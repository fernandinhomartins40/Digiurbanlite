import express from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { AuthenticatedRequest } from '../types';
import { UserRole, InteractionType } from '@prisma/client';
import * as interactionService from '../services/protocol-interaction.service';

const router = express.Router();

/**
 * POST /api/protocols/:protocolId/interactions
 * Criar uma nova interação em um protocolo
 */
router.post(
  '/:protocolId/interactions',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { protocolId } = req.params;
      const { type, message, isInternal, attachments, metadata } = req.body;

      // Determinar tipo de autor baseado no role
      let authorType: 'CITIZEN' | 'SERVER' | 'SYSTEM' = 'CITIZEN';
      if (authReq.userRole && authReq.userRole !== UserRole.GUEST) {
        authorType = 'SERVER';
      }

      const interaction = await interactionService.createInteraction({
        protocolId,
        type: type || InteractionType.MESSAGE,
        authorType,
        authorId: authReq.userId,
        authorName: authReq.user?.name || 'Usuário',
        message,
        isInternal: isInternal || false,
        attachments,
        metadata
        });

      return res.status(201).json({
        success: true,
        data: interaction
        });
    } catch (error) {
      console.error('Erro ao criar interação:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar interação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/interactions
 * Listar todas as interações de um protocolo
 */
router.get(
  '/:protocolId/interactions',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { protocolId } = req.params;
      const { includeInternal } = req.query;

      // Apenas servidores podem ver interações internas
      const canSeeInternal =
        authReq.userRole && authReq.userRole !== UserRole.GUEST;
      const showInternal =
        includeInternal === 'true' && canSeeInternal;

      const interactions = await interactionService.getProtocolInteractions(
        protocolId,
        showInternal
      );

      return res.json({
        success: true,
        data: interactions
        });
    } catch (error) {
      console.error('Erro ao listar interações:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar interações',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/interactions/:interactionId/read
 * Marcar uma interação como lida
 */
router.put(
  '/:protocolId/interactions/:interactionId/read',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { interactionId } = req.params;

      const interaction = await interactionService.markInteractionAsRead(
        interactionId
      );

      return res.json({
        success: true,
        data: interaction
        });
    } catch (error) {
      console.error('Erro ao marcar interação como lida:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar interação como lida',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/interactions/read-all
 * Marcar todas as interações de um protocolo como lidas
 */
router.put(
  '/:protocolId/interactions/read-all',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const result = await interactionService.markAllProtocolInteractionsAsRead(
        protocolId
      );

      return res.json({
        success: true,
        data: result
        });
    } catch (error) {
      console.error('Erro ao marcar todas interações como lidas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar todas interações como lidas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/interactions/unread-count
 * Contar interações não lidas de um protocolo
 */
router.get(
  '/:protocolId/interactions/unread-count',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const count = await interactionService.countUnreadInteractions(protocolId);

      return res.json({
        success: true,
        data: { count }
        });
    } catch (error) {
      console.error('Erro ao contar interações não lidas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao contar interações não lidas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * DELETE /api/protocols/:protocolId/interactions/:interactionId
 * Deletar uma interação (apenas administradores)
 */
router.delete(
  '/:protocolId/interactions/:interactionId',
  adminAuthMiddleware,
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { interactionId } = req.params;

      await interactionService.deleteInteraction(interactionId);

      return res.json({
        success: true,
        message: 'Interação deletada com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar interação:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar interação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

export default router;
