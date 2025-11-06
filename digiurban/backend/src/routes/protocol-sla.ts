import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as slaService from '../services/protocol-sla.service';

const router = express.Router();

/**
 * POST /api/protocols/:protocolId/sla
 * Criar SLA para um protocolo
 */
router.post(
  '/:protocolId/sla',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { workingDays, startDate } = req.body;

      if (!workingDays) {
        return res.status(400).json({
          success: false,
          error: 'Dias úteis são obrigatórios'
        });
      }

      const sla = await slaService.createSLA({
        protocolId,
        workingDays,
        startDate: startDate ? new Date(startDate) : undefined
        });

      return res.status(201).json({
        success: true,
        data: sla
        });
    } catch (error) {
      console.error('Erro ao criar SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/sla
 * Obter SLA de um protocolo
 */
router.get('/:protocolId/sla', authenticateToken, async (req, res) => {
  try {
    const { protocolId } = req.params;

    const sla = await slaService.getProtocolSLA(protocolId);

    if (!sla) {
      return res.status(404).json({
        success: false,
        error: 'SLA não encontrado para este protocolo'
        });
    }

    return res.json({
      success: true,
      data: sla
        });
  } catch (error) {
    console.error('Erro ao obter SLA:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter SLA',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * PUT /api/protocols/:protocolId/sla/pause
 * Pausar SLA de um protocolo
 */
router.put(
  '/:protocolId/sla/pause',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Motivo da pausa é obrigatório'
        });
      }

      const sla = await slaService.pauseSLA(protocolId, reason);

      return res.json({
        success: true,
        data: sla
        });
    } catch (error) {
      console.error('Erro ao pausar SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao pausar SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/sla/resume
 * Retomar SLA de um protocolo
 */
router.put(
  '/:protocolId/sla/resume',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const sla = await slaService.resumeSLA(protocolId);

      return res.json({
        success: true,
        data: sla
        });
    } catch (error) {
      console.error('Erro ao retomar SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao retomar SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/sla/complete
 * Finalizar SLA de um protocolo
 */
router.put(
  '/:protocolId/sla/complete',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const sla = await slaService.completeSLA(protocolId);

      return res.json({
        success: true,
        data: sla
        });
    } catch (error) {
      console.error('Erro ao finalizar SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao finalizar SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/sla/update-status
 * Atualizar status de atraso do SLA
 */
router.put(
  '/:protocolId/sla/update-status',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const sla = await slaService.updateSLAStatus(protocolId);

      return res.json({
        success: true,
        data: sla
        });
    } catch (error) {
      console.error('Erro ao atualizar status do SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status do SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/sla/overdue
 * Obter todos os SLAs em atraso
 */
router.get('/overdue', requireRole(UserRole.USER), async (req, res) => {
  try {
    const { tenantId } = req.query;

    const slas = await slaService.getOverdueSLAs(
      tenantId ? String(tenantId) : undefined
    );

    return res.json({
      success: true,
      data: slas
        });
  } catch (error) {
    console.error('Erro ao obter SLAs em atraso:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter SLAs em atraso',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * GET /api/sla/near-due
 * Obter SLAs próximos do vencimento
 */
router.get('/near-due', requireRole(UserRole.USER), async (req, res) => {
  try {
    const { days } = req.query;

    const slas = await slaService.getSLAsNearDue(
      days ? parseInt(String(days)) : 3
    );

    return res.json({
      success: true,
      data: slas
        });
  } catch (error) {
    console.error('Erro ao obter SLAs próximos do vencimento:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter SLAs próximos do vencimento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * GET /api/sla/stats/:tenantId
 * Obter estatísticas de SLA para um tenant
 */
router.get(
  '/stats/:tenantId',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      const stats = await slaService.calculateSLAStats(tenantId);

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Erro ao calcular estatísticas de SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao calcular estatísticas de SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * DELETE /api/protocols/:protocolId/sla
 * Deletar SLA de um protocolo
 */
router.delete(
  '/:protocolId/sla',
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      await slaService.deleteSLA(protocolId);

      return res.json({
        success: true,
        message: 'SLA deletado com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar SLA:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar SLA',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

export default router;
