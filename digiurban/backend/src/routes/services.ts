import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import {
  AuthenticatedRequest,
  SuccessResponse,
  ErrorResponse
        } from '../types';
import { generateDefaultWorkflow } from '../services/workflow-template.service';

// ====================== TIPOS LOCAIS ISOLADOS ======================

interface WhereCondition {
  [key: string]: unknown;
}

// FASE 2 - Interface para serviços
// WhereClause interface removida - usando WhereCondition do sistema centralizado

const router = Router();

// Aplicar middleware de tenant em todas as rotas
/**
 * GET /api/services
 * Listar serviços (catálogo público - sem autenticação)
 * Query params opcionais:
 * - includeFeatures: "true" para incluir configurações de features
 */
router.get(
  '/',
  async (req, res: Response<SuccessResponse | ErrorResponse>) => {
    try {
      const { departmentId, departmentCode, search, includeFeatures } = req.query;

      console.log('[GET /api/services] Query params:', { departmentId, departmentCode, search });

      let whereClause: WhereCondition = {
        isActive: true
        };

      // Suporte para filtrar por departmentId OU departmentCode (case-insensitive)
      if (departmentId) {
        whereClause.departmentId = departmentId;
      } else if (departmentCode) {
        // Converter slug (assistencia-social) para code (ASSISTENCIA_SOCIAL)
        const code = (departmentCode as string).replace(/-/g, '_').toUpperCase();
        console.log('[GET /api/services] Converted code:', code);
        whereClause.department = {
          code: code
        };
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      console.log('[GET /api/services] WhereClause:', JSON.stringify(whereClause, null, 2));

      // Include condicional baseado em flags
      const services = await prisma.serviceSimplified.findMany({
        where: whereClause as any,
        include: {
          department: {
            select: {
              id: true,
              name: true
        }
      }
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }]
        });

      console.log('[GET /api/services] Services found:', services.length);

      res.json({ data: services, success: true });
    } catch (error) {
      console.error('List services error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro interno do servidor'
        });
    }
  }
);

/**
 * GET /api/services/:id
 * Obter serviço específico (público - sem autenticação)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id,
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true
        }
      }
        }
        });

    if (!service) {
      res.status(404).json({
        error: 'Not found',
        message: 'Serviço não encontrado'
        });
      return;
    }

    // Normalizar requiredDocuments para array
    let normalizedRequiredDocuments = service.requiredDocuments
    if (typeof service.requiredDocuments === 'string') {
      try {
        normalizedRequiredDocuments = JSON.parse(service.requiredDocuments)
      } catch (e) {
        console.error('Erro ao parsear requiredDocuments:', e)
        normalizedRequiredDocuments = []
      }
    }

    res.json({
      service: {
        ...service,
        requiredDocuments: normalizedRequiredDocuments
      }
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * POST /api/services
 * Criar novo serviço (apenas MANAGER ou superior)
 * Suporta Feature Flags opcionais para recursos avançados
 */
