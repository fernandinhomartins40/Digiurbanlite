import express from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { UserRole, StageStatus } from '@prisma/client';
import * as stageService from '../services/protocol-stage.service';

const router = express.Router();

/**
 * POST /api/protocols/:protocolId/stages
 * Criar uma nova etapa para um protocolo
 */
router.post(
  '/:protocolId/stages',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { stageName, stageOrder, assignedTo, dueDate, metadata } = req.body;

      if (!stageName || stageOrder === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Nome e ordem da etapa são obrigatórios'
        });
      }

      const stage = await stageService.createStage({
        protocolId,
        stageName,
        stageOrder,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        metadata
        });

      return res.status(201).json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/stages
 * Listar todas as etapas de um protocolo
 */
router.get('/:protocolId/stages', adminAuthMiddleware, async (req, res) => {
  try {
    const { protocolId } = req.params;

    const stages = await stageService.getProtocolStages(protocolId);

    return res.json({
      success: true,
      data: stages
        });
  } catch (error) {
    console.error('Erro ao listar etapas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar etapas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * GET /api/protocols/:protocolId/stages/current
 * Obter a etapa atual do protocolo
 */
router.get(
  '/:protocolId/stages/current',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const stage = await stageService.getCurrentStage(protocolId);

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao obter etapa atual:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao obter etapa atual',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/stages/:stageId
 * Obter uma etapa específica
 */
router.get(
  '/:protocolId/stages/:stageId',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { stageId } = req.params;

      const stage = await stageService.getStageById(stageId);

      if (!stage) {
        return res.status(404).json({
          success: false,
          error: 'Etapa não encontrada'
        });
      }

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao obter etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao obter etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/stages/:stageId
 * Atualizar uma etapa
 */
router.put(
  '/:protocolId/stages/:stageId',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { stageId } = req.params;
      const updateData = req.body;

      const stage = await stageService.updateStage(stageId, updateData);

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/stages/:stageId/start
 * Iniciar uma etapa
 */
router.put(
  '/:protocolId/stages/:stageId/start',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { stageId } = req.params;

      const stage = await stageService.startStage(stageId, authReq.userId);

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao iniciar etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao iniciar etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/stages/:stageId/complete
 * Completar uma etapa
 */
router.put(
  '/:protocolId/stages/:stageId/complete',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { stageId } = req.params;
      const { result, notes } = req.body;

      const stage = await stageService.completeStage(
        stageId,
        authReq.userId,
        result,
        notes
      );

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao completar etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao completar etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/stages/:stageId/skip
 * Pular uma etapa
 */
router.put(
  '/:protocolId/stages/:stageId/skip',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { stageId } = req.params;
      const { reason } = req.body;

      const stage = await stageService.skipStage(
        stageId,
        authReq.userId,
        reason
      );

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao pular etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao pular etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/stages/:stageId/fail
 * Marcar etapa como falha
 */
router.put(
  '/:protocolId/stages/:stageId/fail',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { stageId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Motivo da falha é obrigatório'
        });
      }

      const stage = await stageService.failStage(
        stageId,
        authReq.userId,
        reason
      );

      return res.json({
        success: true,
        data: stage
        });
    } catch (error) {
      console.error('Erro ao marcar etapa como falha:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar etapa como falha',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/stages/check-completion
 * Verificar se todas as etapas foram completadas
 */
router.get(
  '/:protocolId/stages/check-completion',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const allCompleted = await stageService.allStagesCompleted(protocolId);

      return res.json({
        success: true,
        data: { allCompleted }
        });
    } catch (error) {
      console.error('Erro ao verificar completude das etapas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar completude das etapas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/stages/count-by-status
 * Contar etapas por status
 */
router.get(
  '/:protocolId/stages/count-by-status',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const counts = await stageService.countStagesByStatus(protocolId);

      return res.json({
        success: true,
        data: counts
        });
    } catch (error) {
      console.error('Erro ao contar etapas por status:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao contar etapas por status',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * DELETE /api/protocols/:protocolId/stages/:stageId
 * Deletar uma etapa
 */
router.delete(
  '/:protocolId/stages/:stageId',
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { stageId } = req.params;

      await stageService.deleteStage(stageId);

      return res.json({
        success: true,
        message: 'Etapa deletada com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

export default router;
