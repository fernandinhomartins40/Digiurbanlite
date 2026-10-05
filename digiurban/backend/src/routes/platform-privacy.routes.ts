/**
 * /api/platform/privacy — prazo de guarda das conversas (LGPD).
 * Leitura: toda a equipe da plataforma. Alterar e rodar agora: só PLATFORM_ADMIN.
 */

import { Router, Request } from 'express';
import { z } from 'zod';
import { platformAuthMiddleware, requirePlatformRole, PlatformAuthenticatedRequest } from '../middleware/platform-auth';
import { logAuditEvent } from '../utils/audit-logger';
import { getRetentionSettings, runRetention, updateRetentionSettings } from '../services/privacy-retention.service';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import facePlatformClientService from '../services/face-platform-client.service';

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
        // biometria: foto de quem não foi reconhecido no máximo 30 dias (minimização)
        faceUnmatchedImageDays: z.number().int().min(1, 'Mínimo de 1 dia').max(30, 'Máximo de 30 dias').optional(),
        faceEventImageDays: z.number().int().min(1, 'Mínimo de 1 dia').max(365, 'Máximo de 365 dias').optional(),
        faceEventDays: z.number().int().min(30, 'Mínimo de 30 dias').max(1825, 'Máximo de 5 anos').optional(),
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

// ---------------- Biometria facial (motor e limites) ----------------

/** Modelos de reconhecimento disponíveis no motor e a situação da licença dos PESOS */
export const FACE_MODELS = [
  {
    id: 'arcface_mnet',
    label: 'ArcFace leve (padrão)',
    description: 'Rápido e leve para a VPS. Boa precisão.',
    license: 'Pesos do InsightFace: uso NÃO comercial. Exige licença comercial do InsightFace para produção paga.',
  },
  {
    id: 'arcface_resnet',
    label: 'ArcFace completo',
    description: 'Mais preciso, ~15x mais lento e baixa 174 MB na primeira vez.',
    license: 'Pesos do InsightFace: uso NÃO comercial. Exige licença comercial do InsightFace para produção paga.',
  },
  {
    id: 'mobileface_v3l',
    label: 'MobileFace',
    description: 'Leve, precisão um pouco menor.',
    license: 'Treinado em base de pesquisa (MS1MV2). Verifique a licença antes do uso comercial.',
  },
] as const;

const faceSettingsSchema = z.object({
  recognitionModel: z.enum(['arcface_mnet', 'arcface_resnet', 'mobileface_v3l']).optional(),
  matchThreshold: z.number().min(0.3, 'Mínimo de 0,30').max(0.9, 'Máximo de 0,90').optional(),
  reviewThreshold: z.number().min(0.2, 'Mínimo de 0,20').max(0.85, 'Máximo de 0,85').optional(),
  minQuality: z.number().min(0.3).max(0.95).optional(),
  minLiveness: z.number().min(0.34).max(1).optional(),
  challengeYawDegrees: z.number().min(8).max(35).optional(),
});

async function loadFaceSettings() {
  return runAsPlatform(async () =>
    prisma.faceEngineSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton' }, update: {} })
  );
}

router.get('/face-settings', async (_req, res) => {
  try {
    res.json({ success: true, settings: await loadFaceSettings(), models: FACE_MODELS });
  } catch (error) {
    console.error('[platform-privacy] face-settings', error);
    res.status(500).json({ error: 'Erro ao carregar a configuração da biometria' });
  }
});

router.put('/face-settings', ADMIN, async (req, res) => {
  try {
    const body = faceSettingsSchema.parse(req.body);
    const current = await loadFaceSettings();
    const match = body.matchThreshold ?? current.matchThreshold;
    const review = body.reviewThreshold ?? current.reviewThreshold;
    if (review >= match) {
      return res.status(400).json({ error: 'O limite de revisão precisa ser menor que o de reconhecimento automático.' });
    }
    const settings = await runAsPlatform(async () =>
      prisma.faceEngineSettings.update({
        where: { id: 'singleton' },
        data: { ...body, updatedBy: (req as PlatformAuthenticatedRequest).platformUser?.id || null },
      })
    );
    await facePlatformClientService.notifySettingsChanged();
    audit(req, 'platform_face_settings_updated', body);
    res.json({
      success: true,
      settings,
      models: FACE_MODELS,
      ...(body.recognitionModel && body.recognitionModel !== current.recognitionModel
        ? { notice: 'Modelo trocado: as biometrias já cadastradas são recalculadas automaticamente a partir das fotos, em segundo plano.' }
        : {}),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
    console.error('[platform-privacy] face-settings', error);
    res.status(500).json({ error: 'Erro ao salvar a configuração da biometria' });
  }
});

router.post('/retention/face/run', ADMIN, async (req, res) => {
  try {
    const summary = await facePlatformClientService.runRetentionNow();
    audit(req, 'platform_face_retention_run', summary || {});
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(Number(error?.status) || 500).json({ error: error?.message || 'Erro ao aplicar o prazo da biometria' });
  }
});

export default router;
