/**
 * /api/admin/digibot — página "DigiBot" do painel do município (sem JSON).
 * Administradores do município: visão geral, mensagens, menu, perguntas
 * frequentes, palavras do cidadão por serviço, "ensinar o bot", publicar e
 * voltar versão.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { tryGetTenantId } from '../lib/tenant-context';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { logAuditEvent } from '../utils/audit-logger';
import { getWallet } from '../services/ai-gateway/billing';
import { isAiAvailable } from '../services/ai-gateway/gateway';
import {
  addServiceTerm,
  deleteFaq,
  discardDraft,
  ensureDefaultFaqs,
  getBotSettings,
  listFaqs,
  listServiceTerms,
  listUnanswered,
  listVersions,
  matchFaq,
  publishDraft,
  removeServiceTerm,
  resolveUnanswered,
  restoreVersion,
  saveDraft,
  searchServicesForBot,
  upsertFaq,
} from '../services/digibot/digibot.service';

const router = Router();
router.use(adminAuthMiddleware, requireMinRole(UserRole.ADMIN));

const who = (req: Request) => (req as any).user?.id as string | undefined;

function fail(res: Response, error: any, label: string) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error(`[admin-digibot] ${label}`, error);
  return res.status(status).json({ error: status >= 500 ? 'Erro ao processar. Tente de novo.' : error.message });
}

function audit(req: Request, action: string, details: Record<string, unknown> = {}) {
  void logAuditEvent({
    userId: who(req),
    action,
    resource: req.originalUrl,
    method: req.method,
    details,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  }).catch(() => undefined);
}

// ---------------------------------------------------------------- visão geral

router.get('/overview', async (_req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 86400000);
    const tenantId = tryGetTenantId();
    const [flow, botMessages, handovers, protocols, unansweredOpen, unansweredWeek, topUnanswered, aiOn, wallet] = await Promise.all([
      prisma.flowDefinition.findFirst({ where: { name: 'ai_assistant' }, select: { id: true } }),
      prisma.message.findMany({
        where: { sentAt: { gte: since }, senderType: 'CITIZEN', conversation: { isBotConversation: true } },
        select: { conversationId: true },
        distinct: ['conversationId'],
      }),
      prisma.flowExecution.count({ where: { pausedAt: { gte: since } } }),
      prisma.protocolSimplified.count({ where: { channel: 'BOT', createdAt: { gte: since } } }),
      prisma.botUnanswered.count({ where: { status: 'OPEN' } }),
      prisma.botUnanswered.aggregate({ where: { lastSeenAt: { gte: since } }, _sum: { count: true } }),
      prisma.botUnanswered.findMany({ where: { status: 'OPEN' }, orderBy: [{ count: 'desc' }, { lastSeenAt: 'desc' }], take: 5, select: { id: true, text: true, count: true } }),
      isAiAvailable().catch(() => false),
      tenantId ? getWallet(tenantId).catch(() => null) : Promise.resolve(null),
    ]);
    const conversations = botMessages.length;
    res.json({
      success: true,
      status: {
        botOnline: Boolean(flow),
        aiAvailable: aiOn,
        aiCredits: wallet ? Number(wallet.balance) : null,
      },
      week: {
        conversations,
        protocolsOpened: protocols,
        handovers,
        resolvedByBot: Math.max(0, conversations - handovers),
        notUnderstood: Number(unansweredWeek._sum.count || 0),
      },
      unansweredOpen,
      topUnanswered,
    });
  } catch (error) {
    fail(res, error, 'overview');
  }
});

// ---------------------------------------------------------------- configuração

router.get('/settings', async (_req, res) => {
  try {
    res.json({ success: true, ...(await getBotSettings()), versions: await listVersions() });
  } catch (error) {
    fail(res, error, 'settings');
  }
});

router.put('/settings/draft', async (req, res) => {
  try {
    res.json({ success: true, ...(await saveDraft(req.body)) });
  } catch (error) {
    fail(res, error, 'draft');
  }
});

router.post('/settings/discard', async (_req, res) => {
  try {
    res.json({ success: true, ...(await discardDraft()) });
  } catch (error) {
    fail(res, error, 'discard');
  }
});

router.post('/settings/publish', async (req, res) => {
  try {
    const result = await publishDraft(who(req));
    audit(req, 'digibot_settings_published', { version: result.version });
    res.json({ success: true, ...result, versions: await listVersions() });
  } catch (error) {
    fail(res, error, 'publish');
  }
});

router.post('/settings/versions/:id/restore', async (req, res) => {
  try {
    const result = await restoreVersion(req.params.id, who(req));
    audit(req, 'digibot_settings_restored', { from: req.params.id, version: result.version });
    res.json({ success: true, ...result, versions: await listVersions() });
  } catch (error) {
    fail(res, error, 'restore');
  }
});

// ---------------------------------------------------------------- perguntas frequentes

const FaqSchema = z.object({
  question: z.string().trim().min(5, 'Escreva a pergunta (mínimo 5 letras)').max(200),
  answer: z.string().trim().min(5, 'Escreva a resposta').max(2000),
  keywords: z.array(z.string().max(60)).max(20).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

router.get('/faqs', async (_req, res) => {
  try {
    await ensureDefaultFaqs();
    res.json({ success: true, faqs: await listFaqs() });
  } catch (error) {
    fail(res, error, 'faqs');
  }
});

router.post('/faqs', async (req, res) => {
  try {
    const faq = await upsertFaq(FaqSchema.parse(req.body));
    audit(req, 'digibot_faq_created', { id: faq.id });
    res.status(201).json({ success: true, faq });
  } catch (error) {
    fail(res, error, 'faq create');
  }
});

router.put('/faqs/:id', async (req, res) => {
  try {
    const faq = await upsertFaq({ ...FaqSchema.parse(req.body), id: req.params.id });
    res.json({ success: true, faq });
  } catch (error) {
    fail(res, error, 'faq update');
  }
});

router.delete('/faqs/:id', async (req, res) => {
  try {
    await deleteFaq(req.params.id);
    audit(req, 'digibot_faq_deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    fail(res, error, 'faq delete');
  }
});

// ---------------------------------------------------------------- serviços e palavras do cidadão

router.get('/services', async (_req, res) => {
  try {
    res.json({ success: true, services: await listServiceTerms() });
  } catch (error) {
    fail(res, error, 'services');
  }
});

router.post('/services/:serviceId/terms', async (req, res) => {
  try {
    const { term } = z.object({ term: z.string().trim().min(2, 'Escreva ao menos 2 letras').max(60) }).parse(req.body);
    const created = await addServiceTerm(req.params.serviceId, term);
    res.status(201).json({ success: true, term: { id: created.id, term: created.term } });
  } catch (error) {
    fail(res, error, 'term add');
  }
});

router.delete('/terms/:id', async (req, res) => {
  try {
    await removeServiceTerm(req.params.id);
    res.json({ success: true });
  } catch (error) {
    fail(res, error, 'term remove');
  }
});

/** "Testar": o que o bot responderia a esta frase (serviço e/ou pergunta frequente) */
router.post('/test', async (req, res) => {
  try {
    const { text } = z.object({ text: z.string().trim().min(2, 'Escreva uma frase').max(300) }).parse(req.body);
    const services = await prisma.serviceSimplified.findMany({
      where: { isActive: true },
      take: 500,
      select: { id: true, name: true, description: true, category: true, department: { select: { id: true, name: true } } },
    });
    const [matches, faq] = await Promise.all([searchServicesForBot(text, services, 5), matchFaq(text)]);
    res.json({
      success: true,
      services: matches.map((s) => ({ id: s.id, name: s.name, department: s.department?.name || null, score: Math.round(s.matchScore * 100) })),
      faq,
    });
  } catch (error) {
    fail(res, error, 'test');
  }
});

// ---------------------------------------------------------------- ensinar o bot

router.get('/unanswered', async (req, res) => {
  try {
    const status = z.enum(['OPEN', 'RESOLVED', 'IGNORED']).catch('OPEN').parse(req.query.status);
    res.json({ success: true, items: await listUnanswered(status) });
  } catch (error) {
    fail(res, error, 'unanswered');
  }
});

const ResolveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('service'), serviceId: z.string().min(1), term: z.string().max(60).optional() }),
  z.object({ type: z.literal('faq'), answer: z.string().trim().min(5, 'Escreva a resposta').max(2000), question: z.string().max(200).optional() }),
  z.object({ type: z.literal('ignore') }),
]);

router.post('/unanswered/:id/resolve', async (req, res) => {
  try {
    const action = ResolveSchema.parse(req.body);
    await resolveUnanswered(req.params.id, action, who(req));
    audit(req, 'digibot_taught', { id: req.params.id, type: action.type });
    res.json({ success: true });
  } catch (error) {
    fail(res, error, 'resolve');
  }
});

export default router;
