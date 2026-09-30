/**
 * ============================================================================
 * LEADS PÚBLICOS — formulários da landing institucional (/landing)
 * ============================================================================
 * Montado em /api/leads. Só o que a landing precisa: pedido de demonstração,
 * contato e "Receba novidades". Os pedidos aparecem em Super-admin › Leads.
 *
 * O antigo routes/leads.ts (com "teste grátis" público que criava usuário com
 * senha) segue NÃO montado de propósito.
 *
 * Proteções: validação com limites de tamanho, campo-armadilha para robôs
 * (`website` — invisível para pessoas) e limite de envios por IP.
 */

import { Router, Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { z } from 'zod';
import { LeadSource } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import { LeadNotificationService } from '../lib/email/LeadNotificationService';
import { convertLeadToService } from '../types';

const router = Router();
const notifier = new LeadNotificationService();

const leadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || ''),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitos envios em pouco tempo. Tente de novo em alguns minutos.' },
});

const text = (max: number) => z.string().trim().max(max);

const LeadSchema = z.object({
  kind: z.enum(['demo', 'contact', 'newsletter']),
  name: text(120).optional().default(''),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(160),
  phone: text(40).optional(),
  company: text(160).optional(),
  position: text(120).optional(),
  message: text(2000).optional(),
  /** Armadilha: pessoas não veem este campo; robôs preenchem */
  website: z.string().optional(),
});

const SOURCE: Record<'demo' | 'contact' | 'newsletter', LeadSource> = {
  demo: LeadSource.DEMO_REQUEST,
  contact: LeadSource.CONTACT_FORM,
  newsletter: LeadSource.NEWSLETTER,
};

/** POST /api/leads — { kind: 'demo' | 'contact' | 'newsletter', ... } */
router.post('/', leadsLimiter, async (req: Request, res: Response) => {
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  }
  const data = parsed.data;

  // Robô: responde como sucesso e não grava nada
  if (data.website) return res.status(201).json({ success: true });

  if (data.kind !== 'newsletter' && data.name.length < 2) {
    return res.status(400).json({ error: 'Informe seu nome' });
  }

  try {
    const lead = await runAsPlatform(async () => {
      // Newsletter: um e-mail só entra uma vez
      if (data.kind === 'newsletter') {
        const existing = await prisma.lead.findFirst({ where: { email: data.email, source: LeadSource.NEWSLETTER } });
        if (existing) return existing;
      }
      return prisma.lead.create({
        data: {
          name: data.name || data.email,
          email: data.email,
          phone: data.phone || undefined,
          company: data.company || null,
          position: data.position || undefined,
          message: data.message || undefined,
          source: SOURCE[data.kind],
          metadata: { origin: 'landing', userAgent: req.headers['user-agent'], timestamp: new Date().toISOString() },
        },
      });
    });

    // Aviso por e-mail à equipe: nunca derruba o envio
    if (data.kind !== 'newsletter') {
      const payload = convertLeadToService(lead as any);
      const send = data.kind === 'demo' ? notifier.notifyDemoRequest(payload) : notifier.notifyContactForm(payload);
      send.catch((err) => console.warn('[LEADS] aviso por e-mail não enviado:', err?.message));
    }

    return res.status(201).json({ success: true });
  } catch (error: any) {
    console.error('[LEADS] erro ao registrar lead:', error?.message);
    return res.status(500).json({ error: 'Não foi possível enviar agora. Tente de novo em instantes.' });
  }
});

export default router;
