/**
 * /api/ai — Assistente de IA dos servidores (Análises › Assistente).
 *
 * Antes era um proxy para o serviço digiurban-ai (IA local, desligado na VPS).
 * Agora responde aqui mesmo, usando o gateway de IA da plataforma: cada
 * resposta debita a carteira de créditos do município (402 sem créditos,
 * 503 sem provedor configurado).
 *
 * Privacidade: cada conversa pertence a um servidor (userId) dentro do
 * município (tenant). O contexto enviado à IA é só agregado (contagens), sem
 * nome, CPF ou conteúdo de protocolos — e o gateway ainda mascara PII.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { tryGetTenantId } from '../lib/tenant-context';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { AuthenticatedRequest } from '../types';
import { complete, isAiAvailable } from '../services/ai-gateway/gateway';

const router = Router();
router.use(adminAuthMiddleware);

const userOf = (req: Request) => (req as AuthenticatedRequest).user!;
const tenantOf = (req: Request): string | null => tryGetTenantId() || (req as any).tenantId || null;

const HISTORY_LIMIT = 8;
const ATTACHMENT_CHARS = 6000;

const STATUS_LABEL: Record<string, string> = {
  VINCULADO: 'aguardando início',
  PROGRESSO: 'em andamento',
  ATUALIZACAO: 'aguardando atualização',
  PENDENCIA: 'com pendência do cidadão',
  CONCLUIDO: 'concluídos',
  CANCELADO: 'cancelados',
};

function friendlyError(error: any): { status: number; message: string } {
  const status = Number(error?.status) || 500;
  if (status === 402) return { status, message: 'O município está sem créditos de IA. Um administrador pode comprar um pacote em Configurações › Créditos de IA.' };
  if (status === 503) return { status, message: 'A IA está indisponível no momento. Tente de novo em alguns minutos.' };
  return { status: 500, message: 'Não consegui responder agora. Tente de novo.' };
}

async function ownConversation(req: Request, id: string) {
  return prisma.aiAssistantConversation.findFirst({ where: { id, userId: userOf(req).id } });
}

// ---------------------------------------------------------------- contexto

const NUMBERS_HINT = /protocol|pedido|solicita|quant|total|atras|prazo|sla|secretaria|departament|andamento|conclu|cancel|pend|resumo|relat|indicador|n[uú]mero|estat/i;

/** Retrato agregado dos protocolos (sem dados pessoais). Servidor comum vê só o próprio departamento. */
async function protocolSnapshot(req: Request): Promise<string | null> {
  const user = userOf(req);
  const seesAll = ([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER] as UserRole[]).includes(user.role as UserRole);
  if (!seesAll && !user.departmentId) return null;
  const scope = seesAll ? {} : { departmentId: user.departmentId as string };
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [byStatus, overdue, thisMonth, concludedMonth, byDept] = await Promise.all([
    prisma.protocolSimplified.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
    prisma.protocolSLA.count({ where: { isOverdue: true, protocol: { ...scope, status: { notIn: ['CONCLUIDO', 'CANCELADO'] } } } }),
    prisma.protocolSimplified.count({ where: { ...scope, createdAt: { gte: monthStart } } }),
    prisma.protocolSimplified.count({ where: { ...scope, concludedAt: { gte: monthStart } } }),
    seesAll
      ? prisma.protocolSimplified.groupBy({
          by: ['departmentId'],
          where: { status: { notIn: ['CONCLUIDO', 'CANCELADO'] } },
          _count: { _all: true },
          orderBy: { _count: { departmentId: 'desc' } },
          take: 8,
        })
      : Promise.resolve([] as Array<{ departmentId: string; _count: { _all: number } }>),
  ]);

  const total = byStatus.reduce((s, r) => s + r._count._all, 0);
  const lines = [
    `Retrato dos protocolos ${seesAll ? 'do município' : 'do seu departamento'} (gerado agora):`,
    `- Total: ${total}`,
    ...byStatus.map((r) => `- ${STATUS_LABEL[r.status] || r.status}: ${r._count._all}`),
    `- Em aberto e atrasados (prazo vencido): ${overdue}`,
    `- Abertos neste mês: ${thisMonth}; concluídos neste mês: ${concludedMonth}`,
  ];
  if (byDept.length) {
    const names = await prisma.department.findMany({ where: { id: { in: byDept.map((d) => d.departmentId) } }, select: { id: true, name: true } });
    const nameOf = new Map(names.map((n) => [n.id, n.name]));
    lines.push('Secretarias com mais protocolos em aberto:');
    byDept.forEach((d) => lines.push(`- ${nameOf.get(d.departmentId) || 'Secretaria'}: ${d._count._all}`));
  }
  return lines.join('\n');
}

