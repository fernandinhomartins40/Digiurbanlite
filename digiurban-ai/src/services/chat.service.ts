import { AiConversation, AiMessage, AiMessageRole, Prisma } from '@prisma/client';
import { config } from '../config/config';
import { applicationContextService } from './application-context.service';
import { applicationDataService } from './application-data.service';
import prisma from '../utils/prisma';
import { apiKeyService } from './api-key.service';
import { KnowledgeIndexScope, knowledgeService } from './knowledge.service';
import {
  AiExperience,
  ChatCompletionResult,
  ChatMessageInput,
  ChatResponseFormat,
  ChatThinkingMode,
} from '../types';
import { aiObservabilityService } from './ai-observability.service';
import { aiProviderService, AiProviderServiceError } from './ai-provider.service';
import { inferenceRouterService } from './inference-router.service';
import { semanticCacheService, SemanticCacheHit } from './semantic-cache.service';
import { toolRunnerService } from './tool-runner.service';
import { webSearchService, WebSearchResult } from './web-search.service';
import logger from '../utils/logger';
import { normalizeOperationalText } from '../utils/operational-text';

export type ChatMode = 'free' | 'rag';

type InferenceProfile = 'interactive' | 'rag' | 'draft' | 'tool' | 'structured';

type WebSearchMetadata = {
  enabled: boolean;
  provider: string;
  resultCount: number;
  sources: Array<{
    title: string;
    url: string;
    source: string;
  }>;
};

type InteractiveAction = {
  label: string;
  href?: string;
  prompt?: string;
  variant?: 'primary' | 'secondary';
};

type InteractiveCard = {
  type: 'metric_grid' | 'record_list' | 'action_grid';
  title: string;
  subtitle?: string;
  tone?: 'cyan' | 'emerald' | 'amber' | 'slate';
  items: Array<{
    label: string;
    value: string | number;
    description?: string;
    href?: string;
    status?: string;
  }>;
  actions?: InteractiveAction[];
};

function isConcreteAdminPath(path?: string): path is string {
  return Boolean(path && path.startsWith('/admin') && !path.includes('[') && !path.includes(']'));
}

function buildApplicationContextCards(results: Array<{
  id: string;
  title: string;
  summary: string;
  path?: string;
  category?: string;
  kind?: string;
  minRole?: string;
  permissions?: string[];
}>): InteractiveCard[] {
  const concreteResults = results.filter((result) => isConcreteAdminPath(result.path)).slice(0, 8);
  if (!concreteResults.length) {
    return [];
  }

  const primary = concreteResults[0];
  const actions: InteractiveAction[] = [
    ...(primary?.path
      ? [{
          label: `Abrir ${primary.title}`,
          href: primary.path,
          variant: 'primary' as const,
        }]
      : []),
    {
      label: 'Ver inicio',
      href: '/admin',
      variant: 'secondary',
    },
    {
      label: 'Perguntar passo a passo',
      prompt: `Explique o passo a passo para usar ${primary?.title || 'essa funcionalidade'}`,
      variant: 'secondary',
    },
  ];

  const groupedResults = concreteResults.reduce((groups, result) => {
    const group = result.category || 'Geral';
    const current = groups.get(group) || [];
    current.push(result);
    groups.set(group, current);
    return groups;
  }, new Map<string, typeof concreteResults>());

  return Array.from(groupedResults.entries()).slice(0, 3).map(([category, entries], groupIndex) => ({
      type: 'action_grid',
      title: groupIndex === 0 ? 'Atalhos encontrados' : category,
      subtitle: groupIndex === 0 ? 'Funcionalidades mapeadas no portal administrativo' : 'Outras telas relacionadas',
      tone: 'slate',
      items: entries.map((result) => ({
        label: result.title,
        value: result.path || result.summary,
        description: result.summary,
        href: result.path,
        status: result.kind === 'workflow'
          ? 'Fluxo'
          : result.minRole
            ? `Perfil: ${result.minRole}`
            : result.permissions?.length
              ? 'Permissao requerida'
              : 'Tela',
      })),
      actions: groupIndex === 0 ? actions : undefined,
    }));
}

function buildApplicationContextContent(results: Array<{
  title: string;
  summary: string;
  path?: string;
}>): string | null {
  const concreteResults = results.filter((result) => isConcreteAdminPath(result.path)).slice(0, 5);
  if (!concreteResults.length) {
    return null;
  }

  return [
    'Encontrei estes atalhos no portal administrativo:',
    ...concreteResults.map((result, index) =>
      `${index + 1}. ${result.title} - ${result.path}\n   ${truncateForModel(result.summary, 180)}`,
    ),
  ].join('\n');
}

function buildDeterministicApplicationContextCompletion(params: {
  query: string;
  latencyStartedAt: number;
}): ChatCompletionResult | null {
  const results = applicationContextService.search({ query: params.query, limit: 24 });
  const content = buildApplicationContextContent(results);
  if (!content) {
    return null;
  }

  return {
    content,
    model: 'application-context-deterministic',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs: Date.now() - params.latencyStartedAt,
    finishReason: 'deterministic_application_context',
    profile: 'navigation',
    attemptedModels: [],
    usedFallback: false,
    circuitBreakerOpen: false,
    routeKind: 'context_navigation',
    deterministicResponse: true,
    interactiveCards: buildApplicationContextCards(results),
  };
}

interface MessageAttachmentInput {
  name: string;
  mimeType?: string;
  size?: number;
  contentText?: string;
}

function normalizeConversationTitle(input: string): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, 80);
}

function mapStoredRoleToModelRole(role: AiMessageRole): ChatMessageInput['role'] {
  switch (role) {
    case AiMessageRole.SYSTEM:
      return 'system';
    case AiMessageRole.ASSISTANT:
      return 'assistant';
    case AiMessageRole.TOOL:
      return 'tool';
    case AiMessageRole.USER:
    default:
      return 'user';
  }
}

function truncateForModel(content: string, maxChars: number): string {
  const normalized = content.trim();
  if (!normalized) return '';

  const safeMaxChars = Math.max(120, maxChars);
  if (normalized.length <= safeMaxChars) {
    return normalized;
  }

  const suffix = '\n[...trecho resumido para reduzir latencia...]';
  if (safeMaxChars <= suffix.length + 40) {
    return normalized.slice(0, safeMaxChars).trimEnd();
  }

  return `${normalized.slice(0, safeMaxChars - suffix.length).trimEnd()}${suffix}`;
}

function trimContextForPrompt(chunks: string[]): string[] {
  const globalBudget = Math.max(600, config.maxContextCharsInPrompt);
  const perChunkLimit = Math.max(240, config.maxChunkSizeChars);
  let remaining = globalBudget;
  const result: string[] = [];

  for (const chunk of chunks) {
    if (remaining <= 0) {
      break;
    }

    const clipped = truncateForModel(chunk, Math.min(perChunkLimit, remaining));
    if (!clipped) {
      continue;
    }

    result.push(clipped);
    remaining -= clipped.length;
  }

  return result;
}

function boundRagModelMessages(messages: ChatMessageInput[]): ChatMessageInput[] {
  if (!messages.length) {
    return messages;
  }

  const [systemMessage, ...conversationMessages] = messages;
  const boundedSystemMessage: ChatMessageInput = {
    role: systemMessage.role,
    content: truncateForModel(
      systemMessage.content,
      Math.max(960, config.maxContextCharsInPrompt + 240),
    ),
  };

  const perMessageLimit = Math.max(300, config.maxModelMessageChars);
  const conversationBudget = Math.max(perMessageLimit, config.maxContextCharsInPrompt);

  const boundedConversationMessages = conversationMessages
    .map((message) => ({
      role: message.role,
      content: truncateForModel(message.content, perMessageLimit),
      thinking: message.thinking,
      toolName: message.toolName,
      toolCallId: message.toolCallId,
      toolCalls: message.toolCalls,
    }))
    .filter((message) => message.content.length > 0 || message.toolCalls?.length);

  let consumedChars = 0;
  const selected: ChatMessageInput[] = [];

  for (let index = boundedConversationMessages.length - 1; index >= 0; index -= 1) {
    if (consumedChars >= conversationBudget) {
      break;
    }

    const message = boundedConversationMessages[index];
    const remaining = conversationBudget - consumedChars;

    if (message.content.length <= remaining) {
      selected.push(message);
      consumedChars += message.content.length;
      continue;
    }

    if (remaining < 120 || message.toolCalls?.length) {
      continue;
    }

    selected.push({
      ...message,
      content: truncateForModel(message.content, remaining),
    });
    consumedChars = conversationBudget;
  }

  return [boundedSystemMessage, ...selected.reverse()];
}

function boundConversationMessages(messages: ChatMessageInput[]): ChatMessageInput[] {
  if (!messages.length) {
    return messages;
  }

  const hasSystem = messages[0]?.role === 'system';
  const leadingSystem = hasSystem
    ? {
        ...messages[0],
        content: truncateForModel(
          messages[0].content,
          Math.max(720, config.maxContextCharsInPrompt + 160),
        ),
      }
    : undefined;
  const conversationMessages = hasSystem ? messages.slice(1) : messages;
  const perMessageLimit = Math.max(300, config.maxModelMessageChars);
  const conversationBudget = Math.max(perMessageLimit * 2, config.maxContextCharsInPrompt);

  const boundedConversationMessages = conversationMessages
    .map((message) => ({
      role: message.role,
      content: truncateForModel(message.content, perMessageLimit),
      thinking: message.thinking,
      toolName: message.toolName,
      toolCallId: message.toolCallId,
      toolCalls: message.toolCalls,
    }))
    .filter((message) => message.content.length > 0 || message.toolCalls?.length);

  let consumedChars = 0;
  const selected: ChatMessageInput[] = [];

  for (let index = boundedConversationMessages.length - 1; index >= 0; index -= 1) {
    if (consumedChars >= conversationBudget) {
      break;
    }

    const message = boundedConversationMessages[index];
    const remaining = conversationBudget - consumedChars;

    if (message.content.length <= remaining) {
      selected.push(message);
      consumedChars += message.content.length;
      continue;
    }

    if (remaining < 120 || message.toolCalls?.length) {
      continue;
    }

    selected.push({
      ...message,
      content: truncateForModel(message.content, remaining),
    });
    consumedChars = conversationBudget;
  }

  return leadingSystem ? [leadingSystem, ...selected.reverse()] : selected.reverse();
}

function renderPromptSection(tag: string, content?: string): string {
  const normalized = content?.trim();
  if (!normalized) {
    return '';
  }

  return `<${tag}>\n${normalized}\n</${tag}>`;
}

function renderPromptList(items: string[]): string {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join('\n');
}

function joinPromptSections(sections: Array<string | undefined>): string {
  return sections.filter((section): section is string => Boolean(section && section.trim())).join('\n\n');
}

function buildSystemPrompt(params: {
  userName?: string;
  departmentId?: string;
  retrievedContext: string[];
  applicationContext: string[];
  applicationData?: string;
  webContext: string[];
  webSearchEnabled: boolean;
  extraInstruction?: string;
  toolsEnabled: boolean;
}): string {
  const operator =
    params.userName || params.departmentId
      ? `usuario=${params.userName || 'nao_informado'}; departamento=${params.departmentId || 'nao_informado'}`
      : '';

  return joinPromptSections([
    renderPromptSection('mode', 'rag'),
    renderPromptSection('role', 'assistente_operacional_municipal'),
    renderPromptSection(
      'response_contract',
      renderPromptList([
        'responda em pt-BR',
        'entregue a resposta final primeiro',
        'padrao curto: 1 paragrafo curto ou ate 5 bullets',
        'priorize contexto recuperado e contexto web',
        params.toolsEnabled
          ? 'para perguntas sobre a aplicacao DigiUrban, use ferramentas antes de responder'
          : 'responda apenas com base no contexto recuperado',
        'se faltar evidencia, diga claramente que nao ha dados suficientes',
        'nao invente telas, botoes, ids, status, normas ou dados internos',
        'quando usar dados internos, mencione que a origem e interna e indique o horario da medicao se disponivel',
        'se usar web, cite links relevantes',
      ]),
    ),
    renderPromptSection('operator', operator),
    renderPromptSection(
      'extra_instruction',
      params.extraInstruction?.trim(),
    ),
    renderPromptSection(
      'knowledge_context',
      params.retrievedContext
        .map((chunk, index) => `[K${index + 1}] ${chunk}`)
        .join('\n\n'),
    ),
    renderPromptSection(
      'application_context',
      params.applicationContext
        .map((chunk, index) => `[A${index + 1}] ${chunk}`)
        .join('\n\n'),
    ),
    renderPromptSection('application_data', params.applicationData),
    renderPromptSection(
      'application_scope',
      params.toolsEnabled
        ? renderPromptList([
            'perguntas sobre menu, rota, modulo, permissao, papel ou fluxo da DigiUrban devem usar ferramentas',
            'perguntas sobre totais, status ou metricas internas devem usar ferramentas',
            'nao responda no escuro sobre a aplicacao',
          ])
        : '',
    ),
    renderPromptSection(
      'web_context',
      params.webSearchEnabled
        ? params.webContext
            .map((chunk, index) => `[W${index + 1}] ${chunk}`)
            .join('\n\n')
        : '',
    ),
  ]);
}

