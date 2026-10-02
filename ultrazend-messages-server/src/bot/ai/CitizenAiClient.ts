import { AsyncLocalStorage } from 'async_hooks';
/**
 * ============================================================================
 * CLIENTE DE IA DO DIGIBOT — via gateway da plataforma (backend)
 * ============================================================================
 * Antes: chamava o serviço digiurban-ai (IA local llama.cpp), removido do
 * deploy; e sempre com o tenant "default" (consumo sem dono).
 *
 * Agora, gastando o mínimo de tokens:
 *   1. Regras locais (zero token): número de protocolo, CPF, e-mail,
 *      telefone, CEP, datas — nunca saem do servidor.
 *   2. DECISÕES (intenção, escolher serviço/opção, qual campo corrigir) →
 *      POST /api/internal/ai/decide → JEV (saída grátis), LLM só se a
 *      confiança for baixa.
 *   3. TEXTO (extrair campos livres, orientar o cidadão) →
 *      POST /api/internal/ai/complete → LLM chinês mais barato disponível.
 *
 * Cada chamada leva o município da conversa (X-Tenant-Id) e é cobrada da
 * carteira de créditos dele. Sem créditos (402) ou sem provedor (503), os
 * métodos devolvem null e o bot segue pelos menus — o cidadão nunca trava.
 */

import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';
import { getBotTenantId } from '../tenant-context';
import { withServiceToken } from '../../utils/serviceToken';
import {
  CitizenAiCorrectionExtraction,
  CitizenAiFieldExtraction,
  CitizenAiGuidance,
  CitizenAiIntentAnalysis,
  CitizenAiSelection,
} from './types';

type Field = {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: Array<{ id?: string; label?: string; value?: string }>;
};

const INTENTS: Record<string, string> = {
  greeting: 'cumprimento ou saudação sem pedido',
  solicitar_servico: 'quer pedir, abrir, registrar ou solicitar um serviço da prefeitura',
  consultar_protocolo: 'quer saber o andamento de um pedido/protocolo',
  corrigir_dados: 'quer corrigir uma informação já dada neste atendimento',
  meu_perfil: 'quer ver ou alterar seus dados cadastrais',
  documentos: 'assunto sobre documentos emitidos ou enviados',
  minha_familia: 'assunto sobre membros da família/dependentes',
  notificacoes: 'avisos e notificações',
  avaliacao: 'quer avaliar um atendimento',
  ajuda: 'dúvida sobre como usar o sistema',
  atendimento_humano: 'pede atendente, pessoa, servidor ou suporte humano',
};

// ---------------------------------------------------------------- regras locais (0 token)

