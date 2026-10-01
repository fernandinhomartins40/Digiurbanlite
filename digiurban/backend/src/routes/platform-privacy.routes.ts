/**
 * /api/platform/privacy — prazo de guarda das conversas (LGPD).
 * Leitura: toda a equipe da plataforma. Alterar e rodar agora: só PLATFORM_ADMIN.
 */

import { Router, Request } from 'express';
import { z } from 'zod';
import { platformAuthMiddleware, requirePlatformRole, PlatformAuthenticatedRequest } from '../middleware/platform-auth';
import { logAuditEvent } from '../utils/audit-logger';
import { getRetentionSettings, runRetention, updateRetentionSettings } from '../services/privacy-retention.service';

const router = Router();
router.use(platformAuthMiddleware);
const ADMIN = requirePlatformRole('PLATFORM_ADMIN');

function audit(req: Request, action: string, details: Record<string, unknown>) {
  void logAuditEvent({
    action, resource: req.originalUrl, method: req.method,
    details: { context: 'platform', platformUserId: (req as PlatformAuthenticatedRequest).platformUser?.id, ...details },
    ip: req.ip, userAgent: req.headers['user-agent'], success: true,
  }).catch(() => undefined);
}

router.get('/retention', async (_req, res) => {
  try {
    const [settings, pending] = await Promise.all([getRetentionSettings(), runRetention({ dryRun: true })]);
    res.json({ success: true, settings, pending });
  } catch (error) {
    console.error('[platform-privacy]', error);
    res.status(500).json({ error: 'Erro ao carregar o prazo de guarda' });
  }
});

router.put('/retention', ADMIN, async (req, res) => {
  try {
    const body = z
      .object({
        enabled: z.boolean().optional(),
        botChatDays: z.number().int().min(30, 'Mínimo de 30 dias').max(3650).optional(),
        humanChatDays: z.number().int().min(30, 'Mínimo de 30 dias').max(3650).optional(),
        assistantDays: z.number().int().min(7, 'Mínimo de 7 dias').max(3650).optional(),
      })
      .parse(req.body);
    const settings = await updateRetentionSettings(body);
    audit(req, 'platform_retention_updated', body);
    res.json({ success: true, settings, pending: await runRetention({ dryRun: true }) });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
    console.error('[platform-privacy]', error);
    res.status(500).json({ error: 'Erro ao salvar o prazo de guarda' });
  }
});

router.post('/retention/run', ADMIN, async (req, res) => {
  try {
    const settings = await getRetentionSettings();
    if (!settings.enabled) return res.status(409).json({ error: 'Ative o prazo de guarda antes de rodar' });
    const summary = await runRetention();
    audit(req, 'platform_retention_run', { ...summary });
    res.json({ success: true, summary });
  } catch (error) {
    console.error('[platform-privacy]', error);
    res.status(500).json({ error: 'Erro ao aplicar o prazo de guarda' });
  }
});

export default router;
