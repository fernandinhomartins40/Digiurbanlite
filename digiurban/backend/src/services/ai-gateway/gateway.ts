/**
 * ============================================================================
 * GATEWAY DE IA DA PLATAFORMA
 * ============================================================================
 * Um ponto único para toda IA do DigiUrban (bot do cidadão, painel, API):
 *
 *   decide()   → JEV (decisão tipada, saída grátis). Se o JEV não estiver
 *                disponível ou a confiança ficar abaixo do mínimo, cai para
 *                um LLM barato com resposta em JSON.
 *   complete() → LLM "fast" ou "smart", escolhido pelo menor custo efetivo.
 *
 * Roteamento "o que mais entrega e menos gasta": para cada modelo habilitado
 * (com chave válida e região permitida) calcula o custo estimado da chamada e
 * penaliza taxa de falha e latência observadas. Em erro, tenta o próximo.
 *
 * LGPD: todo texto passa por redact() antes de sair; a resposta é restaurada
 * localmente. Cobrança: cada chamada de município debita a carteira dele
 * (billing.ts); chamadas da própria plataforma (tenantId null) não cobram.
 */

import { prisma } from '../../lib/prisma';
import { runAsPlatform } from '../../lib/tenant-context';
import { MODEL_DEFAULTS, PROVIDER_DEFAULTS, providerDefault, type AiTier } from './catalog';
import { decryptSecret, encryptSecret, last4 } from './secrets';
import { redact, restore, restoreDeep } from './pii';
import { chatCompletion, jevDecision, ProviderError, testProvider } from './providers';
import { assertHasCredits, chargeUsage, getBillingSettings } from './billing';

export class AiUnavailableError extends Error {
  status = 503;
  constructor(message = 'IA indisponível: nenhum provedor configurado. Cadastre uma chave em Super-admin › IA.') {
    super(message);
  }
}

// ---------------------------------------------------------------- catálogo

let catalogReady = false;
export async function ensureCatalog(): Promise<void> {
  if (catalogReady) return;
  await runAsPlatform(async () => {
    for (const p of PROVIDER_DEFAULTS) {
      await prisma.aiProviderCredential.upsert({
        where: { provider: p.provider },
        create: { provider: p.provider, label: p.label, baseUrl: p.baseUrl, dataRegion: p.dataRegion, zeroRetention: p.zeroRetention },
        update: {},
      });
    }
    for (const m of MODEL_DEFAULTS) {
      await prisma.aiModelConfig.upsert({
        where: { provider_modelId: { provider: m.provider, modelId: m.modelId } },
        create: m,
        update: {},
      });
    }
  });
  catalogReady = true;
}

function isReadable(enc: string): boolean {
  try {
    decryptSecret(enc);
    return true;
  } catch {
    return false;
  }
}

export async function listProviders() {
  await ensureCatalog();
  const rows = await runAsPlatform(async () => prisma.aiProviderCredential.findMany({ orderBy: { provider: 'asc' } }));
  return rows.map(({ apiKeyEnc, ...r }) => ({
    ...r,
    hasKey: Boolean(apiKeyEnc),
    // false = a chave foi cifrada com outro segredo do servidor (ex.: JWT_SECRET
    // trocado) — precisa ser cadastrada de novo pelo formulário
    keyReadable: apiKeyEnc ? isReadable(apiKeyEnc) : true,
    kind: providerDefault(r.provider)?.kind || 'openai',
    signupUrl: providerDefault(r.provider)?.signupUrl,
    notes: providerDefault(r.provider)?.notes,
  }));
}

