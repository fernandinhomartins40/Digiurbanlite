/**
 * Chamadas HTTP aos provedores: LLMs no padrão OpenAI (/chat/completions) e
 * JEV no padrão System One (/systemone). Sem SDKs — só fetch, com timeout.
 */

export class ProviderError extends Error {
  constructor(message: string, public status?: number, public retriable = true) {
    super(message);
  }
}

const TIMEOUT_MS = Number(process.env.AI_GATEWAY_TIMEOUT_MS || 25000);

async function post(url: string, apiKey: string, body: unknown, extraHeaders: Record<string, string> = {}): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 300) };
    }
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || data?.message || `HTTP ${res.status}`;
      // 4xx (exceto limite) = erro de configuração: não adianta tentar de novo no mesmo provedor
      throw new ProviderError(String(msg).slice(0, 300), res.status, res.status === 429 || res.status >= 500);
    }
    return data;
  } catch (error: any) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(error?.name === 'AbortError' ? 'Tempo esgotado' : error?.message || 'Falha de rede');
  } finally {
    clearTimeout(timer);
  }
}

export interface ChatParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  system?: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

const estimateTokens = (text: string) => Math.ceil(text.length / 3.5);

export async function chatCompletion(p: ChatParams): Promise<ChatResult> {
  const messages = [
    ...(p.system ? [{ role: 'system', content: p.system }] : []),
    { role: 'user', content: p.prompt },
  ];
  const data = await post(`${p.baseUrl.replace(/\/$/, '')}/chat/completions`, p.apiKey, {
    model: p.model,
    messages,
    max_tokens: p.maxTokens ?? 400,
    temperature: p.temperature ?? 0.2,
    ...(p.json ? { response_format: { type: 'json_object' } } : {}),
  });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ProviderError('Resposta sem conteúdo');
  const usage = data?.usage || {};
  return {
    content,
    inputTokens: usage.prompt_tokens ?? estimateTokens((p.system || '') + p.prompt),
    outputTokens: usage.completion_tokens ?? estimateTokens(content),
    cachedInputTokens: usage.prompt_cache_hit_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? 0,
  };
}

export interface DecisionParams {
  baseUrl: string;
  apiKey: string;
  model: string;
  state: string;
  instructions: string;
  /** id → descrição. Sempre inclui "nenhuma" para o mundo aberto. */
  choices: Record<string, string>;
}

export interface DecisionResult {
  choice: string | null;
  confidence: number;
  probabilities: Record<string, number>;
  inputTokens: number;
}

/** JEV: uma pergunta do tipo "choice" sobre o estado (mensagem + contexto) */
export async function jevDecision(p: DecisionParams): Promise<DecisionResult> {
  const data = await post(`${p.baseUrl.replace(/\/$/, '')}/systemone`, p.apiKey, {
    model: p.model,
    state: p.state,
    questions: {
      decision: { type: 'choice', instructions: p.instructions, criteria: p.choices },
    },
  });
  // Resposta validada campo a campo (a API ainda está em acesso antecipado)
  const answer = data?.answers?.decision ?? data?.answers?.[0] ?? {};
  const probabilities: Record<string, number> = {};
  const rawProbs = answer.probabilities ?? answer.distribution ?? {};
  if (rawProbs && typeof rawProbs === 'object') {
    for (const [k, v] of Object.entries(rawProbs)) if (typeof v === 'number') probabilities[k] = v;
  }
  const picked = answer.answer ?? answer.choice ?? answer.selected ?? answer.value ?? null;
  const choice =
    typeof picked === 'string' && picked in p.choices
      ? picked
      : Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const confidence =
    typeof answer.confidence === 'number' ? answer.confidence : choice && probabilities[choice] != null ? probabilities[choice] : 0;
  return {
    choice: choice && choice in p.choices ? choice : null,
    confidence: Math.max(0, Math.min(1, confidence)),
    probabilities,
    inputTokens: data?.usage?.input_tokens ?? data?.usage?.prompt_tokens ?? estimateTokens(p.state + p.instructions + JSON.stringify(p.choices)),
  };
}

/** Teste de credencial: lista de modelos (OpenAI) ou decisão mínima (JEV) */
export async function testProvider(kind: 'openai' | 'jev', baseUrl: string, apiKey: string, sampleModel?: string): Promise<{ ok: boolean; detail: string; models?: string[] }> {
  if (kind === 'jev') {
    const r = await jevDecision({
      baseUrl,
      apiKey,
      model: sampleModel || 'jev-latest',
      state: 'Quero pedir poda de árvore na minha rua',
      instructions: 'Qual a intenção do cidadão?',
      choices: { servico: 'pedir um serviço', consulta: 'consultar um pedido', nenhuma: 'nenhuma das anteriores' },
    });
    return { ok: true, detail: `Decisão: ${r.choice} (${Math.round(r.confidence * 100)}%)` };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: controller.signal });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, detail: data?.error?.message || `HTTP ${res.status}` };
    const models = Array.isArray(data?.data) ? data.data.map((m: any) => String(m.id)).slice(0, 200) : [];
    return { ok: true, detail: `${models.length} modelos disponíveis`, models };
  } finally {
    clearTimeout(timer);
  }
}