function buildFreeModeSystemPrompt(params: { extraInstruction?: string }): string {
  return joinPromptSections([
    renderPromptSection('mode', 'free_chat'),
    renderPromptSection('role', 'assistente_geral_de_escrita_e_produtividade'),
    renderPromptSection(
      'response_contract',
      renderPromptList([
        'responda em pt-BR',
        'entregue a resposta final primeiro',
        'padrao curto: 1 paragrafo curto ou ate 5 bullets',
        'se a mensagem do usuario for apenas uma saudacao ou cumprimento curto, responda apenas com uma saudacao curta e um convite simples para continuar',
        'em redacao ou revisao, entregue o texto pronto sem introducao',
        'nao finja acesso a dados internos ou protocolos',
        'se pedirem dados internos, diga que este modo nao tem contexto conectado',
        'nunca crie exemplos de protocolos, chamados, ids, status, secretarias ou quantidades como se fossem dados reais',
        'se a pergunta parece pedir dados operacionais reais, responda que esses dados precisam vir de consulta interna',
        'nao mencione limitacoes, suporte, portal, sistema interno ou canais oficiais sem que o usuario tenha pedido isso',
      ]),
    ),
    renderPromptSection(
      'extra_instruction',
      params.extraInstruction?.trim(),
    ),
  ]);
}

function buildQualityModeSystemPrompt(params: { extraInstruction?: string }): string {
  return joinPromptSections([
    renderPromptSection('mode', 'quality_chat'),
    renderPromptSection('role', 'assistente_editorial_institucional'),
    renderPromptSection(
      'response_contract',
      renderPromptList([
        'responda em pt-BR',
        'entregue a resposta final primeiro',
        'priorize clareza, precisao e acabamento textual',
        'em redacao, entregue o texto pronto e bem estruturado',
        'evite introducoes desnecessarias e prolixidade',
        'nao finja acesso a dados internos ou fatos atuais sem contexto',
        'nunca invente numeros, ids, protocolos, chamados, status ou nomes de secretarias',
      ]),
    ),
    renderPromptSection('extra_instruction', params.extraInstruction?.trim()),
  ]);
}

function buildFreeModePromptWithWebContext(params: {
  extraInstruction?: string;
  webContext: string[];
  webSearchEnabled: boolean;
  contract?: 'free' | 'quality';
}): string {
  const basePrompt =
    params.contract === 'quality'
      ? buildQualityModeSystemPrompt({
          extraInstruction: params.extraInstruction,
        })
      : buildFreeModeSystemPrompt({
          extraInstruction: params.extraInstruction,
        });

  if (!params.webSearchEnabled || !params.webContext.length) {
    return basePrompt;
  }

  return joinPromptSections([
    basePrompt,
    renderPromptSection(
      'web_context',
      params.webContext.map((chunk, index) => `[W${index + 1}] ${chunk}`).join('\n\n'),
    ),
    renderPromptSection(
      'web_usage',
      renderPromptList([
        'use o contexto web como referencia externa atualizada',
        'cite links relevantes quando usar dados da web',
      ]),
    ),
  ]);
}

function buildWebContextChunks(results: WebSearchResult[]): string[] {
  if (!results.length) return [];

  return results.map((result) => {
    const snippet = result.snippet ? `Resumo: ${result.snippet}` : 'Resumo: sem resumo disponivel.';
    return `Titulo: ${result.title}\nURL: ${result.url}\n${snippet}`;
  });
}

function buildWebSearchMetadata(
  results: WebSearchResult[],
  enabled: boolean,
): WebSearchMetadata | undefined {
  if (!enabled && !results.length) return undefined;

  return {
    enabled,
    provider: config.webSearchProvider,
    resultCount: results.length,
    sources: results.slice(0, 6).map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
    })),
  };
}

function getWebResultPriority(result: WebSearchResult): number {
  try {
    const hostname = new URL(result.url).hostname.toLowerCase();
    if (hostname.includes('ibge.gov.br')) return 100;
    if (hostname.includes('gov.br')) return 90;
    if (hostname.includes('g1.globo.com')) return 80;
    if (hostname.includes('wikipedia.org')) return 30;
    return 50;
  } catch {
    return 10;
  }
}

function sortWebResultsForAnswer(results: WebSearchResult[]): WebSearchResult[] {
  return [...results].sort((left, right) => getWebResultPriority(right) - getWebResultPriority(left));
}

function extractPopulationCandidate(result: WebSearchResult): {
  value: string;
  qualifier?: string;
} | null {
  const haystack = `${result.title} ${result.snippet}`.replace(/\s+/g, ' ').trim();
  if (!haystack) return null;

  const patterns = [
    /(\d{1,3}(?:[.\s]\d{3})+|\d{4,})\s+(?:pessoas|habitantes)/i,
    /popul[a-z]*[^0-9]{0,30}(\d{1,3}(?:[.\s]\d{3})+|\d{4,})/i,
    /(\d{1,3}(?:[.\s]\d{3})+|\d{4,})/i,
  ];

  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    const value = match?.[1]?.trim();
    if (!value) continue;

    const qualifierMatch = haystack.match(/(censo[^.,;)]*20\d{2}|20\d{2})/i);
    return {
      value,
      qualifier: qualifierMatch?.[1]?.trim(),
    };
  }

  return null;
}

function buildDeterministicWebLookupContent(query: string, results: WebSearchResult[]): string | null {
  if (!results.length) {
    return [
      'Nao encontrei resultados suficientes na web para responder com confianca agora.',
      '',
      'Tente reformular a pergunta com mais contexto ou pedir uma fonte especifica.',
    ].join('\n');
  }

  const ordered = sortWebResultsForAnswer(results);
  const normalizedQuery = normalizeIntentText(query);
  const isPopulationLookup = /habitantes|populacao/.test(normalizedQuery);

  if (isPopulationLookup) {
    const candidateSource =
      ordered
        .map((result) => ({ result, candidate: extractPopulationCandidate(result) }))
        .find((item) => item.candidate?.value)?.result || ordered[0];
    const candidate = extractPopulationCandidate(candidateSource);

    if (candidate?.value) {
      const leadingSentence = [
        `Encontrei na web a indicacao de ${candidate.value} habitantes.`,
        candidate.qualifier ? `Referencia identificada: ${candidate.qualifier}.` : undefined,
        `Fonte mais forte encontrada: ${candidateSource.title}.`,
      ]
        .filter(Boolean)
        .join(' ');

      return [
        leadingSentence,
        '',
        'Fontes web:',
        ...ordered.slice(0, 4).map((result) => `- [${result.title}](${result.url})${result.snippet ? `: ${result.snippet}` : ''}`),
      ].join('\n');
    }
  }

  const primary = ordered[0];
  return [
    `Encontrei estas referencias na web para sua pergunta. Resultado mais relevante: ${primary.title}${primary.snippet ? ` - ${primary.snippet}` : ''}`,
    '',
    'Fontes web:',
    ...ordered.slice(0, 4).map((result) => `- [${result.title}](${result.url})${result.snippet ? `: ${result.snippet}` : ''}`),
  ].join('\n');
}

function normalizeIntentText(input: string): string {
  return normalizeOperationalText(input);
}

function shouldUseLowLatencyProfile(query: string): boolean {
  const normalized = normalizeIntentText(query);
  if (!normalized) return true;

  if (normalized.length <= 20) {
    const greetings = new Set([
      'oi',
      'ola',
      'ola tudo bem',
      'bom dia',
      'boa tarde',
      'boa noite',
      'tudo bem',
      'ok',
      'obrigado',
      'valeu',
      'hi',
      'hello',
    ]);
    if (greetings.has(normalized)) {
      return true;
    }
  }

  const words = normalized.split(' ').filter(Boolean);
  if (!words.length) return true;

  if (words.length <= 2 && words.every((word) => word.length <= 3)) {
    return true;
  }

  const currentFactSignals = [
    'atualmente',
    'hoje',
    'agora',
    'neste momento',
    'habitantes',
    'populacao',
    'cotacao',
    'preco',
    'temperatura',
    'clima',
    'resultado',
    'noticias',
  ];
  const directLookupSignals = [
    'busque',
    'pesquise',
    'procure',
    'na web',
    'na internet',
    'quantos',
    'qual',
    'quem',
    'quando',
    'onde',
  ];
  const hasCurrentFactSignal = currentFactSignals.some((signal) => normalized.includes(signal));
  const hasDirectLookupSignal = directLookupSignals.some((signal) => normalized.includes(signal));
  if (words.length <= 14 && hasCurrentFactSignal && hasDirectLookupSignal) {
    return true;
  }

  return false;
}

function shouldAutoUseWebSearch(query: string): boolean {
  const normalized = normalizeIntentText(query);
  if (!normalized) return false;

  const explicitWebIntent = [
    'busque na web',
    'pesquise na web',
    'procure na web',
    'na internet',
    'na web',
    'online',
    'pesquise',
    'busque',
    'procure',
    'google',
  ].some((signal) => normalized.includes(signal));

  if (explicitWebIntent) {
    return true;
  }

  const currentDataIntent = [
    'atualmente',
    'hoje',
    'agora',
    'neste momento',
    'ultimas',
    'ultimos',
    'recente',
    'recentes',
    'habitantes',
    'populacao',
    'preco',
    'cotacao',
    'clima',
    'temperatura',
    'noticias',
    'resultado',
  ].some((signal) => normalized.includes(signal));

  const lookupFormatIntent = [
    'quantos',
    'qual',
    'quem',
    'quando',
    'onde',
    'quanto',
  ].some((signal) => normalized.includes(signal));

  return currentDataIntent && lookupFormatIntent;
}

function shouldAutoUseBuiltInTools(params: {
  query: string;
  chatMode: ChatMode;
}): boolean {
  if (params.chatMode !== 'rag') {
    return false;
  }

  const normalized = normalizeIntentText(params.query);
  if (!normalized) {
    return false;
  }

  const applicationSignals = [
    'aplicacao',
    'sistema',
    'digiurban',
    'menu',
    'tela',
    'pagina',
    'modulo',
    'rota',
    'dashboard',
    'painel',
    'prefeito',
    'secretaria',
    'cidadao',
    'servidor',
    'servico',
    'protocolo',
    'protocolos',
    'solicitacao',
    'solicitacoes',
    'chamado',
    'chamados',
    'ticket',
    'permissao',
    'papel',
    'role',
  ];
  const workflowSignals = [
    'como faco',
    'como fazer',
    'como abrir',
    'como criar',
    'como acessar',
    'onde fica',
    'qual tela',
    'qual menu',
    'passo a passo',
    'fluxo',
  ];
  const dataSignals = [
    'quantos',
    'quantas',
    'total',
    'totais',
    'numero',
    'numeros',
    'estatistica',
    'estatisticas',
    'status',
    'dados',
    'metricas',
  ];

  const hasApplicationSignal = applicationSignals.some((signal) => normalized.includes(signal));
  const hasWorkflowSignal = workflowSignals.some((signal) => normalized.includes(signal));
  const hasDataSignal = dataSignals.some((signal) => normalized.includes(signal));

  return hasApplicationSignal && (hasWorkflowSignal || hasDataSignal || normalized.includes('aqui na aplicacao'));
}

function shouldPrefetchApplicationData(query: string): boolean {
  const normalized = normalizeIntentText(query);
  if (!normalized) {
    return false;
  }

  const entitySignals = [
    'protocolo',
    'protocolos',
    'solicitacao',
    'solicitacoes',
    'chamado',
    'chamados',
    'ticket',
  ];
  const metricSignals = [
    'quantos',
    'quantas',
    'total',
    'totais',
    'status',
    'numero',
    'numeros',
    'dados',
    'estatistica',
    'estatisticas',
  ];

  return (
    entitySignals.some((signal) => normalized.includes(signal)) &&
    metricSignals.some((signal) => normalized.includes(signal))
  );
}

