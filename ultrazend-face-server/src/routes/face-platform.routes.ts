import { Router, Request, Response } from 'express';
import facePlatformService from '../services/FacePlatformService';
import { requireTenant } from '../middleware/service-auth';
import type { FaceActor } from '../services/face/access-log';
import { applyFaceRetention, reprocessPendingEmbeddings } from '../services/face/jobs';
import { invalidateSettingsCache } from '../services/face/settings';
import logger from '../utils/logger';

const router = Router();

function respond(res: Response, error: any) {
  const status = Number(error?.status || error?.statusCode || 500);
  const safeStatus = Number.isFinite(status) && status >= 400 && status < 600 ? status : 500;
  if (safeStatus >= 500) logger.error('Erro no serviço facial', { error: error?.message });
  const message = safeStatus >= 500 && !error?.status ? 'Erro interno do serviço facial' : error?.message || 'Erro';
  return res.status(safeStatus).json({
    success: false,
    error: message,
    message,
    ...(error?.details && safeStatus < 500 ? { details: error.details } : {}),
  });
}

/** Quem está agindo (o backend informa; entra no registro de acesso) */
function actorOf(req: Request): FaceActor {
  const type = String(req.headers['x-actor-type'] || 'SYSTEM').toUpperCase();
  return {
    type: type === 'USER' || type === 'CITIZEN' ? type : 'SYSTEM',
    id: req.headers['x-actor-id'] ? String(req.headers['x-actor-id']) : null,
    role: req.headers['x-actor-role'] ? String(req.headers['x-actor-role']) : null,
  };
}

const tenantOf = (req: Request) => (req as any).tenantId as string;

function handle(fn: (req: Request, res: Response) => Promise<unknown>, status = 200) {
  return async (req: Request, res: Response) => {
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.status(status).json(result);
    } catch (error) {
      respond(res, error);
    }
  };
}

// ---------------- Manutenção da plataforma (sem município) ----------------
router.post('/maintenance/retention', handle(async () => applyFaceRetention()));
router.post('/maintenance/reprocess', handle(async () => reprocessPendingEmbeddings(50)));
router.post('/maintenance/settings-changed', handle(async () => {
  invalidateSettingsCache();
  return { success: true };
}));

// ---------------- Rotas de município ----------------
router.use(requireTenant);

router.get('/status', handle((req) => facePlatformService.getStatus(tenantOf(req))));
router.get('/dashboard', handle((req) => facePlatformService.getDashboard(tenantOf(req))));
router.get('/schools', handle((req) => facePlatformService.listSchools(tenantOf(req))));
router.get('/schools/:schoolId/citizens', handle((req) => facePlatformService.listSchoolCitizens(tenantOf(req), String(req.params.schoolId))));
router.get('/devices', handle((req) => facePlatformService.listDevices(tenantOf(req))));
router.post('/devices', handle((req) => facePlatformService.createDevice(tenantOf(req), req.body), 201));
router.put('/devices/:id', handle((req) => facePlatformService.updateDevice(tenantOf(req), String(req.params.id), req.body)));
router.get('/zones', handle((req) => facePlatformService.listZones(tenantOf(req))));
router.post('/zones', handle((req) => facePlatformService.createZone(tenantOf(req), req.body), 201));
router.get('/configurations', handle((req) => facePlatformService.listConfigurations(tenantOf(req))));
router.put('/configurations/:schoolId', handle((req) =>
  facePlatformService.upsertSchoolConfiguration(tenantOf(req), { ...req.body, unidadeEducacaoId: String(req.params.schoolId) })
));

router.get('/identities', handle((req) => facePlatformService.listIdentities(tenantOf(req), actorOf(req))));

router.post('/challenges', handle(async (req) => {
  const subject = String(req.body?.subject || '').trim();
  if (!subject) throw Object.assign(new Error('Informe para quem é o desafio'), { status: 400 });
  return facePlatformService.createChallenge(tenantOf(req), subject);
}, 201));

router.get('/citizens/:citizenId/biometry', handle((req) =>
  facePlatformService.getCitizenBiometry(tenantOf(req), String(req.params.citizenId), actorOf(req))
));

router.post('/citizens/:citizenId/enrollments', handle((req) =>
  facePlatformService.createEnrollment(tenantOf(req), {
    citizenId: String(req.params.citizenId),
    purpose: req.body?.purpose,
    frames: req.body?.frames,
    challengeId: req.body?.challengeId,
    sourceType: String(req.body?.sourceType || 'MANUAL_ADMIN'),
    sourceLabel: req.body?.sourceLabel || null,
    consent: req.body?.consent || null,
    actor: actorOf(req),
  }), 201
));

router.delete('/citizens/:citizenId/biometry', handle((req) =>
  facePlatformService.deleteCitizenBiometry(tenantOf(req), {
    citizenId: String(req.params.citizenId),
    actor: actorOf(req),
    reason: req.body?.reason || null,
  })
));

router.get('/citizens/:citizenId/consents', handle((req) => facePlatformService.listConsents(tenantOf(req), String(req.params.citizenId))));
router.post('/citizens/:citizenId/consents', handle((req) =>
  facePlatformService.grantConsent(tenantOf(req), String(req.params.citizenId), req.body?.purpose, req.body?.consent, actorOf(req)), 201
));
router.post('/citizens/:citizenId/consents/revoke', handle((req) =>
  facePlatformService.revokeConsent(
    tenantOf(req),
    String(req.params.citizenId),
    req.body?.purpose,
    actorOf(req),
    String(req.body?.reason || 'Revogado a pedido do titular')
  )
));

router.post('/recognition/verify', handle((req) =>
  facePlatformService.verify(tenantOf(req), {
    frames: req.body?.frames,
    challengeId: req.body?.challengeId,
    expectedCitizenId: req.body?.expectedCitizenId || null,
    purpose: req.body?.purpose || 'IDENTITY_VERIFICATION',
    sourceType: String(req.body?.sourceType || 'LIVE_READ'),
    challengeSubject: String(req.body?.challengeSubject || ''),
    actor: actorOf(req),
  })
));

router.get('/events', handle((req) =>
  facePlatformService.listEvents(tenantOf(req), {
    unidadeEducacaoId: req.query.unidadeEducacaoId as string | undefined,
    zoneId: req.query.zoneId as string | undefined,
    matchStatus: req.query.matchStatus as any,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  })
));
router.post('/events/ingest', handle((req) =>
  facePlatformService.ingestRecognition(tenantOf(req), {
    deviceId: String(req.body?.deviceId || ''),
    zoneId: req.body?.zoneId || null,
    eventType: req.body?.eventType,
    frame: req.body?.frame,
    actor: actorOf(req),
  }), 201
));
router.post('/events/:id/review', handle((req) =>
  facePlatformService.reviewEvent(tenantOf(req), String(req.params.id), actorOf(req), req.body?.decision)
));

router.get('/media/:kind/:id', async (req: Request, res: Response) => {
  try {
    const kind = req.params.kind === 'event' ? 'event' : req.params.kind === 'enrollment' ? 'enrollment' : null;
    if (!kind) return res.status(400).json({ error: 'Tipo de foto inválido' });
    const media = await facePlatformService.getMedia(tenantOf(req), kind, String(req.params.id), actorOf(req));
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(media.buffer);
  } catch (error) {
    return respond(res, error);
  }
});

router.get('/access-logs', handle((req) =>
  facePlatformService.listAccessLogs(tenantOf(req), {
    citizenId: req.query.citizenId as string | undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  })
));

export default router;