const RE = {
  protocol: /\b(?:\d{4}[-/.]?\d{4,8}|[A-Z]{2,5}-\d{4}-\d{3,8})\b/i,
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  phone: /(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/,
  cep: /\b\d{5}-?\d{3}\b/,
  date: /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/,
};

function localValue(field: Field, message: string): string | undefined {
  const key = `${field.id} ${field.label} ${field.type || ''}`.toLowerCase();
  const pick = (re: RegExp) => message.match(re)?.[0];
  if (key.includes('cpf')) return pick(RE.cpf)?.replace(/\D/g, '');
  if (field.type === 'email' || key.includes('e-mail') || key.includes('email')) return pick(RE.email);
  if (field.type === 'tel' || key.includes('telefone') || key.includes('celular') || key.includes('whatsapp')) return pick(RE.phone)?.replace(/\D/g, '');
  if (key.includes('cep')) return pick(RE.cep)?.replace(/\D/g, '');
  if (field.type === 'date' || key.includes('data')) {
    const m = message.match(RE.date);
    if (m) {
      const year = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
  }
  return undefined;
}

function optionChoices(field: Field): Record<string, string> | null {
  if (!Array.isArray(field.options) || field.options.length < 2) return null;
  const out: Record<string, string> = {};
  field.options.slice(0, 200).forEach((o, i) => {
    out[`op${i}`] = o.label || o.value || o.id || `opção ${i + 1}`;
  });
  return out;
}

function optionValue(field: Field, choiceId: string): string | undefined {
  const idx = Number(choiceId.replace('op', ''));
  const o = field.options?.[idx];
  return o ? o.value || o.id || o.label : undefined;
}

const clamp = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};

// ---------------------------------------------------------------- teto de usos por conversa

const budgetStore = new AsyncLocalStorage<{ key: string; limit: number }>();
const usage = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;

function usageInWindow(key: string): number {
  const now = Date.now();
  const list = (usage.get(key) || []).filter((t) => now - t < WINDOW_MS);
  usage.set(key, list);
  return list.length;
}

function countUsage(key: string) {
  usageInWindow(key);
  usage.get(key)!.push(Date.now());
  if (usage.size > 5000) {
    // limpeza simples: remove chaves sem uso recente
    for (const [k, v] of usage) if (!v.length || Date.now() - v[v.length - 1] > WINDOW_MS) usage.delete(k);
  }
}

// ---------------------------------------------------------------- cliente

export class CitizenAiClient {
  private readonly http: AxiosInstance;
  private readonly enabled: boolean;
  /** Após 503 (sem provedor), evita repetir a chamada por 60 s */
  private unavailableUntil = 0;

  constructor() {
    const baseURL = process.env.DIGIURBAN_API_URL || 'http://localhost:3001/api';
    // Token interno vem do painel (banco) ou do .env — resolvido a cada chamada
    this.enabled = (process.env.CITIZEN_AI_ENABLED || 'true').toLowerCase() !== 'false';
    this.http = axios.create({
      baseURL: `${baseURL.replace(/\/$/, '')}/internal/ai`,
      timeout: Number.parseInt(process.env.CITIZEN_AI_TIMEOUT_MS || '20000', 10),
      headers: { 'Content-Type': 'application/json' },
    });
    this.http.interceptors.request.use(withServiceToken);
    this.http.interceptors.request.use((config: any) => {
      const tenantId = getBotTenantId();
      if (tenantId) (config.headers as Record<string, string>)['X-Tenant-Id'] = tenantId;
      return config;
    });
  }

  available(): boolean {
    if (!this.enabled || Date.now() < this.unavailableUntil) return false;
    // teto de usos de IA da conversa atual (painel › DigiBot): acima dele, segue sem IA
    const budget = budgetStore.getStore();
    if (budget) {
      const used = usageInWindow(budget.key);
      if (budget.limit <= 0 || used >= budget.limit) return false;
    }
    return true;
  }

  /**
   * Executa o turno do cidadão com um teto de usos de IA por conversa (janela de
   * 1 hora). Protege o crédito do município de conversas longas ou repetitivas.
   */
  withBudget<T>(key: string, limit: number, fn: () => Promise<T>): Promise<T> {
    return budgetStore.run({ key, limit }, fn);
  }

  private async call<T>(path: '/decide' | '/complete', body: Record<string, unknown>): Promise<T | null> {
    if (!this.available()) return null;
    const budget = budgetStore.getStore();
    if (budget) countUsage(budget.key);
    try {
      const { data } = await this.http.post(path, body);
      return data as T;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 503) this.unavailableUntil = Date.now() + 60000;
      // 402 = município sem créditos: segue pelos menus (o painel avisa o gestor)
      logger.warn('DigiBot IA: chamada não concluída', { path, status, code: error?.response?.data?.code });
      return null;
    }
  }

  private decide(task: string, state: string, instructions: string, choices: Record<string, string>, minConfidence?: number, returnTopOnLowConfidence?: boolean) {
    return this.call<{ choice: string | null; confidence: number; via: string; top?: Array<{ id: string; p: number }> }>('/decide', {
      task,
      state,
      instructions,
      choices,
      minConfidence,
      returnTopOnLowConfidence,
    });
  }

  /**
   * Memória curta de intenções por município: frases que se repetem muito
   * ("oi", "quero segunda via", "como faço?") não gastam IA de novo.
   * Só para mensagens SEM contexto de etapa (triagem) e sem números (podem
   * conter dados pessoais). 15 min, até 500 frases.
   */
  private intentCache = new Map<string, { at: number; value: CitizenAiIntentAnalysis }>();

  private cacheKey(message: string): string | null {
    const normalized = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized || normalized.length > 80 || /\d/.test(message)) return null;
    return `${getBotTenantId() || 'default'}:${normalized}`;
  }

  /**
   * Encontra o serviço pelo SENTIDO da descrição do cidadão, entre todos os
   * serviços do município ("tem um buraco na minha rua" → Tapa-buraco), via
   * JEV. Devolve o escolhido (se houver certeza) e as 3 opções mais prováveis.
   */
  async matchService(params: { message: string; services: Array<{ id: string; label: string; description?: string }> }): Promise<{ selectedId?: string; confidence: number; top: string[] } | null> {
    if (params.services.length < 2) return null;
    const choices: Record<string, string> = {};
    params.services.slice(0, 240).forEach((s) => {
      choices[s.id] = s.description ? `${s.label} — ${s.description}`.slice(0, 280) : s.label;
    });
    const r = await this.decide(
      'match_service',
      `Pedido do cidadão à prefeitura: ${params.message}`,
      'Qual serviço da prefeitura atende a este pedido?',
      choices,
      0.7,
      true
    );
    if (!r) return null;
    return { selectedId: r.choice || undefined, confidence: clamp(r.confidence), top: (r.top || []).filter((t) => t.p >= 0.12).map((t) => t.id) };
  }

  private complete(task: string, prompt: string, system?: string, maxTokens = 300, tier: 'fast' | 'smart' = 'fast') {
    return this.call<{ content: string; json?: any }>('/complete', { task, prompt, system, json: true, maxTokens, tier });
  }

  // ------------------------------------------------------------ API usada pelo orquestrador

  async analyzeTurn(params: { citizenId: string; message: string; recentMessages: string[]; sessionContext?: string }): Promise<CitizenAiIntentAnalysis | null> {
    const protocolNumber = params.message.match(RE.protocol)?.[0];
    const state = [
      params.sessionContext ? `Etapa atual: ${params.sessionContext}` : null,
      params.recentMessages.length ? `Mensagens anteriores: ${params.recentMessages.slice(-4).join(' | ')}` : null,
      `Mensagem do cidadão: ${params.message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const key = params.sessionContext ? null : this.cacheKey(params.message);
    const cached = key ? this.intentCache.get(key) : undefined;
    if (cached && Date.now() - cached.at < 15 * 60000) return { ...cached.value, protocolNumber };

    const r = await this.decide('intent', state, 'Qual é a intenção do cidadão nesta mensagem enviada ao atendimento da prefeitura?', INTENTS);
    if (!r) return protocolNumber ? { intent: 'consultar_protocolo', confidence: 0.8, protocolNumber } : null;
    const intent = (r.choice && r.choice in INTENTS ? r.choice : 'unknown') as CitizenAiIntentAnalysis['intent'];
    const result: CitizenAiIntentAnalysis = {
      intent,
      confidence: clamp(r.confidence),
      serviceQuery: intent === 'solicitar_servico' ? params.message.trim().slice(0, 160) : undefined,
      protocolNumber,
    };
    if (key && result.confidence >= 0.75) {
      if (this.intentCache.size >= 500) this.intentCache.delete(this.intentCache.keys().next().value as string);
      this.intentCache.set(key, { at: Date.now(), value: result });
    }
    return result;
  }

  async selectService(params: { citizenId: string; message: string; candidates: Array<{ id: string; label: string; description?: string }> }): Promise<CitizenAiSelection | null> {
    if (params.candidates.length === 0) return null;
    const choices: Record<string, string> = {};
    params.candidates.slice(0, 240).forEach((c) => {
      choices[c.id] = c.description ? `${c.label} — ${c.description}`.slice(0, 280) : c.label;
    });
    const r = await this.decide('select_option', `Mensagem do cidadão: ${params.message}`, 'Qual destas opções atende ao que o cidadão escreveu?', choices);
    if (!r) return null;
    return { selectedId: r.choice || undefined, confidence: r.choice ? clamp(r.confidence) : 0 };
  }

  async extractFields(params: { citizenId: string; message: string; serviceName: string; sessionContext?: string; fields: Field[] }): Promise<CitizenAiFieldExtraction | null> {
    const values: Record<string, string | number | boolean> = {};
    const pending: Field[] = [];

    // 1) Dados com formato conhecido: regex local (não sai do servidor)
    for (const field of params.fields) {
      const v = localValue(field, params.message);
      if (v) values[field.id] = v;
      else pending.push(field);
    }

    // 2) Campo único com opções → decisão (JEV)
    if (pending.length === 1 && optionChoices(pending[0])) {
      const f = pending[0];
      const r = await this.decide('extract_option', `Mensagem do cidadão: ${params.message}`, `Qual opção do campo "${f.label}" o cidadão informou?`, optionChoices(f)!);
      if (r?.choice) values[f.id] = optionValue(f, r.choice) ?? r.choice;
      return { values, confidence: r ? clamp(r.confidence) : Object.keys(values).length ? 0.9 : 0 };
    }

    if (pending.length === 0) return { values, confidence: 0.95 };

    // 3) Texto livre → LLM barato (dados pessoais mascarados no gateway)
    const fieldText = pending
      .map((f) => {
        const opts = Array.isArray(f.options) && f.options.length ? ` opções=${f.options.map((o) => o.label || o.value || o.id).join(', ')}` : '';
        return `${f.id} | ${f.label} | tipo=${f.type || 'text'}${opts}`;
      })
      .join('\n');
    const r = await this.complete(
      'extract_fields',
      [`Serviço: ${params.serviceName}`, params.sessionContext ? `Contexto: ${params.sessionContext}` : '', `Campos:\n${fieldText}`, `Mensagem do cidadão: ${params.message}`]
        .filter(Boolean)
        .join('\n'),
      'Extraia dados de uma mensagem para um formulário municipal. Responda só JSON: {"values":{"<fieldId>":valor},"description":"opcional","confidence":0-1}. Não invente; omita o que não estiver na mensagem.',
      350
    );
    const raw = r?.json?.values && typeof r.json.values === 'object' ? r.json.values : {};
    const allowed = new Set(pending.map((f) => f.id));
    for (const [k, v] of Object.entries(raw)) {
      if (allowed.has(k) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) values[k] = v;
    }
    return {
      values,
      description: typeof r?.json?.description === 'string' && r.json.description.trim() ? r.json.description.trim() : undefined,
      confidence: r ? clamp(r.json?.confidence) : Object.keys(values).length ? 0.9 : 0,
    };
  }

  async extractCorrection(params: { citizenId: string; message: string; serviceName: string; sessionContext: string; fields: Field[] }): Promise<CitizenAiCorrectionExtraction | null> {
    const choices: Record<string, string> = { descricao: 'a descrição geral do pedido' };
    params.fields.slice(0, 200).forEach((f) => (choices[f.id] = f.label));
    const which = await this.decide('correction_field', `Contexto: ${params.sessionContext}\nMensagem do cidadão: ${params.message}`, 'Qual informação o cidadão quer corrigir?', choices, 0.6);
    if (!which?.choice) return which ? { confidence: 0 } : null;

    if (which.choice === 'descricao') {
      return { description: params.message.trim(), confidence: clamp(which.confidence) };
    }
    const field = params.fields.find((f) => f.id === which.choice)!;
    const local = localValue(field, params.message);
    if (local) return { fieldId: field.id, value: local, confidence: clamp(which.confidence) };
    if (optionChoices(field)) {
      const opt = await this.decide('correction_option', `Mensagem do cidadão: ${params.message}`, `Qual o novo valor do campo "${field.label}"?`, optionChoices(field)!);
      return { fieldId: field.id, value: opt?.choice ? optionValue(field, opt.choice) : undefined, confidence: clamp(opt?.confidence ?? which.confidence) };
    }
    const r = await this.complete(
      'correction_value',
      `Campo: ${field.label} (tipo ${field.type || 'texto'})\nMensagem do cidadão: ${params.message}`,
      'Diga qual é o novo valor do campo informado pelo cidadão. Responda só JSON: {"value":"...","confidence":0-1}. Se não houver valor, value vazio.',
      120
    );
    const value = typeof r?.json?.value === 'string' || typeof r?.json?.value === 'number' ? r.json.value : undefined;
    return { fieldId: field.id, value: value === '' ? undefined : value, confidence: clamp(r?.json?.confidence ?? which.confidence) };
  }

  async generateGuidance(params: {
    citizenId: string;
    message: string;
    recentMessages: string[];
    sessionContext: string;
    availableActions: Array<{ id: string; label: string; description?: string }>;
    serviceSearchSummary?: string;
  }): Promise<CitizenAiGuidance | null> {
    const actions = params.availableActions.map((a) => `${a.id} | ${a.label} | ${a.description || ''}`).join('\n');
    const r = await this.complete(
      'guidance',
      [
        `Etapa: ${params.sessionContext || 'triagem inicial'}`,
        `Histórico: ${params.recentMessages.slice(-4).join(' | ') || 'nenhum'}`,
        params.serviceSearchSummary ? `Busca interna: ${params.serviceSearchSummary}` : '',
        `Ações permitidas:\n${actions}`,
        `Mensagem do cidadão: ${params.message}`,
      ]
        .filter(Boolean)
        .join('\n'),
      'Você é o DigiBot, assistente da prefeitura. Responda só JSON: {"message":"até 2 frases curtas, naturais e empáticas, em português","suggestedActionIds":["até 3 ids da lista"],"confidence":0-1}. Não invente serviços, prazos ou dados; conduza para a próxima ação.',
      220
    );
    if (!r?.json) return null;
    const valid = new Set(params.availableActions.map((a) => a.id));
    return {
      message: typeof r.json.message === 'string' ? r.json.message.trim() : '',
      suggestedActionIds: Array.isArray(r.json.suggestedActionIds) ? r.json.suggestedActionIds.filter((id: unknown) => typeof id === 'string' && valid.has(id)).slice(0, 3) : [],
      confidence: clamp(r.json.confidence),
    };
  }
}

export const citizenAiClient = new CitizenAiClient();
