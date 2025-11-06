import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import {
  AuthenticatedRequest,
  SuccessResponse,
  ErrorResponse
        } from '../types';

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

      let whereClause: WhereCondition = {
        isActive: true
        };

      // Suporte para filtrar por departmentId OU departmentCode
      if (departmentId) {
        whereClause.departmentId = departmentId;
      } else if (departmentCode) {
        whereClause.department = {
          code: departmentCode as string
        };
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      // Include condicional baseado em flags
      const services = await prisma.serviceSimplified.findMany({
        where: whereClause,
        include: {
          department: {
            select: {
              id: true,
              name: true
        }
      },
          // ========== INCLUDES CONDICIONAIS (só se includeFeatures=true) ==========
          ...(includeFeatures === 'true' && {
            customForm: true,
            locationConfig: true,
            scheduling: true,
            survey: true,
            workflow: true,
            customFields: true,
            documents: true,
            notifications: true
        })
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }]
        });

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
    }

    res.json({ service });
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
      serviceType, // INFORMATIVO | COM_DADOS
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
    if (serviceType && !['INFORMATIVO', 'COM_DADOS'].includes(serviceType)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'serviceType deve ser INFORMATIVO ou COM_DADOS'
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

    // Criar serviço simplificado
    const service = await prisma.serviceSimplified.create({
      data: {
        // Básico
        name,
        description: description || null,
        category: category || null,
        departmentId,
        serviceType: serviceType || 'INFORMATIVO',
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

    return res.status(201).json({
      message: 'Serviço criado com sucesso',
      service,
      serviceType: service.serviceType,
      hasDataCapture: service.serviceType === 'COM_DADOS',
      moduleType: service.moduleType
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
      color
        } = authReq.body;

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
        color: color !== undefined ? color : service.color
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
