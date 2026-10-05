/**
 * /api/admin/face-platform — biometria facial no painel do servidor.
 *
 * Revisão 2026-10-04: antes qualquer servidor (qualquer cargo) listava todas as
 * biometrias com o vetor do rosto, cadastrava rosto já aprovado para qualquer
 * cidadão e registrava "aluno entrou" sem rosto nenhum. Agora:
 * - permissão por cargo em cada ação;
 * - o rosto é analisado no servidor (o navegador manda só as fotos);
 * - vetores nunca saem do serviço de face; fotos só por aqui, com registro.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import type { AuthenticatedRequest } from '../types';
import facePlatformService, { type FaceActorHeaders, type FacePurpose } from '../services/face-platform-client.service';

const router = Router();
router.use(adminAuthMiddleware);

const USER = requireMinRole(UserRole.USER);
const COORDINATOR = requireMinRole(UserRole.COORDINATOR);
const MANAGER = requireMinRole(UserRole.MANAGER);

function actorOf(req: Request): FaceActorHeaders {
  const user = (req as AuthenticatedRequest).user as any;
  return { type: 'USER', id: user?.id, role: user?.role };
}

function roleLevel(role: string | undefined) {
  return ({ USER: 1, COORDINATOR: 2, MANAGER: 3, ADMIN: 4, SUPER_ADMIN: 5 } as Record<string, number>)[role || ''] || 0;
}

function handle(fn: (req: Request, res: Response) => Promise<unknown>, status = 200) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.status(status).json(result);
    } catch (error: any) {
      const code = Number(error?.status) || 500;
      if (code >= 500) console.error('[face-platform]', error?.message || error);
      res.status(code).json({
        success: false,
        error: error?.message || 'Erro no serviço de biometria',
        message: error?.message || 'Erro no serviço de biometria',
        ...(error?.details ? { details: error.details } : {}),
      });
    }
  };
}

function purposeOf(value: unknown): FacePurpose {
  return value === 'SCHOOL_SECURITY' ? 'SCHOOL_SECURITY' : 'IDENTITY_VERIFICATION';
}

// ---------------- leitura geral (atendente+) ----------------
router.get('/status', USER, handle(() => facePlatformService.getStatus()));
router.get('/dashboard', USER, handle(() => facePlatformService.getDashboard()));
router.get('/schools', USER, handle(() => facePlatformService.listSchools()));
router.get('/schools/:schoolId/citizens', USER, handle((req) => facePlatformService.listSchoolCitizens(req.params.schoolId)));
router.get('/devices', USER, handle(() => facePlatformService.listDevices()));
router.get('/zones', USER, handle(() => facePlatformService.listZones()));
router.get('/configurations', USER, handle(() => facePlatformService.listConfigurations()));
router.get('/events', USER, handle((req) =>
  facePlatformService.listEvents({
    unidadeEducacaoId: req.query.unidadeEducacaoId,
    zoneId: req.query.zoneId,
    matchStatus: req.query.matchStatus,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  })
));

// ---------------- configuração da escola (coordenador+) ----------------
router.post('/devices', COORDINATOR, handle((req) => facePlatformService.createDevice(req.body), 201));
router.put('/devices/:id', COORDINATOR, handle((req) => facePlatformService.updateDevice(req.params.id, req.body)));
router.post('/zones', COORDINATOR, handle((req) => facePlatformService.createZone(req.body), 201));
router.put('/configurations/:schoolId', COORDINATOR, handle((req) => facePlatformService.upsertSchoolConfiguration(req.params.schoolId, req.body)));

// ---------------- biometrias ----------------
router.get('/identities', MANAGER, handle((req) => facePlatformService.listIdentities(actorOf(req))));
router.get('/citizens/:citizenId/biometry', USER, handle((req) => facePlatformService.getCitizenBiometry(req.params.citizenId, actorOf(req))));
router.get('/access-logs', MANAGER, handle((req) =>
  facePlatformService.listAccessLogs({
    citizenId: req.query.citizenId ? String(req.query.citizenId) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  })
));

/** Desafio da prova de vida (lado sorteado pelo servidor) */
router.post('/challenges', USER, handle((req) => {
  const user = actorOf(req);
  const citizenId = req.body?.citizenId ? String(req.body.citizenId) : null;
  const subject = req.body?.mode === 'enroll' && citizenId ? `enroll:${citizenId}` : `read:user:${user.id}`;
  return facePlatformService.createChallenge(subject, user);
}, 201));