export async function saveProvider(provider: string, input: { apiKey?: string; removeKey?: boolean; isEnabled?: boolean; baseUrl?: string; dataRegion?: string; zeroRetention?: boolean }) {
  await ensureCatalog();
  const data: any = {};
  if (input.apiKey?.trim()) {
    data.apiKeyEnc = encryptSecret(input.apiKey.trim());
    data.apiKeyLast4 = last4(input.apiKey);
    data.lastTestAt = null;
    data.lastTestOk = null;
    data.lastTestError = null;
  }
  if (input.removeKey) Object.assign(data, { apiKeyEnc: null, apiKeyLast4: null, isEnabled: false });
  if (typeof input.isEnabled === 'boolean' && !input.removeKey) data.isEnabled = input.isEnabled;
  if (input.baseUrl) {
    if (!/^https:\/\//.test(input.baseUrl)) throw Object.assign(new Error('O endereço precisa começar com https://'), { status: 400 });
    data.baseUrl = input.baseUrl.trim();
  }
  if (input.dataRegion) data.dataRegion = input.dataRegion;
  if (typeof input.zeroRetention === 'boolean') data.zeroRetention = input.zeroRetention;
  const row = await runAsPlatform(async () => prisma.aiProviderCredential.update({ where: { provider }, data }));
  if (row.isEnabled && !row.apiKeyEnc) {
    await runAsPlatform(async () => prisma.aiProviderCredential.update({ where: { provider }, data: { isEnabled: false } }));
    throw Object.assign(new Error('Cadastre a chave antes de ativar o provedor'), { status: 400 });
  }
  const { apiKeyEnc, ...safe } = row;
  return { ...safe, hasKey: Boolean(apiKeyEnc) };
}

export async function testProviderCredential(provider: string) {
  await ensureCatalog();
  return runAsPlatform(async () => {
    const cred = await prisma.aiProviderCredential.findUnique({ where: { provider } });
    if (!cred?.apiKeyEnc) throw Object.assign(new Error('Cadastre a chave primeiro'), { status: 400 });
    const kind = providerDefault(provider)?.kind || 'openai';
    const sample = await prisma.aiModelConfig.findFirst({ where: { provider, tier: kind === 'jev' ? 'decision' : undefined } });
    let result: { ok: boolean; detail: string; models?: string[] };
    try {
      result = await testProvider(kind, cred.baseUrl, decryptSecret(cred.apiKeyEnc), sample?.modelId);
    } catch (error: any) {
      result = { ok: false, detail: error?.message || 'Falha no teste' };
    }
    await prisma.aiProviderCredential.update({
      where: { provider },
      data: { lastTestAt: new Date(), lastTestOk: result.ok, lastTestError: result.ok ? null : result.detail.slice(0, 300) },
    });
    return result;
  });
}

export async function listModelConfigs() {
  await ensureCatalog();
  return runAsPlatform(async () => prisma.aiModelConfig.findMany({ orderBy: [{ tier: 'asc' }, { inputPricePerMUsd: 'asc' }] }));
}

export async function upsertModelConfig(input: { id?: string; provider: string; modelId: string; label: string; tier: AiTier; inputPricePerMUsd: number; outputPricePerMUsd: number; cachedInputPricePerMUsd?: number | null; isEnabled?: boolean }) {
  const { id, ...data } = input;
  return runAsPlatform(async () =>
    id
      ? prisma.aiModelConfig.update({ where: { id }, data })
      : prisma.aiModelConfig.upsert({ where: { provider_modelId: { provider: data.provider, modelId: data.modelId } }, create: data, update: data })
  );
}

// ---------------------------------------------------------------- roteador

interface Candidate {
  model: Awaited<ReturnType<typeof listModelConfigs>>[number];
  baseUrl: string;
  apiKey: string;
  score: number;
}

async function candidates(tier: AiTier, estIn: number, estOut: number): Promise<Candidate[]> {
  await ensureCatalog();
  const settings = await getBillingSettings();
  return runAsPlatform(async () => {
    const [creds, models] = await Promise.all([
      prisma.aiProviderCredential.findMany({ where: { isEnabled: true, apiKeyEnc: { not: null } } }),
      prisma.aiModelConfig.findMany({ where: { tier, isEnabled: true } }),
    ]);
    const credBy = new Map(creds.filter((c) => settings.allowChinaHosted || c.dataRegion !== 'CN').map((c) => [c.provider, c]));
    const now = Date.now();
    const list: Candidate[] = [];
    for (const m of models) {
      const cred = credBy.get(m.provider);
      if (!cred?.apiKeyEnc) continue;
      // disjuntor: modelo que falhou nos últimos 2 min fica de fora se houver outro
      const recentlyFailed = m.lastFailureAt && now - m.lastFailureAt.getTime() < 120000;
      const estCost = (estIn * m.inputPricePerMUsd + estOut * m.outputPricePerMUsd) / 1e6;
      const failRate = m.calls > 0 ? m.failures / m.calls : 0;
      const latencyFactor = 1 + Math.min(m.avgLatencyMs, 30000) / 20000;
      // retenção zero e fora da China ganham leve preferência (LGPD) em empate de custo
      const lgpdFactor = cred.zeroRetention ? 0.95 : cred.dataRegion === 'CN' ? 1.05 : 1;
      const score = (estCost + 1e-7) * (1 + 4 * failRate) * latencyFactor * lgpdFactor * (recentlyFailed ? 50 : 1);
      try {
        list.push({ model: m, baseUrl: cred.baseUrl, apiKey: decryptSecret(cred.apiKeyEnc), score });
      } catch {
        /* chave ilegível (troca de AI_KEYS_ENCRYPTION_KEY) — ignora */
      }
    }
    return list.sort((a, b) => a.score - b.score);
  });
}

async function recordStats(modelId: string, ok: boolean, latencyMs: number, error?: string) {
  await runAsPlatform(async () => {
    const m = await prisma.aiModelConfig.findUnique({ where: { id: modelId } });
    if (!m) return;
    const avg = m.calls === 0 ? latencyMs : Math.round(m.avgLatencyMs * 0.8 + latencyMs * 0.2);
    await prisma.aiModelConfig.update({
      where: { id: modelId },
      data: {
        calls: { increment: 1 },
        ...(ok ? { avgLatencyMs: avg } : { failures: { increment: 1 }, lastFailureAt: new Date(), lastError: (error || '').slice(0, 300) }),
      },
    });
  }).catch(() => undefined);
}

const costOf = (m: Candidate['model'], inTok: number, outTok: number, cachedIn = 0) =>
  ((inTok - cachedIn) * m.inputPricePerMUsd + cachedIn * (m.cachedInputPricePerMUsd ?? m.inputPricePerMUsd) + outTok * m.outputPricePerMUsd) / 1e6;

const estTokens = (s: string) => Math.ceil(s.length / 3.5);

export async function isAiAvailable(): Promise<boolean> {
  const fast = await candidates('fast', 500, 200);
  if (fast.length) return true;
  return (await candidates('decision', 500, 0)).length > 0;
}

// ---------------------------------------------------------------- API pública do gateway

export interface CallContext {
  /** null = uso da própria plataforma (não cobra) */
  tenantId: string | null;
  task: string;
  source: 'bot' | 'admin' | 'api' | 'platform';
}

export interface CompleteInput extends CallContext {
  system?: string;
  prompt: string;
  json?: boolean;
  tier?: 'fast' | 'smart';
  maxTokens?: number;
}

export async function complete(input: CompleteInput): Promise<{ content: string; json?: any; provider: string; model: string; credits: number }> {
  if (input.tenantId) await assertHasCredits(input.tenantId);
  const settings = await getBillingSettings();
  const piiMap: Record<string, string> = {};
  const system = input.system && settings.redactPii ? redact(input.system, piiMap) : { text: input.system || '', map: piiMap };
  const prompt = settings.redactPii ? redact(input.prompt, system.map) : { text: input.prompt, map: system.map };

  const tiers: Array<'fast' | 'smart'> = input.tier === 'smart' ? ['smart', 'fast'] : ['fast', 'smart'];
  const estIn = estTokens(system.text + prompt.text);
  const estOut = input.maxTokens ?? 300;
  let lastError = '';
  for (const tier of tiers) {
    const list = await candidates(tier, estIn, estOut);
    for (const c of list.slice(0, 3)) {
      const started = Date.now();
      try {
        const r = await chatCompletion({
          baseUrl: c.baseUrl,
          apiKey: c.apiKey,
          model: c.model.modelId,
          system: system.text || undefined,
          prompt: prompt.text,
          json: input.json,
          maxTokens: input.maxTokens,
        });
        const latency = Date.now() - started;
        void recordStats(c.model.id, true, latency);
        const content = restore(r.content, prompt.map);
        let parsed: any;
        if (input.json) {
          try {
            parsed = restoreDeep(JSON.parse(r.content.match(/\{[\s\S]*\}/)?.[0] || r.content), prompt.map);
          } catch {
            parsed = undefined;
          }
        }
        const cost = costOf(c.model, r.inputTokens, r.outputTokens, r.cachedInputTokens);
        const charged = input.tenantId
          ? await chargeUsage({ tenantId: input.tenantId, task: input.task, source: input.source, provider: c.model.provider, modelId: c.model.modelId, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: cost, latencyMs: latency })
          : { credits: 0 };
        return { content, json: parsed, provider: c.model.provider, model: c.model.modelId, credits: charged.credits };
      } catch (error: any) {
        lastError = error?.message || 'erro';
        void recordStats(c.model.id, false, Date.now() - started, lastError);
        if (error instanceof ProviderError && !error.retriable && error.status === 401) continue;
      }
    }
  }
  throw new AiUnavailableError(lastError ? `Nenhum provedor respondeu (${lastError})` : undefined);
}

export interface DecideInput extends CallContext {
  state: string;
  instructions: string;
  choices: Record<string, string>;
  /** abaixo disto, confirma com um LLM (padrão 0.75) */
  minConfidence?: number;
  /** com confiança baixa, devolve as 3 mais prováveis em vez de chamar o LLM (mais barato) */
  returnTopOnLowConfidence?: boolean;
}

export async function decide(input: DecideInput): Promise<{ choice: string | null; confidence: number; via: string; credits: number; top: Array<{ id: string; p: number }> }> {
  if (input.tenantId) await assertHasCredits(input.tenantId);
  const settings = await getBillingSettings();
  const choices = { ...input.choices, nenhuma: input.choices.nenhuma || 'nenhuma das opções se aplica' };
  const state = settings.redactPii ? redact(input.state).text : input.state;
  const minConfidence = input.minConfidence ?? 0.75;

  // 1) JEV: decisão tipada, saída grátis
  const jev = await candidates('decision', estTokens(state + input.instructions + JSON.stringify(choices)), 0);
  for (const c of jev.slice(0, 2)) {
    const started = Date.now();
    try {
      const r = await jevDecision({ baseUrl: c.baseUrl, apiKey: c.apiKey, model: c.model.modelId, state, instructions: input.instructions, choices });
      const latency = Date.now() - started;
      void recordStats(c.model.id, true, latency);
      const charged = input.tenantId
        ? await chargeUsage({ tenantId: input.tenantId, task: input.task, source: input.source, provider: c.model.provider, modelId: c.model.modelId, inputTokens: r.inputTokens, outputTokens: 0, costUsd: costOf(c.model, r.inputTokens, 0), latencyMs: latency })
        : { credits: 0 };
      // 3 opções mais prováveis (para o bot sugerir quando não há certeza)
      const top = Object.entries(r.probabilities)
        .filter(([id]) => id !== 'nenhuma' && id in choices)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, p]) => ({ id, p }));
      if (r.confidence >= minConfidence) {
        return { choice: r.choice === 'nenhuma' ? null : r.choice, confidence: r.confidence, via: `jev:${c.model.modelId}`, credits: charged.credits, top };
      }
      if (input.returnTopOnLowConfidence && top.length) {
        return { choice: null, confidence: r.confidence, via: `jev:${c.model.modelId}`, credits: charged.credits, top };
      }
      break; // confiança baixa → confirma com LLM abaixo
    } catch (error: any) {
      void recordStats(c.model.id, false, Date.now() - started, error?.message);
    }
  }

  // 2) LLM barato com resposta JSON (fallback)
  const list = Object.entries(choices).map(([id, desc]) => `- ${id}: ${desc}`).join('\n');
  const r = await complete({
    ...input,
    tier: 'fast',
    json: true,
    maxTokens: 60,
    system: 'Você classifica mensagens de cidadãos para um sistema municipal. Responda só JSON: {"choice":"<id>","confidence":0-1}.',
    prompt: `${input.instructions}\nOpções:\n${list}\n\nMensagem e contexto:\n${state}`,
  });
  const choice = typeof r.json?.choice === 'string' && r.json.choice in choices ? r.json.choice : null;
  const confidence = Math.max(0, Math.min(1, Number(r.json?.confidence) || 0));
  return { choice: choice === 'nenhuma' ? null : choice, confidence, via: `llm:${r.model}`, credits: r.credits, top: choice && choice !== 'nenhuma' ? [{ id: choice, p: confidence }] : [] };
}
