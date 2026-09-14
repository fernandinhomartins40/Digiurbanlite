import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';
import {
  CitizenAiCorrectionExtraction,
  CitizenAiFieldExtraction,
  CitizenAiGuidance,
  CitizenAiIntentAnalysis,
  CitizenAiSelection,
} from './types';

const DEFAULT_AI_URL = 'http://localhost:9004/api/v1/internal/chat/completions';

function clampConfidence(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, numeric));
}

function parseJsonContent(rawContent: string): Record<string, any> | null {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [trimmed];
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      // Ignore and try the next candidate.
    }
  }

  return null;
}

export class CitizenAiClient {
  private readonly httpClient: AxiosInstance;
  private readonly serviceToken: string;
  private readonly tenantId: string;
  private readonly isConfigured: boolean;

  constructor() {
    // Otimização VPS (docs/PLANO-OTIMIZACAO-VPS.md, M4): a URL do serviço de IA precisa
    // ser EXPLÍCITA. Antes, sem variável definida, caía no DEFAULT_AI_URL (localhost:9004)
    // — que dentro do container não é ninguém — e o cliente ainda assim se considerava
    // configurado, tentando chamar host morto a cada turno de conversa.
    const explicitBaseURL =
      process.env.CITIZEN_AI_COMPLETIONS_URL ||
      process.env.DIGIURBAN_AI_COMPLETIONS_URL ||
      '';
    const baseURL = explicitBaseURL || DEFAULT_AI_URL;

    this.serviceToken = process.env.AI_SERVICE_TOKEN || '';
    this.tenantId = process.env.CITIZEN_AI_TENANT_ID || process.env.AI_DEFAULT_TENANT_ID || 'default';
    // Exige token E URL explícita. Com a IA local removida (llama.cpp/digiurban-ai) e a
    // externa (DeepSeek) ainda não integrada, isto faz o bot usar o caminho determinístico
    // em vez de degradar por timeout. Quando a IA voltar, basta definir a variável.
    this.isConfigured = Boolean(this.serviceToken) && Boolean(explicitBaseURL);

    this.httpClient = axios.create({
      baseURL,
      timeout: Number.parseInt(process.env.CITIZEN_AI_TIMEOUT_MS || '30000', 10),
      headers: {
        Authorization: `Bearer ${this.serviceToken}`,
        'x-tenant-id': this.tenantId,
        'Content-Type': 'application/json',
      },
    });
  }

  available(): boolean {
    return this.isConfigured;
  }

  async analyzeTurn(params: {
    citizenId: string;
    message: string;
    recentMessages: string[];
    sessionContext?: string;
  }): Promise<CitizenAiIntentAnalysis | null> {
    const prompt = [
      'Voce e um classificador de intencao para atendimento municipal.',
      'Responda apenas com JSON valido.',
      'Intencoes permitidas: greeting, solicitar_servico, consultar_protocolo, corrigir_dados, meu_perfil, documentos, minha_familia, notificacoes, avaliacao, ajuda, atendimento_humano, unknown.',
      'Campos obrigatorios do JSON: intent, confidence.',
      'Campos opcionais: serviceQuery, protocolNumber, notes.',
      'Regras:',
      '- Use solicitar_servico quando o cidadao quer pedir, abrir, registrar ou solicitar um servico da prefeitura.',
      '- Use consultar_protocolo quando o cidadao quiser consultar andamento e informar ou insinuar numero de protocolo.',
      '- Use corrigir_dados quando o cidadao quer alterar uma informacao ja coletada no atendimento atual.',
      '- Use atendimento_humano quando pedir atendente, humano, servidor ou suporte humano.',
      '- serviceQuery deve ser uma consulta curta para buscar o servico correto.',
      '- confidence deve variar de 0 a 1.',
      params.sessionContext ? `Contexto do fluxo atual: ${params.sessionContext}` : 'Contexto do fluxo atual: nenhum',
      `Historico recente: ${params.recentMessages.join(' | ') || 'sem historico relevante'}`,
      `Mensagem atual: ${params.message}`,
    ].join('\n');

    const parsed = await this.requestJson(prompt, params.citizenId);
    if (!parsed) {
      return null;
    }

    return {
      intent: this.normalizeIntent(parsed.intent),
      confidence: clampConfidence(parsed.confidence),
      serviceQuery:
        typeof parsed.serviceQuery === 'string' && parsed.serviceQuery.trim()
          ? parsed.serviceQuery.trim()
          : undefined,
      protocolNumber:
        typeof parsed.protocolNumber === 'string' && parsed.protocolNumber.trim()
          ? parsed.protocolNumber.trim()
          : undefined,
      notes: typeof parsed.notes === 'string' ? parsed.notes.trim() : undefined,
    };
  }