/**
 * Cadastro presencial (atendimento ou escola). Exige o consentimento do titular
 * ou, para aluno menor, do responsável — registrado aqui pelo servidor.
 */
router.post('/citizens/:citizenId/enrollments', USER, handle((req) => {
  const user = actorOf(req);
  const purpose = purposeOf(req.body?.purpose);
  const consent = req.body?.consent;
  return facePlatformService.createEnrollment(
    req.params.citizenId,
    {
      purpose,
      frames: req.body?.frames,
      challengeId: req.body?.challengeId,
      sourceType: purpose === 'SCHOOL_SECURITY' ? 'SCHOOL_SECURITY' : 'ADMIN_WEBCAM',
      sourceLabel: req.body?.sourceLabel || null,
      consent:
        consent && consent.accepted
          ? {
              relationship: ['MAE', 'PAI', 'RESPONSAVEL_LEGAL'].includes(consent.relationship) ? consent.relationship : 'TITULAR',
              channel: 'PRESENCIAL',
              grantedByName: consent.grantedByName || null,
              grantedByCitizenId: consent.grantedByCitizenId || null,
              recordedByUserId: user.id,
              evidence: { termoAssinado: Boolean(consent.signedTermOnFile), observacao: String(consent.note || '').slice(0, 300) },
            }
          : null,
    },
    user
  );
}, 201));

/**
 * Leitura ao vivo. Com cidadão esperado: confirma se é ele (1:1, atendente+).
 * Sem cidadão esperado: procura no município (1:N) — só gerente+, exceto a
 * finalidade escolar (portaria).
 */
router.post('/recognition/verify', USER, handle(async (req) => {
  const user = actorOf(req);
  const purpose = purposeOf(req.body?.purpose);
  const expectedCitizenId = req.body?.expectedCitizenId ? String(req.body.expectedCitizenId) : null;
  if (!expectedCitizenId && purpose !== 'SCHOOL_SECURITY' && roleLevel(user.role || undefined) < 3) {
    throw Object.assign(new Error('Para procurar um rosto entre todos os cidadãos é preciso ser gerente ou administrador. Informe o cidadão atendido.'), { status: 403 });
  }
  return facePlatformService.verify(
    {
      frames: req.body?.frames,
      challengeId: req.body?.challengeId,
      challengeSubject: `read:user:${user.id}`,
      expectedCitizenId,
      purpose,
      sourceType: purpose === 'SCHOOL_SECURITY' ? 'SCHOOL_SECURITY_LIVE_READ' : 'ADMIN_LIVE_READ',
    },
    user
  );
}));

// ---------------- consentimento ----------------
router.get('/citizens/:citizenId/consents', USER, handle((req) => facePlatformService.listConsents(req.params.citizenId, actorOf(req))));
router.post('/citizens/:citizenId/consents/revoke', USER, handle((req) =>
  facePlatformService.revokeConsent(
    req.params.citizenId,
    purposeOf(req.body?.purpose),
    String(req.body?.reason || 'Revogado a pedido do titular ou responsável').slice(0, 300),
    actorOf(req)
  )
));

// ---------------- portaria da escola ----------------
router.post('/events/ingest', USER, handle((req) =>
  facePlatformService.ingestRecognition(
    {
      deviceId: String(req.body?.deviceId || ''),
      zoneId: req.body?.zoneId || null,
      eventType: req.body?.eventType,
      frame: req.body?.frame,
    },
    actorOf(req)
  ), 201
));
router.post('/events/:id/review', USER, handle((req) => facePlatformService.reviewEvent(req.params.id, req.body?.decision, actorOf(req))));

// ---------------- fotos (coordenador+, cada acesso registrado) ----------------
router.get('/media/:kind/:id', COORDINATOR, async (req: Request, res: Response) => {
  try {
    const kind = req.params.kind === 'event' ? 'event' : 'enrollment';
    const media = await facePlatformService.getMedia(kind, req.params.id, actorOf(req));
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(media.buffer);
  } catch (error: any) {
    res.status(Number(error?.status) || 500).json({ success: false, error: error?.message || 'Foto indisponível' });
  }
});

export default router;