router.post('/', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      // Campos básicos (obrigatórios)
      name,
      description,
      departmentId,
      category,
      serviceType, // COM_DADOS | SEM_DADOS
      requiresDocuments,
      requiredDocuments,
      estimatedDays,
      priority,
      icon,
      color,

      // NOVO: Campos para serviços COM_DADOS
      moduleType, // Ex: "MATRICULA_ALUNO", "ATENDIMENTOS_SAUDE"
      formSchema, // JSON Schema do formulário
    } = authReq.body;

    // ========== VALIDAÇÃO BÁSICA ==========
    if (!name || !departmentId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Nome e departamento são obrigatórios'
        });
    }

    // Verificar se departamento existe
    // ✅ Validar departamento global (sem tenantId)
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isActive: true
        }
        });

    if (!department) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Departamento não encontrado'
        });
    }

    // Verificar permissões
    if (authReq.userRole === UserRole.MANAGER && authReq.user?.departmentId !== departmentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Você só pode criar serviços do seu departamento'
        });
    }

    // Validar serviceType
    if (serviceType && !['COM_DADOS', 'SEM_DADOS'].includes(serviceType)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'serviceType deve ser COM_DADOS ou SEM_DADOS'
        });
    }

    // Validar campos obrigatórios para COM_DADOS
    if (serviceType === 'COM_DADOS') {
      if (!moduleType) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'moduleType é obrigatório para serviços COM_DADOS'
        });
      }
      if (!formSchema) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'formSchema é obrigatório para serviços COM_DADOS'
        });
      }
    }

    // ========== VALIDAÇÕES CRÍTICAS DE UNICIDADE ==========

    // VALIDAÇÃO 1: moduleType único em serviços
    if (serviceType === 'COM_DADOS' && moduleType) {
      const existingService = await prisma.serviceSimplified.findFirst({
        where: {
          moduleType,
          isActive: true // Considerar apenas ativos
        },
        select: { id: true, name: true }
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate moduleType',
          message: `O moduleType "${moduleType}" já está em uso pelo serviço "${existingService.name}". Cada moduleType deve ser único. Escolha outro nome ou reutilize o serviço existente.`,
          existingService: {
            id: existingService.id,
            name: existingService.name
          }
        });
      }

      // VALIDAÇÃO 2: moduleType único em workflows
      const existingWorkflow = await prisma.moduleWorkflow.findUnique({
        where: { moduleType },
        select: { id: true, name: true }
      });

      if (existingWorkflow) {
        return res.status(409).json({
          success: false,
          error: 'Workflow already exists',
          message: `Já existe um workflow com moduleType "${moduleType}" (${existingWorkflow.name}). Para usar este moduleType, você precisa reutilizar o serviço existente ou escolher outro nome.`,
          existingWorkflow: {
            id: existingWorkflow.id,
            name: existingWorkflow.name
          }
        });
      }
    }

    // ========== CRIAÇÃO EM TRANSAÇÃO ATÔMICA ==========

    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar serviço
      const service = await tx.serviceSimplified.create({
        data: {
          // Básico
          name,
          description: description || null,
          category: category || null,
          departmentId,
          serviceType: serviceType || 'SEM_DADOS',
          requiresDocuments: requiresDocuments || false,
          requiredDocuments: requiredDocuments || null,
          estimatedDays: estimatedDays || null,
          priority: priority || 3,
          icon: icon || null,
          color: color || null,
          isActive: true,

          // Campos para COM_DADOS
          moduleType: serviceType === 'COM_DADOS' ? moduleType : null,
          formSchema: serviceType === 'COM_DADOS' ? formSchema : null
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // 2. Se COM_DADOS, criar workflow automaticamente
      let workflow = null;
      let workflowCreated = false;

      if (serviceType === 'COM_DADOS' && moduleType) {
        const workflowTemplate = generateDefaultWorkflow({
          moduleType,
          serviceName: name,
          serviceDescription: description,
          estimatedDays,
          departmentName: department.name
        });

        // Criar workflow (já validamos que não existe)
        workflow = await tx.moduleWorkflow.create({
          data: {
            moduleType: workflowTemplate.moduleType,
            name: workflowTemplate.name,
            description: workflowTemplate.description,
            defaultSLA: workflowTemplate.defaultSLA,
            stages: workflowTemplate.stages as any, // JSON field
            rules: workflowTemplate.rules as any // JSON field
          }
        });

        workflowCreated = true;
        console.log(`✅ [AUTO-CREATE] Workflow criado para ${moduleType}`);
      }

      return { service, workflow, workflowCreated };
    });

    // ========== RESPOSTA COM INFORMAÇÕES COMPLETAS ==========

    return res.status(201).json({
      success: true,
      message: result.workflowCreated
        ? `Serviço e workflow criados com sucesso. O workflow foi gerado automaticamente e pode ser editado em /admin/workflows`
        : 'Serviço criado com sucesso',
      service: result.service,
      workflow: result.workflow,
      workflowCreated: result.workflowCreated,
      serviceType: result.service.serviceType,
      hasDataCapture: result.service.serviceType === 'COM_DADOS',
      moduleType: result.service.moduleType
        });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * PUT /api/services/:id
 * Atualizar serviço (apenas MANAGER ou superior)
 */
router.put('/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const {
      // Campos básicos
      name,
      description,
      category,
      requiresDocuments,
      requiredDocuments,
      estimatedDays,
      priority,
      isActive,
      icon,
      color,

      // Campos avançados
      formSchema,
      moduleType,
      enabledFields,
      formFieldsConfig
        } = authReq.body;

    // DEBUG: Log dos campos de configuração recebidos
    console.log('📥 [DEBUG] PUT /api/services/:id - Dados recebidos:', {
      serviceId: id,
      enabledFields: enabledFields || 'null',
      formFieldsConfigLength: formFieldsConfig ? (Array.isArray(formFieldsConfig) ? formFieldsConfig.length : 'not array') : 'null'
    });

    // Verificar se serviço existe
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id
        }
        });

    if (!service) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Serviço não encontrado'
        });
    }

    // Verificar permissões
    if (authReq.userRole === UserRole.MANAGER && authReq.user?.departmentId !== service.departmentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Você só pode editar serviços do seu departamento'
        });
    }

    // ========== VALIDAÇÃO DE UNICIDADE DO moduleType ==========
    // Se está tentando alterar o moduleType, validar unicidade
    if (moduleType !== undefined && moduleType !== service.moduleType) {
      // VALIDAÇÃO 1: moduleType único em serviços
      const existingService = await prisma.serviceSimplified.findFirst({
        where: {
          moduleType,
          isActive: true,
          id: { not: id } // Excluir o próprio serviço
        },
        select: { id: true, name: true }
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate moduleType',
          message: `O moduleType "${moduleType}" já está em uso pelo serviço "${existingService.name}". Cada moduleType deve ser único. Escolha outro nome.`,
          existingService: {
            id: existingService.id,
            name: existingService.name
          }
        });
      }

      // VALIDAÇÃO 2: moduleType único em workflows
      const existingWorkflow = await prisma.moduleWorkflow.findUnique({
        where: { moduleType },
        select: { id: true, name: true }
      });

      if (existingWorkflow) {
        return res.status(409).json({
          success: false,
          error: 'Workflow already exists',
          message: `Já existe um workflow com moduleType "${moduleType}" (${existingWorkflow.name}). Para usar este moduleType, escolha outro nome ou reutilize o workflow existente.`,
          existingWorkflow: {
            id: existingWorkflow.id,
            name: existingWorkflow.name
          }
        });
      }
    }

    const updatedService = await prisma.serviceSimplified.update({
      where: { id },
      data: {
        name: name !== undefined ? name : service.name,
        description: description !== undefined ? description : service.description,
        category: category !== undefined ? category : service.category,
        requiresDocuments: requiresDocuments !== undefined ? requiresDocuments : service.requiresDocuments,
        requiredDocuments: requiredDocuments !== undefined ? requiredDocuments : service.requiredDocuments,
        estimatedDays: estimatedDays !== undefined ? estimatedDays : service.estimatedDays,
        priority: priority !== undefined ? priority : service.priority,
        isActive: isActive !== undefined ? isActive : service.isActive,
        icon: icon !== undefined ? icon : service.icon,
        color: color !== undefined ? color : service.color,

        // Campos avançados
        formSchema: formSchema !== undefined ? formSchema : service.formSchema,
        moduleType: moduleType !== undefined ? moduleType : service.moduleType,

        // Configuração de campos do formulário
        // IMPORTANTE: Aceitar null explicitamente para permitir limpeza
        ...(formFieldsConfig !== undefined && { formFieldsConfig }),
        ...(enabledFields !== undefined && { enabledFields })
        },
      include: {
        department: {
          select: {
            id: true,
            name: true
        }
      }
        }
        });

    // DEBUG: Log dos campos salvos
    console.log('💾 [DEBUG] PUT /api/services/:id - Serviço atualizado:', {
      serviceId: updatedService.id,
      enabledFieldsSaved: updatedService.enabledFields ? 'sim' : 'null',
      formFieldsConfigSaved: updatedService.formFieldsConfig ? 'sim' : 'null'
    });

    return res.json({
      message: 'Serviço atualizado com sucesso',
      service: updatedService
        });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * DELETE /api/services/:id
 * Desativar serviço (soft delete)
 */
