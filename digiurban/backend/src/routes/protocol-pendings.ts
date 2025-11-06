import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { UserRole, PendingType, PendingStatus } from '@prisma/client';
import * as pendingService from '../services/protocol-pending.service';

const router = express.Router();

/**
 * POST /api/protocols/:protocolId/pendings
 * Criar uma nova pendência
 */
router.post(
  '/:protocolId/pendings',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { protocolId } = req.params;
      const {
        type,
        title,
        description,
        dueDate,
        blocksProgress,
        metadata
        } = req.body;

      if (!type || !title || !description) {
        return res.status(400).json({
          success: false,
          error: 'Tipo, título e descrição são obrigatórios'
        });
      }

      const pending = await pendingService.createPending({
        protocolId,
        type,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        blocksProgress,
        metadata,
        createdBy: authReq.userId
        });

      return res.status(201).json({
        success: true,
        data: pending
        });
    } catch (error) {
      console.error('Erro ao criar pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/pendings
 * Listar todas as pendências de um protocolo
 */
router.get(
  '/:protocolId/pendings',
  authenticateToken,
  async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { status } = req.query;

      const pendings = await pendingService.getProtocolPendings(
        protocolId,
        status as PendingStatus | undefined
      );

      return res.json({
        success: true,
        data: pendings
        });
    } catch (error) {
      console.error('Erro ao listar pendências:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar pendências',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/pendings/:pendingId
 * Obter uma pendência específica
 */
router.get(
  '/:protocolId/pendings/:pendingId',
  authenticateToken,
  async (req, res) => {
    try {
      const { pendingId } = req.params;

      const pending = await pendingService.getPendingById(pendingId);

      if (!pending) {
        return res.status(404).json({
          success: false,
          error: 'Pendência não encontrada'
        });
      }

      return res.json({
        success: true,
        data: pending
        });
    } catch (error) {
      console.error('Erro ao obter pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao obter pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId
 * Atualizar uma pendência
 */
router.put(
  '/:protocolId/pendings/:pendingId',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { pendingId } = req.params;
      const { status, resolution, dueDate } = req.body;

      const pending = await pendingService.updatePending(pendingId, {
        status,
        resolution,
        dueDate: dueDate ? new Date(dueDate) : undefined
        });

      return res.json({
        success: true,
        data: pending
        });
    } catch (error) {
      console.error('Erro ao atualizar pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/start
 * Marcar pendência como em progresso
 */
router.put(
  '/:protocolId/pendings/:pendingId/start',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { pendingId } = req.params;

      const pending = await pendingService.startPending(pendingId);

      return res.json({
        success: true,
        data: pending
        });
    } catch (error) {
      console.error('Erro ao iniciar pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao iniciar pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/resolve
 * Resolver uma pendência
 */
router.put(
  '/:protocolId/pendings/:pendingId/resolve',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { pendingId } = req.params;
      const { resolution } = req.body;

      if (!resolution) {
        return res.status(400).json({
          success: false,
          error: 'Resolução é obrigatória'
        });
      }

      const pending = await pendingService.resolvePending(
        pendingId,
        authReq.userId,
        resolution
      );

      return res.json({
        success: true,
        data: pending
        });
    } catch (error) {
      console.error('Erro ao resolver pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao resolver pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/pendings/:pendingId/cancel
 * Cancelar uma pendência
 */
router.put(
  '/:protocolId/pendings/:pendingId/cancel',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { pendingId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Motivo é obrigatório'
        });
      }

      const pending = await pendingService.cancelPending(
        pendingId,
        authReq.userId,
        reason
      );

      return res.json({
        success: true,
        data: pending
        });
    } catch (error) {
      console.error('Erro ao cancelar pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao cancelar pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/pendings/check-blocking
 * Verificar se há pendências bloqueantes
 */
router.get(
  '/:protocolId/pendings/check-blocking',
  authenticateToken,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const hasBlocking = await pendingService.hasBlockingPendings(protocolId);

      return res.json({
        success: true,
        data: { hasBlocking }
        });
    } catch (error) {
      console.error('Erro ao verificar pendências bloqueantes:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar pendências bloqueantes',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/pendings/count-by-status
 * Contar pendências por status
 */
router.get(
  '/:protocolId/pendings/count-by-status',
  authenticateToken,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const counts = await pendingService.countPendingsByStatus(protocolId);

      return res.json({
        success: true,
        data: counts
        });
    } catch (error) {
      console.error('Erro ao contar pendências por status:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao contar pendências por status',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/pendings/check-expired
 * Verificar e marcar pendências expiradas
 */
router.put(
  '/:protocolId/pendings/check-expired',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const expired = await pendingService.checkExpiredPendings(protocolId);

      return res.json({
        success: true,
        data: {
          count: expired.length,
          expired
        }
        });
    } catch (error) {
      console.error('Erro ao verificar pendências expiradas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar pendências expiradas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * DELETE /api/protocols/:protocolId/pendings/:pendingId
 * Deletar uma pendência
 */
router.delete(
  '/:protocolId/pendings/:pendingId',
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { pendingId } = req.params;

      await pendingService.deletePending(pendingId);

      return res.json({
        success: true,
        message: 'Pendência deletada com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar pendência:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar pendência',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

export default router;