const SYSTEM_PROMPT = [
  'Você é o Assistente DigiUrban, que ajuda servidores públicos de uma prefeitura brasileira no dia a dia.',
  'Responda em português do Brasil, de forma clara, curta e prática. Use listas quando ajudar.',
  'Pode redigir ofícios, respostas a cidadãos, resumos e explicar procedimentos administrativos.',
  'Quando houver um "Retrato dos protocolos", use só esses números; nunca invente dados.',
  'Se não souber algo do município, diga que não tem a informação.',
  'Nunca peça nem repita CPF, senhas ou dados pessoais.',
].join(' ');

async function answer(req: Request, conversationId: string, body: MessageBody) {
  const tenantId = tenantOf(req);

  const history = await prisma.aiAssistantMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
  });

  const attachments = (body.attachments || []).slice(0, 3);
  const attachmentText = attachments
    .filter((a) => a.contentText)
    .map((a) => `--- Anexo: ${a.name} ---\n${String(a.contentText).slice(0, ATTACHMENT_CHARS)}`)
    .join('\n\n');

  const sources: string[] = [];
  let snapshot: string | null = null;
  if (NUMBERS_HINT.test(body.content)) {
    snapshot = await protocolSnapshot(req).catch(() => null);
    if (snapshot) sources.push('protocolos');
  }
  if (attachmentText) sources.push('anexos');

  const transcript = history
    .reverse()
    .map((m) => `${m.role === 'USER' ? 'Servidor' : 'Assistente'}: ${m.content.slice(0, 2000)}`)
    .join('\n');

  const prompt = [
    snapshot,
    transcript ? `Conversa até aqui:\n${transcript}` : null,
    attachmentText || null,
    body.extraInstruction ? `Instrução extra: ${body.extraInstruction.slice(0, 500)}` : null,
    `Servidor: ${body.content}`,
    'Assistente:',
  ]
    .filter(Boolean)
    .join('\n\n');

  const userMessage = await prisma.aiAssistantMessage.create({
    data: {
      tenantId,
      conversationId,
      role: 'USER',
      content: body.content,
      metadata: attachments.length ? { attachments: attachments.map((a) => ({ name: a.name, mimeType: a.mimeType, size: a.size })) } : undefined,
    },
  });

  const started = Date.now();
  // sem resposta (sem créditos, IA fora do ar): a pergunta não fica "órfã" no histórico
  const r = await complete({
    tenantId,
    task: 'assistant',
    source: 'admin',
    tier: body.experience === 'quality' ? 'smart' : 'fast',
    system: SYSTEM_PROMPT,
    prompt,
    maxTokens: body.experience === 'quality' ? 1200 : 700,
  }).catch(async (error) => {
    await prisma.aiAssistantMessage.delete({ where: { id: userMessage.id } }).catch(() => undefined);
    throw error;
  });

  const content = r.content.trim() || 'Não consegui formular uma resposta. Pode reformular a pergunta?';
  const [assistantMessage] = await prisma.$transaction([
    prisma.aiAssistantMessage.create({
      data: {
        tenantId,
        conversationId,
        role: 'ASSISTANT',
        content,
        model: `${r.provider}/${r.model}`,
        totalTokens: 0,
        metadata: {
          experience: body.experience || 'fast',
          contextSources: sources,
          credits: r.credits,
          performance: { latencyMs: Date.now() - started },
        },
      },
    }),
    prisma.aiAssistantConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  // título automático na primeira pergunta
  const conv = await prisma.aiAssistantConversation.findFirst({ where: { id: conversationId }, select: { title: true } });
  if (!conv?.title) {
    await prisma.aiAssistantConversation.update({
      where: { id: conversationId },
      data: { title: body.content.replace(/\s+/g, ' ').trim().slice(0, 60) },
    });
  }

  return { userMessage, assistantMessage, contextSources: sources.length };
}

// ---------------------------------------------------------------- rotas

router.get('/health', async (_req, res) => {
  const ok = await isAiAvailable().catch(() => false);
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'unavailable' });
});

