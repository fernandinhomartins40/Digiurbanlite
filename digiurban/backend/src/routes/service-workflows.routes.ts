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
import { prisma } from '../lib/prisma';
import { seedAllServiceWorkflows } from '../services/service-workflow-seed.service';
import { generateCompleteWorkflowBySubtype } from '../services/workflow-template.service';
import {
  resolveServiceSubtype,
  shouldAutoCreateWorkflow,
} from '../services/service-creation-policy.service';

const router = express.Router();

async function regenerateWorkflowForService(serviceId: string) {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new serviceWorkflowService.WorkflowValidationError('Serviço não encontrado', 404);
  }

  const resolvedSubtype = resolveServiceSubtype({
    serviceType: service.serviceType,
    serviceSubtype: service.serviceSubtype,
    name: service.name,
    description: service.description,
    category: (service as any).category,
    requiresDocuments: (service as any).requiresDocuments,
    requiredDocuments: service.requiredDocuments,
    formSchema: service.formSchema,
    moduleType: service.moduleType,
  });

  const existingWorkflow = await serviceWorkflowService.getWorkflowByServiceId(service.id);

  if (!shouldAutoCreateWorkflow(service.serviceType, resolvedSubtype)) {
    if (existingWorkflow) {
      await serviceWorkflowService.deleteServiceWorkflow(service.id);
    }

    return {
      service,
      subtype: resolvedSubtype,
      mode: 'removed',
      workflow: null,
    };
  }

  const workflowTemplate = generateCompleteWorkflowBySubtype({
    ...service,
    serviceSubtype: resolvedSubtype,
  } as any);

  const workflow = existingWorkflow
    ? await serviceWorkflowService.updateServiceWorkflow(service.id, {
        name: workflowTemplate.name,
        description: workflowTemplate.description,
        stages: workflowTemplate.stages,
        defaultSLA: workflowTemplate.defaultSLA,
        rules: workflowTemplate.rules,
        isActive: true,
      })
    : await serviceWorkflowService.createServiceWorkflow({
        serviceId: service.id,
        name: workflowTemplate.name,
        description: workflowTemplate.description,
        stages: workflowTemplate.stages,
        defaultSLA: workflowTemplate.defaultSLA,
        rules: workflowTemplate.rules,
      });

  return {
    service,
    subtype: resolvedSubtype,
    mode: existingWorkflow ? 'updated' : 'created',
    workflow,
  };
}

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
    const statusCode =
      error instanceof serviceWorkflowService.WorkflowValidationError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error:
        error instanceof serviceWorkflowService.WorkflowValidationError
          ? error.message
          : 'Erro ao criar workflow',
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
    const statusCode =
      error instanceof serviceWorkflowService.WorkflowValidationError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error:
        error instanceof serviceWorkflowService.WorkflowValidationError
          ? error.message
          : 'Erro ao atualizar workflow',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/service-workflows/service/:serviceId/regenerate
 * Regenera o workflow alinhado ao modo operacional do serviço
 */
router.post(
  '/service/:serviceId/regenerate',
  adminAuthMiddleware,
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const result = await regenerateWorkflowForService(serviceId);

      return res.json({
        success: true,
        data: {
          serviceId: result.service.id,
          serviceName: result.service.name,
          subtype: result.subtype,
          mode: result.mode,
          workflow: result.workflow,
        },
        message:
          result.mode === 'removed'
            ? 'Workflow removido porque o serviço não requer fluxo protocolado'
            : 'Workflow regenerado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao regenerar workflow do serviço:', error);
      const statusCode =
        error instanceof serviceWorkflowService.WorkflowValidationError ? error.statusCode : 500;
      return res.status(statusCode).json({
        success: false,
        error:
          error instanceof serviceWorkflowService.WorkflowValidationError
            ? error.message
            : 'Erro ao regenerar workflow',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
);

/**
 * POST /api/service-workflows/regenerate-no-data
 * Regenera workflows de todos os serviços SEM_DADOS ativos
 */
router.post(
  '/regenerate-no-data',
  adminAuthMiddleware,
  requireMinRole(UserRole.ADMIN),
  async (_req, res) => {
    try {
      const services = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          serviceType: 'SEM_DADOS',
        },
        orderBy: { name: 'asc' },
      });

      const summary = {
        total: services.length,
        created: 0,
        updated: 0,
        removed: 0,
        errors: 0,
      };

      const results: Array<{
        serviceId: string;
        serviceName: string;
        subtype?: string;
        mode?: string;
        error?: string;
      }> = [];

      for (const service of services) {
        try {
          const result = await regenerateWorkflowForService(service.id);
          summary[result.mode as 'created' | 'updated' | 'removed'] += 1;
          results.push({
            serviceId: result.service.id,
            serviceName: result.service.name,
            subtype: result.subtype,
            mode: result.mode,
          });
        } catch (error) {
          summary.errors += 1;
          results.push({
            serviceId: service.id,
            serviceName: service.name,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      return res.json({
        success: summary.errors === 0,
        data: {
          summary,
          results,
        },
        message: 'Regeneração dos workflows SEM_DADOS concluída',
      });
    } catch (error) {
      console.error('Erro ao regenerar workflows SEM_DADOS:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao regenerar workflows SEM_DADOS',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
);

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
 * Criar workflows ausentes para os serviços ativos, respeitando a nova lógica
 */
router.post('/seed-all', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const result = await seedAllServiceWorkflows();
    const totalWorkflows = await prisma.serviceWorkflow.count();

    return res.json({
      success: result.errors === 0,
      data: {
        total: totalWorkflows,
        ...result,
      },
      message: `Workflows alinhados com sucesso. Total atual: ${totalWorkflows}`,
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