  async selectService(params: {
    citizenId: string;
    message: string;
    candidates: Array<{ id: string; label: string; description?: string }>;
  }): Promise<CitizenAiSelection | null> {
    const candidateText = params.candidates
      .map((candidate, index) => `${index + 1}. ${candidate.id} | ${candidate.label} | ${candidate.description || ''}`)
      .join('\n');

    const prompt = [
      'Voce deve escolher um servico municipal dentre as opcoes informadas.',
      'Responda apenas com JSON valido.',
      'Campos obrigatorios: selectedId, confidence.',
      'Se nenhuma opcao servir, retorne selectedId vazio e confidence baixa.',
      `Mensagem do cidadao: ${params.message}`,
      `Candidatos:\n${candidateText}`,
    ].join('\n');

    const parsed = await this.requestJson(prompt, params.citizenId);
    if (!parsed) {
      return null;
    }

    return {
      selectedId:
        typeof parsed.selectedId === 'string' && parsed.selectedId.trim()
          ? parsed.selectedId.trim()
          : undefined,
      confidence: clampConfidence(parsed.confidence),
    };
  }

  async extractFields(params: {
    citizenId: string;
    message: string;
    serviceName: string;
    sessionContext?: string;
    fields: Array<{
      id: string;
      label: string;
      type?: string;
      required?: boolean;
      options?: Array<{ id?: string; label?: string; value?: string }>;
    }>;
  }): Promise<CitizenAiFieldExtraction | null> {
    const fieldText = params.fields
      .map((field) => {
        const options =
          Array.isArray(field.options) && field.options.length > 0
            ? ` opcoes=${field.options.map((option) => option.label || option.value || option.id).join(', ')}`
            : '';
        return `${field.id} | ${field.label} | tipo=${field.type || 'text'} | obrigatorio=${field.required ? 'sim' : 'nao'}${options}`;
      })
      .join('\n');

    const prompt = [
      'Voce extrai dados estruturados de uma mensagem do cidadao para preenchimento de servico municipal.',
      'Responda apenas com JSON valido.',
      'Campos obrigatorios: values, confidence.',
      'Campo opcional: description.',
      'values deve ser um objeto onde cada chave corresponde exatamente a um field id informado.',
      'Nao invente valores. Se um campo nao estiver presente, nao inclua.',
      `Servico: ${params.serviceName}`,
      params.sessionContext ? `Contexto atual: ${params.sessionContext}` : undefined,
      `Campos disponiveis:\n${fieldText}`,
      `Mensagem do cidadao: ${params.message}`,
    ].filter(Boolean).join('\n');

    const parsed = await this.requestJson(prompt, params.citizenId);
    if (!parsed) {
      return null;
    }

    const rawValues =
      parsed.values && typeof parsed.values === 'object' && !Array.isArray(parsed.values)
        ? (parsed.values as Record<string, unknown>)
        : {};

    const values: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(rawValues)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        values[key] = value;
      }
    }

    return {
      values,
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : undefined,
      confidence: clampConfidence(parsed.confidence),
    };
  }

  async extractCorrection(params: {
    citizenId: string;
    message: string;
    serviceName: string;
    sessionContext: string;
    fields: Array<{
      id: string;
      label: string;
      type?: string;
      required?: boolean;
      options?: Array<{ id?: string; label?: string; value?: string }>;
    }>;
  }): Promise<CitizenAiCorrectionExtraction | null> {
    const fieldText = params.fields
      .map((field) => {
        const options =
          Array.isArray(field.options) && field.options.length > 0
            ? ` opcoes=${field.options.map((option) => option.label || option.value || option.id).join(', ')}`
            : '';
        return `${field.id} | ${field.label} | tipo=${field.type || 'text'}${options}`;
      })
      .join('\n');

    const prompt = [
      'Voce identifica correcoes em um atendimento municipal em andamento.',
      'Responda apenas com JSON valido.',
      'Campos obrigatorios: confidence.',
      'Campos opcionais: fieldId, value, description.',
      'Use fieldId apenas se a mensagem indicar claramente qual campo deve mudar.',
      'Use description quando a correcao for sobre a descricao geral da solicitacao.',
      'Nao invente dados e nao altere campos que nao foram citados.',
      `Servico: ${params.serviceName}`,
      `Contexto atual: ${params.sessionContext}`,
      `Campos corrigiveis:\n${fieldText}`,
      `Mensagem do cidadao: ${params.message}`,
    ].join('\n');

    const parsed = await this.requestJson(prompt, params.citizenId);
    if (!parsed) {
      return null;
    }

    const rawValue = parsed.value;
    const value =
      typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean'
        ? rawValue
        : undefined;

    return {
      fieldId:
        typeof parsed.fieldId === 'string' && parsed.fieldId.trim()
          ? parsed.fieldId.trim()
          : undefined,
      value,
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : undefined,
      confidence: clampConfidence(parsed.confidence),
    };
  }

  async generateGuidance(params: {
    citizenId: string;
    message: string;
    recentMessages: string[];
    sessionContext: string;
    availableActions: Array<{ id: string; label: string; description?: string }>;
    serviceSearchSummary?: string;
  }): Promise<CitizenAiGuidance | null> {
    const actions = params.availableActions
      .map((action) => `${action.id} | ${action.label} | ${action.description || ''}`)
      .join('\n');

    const prompt = [
      'Voce e o DigiBot, assistente municipal do Digiurban.',
      'Responda apenas com JSON valido.',
      'Campos obrigatorios: message, suggestedActionIds, confidence.',
      'message deve ser curta, natural e contextual, com no maximo 2 frases.',
      'suggestedActionIds deve conter no maximo 3 ids existentes na lista de acoes permitidas.',
      'Nao invente servicos, protocolos, dados pessoais, prazos ou informacoes que nao estejam no contexto.',
      'Se a mensagem estiver confusa, diga o que entendeu e conduza para a melhor proxima acao.',
      'Se houver erro de digitacao, interprete a intencao provavel sem comentar o erro.',
      'Mensagens curtas como "saude", "documentos", "perfil", "protocolo" ou "familia" devem ser conduzidas para a acao mais provavel.',
      'Sempre sugira acoes interativas; nao deixe a conversa terminar sem uma proxima opcao clara.',
      `Contexto do fluxo: ${params.sessionContext || 'triagem inicial'}`,
      `Historico recente: ${params.recentMessages.join(' | ') || 'sem historico relevante'}`,
      params.serviceSearchSummary ? `Resultado da busca interna: ${params.serviceSearchSummary}` : undefined,
      `Acoes permitidas:\n${actions}`,
      `Mensagem do cidadao: ${params.message}`,
    ].filter(Boolean).join('\n');

    const parsed = await this.requestJson(prompt, params.citizenId);
    if (!parsed) {
      return null;
    }

    const validActionIds = new Set(params.availableActions.map((action) => action.id));
    const suggestedActionIds = Array.isArray(parsed.suggestedActionIds)
      ? parsed.suggestedActionIds
          .filter((id: unknown): id is string => typeof id === 'string' && validActionIds.has(id))
          .slice(0, 3)
      : [];

    return {
      message:
        typeof parsed.message === 'string' && parsed.message.trim()
          ? parsed.message.trim()
          : '',
      suggestedActionIds,
      confidence: clampConfidence(parsed.confidence),
    };
  }

  private normalizeIntent(intent: unknown): CitizenAiIntentAnalysis['intent'] {
    const value = typeof intent === 'string' ? intent.trim().toLowerCase() : '';
    switch (value) {
      case 'greeting':
      case 'solicitar_servico':
      case 'consultar_protocolo':
      case 'corrigir_dados':
      case 'meu_perfil':
      case 'documentos':
      case 'minha_familia':
      case 'notificacoes':
      case 'avaliacao':
      case 'ajuda':
      case 'atendimento_humano':
        return value;
      default:
        return 'unknown';
    }
  }

  private async requestJson(prompt: string, citizenId: string): Promise<Record<string, any> | null> {
    if (!this.isConfigured) {
      return null;
    }

    // Instrução alinhada ao fine-tuning do modelo DigiBot
    const extraInstruction =
      'Você é o DigiBot, assistente inteligente do sistema DigiUrban para atendimento municipal. ' +
      'Você ajuda cidadãos a solicitar serviços, consultar protocolos, atualizar cadastros e navegar pelo sistema. ' +
      'Responda sempre em português brasileiro de forma clara, objetiva e empática. ' +
      'Retorne apenas JSON válido sem texto adicional.';

    try {
      const experience = prompt.length > 300 ? 'contextual' : 'fast';

      const response = await this.httpClient.post('', {
        prompt,
        extraInstruction,
        experience,
        mode: 'free',
        think: false,
        responseFormat: 'json',
        userId: citizenId,
      });

      const content = response.data?.data?.content;
      if (typeof content !== 'string') {
        return null;
      }

      return parseJsonContent(content);
    } catch (error) {
      logger.warn('Citizen AI request failed', {
        citizenId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

export const citizenAiClient = new CitizenAiClient();
