import { AiConversation, AiMessage, AiMessageRole, Prisma } from '@prisma/client';
import { config } from '../config/config';
import prisma from '../utils/prisma';
import { apiKeyService } from './api-key.service';
import { knowledgeService } from './knowledge.service';
import {
  ChatCompletionResult,
  ChatMessageInput,
  ChatResponseFormat,
  ChatThinkingMode,
} from '../types';
import { ollamaService, OllamaServiceError } from './ollama.service';
import { toolRunnerService } from './tool-runner.service';
import { webSearchService, WebSearchResult } from './web-search.service';
import logger from '../utils/logger';

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
      Math.max(1200, config.maxContextCharsInPrompt + 600),
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
  const leadingSystem = hasSystem ? messages[0] : undefined;
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

function buildSystemPrompt(params: {
  userName?: string;
  departmentId?: string;
  retrievedContext: string[];
  webContext: string[];
  webSearchEnabled: boolean;
  extraInstruction?: string;
}): string {
  const contextBlock = params.retrievedContext.length
    ? params.retrievedContext
        .map((chunk, index) => `[Contexto ${index + 1}]\n${chunk}`)
        .join('\n\n')
    : 'Nenhum contexto recuperado no momento.';
  const webContextBlock =
    params.webSearchEnabled && params.webContext.length
      ? params.webContext
          .map((chunk, index) => `[Web ${index + 1}]\n${chunk}`)
          .join('\n\n')
      : 'Sem contexto web nesta solicitacao.';

  const persona = [
    'Voce e a DigiUrban IA, assistente operacional para gestao publica municipal.',
    'Responda em portugues do Brasil com clareza, objetividade e foco em execucao.',
    'Use prioritariamente o contexto fornecido.',
    'Entregue respostas curtas por padrao: no maximo 5 bullets ou 1 paragrafo curto, salvo se o usuario pedir detalhamento.',
    'Se faltar evidencia no contexto, diga explicitamente que nao ha dados suficientes.',
    'Nunca invente IDs, normas, status de protocolo ou informacoes de cidadania.',
    'Quando usar contexto web, cite os links relevantes de forma objetiva.',
  ].join(' ');

  const operator =
    params.userName || params.departmentId
      ? `Servidor atual: ${params.userName || 'nao informado'}; departamento: ${
          params.departmentId || 'nao informado'
        }.`
      : 'Servidor atual nao identificado.';

  const extra = params.extraInstruction?.trim()
    ? `Instrucao adicional: ${params.extraInstruction.trim()}`
    : '';

  return [
    persona,
    operator,
    extra,
    `Base de conhecimento:\n${contextBlock}`,
    `Contexto web:\n${webContextBlock}`,
  ]
    .filter(Boolean)
    .join('\n\n');
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

function normalizeIntentText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

  return false;
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
    'Voce pode usar ferramentas quando realmente precisar de contexto externo ou dados internos.',
    'Use no maximo a ferramenta necessaria para resolver a tarefa.',
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
}): Promise<{ enabled: boolean; results: WebSearchResult[] }> {
  const requested =
    typeof params.requested === 'boolean' ? params.requested : config.webSearchDefault;

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
      },
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

    const lowLatencyProfile = shouldUseLowLatencyProfile(normalized);
    const chatMode: ChatMode = params.mode || 'free';
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

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: lowLatencyProfile
        ? Math.min(config.maxConversationMessagesContext, 3)
        : config.maxConversationMessagesContext,
    });

    const conversationMessages = recentMessages
      .reverse()
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
      chatMode,
      lowLatencyProfile,
      webSearchRequested: params.webSearch,
      extraInstruction: params.extraInstruction,
      source: 'ADMIN_CHAT',
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
    });

    const completion = await this.executeModelFlowWithRagFallback({
      query: normalized,
      relevantChunks: prepared.relevantChunks,
      tenantId: params.tenantId,
      modelMessages: prepared.modelMessages,
      model: params.model,
      think: params.think,
      chatMode,
      lowLatencyProfile,
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
      toolLoopLimit: params.toolLoopLimit,
    });

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
          profile: completion.profile,
          attemptedModels: completion.attemptedModels,
          usedFallback: completion.usedFallback,
          circuitBreakerOpen: completion.circuitBreakerOpen,
          toolCalls: toJsonValue(completion.toolCalls),
          responseFormat: toJsonValue(params.responseFormat),
          builtinToolsEnabled: params.useBuiltInTools || undefined,
          contextSources: prepared.relevantChunks.slice(0, 5).map((item) => item.sourceId),
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
      contextSources: prepared.relevantChunks.length,
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

    const lowLatencyProfile = shouldUseLowLatencyProfile(normalized);
    const chatMode: ChatMode = params.mode || 'free';
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

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: lowLatencyProfile
        ? Math.min(config.maxConversationMessagesContext, 3)
        : config.maxConversationMessagesContext,
    });

    const conversationMessages = recentMessages
      .reverse()
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
      chatMode,
      lowLatencyProfile,
      webSearchRequested: params.webSearch,
      extraInstruction: params.extraInstruction,
      source: 'ADMIN_CHAT',
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
    });

    const completion = await this.executeModelFlowWithRagFallback({
      query: normalized,
      relevantChunks: prepared.relevantChunks,
      tenantId: params.tenantId,
      modelMessages: prepared.modelMessages,
      model: params.model,
      think: params.think,
      chatMode,
      lowLatencyProfile,
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
      toolLoopLimit: params.toolLoopLimit,
      onThinkingDelta: params.onThinkingDelta,
      onContentDelta: params.onContentDelta,
    });

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
          profile: completion.profile,
          attemptedModels: completion.attemptedModels,
          usedFallback: completion.usedFallback,
          circuitBreakerOpen: completion.circuitBreakerOpen,
          toolCalls: toJsonValue(completion.toolCalls),
          responseFormat: toJsonValue(params.responseFormat),
          builtinToolsEnabled: params.useBuiltInTools || undefined,
          contextSources: prepared.relevantChunks.slice(0, 5).map((item) => item.sourceId),
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
      contextSources: prepared.relevantChunks.length,
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
    attemptedModels?: string[];
    usedFallback?: boolean;
    circuitBreakerOpen?: boolean;
    webSearch?: WebSearchMetadata;
  }> {
    const prompt = params.prompt.trim();
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const lowLatencyProfile = shouldUseLowLatencyProfile(prompt);
    const chatMode = resolveChatMode({
      requestedMode: params.mode,
      source: params.source,
    });

    const prepared = await this.prepareModelMessages({
      tenantId: params.tenantId,
      userName: params.userName,
      departmentId: params.departmentId,
      query: prompt,
      messages: [{ role: 'user', content: prompt }],
      chatMode,
      lowLatencyProfile,
      webSearchRequested: params.webSearch,
      extraInstruction: params.extraInstruction,
      source: params.source,
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
    });

    const completion = await this.executeModelFlowWithRagFallback({
      query: prompt,
      relevantChunks: prepared.relevantChunks,
      tenantId: params.tenantId,
      modelMessages: prepared.modelMessages,
      model: params.model,
      think: params.think,
      chatMode,
      lowLatencyProfile,
      responseFormat: params.responseFormat,
      useBuiltInTools: params.useBuiltInTools,
      toolLoopLimit: params.toolLoopLimit,
    });

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
      contextSources: prepared.relevantChunks.length,
      profile: completion.profile,
      attemptedModels: completion.attemptedModels,
      usedFallback: completion.usedFallback,
      circuitBreakerOpen: completion.circuitBreakerOpen,
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
    chatMode: ChatMode;
    lowLatencyProfile: boolean;
    webSearchRequested?: boolean;
    extraInstruction?: string;
    source: 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
  }): Promise<{
    modelMessages: ChatMessageInput[];
    relevantChunks: Array<{ content: string; sourceId: string; score: number }>;
    webSearch: { enabled: boolean; results: WebSearchResult[] };
  }> {
    let relevantChunks: Array<{ content: string; sourceId: string; score: number }> = [];
    const shouldPreloadKnowledge =
      params.chatMode === 'rag' && !params.lowLatencyProfile && !params.useBuiltInTools;

    if (shouldPreloadKnowledge) {
      try {
        relevantChunks = await knowledgeService.searchRelevantChunks({
          tenantId: params.tenantId,
          query: params.query,
          limit: config.maxContextChunks,
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

    const webSearch = await resolveWebSearchContext({
      query: params.query,
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      source: params.source,
      requested:
        params.chatMode === 'rag' && !params.lowLatencyProfile && !params.useBuiltInTools
          ? params.webSearchRequested
          : false,
    });

    let modelMessages =
      params.chatMode === 'rag'
        ? boundRagModelMessages([
            {
              role: 'system',
              content: buildSystemPrompt({
                userName: params.userName,
                departmentId: params.departmentId,
                retrievedContext: trimContextForPrompt(relevantChunks.map((item) => item.content)),
                webContext: trimContextForPrompt(buildWebContextChunks(webSearch.results)),
                webSearchEnabled: webSearch.enabled,
                extraInstruction: params.extraInstruction,
              }),
            },
            ...params.messages,
          ])
        : boundConversationMessages(
            params.extraInstruction?.trim()
              ? [
                  {
                    role: 'system',
                    content: `Instrucao adicional: ${params.extraInstruction.trim()}`,
                  },
                  ...params.messages,
                ]
              : params.messages,
          );

    modelMessages = appendStructuredOutputInstruction(modelMessages, params.responseFormat);
    return { modelMessages, relevantChunks, webSearch };
  }

  private async executeModelFlowWithRagFallback(params: {
    query: string;
    relevantChunks: Array<{ content: string; sourceId: string; score: number }>;
    tenantId: string;
    modelMessages: ChatMessageInput[];
    model?: string;
    think?: ChatThinkingMode;
    chatMode: ChatMode;
    lowLatencyProfile: boolean;
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
    onThinkingDelta?: (delta: string) => void;
    onContentDelta?: (delta: string) => void;
  }): Promise<ChatCompletionResult> {
    try {
      return await this.executeModelFlow(params);
    } catch (error) {
      if (
        params.chatMode === 'rag' &&
        params.relevantChunks.length > 0 &&
        error instanceof OllamaServiceError
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
    chatMode: ChatMode;
    lowLatencyProfile: boolean;
    responseFormat?: ChatResponseFormat;
    useBuiltInTools?: boolean;
    toolLoopLimit?: number;
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
        return ollamaService.chatStream(
          params.modelMessages,
          params.model,
          {
            think: params.think,
            profile,
            format: params.responseFormat,
          },
          {
            onThinkingDelta: params.onThinkingDelta,
            onContentDelta: params.onContentDelta,
          },
        );
      }

      return ollamaService.chat(params.modelMessages, params.model, {
        think: params.think,
        profile,
        format: params.responseFormat,
      });
    }

    const builtinTools = toolRunnerService.getBuiltInTools({
      tenantId: params.tenantId,
      chatMode: params.chatMode,
    });
    if (!builtinTools.length) {
      return params.onThinkingDelta || params.onContentDelta
        ? ollamaService.chatStream(
            params.modelMessages,
            params.model,
            {
              think: params.think,
              profile,
              format: params.responseFormat,
            },
            {
              onThinkingDelta: params.onThinkingDelta,
              onContentDelta: params.onContentDelta,
            },
          )
        : ollamaService.chat(params.modelMessages, params.model, {
            think: params.think,
            profile,
            format: params.responseFormat,
          });
    }

    const toolLoopLimit = Math.max(1, Math.min(params.toolLoopLimit || config.ollamaToolLoopMaxSteps, 8));
    const messages = appendToolUsageInstruction(params.modelMessages);
    let workingMessages = [...messages];

    for (let step = 0; step < toolLoopLimit; step += 1) {
      const completion = await ollamaService.chat(workingMessages, params.model, {
        think: params.think,
        profile: 'tool',
        tools: builtinTools,
        format: step === toolLoopLimit - 1 ? undefined : params.responseFormat,
      });

      if (!completion.toolCalls?.length) {
        if (completion.thinking) {
          params.onThinkingDelta?.(completion.thinking);
        }
        if (completion.content) {
          params.onContentDelta?.(completion.content);
        }
        return completion;
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
    const finalCompletion = await ollamaService.chat(finalizeMessages, params.model, {
      think: false,
      profile: params.responseFormat ? 'structured' : 'draft',
      format: params.responseFormat,
      allowFallback: true,
    });

    if (finalCompletion.thinking) {
      params.onThinkingDelta?.(finalCompletion.thinking);
    }
    if (finalCompletion.content) {
      params.onContentDelta?.(finalCompletion.content);
    }

    return finalCompletion;
  }
}

export const chatService = new ChatService();