router.get('/conversations', async (req, res) => {
  try {
    const data = await prisma.aiAssistantConversation.findMany({
      where: { userId: userOf(req).id, isArchived: false },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
    res.json({ data });
  } catch (error) {
    console.error('[ai-assistant] list', error);
    res.status(500).json({ error: 'Erro ao carregar conversas' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const { title } = z.object({ title: z.string().max(120).optional() }).parse(req.body || {});
    const data = await prisma.aiAssistantConversation.create({
      data: { tenantId: tenantOf(req), userId: userOf(req).id, title: title || null },
    });
    res.status(201).json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Título inválido' });
    console.error('[ai-assistant] create', error);
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const conv = await ownConversation(req, req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
    const messages = await prisma.aiAssistantMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    res.json({ data: { ...conv, messages } });
  } catch (error) {
    console.error('[ai-assistant] get', error);
    res.status(500).json({ error: 'Erro ao abrir conversa' });
  }
});

router.patch('/conversations/:id', async (req, res) => {
  try {
    const body = z.object({ title: z.string().min(1).max(120).optional(), isArchived: z.boolean().optional() }).parse(req.body || {});
    const conv = await ownConversation(req, req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
    const data = await prisma.aiAssistantConversation.update({ where: { id: conv.id }, data: body });
    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos' });
    console.error('[ai-assistant] patch', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    const conv = await ownConversation(req, req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
    await prisma.aiAssistantConversation.delete({ where: { id: conv.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[ai-assistant] delete', error);
    res.status(500).json({ error: 'Erro ao apagar conversa' });
  }
});

const MessageSchema = z.object({
  content: z.string().trim().min(1, 'Escreva uma mensagem').max(8000),
  experience: z.enum(['fast', 'contextual', 'quality']).optional(),
  extraInstruction: z.string().max(1000).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().max(200),
        mimeType: z.string().max(120).optional(),
        size: z.number().optional(),
        contentText: z.string().max(200000).optional(),
      }),
    )
    .max(5)
    .optional(),
});
type MessageBody = z.infer<typeof MessageSchema>;

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const body = MessageSchema.parse(req.body);
    const conv = await ownConversation(req, req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
    const r = await answer(req, conv.id, body);
    res.json({ data: { conversationId: conv.id, ...r } });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
    const f = friendlyError(error);
    if (f.status === 500) console.error('[ai-assistant] message', error);
    res.status(f.status).json({ error: f.message });
  }
});

/** Stream NDJSON: start → content_delta (em pedaços) → done | error */
router.post('/conversations/:id/messages/stream', async (req, res) => {
  let body: MessageBody;
  try {
    body = MessageSchema.parse(req.body);
  } catch (error: any) {
    return res.status(400).json({ error: error?.issues?.[0]?.message || 'Dados inválidos' });
  }
  const conv = await ownConversation(req, req.params.id).catch(() => null);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  const send = (event: Record<string, unknown>) => res.write(`${JSON.stringify(event)}\n`);

  send({ type: 'start', data: { conversationId: conv.id } });
  try {
    const r = await answer(req, conv.id, body);
    const text = r.assistantMessage.content;
    for (let i = 0; i < text.length; i += 60) {
      send({ type: 'content_delta', data: { delta: text.slice(i, i + 60) } });
    }
    send({ type: 'done', data: { conversationId: conv.id, assistantMessage: r.assistantMessage, contextSources: r.contextSources } });
  } catch (error: any) {
    const f = friendlyError(error);
    if (f.status === 500) console.error('[ai-assistant] stream', error);
    send({ type: 'error', error: f.message });
  }
  res.end();
});

// Recursos do antigo serviço de IA local que não existem mais: resposta clara em vez de 503 genérico
router.all(/.*/, (_req, res) => {
  res.status(410).json({ error: 'Recurso do antigo serviço de IA local, desativado. Use o Assistente ou Super-admin › IA.' });
});

export default router;
