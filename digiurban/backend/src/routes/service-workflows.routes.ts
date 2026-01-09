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
 * POST /api/service-workflows/seed-all
 * Criar workflows GENÉRICOS para todos os serviços sem workflow
 */
router.post('/seed-all', adminAuthMiddleware, requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { prisma } = await import('../lib/prisma');

    console.log('🌱 Criando workflows GENÉRICOS para serviços sem workflow...');

    // Buscar serviços sem workflow
    const servicesWithoutWorkflow = await prisma.serviceSimplified.findMany({
      where: {
        isActive: true,
        workflow: null
      },
      include: {
        department: true
      }
    });

    console.log(`   → Encontrados ${servicesWithoutWorkflow.length} serviços sem workflow`);

    const created: any[] = [];
    const errors: string[] = [];

    for (const service of servicesWithoutWorkflow) {
      try {
        const workflow = await serviceWorkflowService.createServiceWorkflow({
          serviceId: service.id,
          name: `Workflow - ${service.name}`,
          description: `Workflow genérico para ${service.name}`,
          stages: [
            {
              name: 'Solicitação Recebida',
              order: 1,
              description: 'Protocolo recebido e aguardando análise inicial',
              slaDays: 2,
              requiredDocumentTypes: [],
              requiredFormFieldIds: [],
              allowedActions: ['APPROVE'],
              canSkip: false
            },
            {
              name: 'Análise de Documentos',
              order: 2,
              description: 'Verificação e validação dos documentos apresentados',
              slaDays: 3,
              requiredDocumentTypes: service.requiredDocuments ?
                (Array.isArray(service.requiredDocuments) ?
                  (service.requiredDocuments as any[]).map(doc =>
                    typeof doc === 'string' ? doc : doc.type
                  ) : []) : [],
              requiredFormFieldIds: [],
              allowedActions: ['APPROVE', 'REQUEST_INFO'],
              canSkip: false
            },
            {
              name: 'Processamento',
              order: 3,
              description: `Processamento da solicitação pelo ${service.department.name}`,
              slaDays: 5,
              requiredDocumentTypes: [],
              requiredFormFieldIds: [],
              allowedActions: ['APPROVE', 'REQUEST_INFO'],
              canSkip: false
            },
            {
              name: 'Aprovação Final',
              order: 4,
              description: 'Aprovação final da solicitação',
              slaDays: 2,
              requiredDocumentTypes: [],
              requiredFormFieldIds: [],
              allowedActions: ['APPROVE', 'REJECT'],
              canSkip: false
            },
            {
              name: 'Emissão/Conclusão',
              order: 5,
              description: 'Emissão do documento ou conclusão do atendimento',
              slaDays: 1,
              requiredDocumentTypes: [],
              requiredFormFieldIds: [],
              allowedActions: ['APPROVE'],
              canSkip: false
            }
          ],
          defaultSLA: service.estimatedDays || 13
        });

        created.push({
          serviceId: service.id,
          serviceName: service.name,
          workflowId: workflow.id,
          stagesCount: 5
        });

        console.log(`   ✅ ${service.name} - 5 etapas`);
      } catch (error) {
        const errorMsg = `${service.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Criados: ${created.length}`);
    console.log(`   ❌ Erros: ${errors.length}`);

    return res.json({
      success: true,
      data: {
        created,
        errors,
        total: created.length
      },
      message: `${created.length} workflows criados com sucesso`
    });
  } catch (error) {
    console.error('Erro ao criar workflows genéricos:', error);
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
