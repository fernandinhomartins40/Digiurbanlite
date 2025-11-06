import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as workflowService from '../services/module-workflow.service';

const router = express.Router();

/**
 * POST /api/workflows
 * Criar um novo workflow de módulo
 */
router.post('/', requireRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { moduleType, name, description, stages, defaultSLA, rules } =
      req.body;

    if (!moduleType || !name || !stages || !Array.isArray(stages)) {
      return res.status(400).json({
        success: false,
        error:
          'Tipo de módulo, nome e etapas (array) são obrigatórios'
        });
    }

    const workflow = await workflowService.createWorkflow({
      moduleType,
      name,
      description,
      stages,
      defaultSLA,
      rules
        });

    return res.status(201).json({
      success: true,
      data: workflow
        });
  } catch (error) {
    console.error('Erro ao criar workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar workflow',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * GET /api/workflows
 * Listar todos os workflows
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const workflows = await workflowService.getAllWorkflows();

    return res.json({
      success: true,
      data: workflows
        });
  } catch (error) {
    console.error('Erro ao listar workflows:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar workflows',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * GET /api/workflows/stats
 * Obter estatísticas de workflows
 */
router.get('/stats', requireRole(UserRole.ADMIN), async (req, res) => {
  try {
    const stats = await workflowService.getWorkflowStats();

    return res.json({
      success: true,
      data: stats
        });
  } catch (error) {
    console.error('Erro ao obter estatísticas de workflows:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas de workflows',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * GET /api/workflows/:moduleType
 * Obter workflow por tipo de módulo
 */
router.get('/:moduleType', authenticateToken, async (req, res) => {
  try {
    const { moduleType } = req.params;

    const workflow = await workflowService.getWorkflowByModuleType(moduleType);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado para este tipo de módulo'
        });
    }

    return res.json({
      success: true,
      data: workflow
        });
  } catch (error) {
    console.error('Erro ao obter workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter workflow',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * PUT /api/workflows/:moduleType
 * Atualizar um workflow
 */
router.put('/:moduleType', requireRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { moduleType } = req.params;
    const updateData = req.body;

    const workflow = await workflowService.updateWorkflow(
      moduleType,
      updateData
    );

    return res.json({
      success: true,
      data: workflow
        });
  } catch (error) {
    console.error('Erro ao atualizar workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar workflow',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

/**
 * POST /api/workflows/:moduleType/apply/:protocolId
 * Aplicar workflow a um protocolo
 */
router.post(
  '/:moduleType/apply/:protocolId',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { moduleType, protocolId } = req.params;

      const stages = await workflowService.applyWorkflowToProtocol(
        protocolId,
        moduleType
      );

      return res.status(201).json({
        success: true,
        data: stages,
        message: `Workflow aplicado com sucesso. ${stages.length} etapas criadas.`
        });
    } catch (error) {
      console.error('Erro ao aplicar workflow:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao aplicar workflow',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/workflows/validate-stage/:protocolId/:stageOrder
 * Validar condições de uma etapa
 */
router.get(
  '/validate-stage/:protocolId/:stageOrder',
  requireRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId, stageOrder } = req.params;

      const validation = await workflowService.validateStageConditions(
        protocolId,
        parseInt(stageOrder)
      );

      return res.json({
        success: true,
        data: validation
        });
    } catch (error) {
      console.error('Erro ao validar etapa:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao validar etapa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * POST /api/workflows/seed-defaults
 * Criar workflows padrão
 */
router.post(
  '/seed-defaults',
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const created = await workflowService.createDefaultWorkflows();

      return res.json({
        success: true,
        data: created,
        message: `${created.length} workflows padrão criados com sucesso`
        });
    } catch (error) {
      console.error('Erro ao criar workflows padrão:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar workflows padrão',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * DELETE /api/workflows/:moduleType
 * Deletar um workflow
 */
router.delete(
  '/:moduleType',
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { moduleType } = req.params;

      await workflowService.deleteWorkflow(moduleType);

      return res.json({
        success: true,
        message: 'Workflow deletado com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar workflow',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

export default router;
