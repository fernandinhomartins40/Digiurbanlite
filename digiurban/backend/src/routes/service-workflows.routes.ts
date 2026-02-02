/**
 * ============================================================================
 * SERVICE WORKFLOWS ROUTES - NOVO
 * ============================================================================
 *
 * Rotas para gerenciamento de workflows por serviço
 */

import express from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole } from '@prisma/client';
import * as serviceWorkflowService from '../services/service-workflow.service';

const router = express.Router();

/**
 * GET /api/service-workflows
 * Listar todos os workflows de serviços
 */
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { isActive, departmentId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (departmentId) {
      filters.departmentId = departmentId as string;
    }

    const workflows = await serviceWorkflowService.getAllServiceWorkflows(filters);

    return res.json({
      success: true,
      data: workflows,
      total: workflows.length
    });
  } catch (error) {
    console.error('Erro ao listar workflows de serviços:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar workflows',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/service-workflows/stats
 * Obter estatísticas de workflows
 */
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const stats = await serviceWorkflowService.getWorkflowStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/service-workflows/service/:serviceId
 * Obter workflow de um serviço específico
 */
router.get('/service/:serviceId', adminAuthMiddleware, async (req, res) => {
  try {
    const { serviceId } = req.params;

    const workflow = await serviceWorkflowService.getWorkflowByServiceId(serviceId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado para este serviço'
      });
    }

    return res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Erro ao buscar workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar workflow',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/service-workflows/:id
 * Obter workflow por ID
 */
router.get('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = await serviceWorkflowService.getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow não encontrado'
      });
    }

    return res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Erro ao buscar workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar workflow',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/service-workflows
 * Criar um novo workflow de serviço
 */
router.post('/', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { serviceId, name, description, stages, defaultSLA, rules } = req.body;

    if (!serviceId || !name || !stages || !Array.isArray(stages)) {
      return res.status(400).json({
        success: false,
        error: 'ID do serviço, nome e etapas (array) são obrigatórios'
      });
    }

    const workflow = await serviceWorkflowService.createServiceWorkflow({
      serviceId,
      name,
      description,
      stages,
      defaultSLA,
      rules
    });

    return res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow criado com sucesso'
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
 * PUT /api/service-workflows/service/:serviceId
 * Atualizar workflow de um serviço
 */
router.put('/service/:serviceId', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, description, stages, defaultSLA, rules, isActive } = req.body;

    const workflow = await serviceWorkflowService.updateServiceWorkflow(serviceId, {
      name,
      description,
      stages,
      defaultSLA,
      rules,
      isActive
    });

    return res.json({
      success: true,
      data: workflow,
      message: 'Workflow atualizado com sucesso'
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
 * DELETE /api/service-workflows/service/:serviceId
 * Deletar workflow de um serviço
 */
router.delete('/service/:serviceId', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { serviceId } = req.params;

    await serviceWorkflowService.deleteServiceWorkflow(serviceId);

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
});

/**
 * DELETE /api/service-workflows/delete-all
 * Deletar TODOS os workflows
 */
router.delete('/delete-all', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const deletedCount = await serviceWorkflowService.deleteAllServiceWorkflows();

    return res.json({
      success: true,
      data: {
        deletedCount
      },
      message: `${deletedCount} workflow(s) deletado(s) com sucesso`
    });
  } catch (error) {
    console.error('Erro ao deletar todos os workflows:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao deletar workflows',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/service-workflows/seed-all
 * Criar/atualizar workflows para todos os serviços
 * - Serviços COM_DADOS (com moduleType): workflows ESPECÍFICOS (79 workflows)
 * - Serviços SEM_DADOS (sem moduleType): workflows GENÉRICOS
 */
router.post('/seed-all', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    // ✅ Executar seed via spawn para evitar problema de rootDir
    const { spawn } = await import('child_process');
    const path = await import('path');

    const seedPath = path.join(process.cwd(), 'prisma/seeds/service-workflows.seed.ts');

    return new Promise((resolve) => {
      const seedProcess = spawn('npx', ['tsx', seedPath], {
        stdio: 'inherit',
        shell: true
      });

      seedProcess.on('close', async (code) => {
        if (code === 0) {
          // Contar workflows após seed
          const { prisma } = await import('../lib/prisma');
          const totalWorkflows = await prisma.serviceWorkflow.count();

          resolve(res.json({
            success: true,
            data: {
              total: totalWorkflows
            },
            message: `Workflows criados/atualizados com sucesso! Total: ${totalWorkflows}`
          }));
        } else {
          resolve(res.status(500).json({
            success: false,
            error: 'Erro ao executar seed de workflows',
            details: `Processo retornou código ${code}`
          }));
        }
      });

      seedProcess.on('error', (error) => {
        resolve(res.status(500).json({
          success: false,
          error: 'Erro ao iniciar processo de seed',
          details: error.message
        }));
      });
    });
  } catch (error) {
    console.error('Erro ao criar workflows:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar workflows',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/service-workflows/service-info/:serviceId
 * Obter informações do serviço para criar workflow
 */
router.get('/service-info/:serviceId', adminAuthMiddleware, async (req, res) => {
  try {
    const { serviceId } = req.params;

    const serviceInfo = await serviceWorkflowService.getServiceForWorkflow(serviceId);

    if (!serviceInfo) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      });
    }

    return res.json({
      success: true,
      data: serviceInfo
    });
  } catch (error) {
    console.error('Erro ao buscar informações do serviço:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar informações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
