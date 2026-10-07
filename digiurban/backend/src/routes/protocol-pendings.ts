import express from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { UserRole, PendingStatus } from '@prisma/client';
import * as pendingService from '../services/protocol-pending.service';
import { assertProtocolAccess } from '../services/protocol-access.service';

const router = express.Router();

/**
 * O servidor só mexe em pendências de protocolos que ele pode ver (mesma
 * regra da tela do protocolo). Antes qualquer servidor do município, de
 * qualquer secretaria, criava/resolvia/cancelava pendência de qualquer protocolo.
 */
const protocolAccess: express.RequestHandler = async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user as any;
    await assertProtocolAccess(
      { id: user?.id, role: user?.role, departmentId: user.departmentId, departmentIds: (user as any)?.departmentIds },
      req.params.protocolId
    );
    next();
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({
      success: false,
      error: error?.statusCode ? error.message : 'Erro ao verificar acesso ao protocolo'
    });
  }
};

/** A pendência do endereço precisa ser deste protocolo */
const pendingOfProtocol: express.RequestHandler = async (req, res, next) => {
  try {
    const pending = await pendingService.getPendingById(req.params.pendingId);
    if (!pending || pending.protocolId !== req.params.protocolId) {
      res.status(404).json({ success: false, error: 'Pendência não encontrada' });
      return;
    }
    (req as any).pending = pending;
    next();
  } catch (error) {
    sendError(res, error, 'Erro ao carregar pendência');
  }
};

function sendError(res: express.Response, error: unknown, fallback: string) {
  if (error instanceof pendingService.PendingActionError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }
  console.error(`${fallback}:`, error);
  return res.status(500).json({
    success: false,
    error: fallback,
    details: error instanceof Error ? error.message : 'Erro desconhecido'
  });
}

function parseFutureDueDate(raw: unknown) {
  const dueDate = pendingService.parsePendingDueDate(raw);
  if (dueDate && dueDate.getTime() < Date.now()) {
    throw new pendingService.PendingActionError('O prazo não pode ser uma data que já passou.', 400);
  }
  return dueDate;
}

const staff = [adminAuthMiddleware, requireMinRole(UserRole.USER), protocolAccess];

/**
 * POST /api/protocols/:protocolId/pendings
 * Criar uma nova pendência
 */
router.post('/:protocolId/pendings', ...staff, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { protocolId } = req.params;
    const {
      type,
      title,
      description,
      dueDate,
      blocksProgress,
      metadata,
      stageId,
      requiresReview,
      sourceType,
      sourceEntityType,
      sourceEntityId,
      dedupeKey,
    } = req.body;

    if (!type || !String(title || '').trim() || !String(description || '').trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tipo, título e descrição são obrigatórios'
      });
    }

    const pending = await pendingService.createPending({
      protocolId,
      type,
      title: String(title).trim(),
      description: String(description).trim(),
      stageId,
      dueDate: parseFutureDueDate(dueDate),
      blocksProgress,
      requiresReview,
      sourceType,
      sourceEntityType,
      sourceEntityId,
      dedupeKey,
      metadata,
      createdBy: authReq.userId
    });

    return res.status(201).json({ success: true, data: pending });
  } catch (error) {
    return sendError(res, error, 'Erro ao criar pendência');
  }
});

/**
 * GET /api/protocols/:protocolId/pendings
 * Listar todas as pendências de um protocolo
 */
router.get('/:protocolId/pendings', adminAuthMiddleware, protocolAccess, async (req, res) => {
  try {
    const { protocolId } = req.params;
    const { status } = req.query;

    const pendings = await pendingService.getProtocolPendings(
      protocolId,
      status as PendingStatus | undefined
    );

    return res.json({ success: true, data: pendings });
  } catch (error) {
    return sendError(res, error, 'Erro ao listar pendências');
  }
});

/**
 * GET /api/protocols/:protocolId/pendings/check-blocking
 * Verificar se há pendências bloqueantes
 */
router.get('/:protocolId/pendings/check-blocking', adminAuthMiddleware, protocolAccess, async (req, res) => {
  try {
    const hasBlocking = await pendingService.hasBlockingPendings(req.params.protocolId);
    return res.json({ success: true, data: { hasBlocking } });
  } catch (error) {
    return sendError(res, error, 'Erro ao verificar pendências bloqueantes');
  }
});

/**
 * GET /api/protocols/:protocolId/pendings/count-by-status
 * Contar pendências por status
 */
router.get('/:protocolId/pendings/count-by-status', adminAuthMiddleware, protocolAccess, async (req, res) => {
  try {
    const counts = await pendingService.countPendingsByStatus(req.params.protocolId);
    return res.json({ success: true, data: counts });
  } catch (error) {
    return sendError(res, error, 'Erro ao contar pendências por status');
  }
});

