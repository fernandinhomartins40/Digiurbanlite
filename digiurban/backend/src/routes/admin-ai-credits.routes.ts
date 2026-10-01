/**
 * /api/admin/ai-credits — créditos de IA do PRÓPRIO município (painel do servidor).
 * Ver saldo/consumo: administradores. Comprar pacote: administradores
 * (gera fatura; os créditos entram quando a plataforma confirma o pagamento).
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { tryGetTenantId } from '../lib/tenant-context';
import { createOrder, listPackages, tenantUsage, getBillingSettings, setLowBalanceThreshold } from '../services/ai-gateway/billing';
import { isAiAvailable } from '../services/ai-gateway/gateway';

const router = Router();
router.use(adminAuthMiddleware, requireMinRole(UserRole.ADMIN));

const tenantOf = (req: Request) => tryGetTenantId() || (req as any).tenantId;

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantOf(req);
    if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
    const [usage, packages, settings, available] = await Promise.all([
      tenantUsage(tenantId),
      listPackages(true),
      getBillingSettings(),
      isAiAvailable().catch(() => false),
    ]);
    res.json({ success: true, ...usage, packages, creditValueBrl: settings.creditValueBrl, aiAvailable: available });
  } catch (error) {
    console.error('[ai-credits]', error);
    res.status(500).json({ error: 'Erro ao carregar créditos de IA' });
  }
});

router.post('/orders', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantOf(req);
    if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
    const { packageId } = z.object({ packageId: z.string().min(1) }).parse(req.body);
    const order = await createOrder(tenantId, packageId, (req as any).userId);
    res.status(201).json({ success: true, order, message: 'Pedido registrado. A fatura foi gerada; os créditos entram após o pagamento.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Escolha um pacote' });
    res.status(error?.status || 500).json({ error: error?.message || 'Erro ao registrar o pedido' });
  }
});

/** Limite do aviso de saldo baixo (null = volta ao padrão da plataforma; 0 = sem aviso) */
router.put('/alert', async (req: Request, res: Response) => {
  try {
    const tenantId = tenantOf(req);
    if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
    const { threshold } = z.object({ threshold: z.number().min(0).max(10000000).nullable() }).parse(req.body);
    await setLowBalanceThreshold(tenantId, threshold);
    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Informe um número de créditos válido' });
    console.error('[ai-credits] alert', error);
    res.status(500).json({ error: 'Erro ao salvar o aviso' });
  }
});

export default router;