router.delete('/:id', adminAuthMiddleware, requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;

    // Verificar se serviço existe
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id
        }
        });

    if (!service) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Serviço não encontrado'
        });
    }

    // Verificar permissões
    if (authReq.userRole === UserRole.MANAGER && authReq.user?.departmentId !== service.departmentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Você só pode desativar serviços do seu departamento'
        });
    }

    // Verificar se há protocolos ativos
    const activeProtocols = await prisma.protocolSimplified.count({
      where: {
        serviceId: id,
        status: {
          in: ['VINCULADO', 'PROGRESSO', 'ATUALIZACAO']
        }
        }
        });

    if (activeProtocols > 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Não é possível desativar o serviço. Existem ${activeProtocols} protocolos ativos.`
        });
    }

    await prisma.serviceSimplified.update({
      where: { id },
      data: { isActive: false }
        });

    return res.json({
      message: 'Serviço desativado com sucesso'
        });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * GET /api/services/department/:departmentId
 * Listar serviços de um departamento específico (público - sem autenticação)
 */
router.get('/department/:departmentId', async (req, res) => {
  try {
    const { departmentId } = req.params;

    const services = await prisma.serviceSimplified.findMany({
      where: {
        departmentId,
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true
        }
      }
        },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }]
        });

    res.json({ data: services, success: true });
  } catch (error) {
    console.error('Get department services error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

export default router;
