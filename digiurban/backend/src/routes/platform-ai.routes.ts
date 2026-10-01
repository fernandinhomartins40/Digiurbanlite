/**
 * /api/platform/ai — IA da plataforma no console /super-admin:
 * chaves dos provedores, modelos/preços, regras de cobrança, pacotes,
 * carteiras dos municípios e relatório de custo × receita.
 * Leitura: toda a equipe da plataforma. Escrita: só PLATFORM_ADMIN.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { platformAuthMiddleware, requirePlatformRole, PlatformAuthenticatedRequest } from '../middleware/platform-auth';
import { logAuditEvent } from '../utils/audit-logger';
import { internalTokenStatus, rotateInternalToken } from '../services/platform-secrets.service';
import {
  complete,
  decide,
  listModelConfigs,
  listProviders,
  saveProvider,
  testProviderCredential,
  upsertModelConfig,
} from '../services/ai-gateway/gateway';
import {
  addCredits,
  getBillingSettings,
  listPackages,
  platformReport,
  updateBillingSettings,
  upsertPackage,
} from '../services/ai-gateway/billing';

const router = Router();
router.use(platformAuthMiddleware);
const ADMIN = requirePlatformRole('PLATFORM_ADMIN');

const who = (req: Request) => (req as PlatformAuthenticatedRequest).platformUser?.id;

function fail(res: Response, error: any) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
  const status = error?.status || 500;
  if (status >= 500) console.error('[platform-ai]', error);
  return res.status(status).json({ error: error?.message || 'Erro interno' });
}

function audit(req: Request, action: string, details: Record<string, unknown>) {
  void logAuditEvent({
    action, resource: req.originalUrl, method: req.method,
    details: { context: 'platform', platformUserId: who(req), ...details },
    ip: req.ip, userAgent: req.headers['user-agent'], success: true,
  }).catch(() => undefined);
}

// ---------------------------------------------------------------- provedores

router.get('/providers', async (_req, res) => {
  try {
    res.json({ success: true, providers: await listProviders() });
  } catch (e) {
    fail(res, e);
  }
});

router.put('/providers/:provider', ADMIN, async (req, res) => {
  try {
    const body = z
      .object({
        apiKey: z.string().max(400).optional(),
        removeKey: z.boolean().optional(),
        isEnabled: z.boolean().optional(),
        baseUrl: z.string().max(300).optional(),
        dataRegion: z.enum(['CN', 'GLOBAL', 'US']).optional(),
        zeroRetention: z.boolean().optional(),
      })
      .parse(req.body);
    const provider = await saveProvider(req.params.provider, body);
    // a chave em si NUNCA vai para o log de auditoria
    audit(req, 'platform_ai_provider_updated', { provider: req.params.provider, keyChanged: Boolean(body.apiKey), removed: Boolean(body.removeKey), isEnabled: body.isEnabled });
    res.json({ success: true, provider });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/providers/:provider/test', ADMIN, async (req, res) => {
  try {
    res.json({ success: true, result: await testProviderCredential(req.params.provider) });
  } catch (e) {
    fail(res, e);
  }
});

// ---------------------------------------------------------------- token interno (bot ↔ sistema)

router.get('/internal-token', async (_req, res) => {
  try {
    res.json({ success: true, status: await internalTokenStatus() });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/internal-token/rotate', ADMIN, async (req, res) => {
  try {
    const r = await rotateInternalToken();
    audit(req, 'platform_internal_token_rotated', {});
    res.json({ success: true, rotatedAt: r.rotatedAt });
  } catch (e) {
    fail(res, e);
  }
});

// ---------------------------------------------------------------- modelos

router.get('/models', async (_req, res) => {
  try {
    res.json({ success: true, models: await listModelConfigs() });
  } catch (e) {
    fail(res, e);
  }
});

const ModelSchema = z.object({
  id: z.string().optional(),
  provider: z.string().min(2),
  modelId: z.string().min(1).max(160),
  label: z.string().min(1).max(120),
  tier: z.enum(['decision', 'fast', 'smart']),
  inputPricePerMUsd: z.number().min(0).max(100),
  outputPricePerMUsd: z.number().min(0).max(200),
  cachedInputPricePerMUsd: z.number().min(0).max(100).nullable().optional(),
  isEnabled: z.boolean().optional(),
});

router.put('/models', ADMIN, async (req, res) => {
  try {
    const model = await upsertModelConfig(ModelSchema.parse(req.body));
    audit(req, 'platform_ai_model_updated', { provider: model.provider, modelId: model.modelId });
    res.json({ success: true, model });
  } catch (e) {
    fail(res, e);
  }
});

// ---------------------------------------------------------------- cobrança

router.get('/billing', async (_req, res) => {
  try {
    res.json({ success: true, settings: await getBillingSettings(), packages: await listPackages() });
  } catch (e) {
    fail(res, e);
  }
});

router.put('/billing', ADMIN, async (req, res) => {
  try {
    const body = z
      .object({
        usdToBrl: z.number().min(1).max(20).optional(),
        markup: z.number().min(1).max(50).optional(),
        creditValueBrl: z.number().min(0.0001).max(10).optional(),
        minChargeCredits: z.number().min(0).max(100).optional(),
        allowChinaHosted: z.boolean().optional(),
        redactPii: z.boolean().optional(),
        lowBalanceCredits: z.number().min(0).max(10000000).optional(),
      })
      .parse(req.body);
    const settings = await updateBillingSettings(body);
    audit(req, 'platform_ai_billing_updated', body);
    res.json({ success: true, settings });
  } catch (e) {
    fail(res, e);
  }
});

router.put('/packages', ADMIN, async (req, res) => {
  try {
    const body = z
      .object({
        id: z.string().optional(),
        code: z.string().min(2).max(40).transform((v) => v.trim().toUpperCase()),
        name: z.string().min(2).max(80),
        description: z.string().max(200).nullable().optional(),
        credits: z.number().int().min(1),
        priceBrl: z.number().min(0),
        isActive: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(req.body);
    const pkg = await upsertPackage(body);
    audit(req, 'platform_ai_package_saved', { code: pkg.code });
    res.json({ success: true, package: pkg });
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Já existe um pacote com este código' });
    fail(res, e);
  }
});

// ---------------------------------------------------------------- municípios

router.get('/report', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    res.json({ success: true, report: await platformReport(days) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/wallets/:tenantId/grant', ADMIN, async (req, res) => {
  try {
    const body = z
      .object({ credits: z.number().min(-10000000).max(10000000).refine((v) => v !== 0), reason: z.string().min(3).max(200) })
      .parse(req.body);
    const wallet = await addCredits(req.params.tenantId, body.credits, body.credits > 0 ? 'GRANT' : 'ADJUST', body.reason, { createdById: who(req) });
    audit(req, 'platform_ai_credits_granted', { tenantId: req.params.tenantId, credits: body.credits, reason: body.reason });
    res.json({ success: true, balance: Number(wallet.balance) });
  } catch (e) {
    fail(res, e);
  }
});

// ---------------------------------------------------------------- teste (sem cobrança)

router.post('/playground', ADMIN, async (req, res) => {
  try {
    const body = z
      .object({ mode: z.enum(['decide', 'complete']), text: z.string().min(1).max(2000), tier: z.enum(['fast', 'smart']).optional() })
      .parse(req.body);
    if (body.mode === 'decide') {
      const r = await decide({
        tenantId: null,
        task: 'playground',
        source: 'platform',
        state: body.text,
        instructions: 'Qual a intenção do cidadão nesta mensagem para a prefeitura?',
        choices: {
          solicitar_servico: 'quer pedir ou abrir um serviço',
          consultar_protocolo: 'quer saber o andamento de um pedido',
          atendimento_humano: 'quer falar com uma pessoa',
          ajuda: 'tem dúvida sobre como usar',
        },
      });
      return res.json({ success: true, result: r });
    }
    const r = await complete({ tenantId: null, task: 'playground', source: 'platform', tier: body.tier, prompt: body.text, maxTokens: 300 });
    res.json({ success: true, result: { content: r.content, provider: r.provider, model: r.model } });
  } catch (e) {
    fail(res, e);
  }
});

export default router;