/**
 * GET /api/protocols/:protocolId/pendings/:pendingId
 * Obter uma pendência específica
 */
router.get('/:protocolId/pendings/:pendingId', adminAuthMiddleware, protocolAccess, pendingOfProtocol, async (req, res) => {
  return res.json({ success: true, data: (req as any).pending });
});

/**
 * PUT /api/protocols/:protocolId/pendings/check-expired
 * Encerrar pendências com prazo vencido (o protocolo volta para a equipe)
 */
router.put('/:protocolId/pendings/check-expired', ...staff, async (req, res) => {
  try {
    const expired = await pendingService.checkExpiredPendings(req.params.protocolId);
    return res.json({ success: true, data: { count: expired.length, expired } });
  } catch (error) {
    return sendError(res, error, 'Erro ao verificar pendências expiradas');
  }
});

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId
 * Alterar o prazo de uma pendência. A situação NÃO muda por aqui (antes dava
 * para marcar "resolvida" sem passar pelas regras e o protocolo não andava):
 * use /resolve, /cancel ou /reopen.
 */
router.put('/:protocolId/pendings/:pendingId', ...staff, pendingOfProtocol, async (req, res) => {
  try {
    if (req.body?.status !== undefined) {
      return res.status(400).json({
        success: false,
        error: 'Para mudar a situação use as ações Resolver, Cancelar ou Pedir novo ajuste.'
      });
    }

    const pending = await pendingService.updatePending(req.params.pendingId, {
      dueDate: parseFutureDueDate(req.body?.dueDate),
    });

    return res.json({ success: true, data: pending });
  } catch (error) {
    return sendError(res, error, 'Erro ao atualizar pendência');
  }
});

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/start
 * Marcar pendência como em progresso
 */
router.put('/:protocolId/pendings/:pendingId/start', ...staff, pendingOfProtocol, async (req, res) => {
  try {
    if ((req as any).pending.status !== PendingStatus.OPEN) {
      return res.status(409).json({ success: false, error: 'Só pendências abertas podem ser iniciadas.' });
    }
    const pending = await pendingService.startPending(req.params.pendingId);
    return res.json({ success: true, data: pending });
  } catch (error) {
    return sendError(res, error, 'Erro ao iniciar pendência');
  }
});

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/resolve
 * Resolver uma pendência. Se o cidadão respondeu com documentos, eles são
 * aprovados junto (a análise vale para a pendência e para o documento).
 */
router.put('/:protocolId/pendings/:pendingId/resolve', ...staff, pendingOfProtocol, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const resolution = String(req.body?.resolution || '').trim();

    if (!resolution) {
      return res.status(400).json({ success: false, error: 'Resolução é obrigatória' });
    }

    const pending = await pendingService.resolvePending(
      req.params.pendingId,
      authReq.userId,
      resolution,
      { approveSubmittedDocuments: true }
    );

    return res.json({ success: true, data: pending });
  } catch (error) {
    return sendError(res, error, 'Erro ao resolver pendência');
  }
});

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/reopen
 * Pedir novo ajuste ao cidadão (pendência respondida ou resolvida).
 * Documentos enviados como resposta são recusados com o mesmo motivo.
 */
router.put('/:protocolId/pendings/:pendingId/reopen', ...staff, pendingOfProtocol, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const reason = String(req.body?.reason || '').trim();

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Motivo é obrigatório' });
    }

    const pending = await pendingService.reopenPending(req.params.pendingId, authReq.userId, reason);
    return res.json({ success: true, data: pending });
  } catch (error) {
    return sendError(res, error, 'Erro ao reabrir pendência');
  }
});

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/cancel
 * Cancelar uma pendência (o protocolo volta a andar se era a última)
 */
router.put('/:protocolId/pendings/:pendingId/cancel', ...staff, pendingOfProtocol, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const reason = String(req.body?.reason || '').trim();

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Motivo é obrigatório' });
    }

    const pending = await pendingService.cancelPending(req.params.pendingId, authReq.userId, reason);
    return res.json({ success: true, data: pending });
  } catch (error) {
    return sendError(res, error, 'Erro ao cancelar pendência');
  }
});

/**
 * DELETE /api/protocols/:protocolId/pendings/:pendingId
 * Apagar uma pendência (só administrador).
 * O login de servidor faltava: o requireRole respondia 401 sempre.
 */
router.delete(
  '/:protocolId/pendings/:pendingId',
  adminAuthMiddleware,
  requireRole(UserRole.ADMIN),
  protocolAccess,
  pendingOfProtocol,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      await pendingService.deletePending(req.params.pendingId, authReq.userId);
      return res.json({ success: true, message: 'Pendência apagada com sucesso' });
    } catch (error) {
      return sendError(res, error, 'Erro ao apagar pendência');
    }
  }
);

export default router;