function formatApplicationContextChunks(results: Array<{
  title: string;
  summary: string;
  path?: string;
  minRole?: string;
  permissions?: string[];
  steps?: string[];
}>): string[] {
  return results.map((result) =>
    [
      `Titulo: ${result.title}`,
      result.path ? `Rota: ${result.path}` : undefined,
      result.minRole ? `Perfil minimo: ${result.minRole}` : undefined,
      result.permissions?.length ? `Permissoes: ${result.permissions.join(', ')}` : undefined,
      `Resumo: ${result.summary}`,
      result.steps?.length ? `Passos: ${result.steps.join(' | ')}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

function resolveChatMode(params: {
  requestedMode?: ChatMode;
  source: 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';
}): ChatMode {
  if (params.requestedMode === 'free' || params.requestedMode === 'rag') {
    return params.requestedMode;
  }

  return params.source === 'ADMIN_CHAT' ? 'free' : 'rag';
}

function resolveInferenceProfile(params: {
  lowLatencyProfile: boolean;
  chatMode: ChatMode;
  responseFormat?: ChatResponseFormat;
  useBuiltInTools?: boolean;
}): InferenceProfile {
  if (params.useBuiltInTools) {
    return 'tool';
  }

  if (params.responseFormat) {
    return 'structured';
  }

  if (params.lowLatencyProfile) {
    return 'interactive';
  }

  return params.chatMode === 'rag' ? 'rag' : 'draft';
}

function resolveRequestedModel(params: {
  requestedModel?: string;
  source: 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';
}): string | undefined {
  const requestedModel = params.requestedModel?.trim();
  if (!requestedModel) {
    return undefined;
  }

  if (params.source === 'ADMIN_CHAT') {
    return undefined;
  }

  return requestedModel;
}

function normalizeAttachmentText(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+\n/g, '\n');
  if (!normalized) return undefined;
  return normalized.slice(0, 2500);
}

function normalizeAttachments(input?: MessageAttachmentInput[]): MessageAttachmentInput[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, 6)
    .map((item) => ({
      name: (item.name || '').trim().slice(0, 180),
      mimeType: item.mimeType?.trim().slice(0, 120) || undefined,
      size:
        typeof item.size === 'number' && Number.isFinite(item.size)
          ? Math.max(0, item.size)
          : undefined,
      contentText: normalizeAttachmentText(item.contentText),
    }))
    .filter((item) => item.name.length > 0);
}

function formatAttachmentSize(size?: number): string {
  if (!size || size <= 0) return '';

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAttachmentContext(attachments: MessageAttachmentInput[]): string {
  if (!attachments.length) return '';

  return attachments
    .map((attachment, index) => {
      const details = [attachment.mimeType || 'tipo-desconhecido', formatAttachmentSize(attachment.size)]
        .filter(Boolean)
        .join(' | ');

      const header = `Arquivo ${index + 1}: ${attachment.name}${details ? ` (${details})` : ''}`;
      if (!attachment.contentText) return header;

      return `${header}\nConteudo extraido:\n${attachment.contentText}`;
    })
    .join('\n\n');
}

function extractAttachmentsFromMetadata(metadata: unknown): MessageAttachmentInput[] {
  if (!metadata || typeof metadata !== 'object') return [];

  const attachments = (metadata as { attachments?: unknown }).attachments;
  if (!Array.isArray(attachments)) return [];

  return normalizeAttachments(
    attachments.map((item) => {
      if (!item || typeof item !== 'object') return { name: '' };

      const raw = item as Record<string, unknown>;
      return {
        name: typeof raw.name === 'string' ? raw.name : '',
        mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : undefined,
        size: typeof raw.size === 'number' ? raw.size : undefined,
        contentText: typeof raw.contentText === 'string' ? raw.contentText : undefined,
      };
    }),
  );
}

function buildModelMessageContent(message: AiMessage): string {
  const baseContent = (message.content || '').trim();
  if (message.role !== AiMessageRole.USER) {
    return baseContent;
  }

  const attachments = extractAttachmentsFromMetadata(message.metadata);
  if (!attachments.length) {
    return baseContent;
  }

  const attachmentContext = buildAttachmentContext(attachments);
  if (!attachmentContext) {
    return baseContent;
  }

  return `${baseContent}\n\n[Arquivos anexados]\n${attachmentContext}`;
}

function extractMessageMetadataRecord(message: AiMessage): Record<string, unknown> {
  if (!message.metadata || typeof message.metadata !== 'object') {
    return {};
  }

  return message.metadata as Record<string, unknown>;
}

function resolveStoredMessageExperience(message: AiMessage): AiExperience | undefined {
  const metadata = extractMessageMetadataRecord(message);
  const experience = metadata.experience;
  if (experience === 'fast' || experience === 'contextual' || experience === 'quality') {
    return experience;
  }

  const chatMode = metadata.chatMode;
  if (chatMode === 'rag') {
    return 'contextual';
  }

  return undefined;
}

function filterConversationHistoryForExperience(
  messages: AiMessage[],
  experience: AiExperience,
): AiMessage[] {
  if (!messages.length) {
    return messages;
  }

  const relevantExperiences =
    experience === 'contextual'
      ? new Set<AiExperience>(['contextual'])
      : new Set<AiExperience>(['fast', 'quality']);

  let startIndex = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== AiMessageRole.ASSISTANT) {
      continue;
    }

    const storedExperience = resolveStoredMessageExperience(message);
    if (!storedExperience) {
      continue;
    }

    if (!relevantExperiences.has(storedExperience)) {
      startIndex = index + 1;
      break;
    }
  }

  return messages.slice(startIndex);
}

function buildPerformanceMetadata(completion: ChatCompletionResult): Record<string, number | undefined> {
  return {
    firstTokenLatencyMs: completion.firstTokenLatencyMs,
    totalDurationMs: completion.totalDurationMs,
    loadDurationMs: completion.loadDurationMs,
    promptEvalDurationMs: completion.promptEvalDurationMs,
    evalDurationMs: completion.evalDurationMs,
    tokensPerSecond: completion.tokensPerSecond,
    latencyMs: completion.latencyMs,
  };
}

function buildRagFallbackContent(
  query: string,
  chunks: Array<{ content: string; sourceId: string; score: number }>,
): string {
  const bullets = chunks
    .slice(0, 3)
    .map((item) => `- Fonte ${item.sourceId}: ${truncateForModel(item.content.replace(/\s+/g, ' '), 260)}`);

  return [
    'Nao foi possivel concluir a resposta do modelo dentro do tempo limite.',
    `Consulta: ${query.trim()}`,
    'Contexto interno mais relevante recuperado:',
    ...bullets,
  ].join('\n');
}

function buildDeterministicWebLookupCompletion(params: {
  query: string;
  results: WebSearchResult[];
  latencyMs: number;
  routeKind: ChatCompletionResult['routeKind'];
}): ChatCompletionResult | null {
  const content = buildDeterministicWebLookupContent(params.query, params.results);
  if (!content) {
    return null;
  }

  return {
    content,
    model: 'web-search-deterministic',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs: params.latencyMs,
    finishReason: 'deterministic_web_lookup',
    profile: 'interactive',
    attemptedModels: [],
    usedFallback: false,
    circuitBreakerOpen: false,
    routeKind: params.routeKind,
    deterministicResponse: true,
  };
}

function buildDeterministicShortCompletion(query: string, latencyMs: number): ChatCompletionResult | null {
  const normalized = normalizeIntentText(query);
  const responses: Record<string, string> = {
    oi: 'Ola! Como posso ajudar?',
    ola: 'Ola! Como posso ajudar?',
    'ola tudo bem': 'Ola! Tudo bem. Como posso ajudar?',
    'bom dia': 'Bom dia! Como posso ajudar?',
    'boa tarde': 'Boa tarde! Como posso ajudar?',
    'boa noite': 'Boa noite! Como posso ajudar?',
    'tudo bem': 'Tudo bem. Como posso ajudar?',
    ok: 'Certo. Como posso ajudar?',
    obrigado: 'Disponha. Precisa de mais alguma coisa?',
    valeu: 'Disponha. Precisa de mais alguma coisa?',
    hi: 'Ola! Como posso ajudar?',
    hello: 'Ola! Como posso ajudar?',
    ajuda: 'Posso ajudar com redacao, revisao de textos, orientacoes sobre telas do sistema e consultas contextuais quando o modo Contextual estiver ativo.',
    menu: 'Posso ajudar com redacao, revisao de textos, orientacoes sobre telas do sistema e consultas contextuais quando o modo Contextual estiver ativo.',
    'o que voce faz': 'Sou o assistente interno para apoiar redacao, revisao de textos e consultas sobre o sistema.',
    'quem e voce': 'Sou o assistente interno da plataforma, preparado para apoiar tarefas administrativas e consultas do sistema.',
  };

  const content = responses[normalized];
  if (!content) return null;

  return {
    content,
    model: 'short-message-deterministic',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs,
    finishReason: 'deterministic_short_message',
    profile: 'interactive',
    attemptedModels: [],
    usedFallback: false,
    circuitBreakerOpen: false,
    routeKind: 'free_short',
    deterministicResponse: true,
  };
}

function buildSemanticCacheCompletion(hit: SemanticCacheHit): ChatCompletionResult {
  return {
    content: hit.content,
    model: hit.model,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs: hit.latencyMs,
    finishReason: `semantic_cache_${hit.hitKind}`,
    profile: 'cache',
    attemptedModels: [],
    usedFallback: false,
    circuitBreakerOpen: false,
    routeKind: 'semantic_cache',
    deterministicResponse: true,
  };
}

function formatMetricLabel(key: string): string {
  const labels: Record<string, string> = {
    total: 'Total',
    active: 'Ativos',
    inProgress: 'Em andamento',
    pending: 'Pendentes',
    needsUpdate: 'Precisam de atualizacao',
    completed: 'Concluidos',
    cancelled: 'Cancelados',
    accepted: 'Aceitos',
    protocolCreated: 'Com protocolo criado',
    rejected: 'Rejeitados',
  };

  return labels[key] || key;
}

function formatMetricBlock(title: string, totals: unknown): string[] {
  if (!totals || typeof totals !== 'object' || Array.isArray(totals)) {
    return [];
  }

  const lines = Object.entries(totals as Record<string, unknown>)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `- ${formatMetricLabel(key)}: ${value}`);

  return lines.length ? [`${title}:`, ...lines] : [];
}

function formatOperationalStatus(value: unknown): string {
  const status = typeof value === 'string' ? value : '';
  const labels: Record<string, string> = {
    VINCULADO: 'Vinculado',
    PROGRESSO: 'Em progresso',
    PENDENCIA: 'Pendencia',
    ATUALIZACAO: 'Aguardando atualizacao',
    CONCLUIDO: 'Concluido',
    CANCELADO: 'Cancelado',
    PENDING: 'Pendente',
    ACCEPTED: 'Aceito',
    PROTOCOL_CREATED: 'Protocolo criado',
    REJECTED: 'Rejeitado',
    CANCELLED: 'Cancelado',
  };

  return labels[status] || status || 'Sem status';
}

function formatDateTimePtBr(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function formatOperationalList(title: string, items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  if (!items.length) {
    return [`${title}: nenhum registro encontrado para esse filtro.`];
  }

  const lines = items.slice(0, 12).map((item, index) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const number = typeof row.number === 'string' ? row.number : `#${index + 1}`;
    const itemTitle = typeof row.title === 'string' ? row.title : 'Sem titulo';
    const status = formatOperationalStatus(row.status);
    const department = typeof row.departmentName === 'string' ? row.departmentName : undefined;
    const service = typeof row.serviceName === 'string' ? row.serviceName : undefined;
    const createdAt = formatDateTimePtBr(row.createdAt);
    const details = [
      status,
      department ? `Secretaria: ${department}` : undefined,
      service ? `Servico: ${service}` : undefined,
      createdAt ? `Criado em: ${createdAt}` : undefined,
    ].filter(Boolean);

    return `${index + 1}. ${number} - ${itemTitle}${details.length ? ` (${details.join(' | ')})` : ''}`;
  });

  return [title, ...lines];
}

function formatCompactRecordList(title: string, items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  if (!items.length) {
    return [`${title}: nenhum registro encontrado para esse filtro.`];
  }

  const preview = items.slice(0, 3).map((item) => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const number = typeof row.number === 'string' ? row.number : undefined;
    const itemTitle =
      typeof row.title === 'string'
        ? row.title
        : typeof row.name === 'string'
          ? row.name
          : 'Registro';
    const status = row.status ? formatOperationalStatus(row.status) : undefined;
    return [number, itemTitle, status].filter(Boolean).join(' - ');
  });

  return [
    `${title}: ${items.length} registro(s) encontrado(s). Exibindo os principais no card abaixo.`,
    ...preview.map((line) => `- ${line}`),
  ];
}

