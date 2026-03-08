import { config } from '../config/config';
import { AiExperience, InferenceRouteKind } from '../types';

export type ChatMode = 'free' | 'rag';

export type KnowledgeIndexScope =
  | 'app_routes_index'
  | 'business_flows_index'
  | 'internal_docs_index'
  | 'live_metrics_tools';

export interface InferencePlan {
  experience: AiExperience;
  chatMode: ChatMode;
  routeKind: InferenceRouteKind;
  resolvedModel?: string;
  promptContract: 'free' | 'contextual' | 'quality';
  knowledgeScopes: KnowledgeIndexScope[];
  lowLatencyProfile: boolean;
  useBuiltInTools: boolean;
  deterministicApplicationContext: boolean;
  deterministicApplicationData: boolean;
  deterministicResponse: boolean;
  shouldPreloadKnowledge: boolean;
  shouldUseWebSearch: boolean;
  allowFallback: boolean;
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(value: string, signals: string[]): boolean {
  return signals.some((signal) => value.includes(signal));
}

function isGreeting(normalized: string): boolean {
  return new Set([
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
  ]).has(normalized);
}

function isWebLookupQuery(normalized: string): boolean {
  const explicitWebIntent = [
    'busque na web',
    'pesquise na web',
    'procure na web',
    'na internet',
    'na web',
    'online',
    'google',
  ];
  if (includesAny(normalized, explicitWebIntent)) {
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
  ];
  const lookupFormatIntent = ['quantos', 'qual', 'quem', 'quando', 'onde', 'quanto'];

  return includesAny(normalized, currentDataIntent) && includesAny(normalized, lookupFormatIntent);
}

function isApplicationQuery(normalized: string): boolean {
  return includesAny(normalized, [
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
    'chamado',
    'chamados',
    'ticket',
    'permissao',
    'papel',
    'role',
    'fluxo',
  ]);
}

function isNavigationQuery(normalized: string): boolean {
  return includesAny(normalized, [
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
    'rota',
  ]);
}

function isMetricsQuery(normalized: string): boolean {
  const entitySignals = ['protocolo', 'protocolos', 'chamado', 'chamados', 'ticket'];
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
    'pendente',
    'pendentes',
    'concluido',
    'concluidos',
  ];

  return includesAny(normalized, entitySignals) && includesAny(normalized, metricSignals);
}

function isDraftingQuery(normalized: string, rawQuery: string): boolean {
  const draftingSignals = [
    'oficio',
    'comunicado',
    'texto',
    'redacao',
    'redigir',
    'reescreva',
    'revisar',
    'revise',
    'corrija',
    'melhore',
    'parecer',
    'memorando',
    'decreto',
    'portaria',
  ];

  return includesAny(normalized, draftingSignals) || rawQuery.trim().length >= 220;
}

function shouldUseFastProfile(normalized: string, query: string): boolean {
  if (!normalized) return true;
  if (normalized.length <= 20 && isGreeting(normalized)) return true;

  const words = normalized.split(' ').filter(Boolean);
  if (!words.length) return true;
  if (words.length <= 2 && words.every((word) => word.length <= 3)) {
    return true;
  }

  return query.trim().length <= 120;
}

export class InferenceRouterService {
  plan(params: {
    query: string;
    requestedMode?: ChatMode;
    requestedExperience?: AiExperience;
    requestedModel?: string;
    source: 'ADMIN_CHAT' | 'INTERNAL_API' | 'PUBLIC_API';
    explicitWebSearch?: boolean;
  }): InferencePlan {
    const normalized = normalizeText(params.query);
    const requestedModel = params.requestedModel?.trim();
    const forcedQuality =
      params.requestedExperience === 'quality' ||
      requestedModel === config.ollamaQualityModel;
    const forcedContextual =
      params.requestedExperience === 'contextual' || params.requestedMode === 'rag';
    const autoQuality =
      !params.requestedExperience && !params.requestedMode && isDraftingQuery(normalized, params.query);
    const experience: AiExperience = forcedQuality || autoQuality
      ? 'quality'
      : forcedContextual
        ? 'contextual'
        : params.requestedExperience || 'fast';

    const chatMode: ChatMode =
      experience === 'contextual' ? 'rag' : params.requestedMode === 'rag' ? 'rag' : 'free';
    const applicationQuery = isApplicationQuery(normalized);
    const navigationQuery = applicationQuery && isNavigationQuery(normalized);
    const metricsQuery = applicationQuery && isMetricsQuery(normalized);
    const webLookup = !applicationQuery && (params.explicitWebSearch === true || isWebLookupQuery(normalized));
    const qualityRoute = experience === 'quality' || autoQuality;

    let routeKind: InferenceRouteKind = 'free_draft';
    if (qualityRoute) {
      routeKind = 'quality';
    } else if (metricsQuery) {
      routeKind = 'context_metrics';
    } else if (navigationQuery) {
      routeKind = 'context_navigation';
    } else if (chatMode === 'rag') {
      routeKind = 'context_documents';
    } else if (webLookup) {
      routeKind = 'web_lookup';
    } else if (shouldUseFastProfile(normalized, params.query)) {
      routeKind = 'free_short';
    }

    const resolvedModel = requestedModel
      ? requestedModel
      : routeKind === 'quality'
        ? config.ollamaQualityModel
        : config.ollamaModel;

    const deterministicApplicationContext =
      routeKind === 'context_navigation' || routeKind === 'context_metrics';
    const deterministicApplicationData = routeKind === 'context_metrics';
    const deterministicResponse =
      deterministicApplicationContext || deterministicApplicationData || routeKind === 'web_lookup';
    const useBuiltInTools =
      chatMode === 'rag' &&
      !deterministicResponse &&
      applicationQuery &&
      routeKind === 'context_documents';

    const knowledgeScopes: KnowledgeIndexScope[] =
      routeKind === 'context_navigation'
        ? ['business_flows_index']
        : routeKind === 'context_documents'
          ? ['business_flows_index', 'internal_docs_index']
          : routeKind === 'context_metrics'
            ? ['live_metrics_tools']
            : [];

    return {
      experience,
      chatMode,
      routeKind,
      resolvedModel,
      promptContract:
        routeKind === 'quality'
          ? 'quality'
          : chatMode === 'rag'
            ? 'contextual'
            : 'free',
      knowledgeScopes,
      lowLatencyProfile: routeKind === 'free_short' || routeKind === 'web_lookup',
      useBuiltInTools,
      deterministicApplicationContext,
      deterministicApplicationData,
      deterministicResponse,
      shouldPreloadKnowledge:
        chatMode === 'rag' &&
        (routeKind === 'context_navigation' || routeKind === 'context_documents'),
      shouldUseWebSearch: params.explicitWebSearch === true || routeKind === 'web_lookup',
      allowFallback: false,
    };
  }
}

export const inferenceRouterService = new InferenceRouterService();