function buildApplicationDataContent(data: Record<string, unknown>): string | null {
  if (data.ok !== true) {
    return null;
  }

  const measuredAt =
    typeof data.measuredAt === 'string'
      ? new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(new Date(data.measuredAt))
      : undefined;

  const entity = typeof data.entity === 'string' ? data.entity : '';
  const lines: string[] = ['Consulta feita diretamente no banco de dados.'];

  if (entity === 'protocols') {
    lines.push(...formatMetricBlock('Protocolos', data.totals));
  } else if (entity === 'admin_tickets') {
    lines.push(...formatMetricBlock('Chamados', data.totals));
  } else if (entity === 'protocol_list') {
    lines.push(...formatCompactRecordList('Protocolos encontrados', data.items));
  } else if (entity === 'ticket_list') {
    lines.push(...formatCompactRecordList('Chamados encontrados', data.items));
  } else if (entity === 'service_list') {
    lines.push(...formatCompactRecordList('Servicos encontrados', data.items));
  } else if (entity === 'document_template_list') {
    lines.push(...formatCompactRecordList('Templates de documento encontrados', data.items));
    lines.push('Para gerar o documento oficial, abra um protocolo e use a aba de documentos gerados.');
  } else if (entity === 'citizen_profile') {
    const found = data.found === true;
    const item = data.item && typeof data.item === 'object' ? data.item as Record<string, unknown> : null;
    if (!found || !item) {
      lines.push('Nenhum cidadao encontrado para o CPF informado.');
    } else {
      lines.push(`Cidadao encontrado: ${typeof item.name === 'string' ? item.name : 'Sem nome'}.`);
      lines.push(`Status: ${item.isActive === false ? 'Inativo' : 'Ativo'} | Verificacao: ${formatOperationalStatus(item.verificationStatus)}.`);
      lines.push('Abra o cadastro pelo card abaixo para ver os dados completos.');
    }
  } else {
    lines.push(...formatMetricBlock('Protocolos', data.protocols));
    lines.push(...formatMetricBlock('Chamados', data.adminTickets));
  }

  if (measuredAt) {
    lines.push(`Atualizado em: ${measuredAt}.`);
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

function buildApplicationDataCards(data: Record<string, unknown>): InteractiveCard[] {
  if (data.ok !== true) {
    return [];
  }

  const entity = typeof data.entity === 'string' ? data.entity : '';

  if (entity === 'protocols' || entity === 'admin_tickets') {
    const totals = data.totals && typeof data.totals === 'object' && !Array.isArray(data.totals)
      ? data.totals as Record<string, unknown>
      : {};
    const isProtocols = entity === 'protocols';
    return [
      {
        type: 'metric_grid',
        title: isProtocols ? 'Protocolos' : 'Chamados',
        subtitle: 'Dados consultados diretamente no banco',
        tone: isProtocols ? 'cyan' : 'emerald',
        items: Object.entries(totals)
          .filter(([, value]) => typeof value === 'number')
          .map(([key, value]) => ({
            label: formatMetricLabel(key),
            value: value as number,
          })),
        actions: [
          {
            label: isProtocols ? 'Abrir protocolos' : 'Abrir chamados',
            href: isProtocols ? '/admin/protocolos' : '/admin/chamados/lista',
            variant: 'primary',
          },
          {
            label: isProtocols ? 'Listar abertos' : 'Listar pendentes',
            prompt: isProtocols ? 'Liste os protocolos abertos' : 'Liste os chamados pendentes',
            variant: 'secondary',
          },
        ],
      },
    ];
  }

  if (entity === 'protocol_list' || entity === 'ticket_list') {
    const items = Array.isArray(data.items) ? data.items : [];
    const isProtocols = entity === 'protocol_list';
    return [
      {
        type: 'record_list',
        title: isProtocols ? 'Protocolos encontrados' : 'Chamados encontrados',
        subtitle: `${items.length} registro(s) retornado(s)`,
        tone: isProtocols ? 'cyan' : 'emerald',
        items: items.slice(0, 12).map((item, index) => {
          const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const id = typeof row.id === 'string' ? row.id : '';
          const number = typeof row.number === 'string' ? row.number : `#${index + 1}`;
          const title = typeof row.title === 'string' ? row.title : 'Sem titulo';
          const status = formatOperationalStatus(row.status);
          const department = typeof row.departmentName === 'string' ? row.departmentName : undefined;
          const service = typeof row.serviceName === 'string' ? row.serviceName : undefined;
          return {
            label: number,
            value: title,
            status,
            description: [department, service].filter(Boolean).join(' | ') || undefined,
            href: isProtocols && id ? `/admin/protocolos/${id}` : undefined,
          };
        }),
        actions: [
          {
            label: isProtocols ? 'Ver todos protocolos' : 'Ver todos chamados',
            href: isProtocols ? '/admin/protocolos' : '/admin/chamados/lista',
            variant: 'primary',
          },
          {
            label: isProtocols ? 'Resumo dos protocolos' : 'Resumo dos chamados',
            prompt: isProtocols ? 'Quantos protocolos temos em aberto?' : 'Quantos chamados temos pendentes?',
            variant: 'secondary',
          },
        ],
      },
    ];
  }

  if (entity === 'service_list') {
    const items = Array.isArray(data.items) ? data.items : [];
    return [
      {
        type: 'record_list',
        title: 'Servicos encontrados',
        subtitle: `${items.length} servico(s) do catalogo`,
        tone: 'emerald',
        items: items.slice(0, 12).map((item) => {
          const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const id = typeof row.id === 'string' ? row.id : '';
          const name = typeof row.name === 'string' ? row.name : 'Servico';
          const department = typeof row.departmentName === 'string' ? row.departmentName : undefined;
          const type = typeof row.serviceType === 'string' ? formatOperationalStatus(row.serviceType) : undefined;
          const estimatedDays = typeof row.estimatedDays === 'number' ? `${row.estimatedDays} dia(s)` : undefined;
          return {
            label: name,
            value: department || 'Sem secretaria vinculada',
            description: [type, estimatedDays, row.requiresDocuments ? 'Exige documentos' : undefined].filter(Boolean).join(' | ') || undefined,
            href: id ? `/admin/servicos/${id}/editar` : '/admin/servicos',
            status: typeof row.category === 'string' ? row.category : type,
          };
        }),
        actions: [
          {
            label: 'Abrir catalogo',
            href: '/admin/servicos',
            variant: 'primary',
          },
          {
            label: 'Criar servico',
            href: '/admin/servicos/novo',
            variant: 'secondary',
          },
        ],
      },
    ];
  }

  if (entity === 'citizen_profile') {
    const item = data.item && typeof data.item === 'object' ? data.item as Record<string, unknown> : null;
    if (!item || typeof item.id !== 'string') {
      return [
        {
          type: 'action_grid',
          title: 'Cidadao nao encontrado',
          subtitle: 'Nenhum cadastro localizado para esse CPF',
          tone: 'amber',
          items: [
            {
              label: 'Cadastrar cidadao',
              value: '/admin/cidadaos/novo',
              href: '/admin/cidadaos/novo',
              description: 'Crie um novo cadastro se o CPF estiver correto.',
            },
          ],
          actions: [
            { label: 'Abrir cidadaos', href: '/admin/cidadaos', variant: 'primary' },
          ],
        },
      ];
    }

    return [
      {
        type: 'record_list',
        title: 'Cadastro do cidadao',
        subtitle: 'Dados consultados diretamente no banco',
        tone: 'cyan',
        items: [
          {
            label: typeof item.name === 'string' ? item.name : 'Cidadao',
            value: typeof item.cpf === 'string' ? item.cpf : 'CPF informado',
            description: [
              typeof item.email === 'string' ? item.email : undefined,
              typeof item.phone === 'string' ? item.phone : undefined,
            ].filter(Boolean).join(' | ') || undefined,
            href: `/admin/cidadaos/${item.id}`,
            status: item.isActive === false ? 'Inativo' : 'Ativo',
          },
        ],
        actions: [
          { label: 'Abrir cadastro', href: `/admin/cidadaos/${item.id}`, variant: 'primary' },
          { label: 'Ver protocolos', href: `/admin/cidadaos/${item.id}`, variant: 'secondary' },
        ],
      },
    ];
  }

  if (entity === 'document_template_list') {
    const items = Array.isArray(data.items) ? data.items : [];
    return [
      {
        type: 'record_list',
        title: 'Templates de documento',
        subtitle: `${items.length} modelo(s) disponivel(is)`,
        tone: 'amber',
        items: items.slice(0, 8).map((item) => {
          const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const id = typeof row.id === 'string' ? row.id : '';
          const name = typeof row.name === 'string' ? row.name : 'Template';
          const code = typeof row.code === 'string' ? row.code : '';
          const documentType = typeof row.documentType === 'string' ? formatOperationalStatus(row.documentType) : undefined;
          const outputFormat = typeof row.outputFormat === 'string' ? row.outputFormat : undefined;
          return {
            label: name,
            value: code || 'Template ativo',
            description: [documentType, outputFormat].filter(Boolean).join(' | ') || undefined,
            href: id ? `/admin/templates-documentos/${id}/view` : '/admin/templates-documentos',
            status: row.isGlobal ? 'Global' : 'Vinculado',
          };
        }),
        actions: [
          { label: 'Abrir templates', href: '/admin/templates-documentos', variant: 'primary' },
          { label: 'Abrir protocolos', href: '/admin/protocolos', variant: 'secondary' },
        ],
      },
    ];
  }

  return [];
}

async function buildDeterministicApplicationDataCompletion(params: {
  query: string;
  latencyStartedAt: number;
}): Promise<ChatCompletionResult | null> {
  const data = await applicationDataService.query(params.query);
  const content = buildApplicationDataContent(data);
  if (!content) {
    return null;
  }

  const latencyMs = Date.now() - params.latencyStartedAt;
  return {
    content,
    model: 'application-data-deterministic',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs,
    finishReason: 'deterministic_application_data',
    profile: 'database',
    attemptedModels: [],
    usedFallback: false,
    circuitBreakerOpen: false,
    routeKind: 'context_metrics',
    deterministicResponse: true,
    interactiveCards: buildApplicationDataCards(data),
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function appendStructuredOutputInstruction(
  messages: ChatMessageInput[],
  responseFormat?: ChatResponseFormat,
): ChatMessageInput[] {
  if (!responseFormat) {
    return messages;
  }

  const instruction =
    responseFormat === 'json'
      ? 'Responda apenas com JSON valido. Nao use markdown, comentarios ou texto fora do JSON.'
      : `Responda apenas com JSON valido seguindo estritamente este schema: ${JSON.stringify(responseFormat)}`;

  const nextMessages = [...messages];
  const systemIndex = nextMessages.findIndex((message) => message.role === 'system');

  if (systemIndex >= 0) {
    nextMessages[systemIndex] = {
      ...nextMessages[systemIndex],
      content: `${nextMessages[systemIndex].content}\n\n${instruction}`,
    };
    return nextMessages;
  }

  return [{ role: 'system', content: instruction }, ...nextMessages];
}

function appendToolUsageInstruction(messages: ChatMessageInput[]): ChatMessageInput[] {
  const instruction = [
    'Para perguntas sobre a aplicacao DigiUrban, use search_application_context antes de responder no escuro.',
    'Para totais, status ou dados vivos de protocolos e chamados, use get_application_data.',
    'Use search_knowledge_base para contexto documental complementar e search_web apenas para fatos externos atuais.',
    'Use no maximo as ferramentas necessarias para resolver a tarefa.',
    'Depois de receber o resultado da ferramenta, responda diretamente ao usuario.',
  ].join(' ');

  return messages[0]?.role === 'system'
    ? [
        {
          ...messages[0],
          content: `${messages[0].content}\n\n${instruction}`,
        },
        ...messages.slice(1),
      ]
    : [{ role: 'system', content: instruction }, ...messages];
}

async function resolveWebSearchContext(params: {
  query: string;
  tenantId: string;
  conversationId?: string;
  source: 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';
  requested?: boolean;
  autoDetect?: boolean;
}): Promise<{ enabled: boolean; results: WebSearchResult[] }> {
  const requested =
    typeof params.requested === 'boolean'
      ? params.requested
      : params.autoDetect
        ? shouldAutoUseWebSearch(params.query)
        : config.webSearchDefault;

  if (!requested) {
    return { enabled: false, results: [] };
  }

  if (!config.webSearchEnabled) {
    logger.warn('Web search requested but disabled by configuration', {
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      source: params.source,
    });
    return { enabled: false, results: [] };
  }

  try {
    const results = await webSearchService.search(params.query, config.webSearchMaxResults);
    return { enabled: true, results };
  } catch (error) {
    logger.warn('Web search lookup failed', {
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      source: params.source,
      provider: config.webSearchProvider,
      error: error instanceof Error ? error.message : String(error),
    });
    return { enabled: true, results: [] };
  }
}

export class ChatService {
  async listConversations(params: {
    tenantId: string;
    userId: string;
  }): Promise<AiConversation[]> {
    return prisma.aiConversation.findMany({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
        isArchived: false,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }

  async createConversation(params: {
    tenantId: string;
    userId: string;
    departmentId?: string;
    title?: string;
  }): Promise<AiConversation> {
    return prisma.aiConversation.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        departmentId: params.departmentId,
        title: params.title?.trim() || 'Nova conversa',
        isArchived: false,
      },
    });
  }

  async updateConversation(params: {
    tenantId: string;
    userId: string;
    conversationId: string;
    title?: string;
    isArchived?: boolean;
  }): Promise<AiConversation> {
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const data: Prisma.AiConversationUpdateInput = {};

    if (typeof params.title === 'string') {
      data.title = params.title.trim() || 'Nova conversa';
    }

    if (typeof params.isArchived === 'boolean') {
      data.isArchived = params.isArchived;
    }

    return prisma.aiConversation.update({
      where: { id: conversation.id },
      data,
    });
  }

  async deleteConversation(params: {
    tenantId: string;
    userId: string;
    conversationId: string;
  }): Promise<void> {
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
      select: { id: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await prisma.aiConversation.delete({
      where: { id: conversation.id },
    });
  }

  async getConversationWithMessages(params: {
    tenantId: string;
    userId: string;
    conversationId: string;
  }): Promise<AiConversation & { messages: AiMessage[] }> {
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(params: {
    tenantId: string;
    userId: string;
    userName?: string;
    departmentId?: string;
    conversationId: string;
    content: string;
    model?: string;
    think?: ChatThinkingMode;
    mode?: ChatMode;
    experience?: AiExperience;
    webSearch?: boolean;
    extraInstruction?: string;
    attachments?: MessageAttachmentInput[];
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
  }): Promise<{
    conversationId: string;
    assistantMessage: AiMessage;
    contextSources: number;
  }> {
    const normalized = params.content.trim();
    if (!normalized) {
      throw new Error('Message content is required');
    }
    const requestStartedAt = Date.now();

    const requestedModel = resolveRequestedModel({
      requestedModel: params.model,
      source: 'ADMIN_CHAT',
    });

    const inferencePlan = inferenceRouterService.plan({
      query: normalized,
      requestedMode: params.mode,
      requestedExperience: params.experience,
      requestedModel,
      source: 'ADMIN_CHAT',
      explicitWebSearch: params.webSearch,
    });
    const chatMode: ChatMode = inferencePlan.chatMode;
    const useBuiltInTools =
      typeof params.useBuiltInTools === 'boolean'
        ? params.useBuiltInTools
        : inferencePlan.useBuiltInTools;
    const resolvedModel = inferencePlan.resolvedModel;
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const attachments = normalizeAttachments(params.attachments);
    const attachmentsMetadata = attachments.map((attachment) => ({
      name: attachment.name,
      ...(attachment.mimeType ? { mimeType: attachment.mimeType } : {}),
      ...(typeof attachment.size === 'number' ? { size: attachment.size } : {}),
      ...(attachment.contentText ? { contentText: attachment.contentText } : {}),
    }));

    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content: normalized,
        metadata: attachmentsMetadata.length > 0 ? { attachments: attachmentsMetadata } : undefined,
      },
    });

    const deterministicShortCompletion =
      inferencePlan.routeKind === 'free_short'
        ? buildDeterministicShortCompletion(normalized, Date.now() - requestStartedAt)
        : null;

    if (deterministicShortCompletion) {
      aiObservabilityService.recordInference({
        routeKind: 'free_short',
        experience: inferencePlan.experience,
        model: deterministicShortCompletion.model,
        latencyMs: deterministicShortCompletion.latencyMs,
        deterministicResponse: true,
        toolFirst: false,
        webSearch: false,
        tenantId: params.tenantId,
        userId: params.userId,
        source: 'ADMIN_CHAT',
      });

      const assistantMessage = await prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: AiMessageRole.ASSISTANT,
          content: deterministicShortCompletion.content,
          model: deterministicShortCompletion.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: deterministicShortCompletion.latencyMs,
          metadata: {
            finishReason: deterministicShortCompletion.finishReason,
            thinkEnabled: false,
            performance: buildPerformanceMetadata(deterministicShortCompletion),
            chatMode,
            experience: inferencePlan.experience,
            profile: deterministicShortCompletion.profile,
            routeKind: deterministicShortCompletion.routeKind,
            attemptedModels: [],
            usedFallback: false,
            circuitBreakerOpen: false,
            deterministicResponse: true,
            responseFormat: toJsonValue(params.responseFormat),
            builtinToolsEnabled: false,
            contextSources: [],
          },
        },
      });

      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          title:
            conversation.title === 'Nova conversa'
              ? normalizeConversationTitle(userMessage.content)
              : undefined,
        },
      });

      return {
        conversationId: conversation.id,
        assistantMessage,
        contextSources: 0,
      };
    }

    if (inferencePlan.deterministicApplicationData) {
      try {
        const completion = await buildDeterministicApplicationDataCompletion({
          query: normalized,
          latencyStartedAt: requestStartedAt,
        });

        if (completion) {
          aiObservabilityService.recordInference({
            routeKind: 'context_metrics',
            experience: inferencePlan.experience,
            model: completion.model,
            latencyMs: completion.latencyMs,
            deterministicResponse: true,
            toolFirst: true,
            webSearch: false,
            tenantId: params.tenantId,
            userId: params.userId,
            source: 'ADMIN_CHAT',
          });

          const assistantMessage = await prisma.aiMessage.create({
            data: {
              conversationId: conversation.id,
              role: AiMessageRole.ASSISTANT,
              content: completion.content,
              model: completion.model,
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              latencyMs: completion.latencyMs,
              metadata: {
                finishReason: completion.finishReason,
                thinkEnabled: false,
                performance: buildPerformanceMetadata(completion),
                chatMode,
                experience: inferencePlan.experience,
                profile: completion.profile,
                routeKind: completion.routeKind,
                attemptedModels: [],
                usedFallback: false,
                circuitBreakerOpen: false,
                deterministicResponse: true,
                responseFormat: toJsonValue(params.responseFormat),
                builtinToolsEnabled: false,
                contextSources: ['data:live_metrics_tools'],
                interactiveCards: toJsonValue(completion.interactiveCards),
              },
            },
          });

          await prisma.aiConversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: new Date(),
              title:
                conversation.title === 'Nova conversa'
                  ? normalizeConversationTitle(userMessage.content)
                  : undefined,
            },
          });

          return {
            conversationId: conversation.id,
            assistantMessage,
            contextSources: 1,
          };
        }
      } catch (error) {
        logger.warn('Deterministic application data response failed', {
          tenantId: params.tenantId,
          conversationId: conversation.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (inferencePlan.deterministicApplicationContext && !inferencePlan.deterministicApplicationData) {
      const completion = buildDeterministicApplicationContextCompletion({
        query: normalized,
        latencyStartedAt: requestStartedAt,
      });

      if (completion) {
        aiObservabilityService.recordInference({
          routeKind: 'context_navigation',
          experience: inferencePlan.experience,
          model: completion.model,
          latencyMs: completion.latencyMs,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: false,
          tenantId: params.tenantId,
          userId: params.userId,
          source: 'ADMIN_CHAT',
        });

        const assistantMessage = await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: AiMessageRole.ASSISTANT,
            content: completion.content,
            model: completion.model,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: completion.latencyMs,
            metadata: {
              finishReason: completion.finishReason,
              thinkEnabled: false,
              performance: buildPerformanceMetadata(completion),
              chatMode,
              experience: inferencePlan.experience,
              profile: completion.profile,
              routeKind: completion.routeKind,
              attemptedModels: [],
              usedFallback: false,
              circuitBreakerOpen: false,
              deterministicResponse: true,
              responseFormat: toJsonValue(params.responseFormat),
              builtinToolsEnabled: false,
              contextSources: ['app:admin_routes'],
              interactiveCards: toJsonValue(completion.interactiveCards),
            },
          },
        });

        await prisma.aiConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            title:
              conversation.title === 'Nova conversa'
                ? normalizeConversationTitle(userMessage.content)
                : undefined,
          },
        });

        return {
          conversationId: conversation.id,
          assistantMessage,
          contextSources: 1,
        };
      }
    }

    const semanticCacheEligible = semanticCacheService.shouldUseCache({
      query: normalized,
      routeKind: inferencePlan.routeKind,
      source: 'ADMIN_CHAT',
      hasAttachments: attachments.length > 0,
      responseFormat: params.responseFormat,
      webSearch: params.webSearch,
      useBuiltInTools,
    });

    if (semanticCacheEligible) {
      const cacheHit = await semanticCacheService.find({
        tenantId: params.tenantId,
        query: normalized,
        routeKind: inferencePlan.routeKind,
        source: 'ADMIN_CHAT',
      });

      if (cacheHit) {
        const completion = buildSemanticCacheCompletion(cacheHit);
        aiObservabilityService.recordInference({
          routeKind: 'semantic_cache',
          experience: inferencePlan.experience,
          model: completion.model,
          latencyMs: completion.latencyMs,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: false,
          tenantId: params.tenantId,
          userId: params.userId,
          source: 'ADMIN_CHAT',
        });

        const assistantMessage = await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: AiMessageRole.ASSISTANT,
            content: completion.content,
            model: completion.model,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: completion.latencyMs,
            metadata: {
              finishReason: completion.finishReason,
              thinkEnabled: false,
              performance: buildPerformanceMetadata(completion),
              chatMode,
              experience: inferencePlan.experience,
              profile: completion.profile,
              routeKind: completion.routeKind,
              originalRouteKind: inferencePlan.routeKind,
              semanticCache: {
                id: cacheHit.id,
                score: cacheHit.score,
                hitKind: cacheHit.hitKind,
              },
              attemptedModels: [],
              usedFallback: false,
              circuitBreakerOpen: false,
              deterministicResponse: true,
              responseFormat: toJsonValue(params.responseFormat),
              builtinToolsEnabled: false,
              contextSources: [],
            },
          },
        });

        await prisma.aiConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            title:
              conversation.title === 'Nova conversa'
                ? normalizeConversationTitle(userMessage.content)
                : undefined,
          },
        });

        return {
          conversationId: conversation.id,
          assistantMessage,
          contextSources: 0,
        };
      }
    }

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: inferencePlan.lowLatencyProfile
        ? Math.min(config.maxConversationMessagesContext, 3)
        : config.maxConversationMessagesContext,
    });

    const scopedHistory = filterConversationHistoryForExperience(
      recentMessages.reverse(),
      inferencePlan.experience,
    );

    const conversationMessages = scopedHistory
      .map((message) => ({
        role: mapStoredRoleToModelRole(message.role),
        content: buildModelMessageContent(message),
      }))
      .filter((message) => message.content.trim().length > 0);

    const prepared = await this.prepareModelMessages({
      tenantId: params.tenantId,
      userName: params.userName,
      departmentId: params.departmentId,
      query: normalized,
      conversationId: params.conversationId,
      messages: conversationMessages,
      inferencePlan,
      webSearchRequested: params.webSearch,
      extraInstruction: params.extraInstruction,
      source: 'ADMIN_CHAT',
      responseFormat: params.responseFormat,
      useBuiltInTools,
    });

    const deterministicWebCompletion =
      inferencePlan.routeKind === 'web_lookup'
        ? buildDeterministicWebLookupCompletion({
            query: normalized,
            results: prepared.webSearch.results,
            latencyMs: Date.now() - requestStartedAt,
            routeKind: inferencePlan.routeKind,
          })
        : null;

    if (deterministicWebCompletion) {
      aiObservabilityService.recordInference({
        routeKind: inferencePlan.routeKind,
        experience: inferencePlan.experience,
        model: deterministicWebCompletion.model,
        latencyMs: deterministicWebCompletion.latencyMs,
        deterministicResponse: true,
        toolFirst: false,
        webSearch: prepared.webSearch.enabled,
        tenantId: params.tenantId,
        userId: params.userId,
        source: 'ADMIN_CHAT',
      });

      const assistantMessage = await prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: AiMessageRole.ASSISTANT,
          content: deterministicWebCompletion.content,
          model: deterministicWebCompletion.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: deterministicWebCompletion.latencyMs,
          metadata: {
            finishReason: deterministicWebCompletion.finishReason,
            thinkEnabled: false,
            performance: buildPerformanceMetadata(deterministicWebCompletion),
            chatMode,
            experience: inferencePlan.experience,
            profile: deterministicWebCompletion.profile,
            routeKind: inferencePlan.routeKind,
            attemptedModels: [],
            usedFallback: false,
            circuitBreakerOpen: false,
            deterministicResponse: true,
            responseFormat: toJsonValue(params.responseFormat),
            builtinToolsEnabled: false,
            contextSources: prepared.contextSourceIds.slice(0, 6),
            webSearch: buildWebSearchMetadata(prepared.webSearch.results, prepared.webSearch.enabled),
          },
        },
      });

      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          title:
            conversation.title === 'Nova conversa'
              ? normalizeConversationTitle(userMessage.content)
              : undefined,
        },
      });

      return {
        conversationId: conversation.id,
        assistantMessage,
        contextSources: prepared.contextSourceIds.length,
      };
    }

    const completion = await this.executeModelFlowWithRagFallback({
      query: normalized,
      relevantChunks: prepared.relevantChunks,
      tenantId: params.tenantId,
      modelMessages: prepared.modelMessages,
      model: resolvedModel,
      think: params.think,
      experience: inferencePlan.experience,
      chatMode,
      lowLatencyProfile: inferencePlan.lowLatencyProfile,
      responseFormat: params.responseFormat,
      useBuiltInTools,
      toolLoopLimit: params.toolLoopLimit,
      allowFallback: inferencePlan.allowFallback,
      routeKind: inferencePlan.routeKind,
      deterministicResponse: inferencePlan.deterministicResponse,
    });

    aiObservabilityService.recordInference({
      routeKind: inferencePlan.routeKind,
      experience: inferencePlan.experience,
      model: completion.model,
      latencyMs: completion.latencyMs,
      firstTokenLatencyMs: completion.firstTokenLatencyMs,
      deterministicResponse: inferencePlan.deterministicResponse,
      toolFirst:
        inferencePlan.deterministicApplicationContext ||
        inferencePlan.deterministicApplicationData ||
        useBuiltInTools,
      webSearch: prepared.webSearch.enabled,
      tenantId: params.tenantId,
      userId: params.userId,
      source: 'ADMIN_CHAT',
    });

    if (semanticCacheEligible) {
      void semanticCacheService.store({
        tenantId: params.tenantId,
        query: normalized,
        source: 'ADMIN_CHAT',
        completion,
        routeKind: inferencePlan.routeKind,
        contextSources: prepared.contextSourceIds,
      });
    }

    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.ASSISTANT,
        content: completion.content,
        model: completion.model,
        promptTokens: completion.inputTokens,
        completionTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
        latencyMs: completion.latencyMs,
        metadata: {
          finishReason: completion.finishReason,
          thinkEnabled: typeof params.think === 'boolean' ? params.think : undefined,
          thinking: completion.thinking || undefined,
          performance: buildPerformanceMetadata(completion),
          chatMode,
          experience: inferencePlan.experience,
          profile: completion.profile,
          routeKind: inferencePlan.routeKind,
          attemptedModels: completion.attemptedModels,
          usedFallback: completion.usedFallback,
          circuitBreakerOpen: completion.circuitBreakerOpen,
          deterministicResponse: inferencePlan.deterministicResponse,
          toolCalls: toJsonValue(completion.toolCalls),
          responseFormat: toJsonValue(params.responseFormat),
          builtinToolsEnabled: useBuiltInTools || undefined,
          contextSources: prepared.contextSourceIds.slice(0, 6),
          webSearch: buildWebSearchMetadata(prepared.webSearch.results, prepared.webSearch.enabled),
        },
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        title:
          conversation.title === 'Nova conversa'
            ? normalizeConversationTitle(userMessage.content)
            : undefined,
      },
    });

    try {
      await apiKeyService.recordUsage({
        tenantId: params.tenantId,
        conversationId: conversation.id,
        userId: params.userId,
        source: 'ADMIN_CHAT',
        model: completion.model,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
        estimatedCostCents: 0,
      });
    } catch (error) {
      logger.warn('Failed to record AI usage (message flow)', {
        tenantId: params.tenantId,
        conversationId: conversation.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      conversationId: conversation.id,
      assistantMessage,
      contextSources: prepared.contextSourceIds.length,
    };
  }

  async sendMessageStream(params: {
    tenantId: string;
    userId: string;
    userName?: string;
    departmentId?: string;
    conversationId: string;
    content: string;
    model?: string;
    think?: ChatThinkingMode;
    mode?: ChatMode;
    experience?: AiExperience;
    webSearch?: boolean;
    extraInstruction?: string;
    attachments?: MessageAttachmentInput[];
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
    onThinkingDelta?: (delta: string) => void;
    onContentDelta?: (delta: string) => void;
  }): Promise<{
    conversationId: string;
    assistantMessage: AiMessage;
    contextSources: number;
  }> {
    const normalized = params.content.trim();
    if (!normalized) {
      throw new Error('Message content is required');
    }
    const requestStartedAt = Date.now();

    const requestedModel = resolveRequestedModel({
      requestedModel: params.model,
      source: 'ADMIN_CHAT',
    });

    const inferencePlan = inferenceRouterService.plan({
      query: normalized,
      requestedMode: params.mode,
      requestedExperience: params.experience,
      requestedModel,
      source: 'ADMIN_CHAT',
      explicitWebSearch: params.webSearch,
    });
    const chatMode: ChatMode = inferencePlan.chatMode;
    const useBuiltInTools =
      typeof params.useBuiltInTools === 'boolean'
        ? params.useBuiltInTools
        : inferencePlan.useBuiltInTools;
    const resolvedModel = inferencePlan.resolvedModel;
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const attachments = normalizeAttachments(params.attachments);
    const attachmentsMetadata = attachments.map((attachment) => ({
      name: attachment.name,
      ...(attachment.mimeType ? { mimeType: attachment.mimeType } : {}),
      ...(typeof attachment.size === 'number' ? { size: attachment.size } : {}),
      ...(attachment.contentText ? { contentText: attachment.contentText } : {}),
    }));

    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content: normalized,
        metadata: attachmentsMetadata.length > 0 ? { attachments: attachmentsMetadata } : undefined,
      },
    });

    const deterministicShortCompletion =
      inferencePlan.routeKind === 'free_short'
        ? buildDeterministicShortCompletion(normalized, Date.now() - requestStartedAt)
        : null;

    if (deterministicShortCompletion) {
      params.onContentDelta?.(deterministicShortCompletion.content);

      aiObservabilityService.recordInference({
        routeKind: 'free_short',
        experience: inferencePlan.experience,
        model: deterministicShortCompletion.model,
        latencyMs: deterministicShortCompletion.latencyMs,
        deterministicResponse: true,
        toolFirst: false,
        webSearch: false,
        tenantId: params.tenantId,
        userId: params.userId,
        source: 'ADMIN_CHAT',
      });

      const assistantMessage = await prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: AiMessageRole.ASSISTANT,
          content: deterministicShortCompletion.content,
          model: deterministicShortCompletion.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: deterministicShortCompletion.latencyMs,
          metadata: {
            finishReason: deterministicShortCompletion.finishReason,
            thinkEnabled: false,
            performance: buildPerformanceMetadata(deterministicShortCompletion),
            chatMode,
            experience: inferencePlan.experience,
            profile: deterministicShortCompletion.profile,
            routeKind: deterministicShortCompletion.routeKind,
            attemptedModels: [],
            usedFallback: false,
            circuitBreakerOpen: false,
            deterministicResponse: true,
            responseFormat: toJsonValue(params.responseFormat),
            builtinToolsEnabled: false,
            contextSources: [],
          },
        },
      });

      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          title:
            conversation.title === 'Nova conversa'
              ? normalizeConversationTitle(userMessage.content)
              : undefined,
        },
      });

      return {
        conversationId: conversation.id,
        assistantMessage,
        contextSources: 0,
      };
    }

    if (inferencePlan.deterministicApplicationData) {
      try {
        const completion = await buildDeterministicApplicationDataCompletion({
          query: normalized,
          latencyStartedAt: requestStartedAt,
        });

        if (completion) {
          params.onContentDelta?.(completion.content);

          aiObservabilityService.recordInference({
            routeKind: 'context_metrics',
            experience: inferencePlan.experience,
            model: completion.model,
            latencyMs: completion.latencyMs,
            deterministicResponse: true,
            toolFirst: true,
            webSearch: false,
            tenantId: params.tenantId,
            userId: params.userId,
            source: 'ADMIN_CHAT',
          });

          const assistantMessage = await prisma.aiMessage.create({
            data: {
              conversationId: conversation.id,
              role: AiMessageRole.ASSISTANT,
              content: completion.content,
              model: completion.model,
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              latencyMs: completion.latencyMs,
              metadata: {
                finishReason: completion.finishReason,
                thinkEnabled: false,
                performance: buildPerformanceMetadata(completion),
                chatMode,
                experience: inferencePlan.experience,
                profile: completion.profile,
                routeKind: completion.routeKind,
                attemptedModels: [],
                usedFallback: false,
                circuitBreakerOpen: false,
                deterministicResponse: true,
                responseFormat: toJsonValue(params.responseFormat),
                builtinToolsEnabled: false,
                contextSources: ['data:live_metrics_tools'],
                interactiveCards: toJsonValue(completion.interactiveCards),
              },
            },
          });

          await prisma.aiConversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: new Date(),
              title:
                conversation.title === 'Nova conversa'
                  ? normalizeConversationTitle(userMessage.content)
                  : undefined,
            },
          });

          return {
            conversationId: conversation.id,
            assistantMessage,
            contextSources: 1,
          };
        }
      } catch (error) {
        logger.warn('Deterministic streamed application data response failed', {
          tenantId: params.tenantId,
          conversationId: conversation.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (inferencePlan.deterministicApplicationContext && !inferencePlan.deterministicApplicationData) {
      const completion = buildDeterministicApplicationContextCompletion({
        query: normalized,
        latencyStartedAt: requestStartedAt,
      });

      if (completion) {
        params.onContentDelta?.(completion.content);

        aiObservabilityService.recordInference({
          routeKind: 'context_navigation',
          experience: inferencePlan.experience,
          model: completion.model,
          latencyMs: completion.latencyMs,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: false,
          tenantId: params.tenantId,
          userId: params.userId,
          source: 'ADMIN_CHAT',
        });

        const assistantMessage = await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: AiMessageRole.ASSISTANT,
            content: completion.content,
            model: completion.model,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: completion.latencyMs,
            metadata: {
              finishReason: completion.finishReason,
              thinkEnabled: false,
              performance: buildPerformanceMetadata(completion),
              chatMode,
              experience: inferencePlan.experience,
              profile: completion.profile,
              routeKind: completion.routeKind,
              attemptedModels: [],
              usedFallback: false,
              circuitBreakerOpen: false,
              deterministicResponse: true,
              responseFormat: toJsonValue(params.responseFormat),
              builtinToolsEnabled: false,
              contextSources: ['app:admin_routes'],
              interactiveCards: toJsonValue(completion.interactiveCards),
            },
          },
        });

        await prisma.aiConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            title:
              conversation.title === 'Nova conversa'
                ? normalizeConversationTitle(userMessage.content)
                : undefined,
          },
        });

        return {
          conversationId: conversation.id,
          assistantMessage,
          contextSources: 1,
        };
      }
    }

    const semanticCacheEligible = semanticCacheService.shouldUseCache({
      query: normalized,
      routeKind: inferencePlan.routeKind,
      source: 'ADMIN_CHAT',
      hasAttachments: attachments.length > 0,
      responseFormat: params.responseFormat,
      webSearch: params.webSearch,
      useBuiltInTools,
    });

    if (semanticCacheEligible) {
      const cacheHit = await semanticCacheService.find({
        tenantId: params.tenantId,
        query: normalized,
        routeKind: inferencePlan.routeKind,
        source: 'ADMIN_CHAT',
      });

      if (cacheHit) {
        const completion = buildSemanticCacheCompletion(cacheHit);
        params.onContentDelta?.(completion.content);

        aiObservabilityService.recordInference({
          routeKind: 'semantic_cache',
          experience: inferencePlan.experience,
          model: completion.model,
          latencyMs: completion.latencyMs,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: false,
          tenantId: params.tenantId,
          userId: params.userId,
          source: 'ADMIN_CHAT',
        });

        const assistantMessage = await prisma.aiMessage.create({
          data: {
            conversationId: conversation.id,
            role: AiMessageRole.ASSISTANT,
            content: completion.content,
            model: completion.model,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            latencyMs: completion.latencyMs,
            metadata: {
              finishReason: completion.finishReason,
              thinkEnabled: false,
              performance: buildPerformanceMetadata(completion),
              chatMode,
              experience: inferencePlan.experience,
              profile: completion.profile,
              routeKind: completion.routeKind,
              originalRouteKind: inferencePlan.routeKind,
              semanticCache: {
                id: cacheHit.id,
                score: cacheHit.score,
                hitKind: cacheHit.hitKind,
              },
              attemptedModels: [],
              usedFallback: false,
              circuitBreakerOpen: false,
              deterministicResponse: true,
              responseFormat: toJsonValue(params.responseFormat),
              builtinToolsEnabled: false,
              contextSources: [],
            },
          },
        });

        await prisma.aiConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            title:
              conversation.title === 'Nova conversa'
                ? normalizeConversationTitle(userMessage.content)
                : undefined,
          },
        });

        return {
          conversationId: conversation.id,
          assistantMessage,
          contextSources: 0,
        };
      }
    }

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: inferencePlan.lowLatencyProfile
        ? Math.min(config.maxConversationMessagesContext, 3)
        : config.maxConversationMessagesContext,
    });

    const scopedHistory = filterConversationHistoryForExperience(
      recentMessages.reverse(),
      inferencePlan.experience,
    );

    const conversationMessages = scopedHistory
      .map((message) => ({
        role: mapStoredRoleToModelRole(message.role),
        content: buildModelMessageContent(message),
      }))
      .filter((message) => message.content.trim().length > 0);

    const prepared = await this.prepareModelMessages({
      tenantId: params.tenantId,
      userName: params.userName,
      departmentId: params.departmentId,
      query: normalized,
      conversationId: params.conversationId,
      messages: conversationMessages,
      inferencePlan,
      webSearchRequested: params.webSearch,
      extraInstruction: params.extraInstruction,
      source: 'ADMIN_CHAT',
      responseFormat: params.responseFormat,
      useBuiltInTools,
    });

    const deterministicWebCompletion =
      inferencePlan.routeKind === 'web_lookup'
        ? buildDeterministicWebLookupCompletion({
            query: normalized,
            results: prepared.webSearch.results,
            latencyMs: Date.now() - requestStartedAt,
            routeKind: inferencePlan.routeKind,
          })
        : null;

    if (deterministicWebCompletion) {
      params.onContentDelta?.(deterministicWebCompletion.content);

      aiObservabilityService.recordInference({
        routeKind: inferencePlan.routeKind,
        experience: inferencePlan.experience,
        model: deterministicWebCompletion.model,
        latencyMs: deterministicWebCompletion.latencyMs,
        deterministicResponse: true,
        toolFirst: false,
        webSearch: prepared.webSearch.enabled,
        tenantId: params.tenantId,
        userId: params.userId,
        source: 'ADMIN_CHAT',
      });

      const assistantMessage = await prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: AiMessageRole.ASSISTANT,
          content: deterministicWebCompletion.content,
          model: deterministicWebCompletion.model,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: deterministicWebCompletion.latencyMs,
          metadata: {
            finishReason: deterministicWebCompletion.finishReason,
            thinkEnabled: false,
            performance: buildPerformanceMetadata(deterministicWebCompletion),
            chatMode,
            experience: inferencePlan.experience,
            profile: deterministicWebCompletion.profile,
            routeKind: inferencePlan.routeKind,
            attemptedModels: [],
            usedFallback: false,
            circuitBreakerOpen: false,
            deterministicResponse: true,
            responseFormat: toJsonValue(params.responseFormat),
            builtinToolsEnabled: false,
            contextSources: prepared.contextSourceIds.slice(0, 6),
            webSearch: buildWebSearchMetadata(prepared.webSearch.results, prepared.webSearch.enabled),
          },
        },
      });

      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          title:
            conversation.title === 'Nova conversa'
              ? normalizeConversationTitle(userMessage.content)
              : undefined,
        },
      });

      return {
        conversationId: conversation.id,
        assistantMessage,
        contextSources: prepared.contextSourceIds.length,
      };
    }

    const completion = await this.executeModelFlowWithRagFallback({
      query: normalized,
      relevantChunks: prepared.relevantChunks,
      tenantId: params.tenantId,
      modelMessages: prepared.modelMessages,
      model: resolvedModel,
      think: params.think,
      experience: inferencePlan.experience,
      chatMode,
      lowLatencyProfile: inferencePlan.lowLatencyProfile,
      responseFormat: params.responseFormat,
      useBuiltInTools,
      toolLoopLimit: params.toolLoopLimit,
      allowFallback: inferencePlan.allowFallback,
      routeKind: inferencePlan.routeKind,
      deterministicResponse: inferencePlan.deterministicResponse,
      onThinkingDelta: params.onThinkingDelta,
      onContentDelta: params.onContentDelta,
    });

    aiObservabilityService.recordInference({
      routeKind: inferencePlan.routeKind,
      experience: inferencePlan.experience,
      model: completion.model,
      latencyMs: completion.latencyMs,
      firstTokenLatencyMs: completion.firstTokenLatencyMs,
      deterministicResponse: inferencePlan.deterministicResponse,
      toolFirst:
        inferencePlan.deterministicApplicationContext ||
        inferencePlan.deterministicApplicationData ||
        useBuiltInTools,
      webSearch: prepared.webSearch.enabled,
      tenantId: params.tenantId,
      userId: params.userId,
      source: 'ADMIN_CHAT',
    });

    if (semanticCacheEligible) {
      void semanticCacheService.store({
        tenantId: params.tenantId,
        query: normalized,
        source: 'ADMIN_CHAT',
        completion,
        routeKind: inferencePlan.routeKind,
        contextSources: prepared.contextSourceIds,
      });
    }

    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.ASSISTANT,
        content: completion.content,
        model: completion.model,
        promptTokens: completion.inputTokens,
        completionTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
        latencyMs: completion.latencyMs,
        metadata: {
          finishReason: completion.finishReason,
          thinkEnabled: typeof params.think === 'boolean' ? params.think : undefined,
          thinking: completion.thinking || undefined,
          performance: buildPerformanceMetadata(completion),
          chatMode,
          experience: inferencePlan.experience,
          profile: completion.profile,
          routeKind: inferencePlan.routeKind,
          attemptedModels: completion.attemptedModels,
          usedFallback: completion.usedFallback,
          circuitBreakerOpen: completion.circuitBreakerOpen,
          deterministicResponse: inferencePlan.deterministicResponse,
          toolCalls: toJsonValue(completion.toolCalls),
          responseFormat: toJsonValue(params.responseFormat),
          builtinToolsEnabled: useBuiltInTools || undefined,
          contextSources: prepared.contextSourceIds.slice(0, 6),
          webSearch: buildWebSearchMetadata(prepared.webSearch.results, prepared.webSearch.enabled),
        },
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        title:
          conversation.title === 'Nova conversa'
            ? normalizeConversationTitle(userMessage.content)
            : undefined,
      },
    });

    try {
      await apiKeyService.recordUsage({
        tenantId: params.tenantId,
        conversationId: conversation.id,
        userId: params.userId,
        source: 'ADMIN_CHAT',
        model: completion.model,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
        estimatedCostCents: 0,
      });
    } catch (error) {
      logger.warn('Failed to record AI usage (streamed message flow)', {
        tenantId: params.tenantId,
        conversationId: conversation.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      conversationId: conversation.id,
      assistantMessage,
      contextSources: prepared.contextSourceIds.length,
    };
  }

  async completeStateless(params: {
    tenantId: string;
    userId?: string;
    userName?: string;
    departmentId?: string;
    prompt: string;
    model?: string;
    think?: ChatThinkingMode;
    mode?: ChatMode;
    experience?: AiExperience;
    webSearch?: boolean;
    extraInstruction?: string;
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
    source: 'INTERNAL_API' | 'PUBLIC_API' | 'ADMIN_CHAT';
    apiKeyId?: string;
    planId?: string;
  }): Promise<{
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    thinking?: string;
    firstTokenLatencyMs?: number;
    totalDurationMs?: number;
    loadDurationMs?: number;
    promptEvalDurationMs?: number;
    evalDurationMs?: number;
    tokensPerSecond?: number;
    contextSources: number;
    profile?: string;
    routeKind?: ChatCompletionResult['routeKind'];
    attemptedModels?: string[];
    usedFallback?: boolean;
    circuitBreakerOpen?: boolean;
    deterministicResponse?: boolean;
    interactiveCards?: unknown;
    webSearch?: WebSearchMetadata;
  }> {
    const prompt = params.prompt.trim();
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    const requestStartedAt = Date.now();

    const requestedModel = resolveRequestedModel({
      requestedModel: params.model,
      source: params.source,
    });

    const inferencePlan = inferenceRouterService.plan({
      query: prompt,
      requestedMode: params.mode,
      requestedExperience: params.experience,
      requestedModel,
      source: params.source,
      explicitWebSearch: params.webSearch,
    });
    const chatMode = inferencePlan.chatMode;
    const useBuiltInTools =
      typeof params.useBuiltInTools === 'boolean'
        ? params.useBuiltInTools
        : inferencePlan.useBuiltInTools;
    const resolvedModel = inferencePlan.resolvedModel;

    const deterministicShortCompletion =
      inferencePlan.routeKind === 'free_short'
        ? buildDeterministicShortCompletion(prompt, Date.now() - requestStartedAt)
        : null;

    if (deterministicShortCompletion) {
      aiObservabilityService.recordInference({
        routeKind: 'free_short',
        experience: inferencePlan.experience,
        model: deterministicShortCompletion.model,
        latencyMs: deterministicShortCompletion.latencyMs,
        deterministicResponse: true,
        toolFirst: false,
        webSearch: false,
        tenantId: params.tenantId,
        userId: params.userId,
        source: params.source,
      });

      return {
        content: deterministicShortCompletion.content,
        model: deterministicShortCompletion.model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        thinking: undefined,
        firstTokenLatencyMs: 0,
        totalDurationMs: deterministicShortCompletion.latencyMs,
        loadDurationMs: 0,
        promptEvalDurationMs: 0,
        evalDurationMs: 0,
        tokensPerSecond: undefined,
        contextSources: 0,
        profile: deterministicShortCompletion.profile,
        routeKind: deterministicShortCompletion.routeKind,
        attemptedModels: [],
        usedFallback: false,
        circuitBreakerOpen: false,
        deterministicResponse: true,
        webSearch: buildWebSearchMetadata([], false),
      };
    }

    if (inferencePlan.deterministicApplicationData) {
      try {
        const completion = await buildDeterministicApplicationDataCompletion({
          query: prompt,
          latencyStartedAt: requestStartedAt,
        });

        if (completion) {
          aiObservabilityService.recordInference({
            routeKind: 'context_metrics',
            experience: inferencePlan.experience,
            model: completion.model,
            latencyMs: completion.latencyMs,
            deterministicResponse: true,
            toolFirst: true,
            webSearch: false,
            tenantId: params.tenantId,
            userId: params.userId,
            source: params.source,
          });

          return {
            content: completion.content,
            model: completion.model,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            thinking: undefined,
            firstTokenLatencyMs: 0,
            totalDurationMs: completion.latencyMs,
            loadDurationMs: 0,
            promptEvalDurationMs: 0,
            evalDurationMs: 0,
            tokensPerSecond: undefined,
            contextSources: 1,
            profile: completion.profile,
            routeKind: completion.routeKind,
            attemptedModels: [],
            usedFallback: false,
            circuitBreakerOpen: false,
            deterministicResponse: true,
            interactiveCards: completion.interactiveCards,
            webSearch: buildWebSearchMetadata([], false),
          };
        }
      } catch (error) {
        logger.warn('Deterministic stateless application data response failed', {
          tenantId: params.tenantId,
          userId: params.userId,
          source: params.source,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (inferencePlan.deterministicApplicationContext && !inferencePlan.deterministicApplicationData) {
      const completion = buildDeterministicApplicationContextCompletion({
        query: prompt,
        latencyStartedAt: requestStartedAt,
      });

      if (completion) {
        aiObservabilityService.recordInference({
          routeKind: 'context_navigation',
          experience: inferencePlan.experience,
          model: completion.model,
          latencyMs: completion.latencyMs,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: false,
          tenantId: params.tenantId,
          userId: params.userId,
          source: params.source,
        });

        return {
          content: completion.content,
          model: completion.model,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          thinking: undefined,
          firstTokenLatencyMs: 0,
          totalDurationMs: completion.latencyMs,
          loadDurationMs: 0,
          promptEvalDurationMs: 0,
          evalDurationMs: 0,
          tokensPerSecond: undefined,
          contextSources: 1,
          profile: completion.profile,
          routeKind: completion.routeKind,
          attemptedModels: [],
          usedFallback: false,
          circuitBreakerOpen: false,
          deterministicResponse: true,
          interactiveCards: completion.interactiveCards,
          webSearch: buildWebSearchMetadata([], false),
        };
      }
    }

    const semanticCacheEligible = semanticCacheService.shouldUseCache({
      query: prompt,
      routeKind: inferencePlan.routeKind,
      source: params.source,
      responseFormat: params.responseFormat,
      webSearch: params.webSearch,
      useBuiltInTools,
    });

    if (semanticCacheEligible) {
      const cacheHit = await semanticCacheService.find({
        tenantId: params.tenantId,
        query: prompt,
        routeKind: inferencePlan.routeKind,
        source: params.source,
      });

      if (cacheHit) {
        const completion = buildSemanticCacheCompletion(cacheHit);
        aiObservabilityService.recordInference({
          routeKind: 'semantic_cache',
          experience: inferencePlan.experience,
          model: completion.model,
          latencyMs: completion.latencyMs,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: false,
          tenantId: params.tenantId,
          userId: params.userId,
          source: params.source,
        });

        return {
          content: completion.content,
          model: completion.model,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          thinking: undefined,
          firstTokenLatencyMs: 0,
          totalDurationMs: completion.latencyMs,
          loadDurationMs: 0,
          promptEvalDurationMs: 0,
          evalDurationMs: 0,
          tokensPerSecond: undefined,
          contextSources: 0,
          profile: completion.profile,
          routeKind: completion.routeKind,
          attemptedModels: [],
          usedFallback: false,
          circuitBreakerOpen: false,
          deterministicResponse: true,
          webSearch: buildWebSearchMetadata([], false),
        };
      }
    }

    const prepared = await this.prepareModelMessages({
      tenantId: params.tenantId,
      userName: params.userName,
      departmentId: params.departmentId,
      query: prompt,
      messages: [{ role: 'user', content: prompt }],
      inferencePlan,
      webSearchRequested: params.webSearch,
      extraInstruction: params.extraInstruction,
      source: params.source,
      responseFormat: params.responseFormat,
      useBuiltInTools,
    });

    const deterministicWebCompletion =
      inferencePlan.routeKind === 'web_lookup'
        ? buildDeterministicWebLookupCompletion({
            query: prompt,
            results: prepared.webSearch.results,
            latencyMs: Date.now() - requestStartedAt,
            routeKind: inferencePlan.routeKind,
          })
        : null;

    if (deterministicWebCompletion) {
      aiObservabilityService.recordInference({
        routeKind: inferencePlan.routeKind,
        experience: inferencePlan.experience,
        model: deterministicWebCompletion.model,
        latencyMs: deterministicWebCompletion.latencyMs,
        deterministicResponse: true,
        toolFirst: false,
        webSearch: prepared.webSearch.enabled,
        tenantId: params.tenantId,
        userId: params.userId,
        source: params.source,
      });

      return {
        content: deterministicWebCompletion.content,
        model: deterministicWebCompletion.model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        thinking: undefined,
        firstTokenLatencyMs: 0,
        totalDurationMs: deterministicWebCompletion.latencyMs,
        loadDurationMs: 0,
        promptEvalDurationMs: 0,
        evalDurationMs: 0,
        tokensPerSecond: undefined,
        contextSources: prepared.contextSourceIds.length,
        profile: deterministicWebCompletion.profile,
        routeKind: deterministicWebCompletion.routeKind,
        attemptedModels: [],
        usedFallback: false,
        circuitBreakerOpen: false,
        deterministicResponse: true,
        webSearch: buildWebSearchMetadata(prepared.webSearch.results, prepared.webSearch.enabled),
      };
    }

    const completion = await this.executeModelFlowWithRagFallback({
      query: prompt,
      relevantChunks: prepared.relevantChunks,
      tenantId: params.tenantId,
      modelMessages: prepared.modelMessages,
      model: resolvedModel,
      think: params.think,
      experience: inferencePlan.experience,
      chatMode,
      lowLatencyProfile: inferencePlan.lowLatencyProfile,
      responseFormat: params.responseFormat,
      useBuiltInTools,
      toolLoopLimit: params.toolLoopLimit,
      allowFallback: inferencePlan.allowFallback,
      routeKind: inferencePlan.routeKind,
      deterministicResponse: inferencePlan.deterministicResponse,
    });

    aiObservabilityService.recordInference({
      routeKind: inferencePlan.routeKind,
      experience: inferencePlan.experience,
      model: completion.model,
      latencyMs: completion.latencyMs,
      firstTokenLatencyMs: completion.firstTokenLatencyMs,
      deterministicResponse: inferencePlan.deterministicResponse,
      toolFirst:
        inferencePlan.deterministicApplicationContext ||
        inferencePlan.deterministicApplicationData ||
        useBuiltInTools,
      webSearch: prepared.webSearch.enabled,
      tenantId: params.tenantId,
      userId: params.userId,
      source: params.source,
    });

    if (semanticCacheEligible) {
      void semanticCacheService.store({
        tenantId: params.tenantId,
        query: prompt,
        source: params.source,
        completion,
        routeKind: inferencePlan.routeKind,
        contextSources: prepared.contextSourceIds,
      });
    }

    try {
      await apiKeyService.recordUsage({
        tenantId: params.tenantId,
        planId: params.planId,
        apiKeyId: params.apiKeyId,
        userId: params.userId,
        source: params.source,
        model: completion.model,
        inputTokens: completion.inputTokens,
        outputTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
        estimatedCostCents: 0,
      });
    } catch (error) {
      logger.warn('Failed to record AI usage (stateless flow)', {
        tenantId: params.tenantId,
        userId: params.userId,
        source: params.source,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      content: completion.content,
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      totalTokens: completion.totalTokens,
      thinking: completion.thinking,
      firstTokenLatencyMs: completion.firstTokenLatencyMs,
      totalDurationMs: completion.totalDurationMs,
      loadDurationMs: completion.loadDurationMs,
      promptEvalDurationMs: completion.promptEvalDurationMs,
      evalDurationMs: completion.evalDurationMs,
      tokensPerSecond: completion.tokensPerSecond,
      contextSources: prepared.contextSourceIds.length,
      profile: completion.profile,
      routeKind: completion.routeKind,
      attemptedModels: completion.attemptedModels,
      usedFallback: completion.usedFallback,
      circuitBreakerOpen: completion.circuitBreakerOpen,
      deterministicResponse: completion.deterministicResponse,
      webSearch: buildWebSearchMetadata(prepared.webSearch.results, prepared.webSearch.enabled),
    };
  }

  private async prepareModelMessages(params: {
    tenantId: string;
    userName?: string;
    departmentId?: string;
    query: string;
    conversationId?: string;
    messages: ChatMessageInput[];
    inferencePlan: ReturnType<typeof inferenceRouterService.plan>;
    webSearchRequested?: boolean;
    extraInstruction?: string;
    source: 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
  }): Promise<{
    modelMessages: ChatMessageInput[];
    relevantChunks: Array<{ content: string; sourceId: string; score: number }>;
    contextSourceIds: string[];
    webSearch: { enabled: boolean; results: WebSearchResult[] };
  }> {
    const chatMode = params.inferencePlan.chatMode;
    let relevantChunks: Array<{ content: string; sourceId: string; score: number }> = [];
    let applicationContextResults: Array<{
      id: string;
      title: string;
      summary: string;
      path?: string;
      minRole?: string;
      permissions?: string[];
      steps?: string[];
    }> = [];
    let applicationContextChunks: string[] = [];
    let applicationDataChunk: string | undefined;
    const shouldPreloadKnowledge =
      params.inferencePlan.shouldPreloadKnowledge && !params.useBuiltInTools;

    if (shouldPreloadKnowledge) {
      try {
        relevantChunks = await knowledgeService.searchRelevantChunks({
          tenantId: params.tenantId,
          query: params.query,
          limit: config.maxContextChunks,
          scopes: params.inferencePlan.knowledgeScopes.filter(
            (scope): scope is KnowledgeIndexScope =>
              scope === 'business_flows_index' || scope === 'internal_docs_index',
          ),
        });
      } catch (error) {
        logger.warn('Knowledge context lookup failed', {
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          source: params.source,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (chatMode === 'rag' && params.inferencePlan.deterministicApplicationContext) {
      applicationContextResults = applicationContextService.search({ query: params.query, limit: 4 });
      applicationContextChunks = trimContextForPrompt(
        formatApplicationContextChunks(applicationContextResults),
      );
    }

    if (chatMode === 'rag' && params.inferencePlan.deterministicApplicationData) {
      try {
        applicationDataChunk = truncateForModel(
          JSON.stringify(await applicationDataService.query(params.query)),
          Math.max(320, Math.min(config.maxContextCharsInPrompt, 900)),
        );
      } catch (error) {
        logger.warn('Application data lookup failed', {
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          source: params.source,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const webSearch = await resolveWebSearchContext({
      query: params.query,
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      source: params.source,
      requested: params.webSearchRequested,
      autoDetect: params.inferencePlan.shouldUseWebSearch,
    });

    let modelMessages =
      chatMode === 'rag'
        ? boundRagModelMessages([
            {
              role: 'system',
              content: buildSystemPrompt({
                userName: params.userName,
                departmentId: params.departmentId,
                retrievedContext: trimContextForPrompt(relevantChunks.map((item) => item.content)),
                applicationContext: applicationContextChunks,
                applicationData: applicationDataChunk,
                webContext: trimContextForPrompt(buildWebContextChunks(webSearch.results)),
                webSearchEnabled: webSearch.enabled,
                extraInstruction: params.extraInstruction,
                toolsEnabled:
                  params.useBuiltInTools ||
                  params.inferencePlan.deterministicApplicationContext ||
                  params.inferencePlan.deterministicApplicationData,
              }),
            },
            ...params.messages,
          ])
        : boundConversationMessages(
            [
              {
                role: 'system',
                content: buildFreeModePromptWithWebContext({
                  extraInstruction: params.extraInstruction,
                  webContext: trimContextForPrompt(buildWebContextChunks(webSearch.results)),
                  webSearchEnabled: webSearch.enabled,
                  contract:
                    params.inferencePlan.promptContract === 'quality' ? 'quality' : 'free',
                }),
              },
              ...params.messages,
            ],
          );

    modelMessages = appendStructuredOutputInstruction(modelMessages, params.responseFormat);
    const contextSourceIds = [
      ...relevantChunks.map((item) => item.sourceId),
      ...applicationContextResults.map((item) => `app:${item.id}`),
      ...(applicationDataChunk ? ['data:live_metrics_tools'] : []),
      ...webSearch.results.slice(0, 3).map((item) => item.url),
    ];
    return { modelMessages, relevantChunks, contextSourceIds, webSearch };
  }

  private async executeModelFlowWithRagFallback(params: {
    query: string;
    relevantChunks: Array<{ content: string; sourceId: string; score: number }>;
    tenantId: string;
    modelMessages: ChatMessageInput[];
    model?: string;
    think?: ChatThinkingMode;
    experience: AiExperience;
    chatMode: ChatMode;
    lowLatencyProfile: boolean;
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
    allowFallback?: boolean;
    routeKind: ChatCompletionResult['routeKind'];
    deterministicResponse: boolean;
    onThinkingDelta?: (delta: string) => void;
    onContentDelta?: (delta: string) => void;
  }): Promise<ChatCompletionResult> {
    try {
      return await this.executeModelFlow(params);
    } catch (error) {
      if (
        params.chatMode === 'rag' &&
        params.relevantChunks.length > 0 &&
        error instanceof AiProviderServiceError
      ) {
        const degradedContent = buildRagFallbackContent(params.query, params.relevantChunks);
        logger.warn('Returning degraded RAG fallback after model timeout', {
          tenantId: params.tenantId,
          query: truncateForModel(params.query, 120),
          statusCode: error.statusCode,
          message: error.message,
        });
        params.onContentDelta?.(degradedContent);
        return {
          content: degradedContent,
          model: 'knowledge-fallback',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          finishReason: 'degraded_rag_timeout',
          profile: 'rag',
          attemptedModels: [],
          usedFallback: false,
          circuitBreakerOpen: false,
          routeKind: params.routeKind,
          deterministicResponse: params.deterministicResponse,
        };
      }

      throw error;
    }
  }

  private async executeModelFlow(params: {
    tenantId: string;
    modelMessages: ChatMessageInput[];
    model?: string;
    think?: ChatThinkingMode;
    experience: AiExperience;
    chatMode: ChatMode;
    lowLatencyProfile: boolean;
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
    allowFallback?: boolean;
    routeKind: ChatCompletionResult['routeKind'];
    deterministicResponse: boolean;
    onThinkingDelta?: (delta: string) => void;
    onContentDelta?: (delta: string) => void;
  }): Promise<ChatCompletionResult> {
    const profile = resolveInferenceProfile({
      lowLatencyProfile: params.lowLatencyProfile,
      chatMode: params.chatMode,
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
    });

    if (!params.useBuiltInTools) {
      if (params.onThinkingDelta || params.onContentDelta) {
        const streamed = await aiProviderService.chatStream(
          params.modelMessages,
          {
            tenantId: params.tenantId,
            model: params.model,
            think: params.think,
            experience: params.experience,
            profile,
            format: params.responseFormat,
            allowFallback: params.allowFallback,
          },
          {
            onThinkingDelta: params.onThinkingDelta,
            onContentDelta: params.onContentDelta,
          },
        );
        return {
          ...streamed,
          routeKind: params.routeKind,
          deterministicResponse: params.deterministicResponse,
        };
      }

      const completion = await aiProviderService.chat(params.modelMessages, {
        tenantId: params.tenantId,
        model: params.model,
        think: params.think,
        experience: params.experience,
        profile,
        format: params.responseFormat,
        allowFallback: params.allowFallback,
      });
      return {
        ...completion,
        routeKind: params.routeKind,
        deterministicResponse: params.deterministicResponse,
      };
    }

    const builtinTools = toolRunnerService.getBuiltInTools({
      tenantId: params.tenantId,
      chatMode: params.chatMode,
    });
    if (!builtinTools.length) {
      if (params.onThinkingDelta || params.onContentDelta) {
        const streamed = await aiProviderService.chatStream(
          params.modelMessages,
          {
            tenantId: params.tenantId,
            model: params.model,
            think: params.think,
            experience: params.experience,
            profile,
            format: params.responseFormat,
            allowFallback: params.allowFallback,
          },
          {
            onThinkingDelta: params.onThinkingDelta,
            onContentDelta: params.onContentDelta,
          },
        );
        return {
          ...streamed,
          routeKind: params.routeKind,
          deterministicResponse: params.deterministicResponse,
        };
      }

      const completion = await aiProviderService.chat(params.modelMessages, {
        tenantId: params.tenantId,
        model: params.model,
        think: params.think,
        experience: params.experience,
        profile,
        format: params.responseFormat,
        allowFallback: params.allowFallback,
      });
      return {
        ...completion,
        routeKind: params.routeKind,
        deterministicResponse: params.deterministicResponse,
      };
    }

    const toolLoopLimit = Math.max(1, Math.min(params.toolLoopLimit || config.llamaCppToolLoopMaxSteps, 8));
    const messages = appendToolUsageInstruction(params.modelMessages);
    let workingMessages = [...messages];

    for (let step = 0; step < toolLoopLimit; step += 1) {
      const completion = await aiProviderService.chat(workingMessages, {
        tenantId: params.tenantId,
        model: params.model,
        think: params.think,
        experience: params.experience,
        profile: 'tool',
        tools: builtinTools,
        format: step === toolLoopLimit - 1 ? undefined : params.responseFormat,
        allowFallback: params.allowFallback,
      });

      if (!completion.toolCalls?.length) {
        if (completion.thinking) {
          params.onThinkingDelta?.(completion.thinking);
        }
        if (completion.content) {
          params.onContentDelta?.(completion.content);
        }
        return {
          ...completion,
          routeKind: params.routeKind,
          deterministicResponse: params.deterministicResponse,
        };
      }

      workingMessages = [
        ...workingMessages,
        {
          role: 'assistant',
          content: completion.content,
          thinking: completion.thinking,
          toolCalls: completion.toolCalls,
        },
      ];

      for (const toolCall of completion.toolCalls) {
        try {
          const result = await toolRunnerService.executeToolCall(toolCall, {
            tenantId: params.tenantId,
            chatMode: params.chatMode,
          });
          workingMessages.push({
            role: 'tool',
            toolName: result.toolName,
            content: JSON.stringify(result.output),
          });
        } catch (error) {
          const fallbackPayload = {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          };
          workingMessages.push({
            role: 'tool',
            toolName: toolCall.function.name,
            content: JSON.stringify(fallbackPayload),
          });
        }
      }
    }

    const finalizeMessages = appendStructuredOutputInstruction(
      [
        ...workingMessages,
        {
          role: 'system',
          content:
            'Finalize agora a resposta ao usuario com base nas ferramentas ja executadas. Nao chame novas ferramentas.',
        },
      ],
      params.responseFormat,
    );
    const finalCompletion = await aiProviderService.chat(finalizeMessages, {
      tenantId: params.tenantId,
      model: params.model,
      think: false,
      experience: params.experience,
      profile: params.responseFormat ? 'structured' : 'draft',
      format: params.responseFormat,
      allowFallback: params.allowFallback,
    });

    if (finalCompletion.thinking) {
      params.onThinkingDelta?.(finalCompletion.thinking);
    }
    if (finalCompletion.content) {
      params.onContentDelta?.(finalCompletion.content);
    }

    return {
      ...finalCompletion,
      routeKind: params.routeKind,
      deterministicResponse: params.deterministicResponse,
    };
  }
}

export const chatService = new ChatService();
