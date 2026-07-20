/**
 * ============================================================================
 * PROTOCOLS SIMPLIFIED ROUTES - Sistema Integrado com Módulos
 * ============================================================================
 * Rotas de protocolos simplificados com integração automática aos módulos
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole, ProtocolStatus, PendingType } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { protocolModuleService } from '../services/protocol-module.service';
import { protocolServiceSimplified } from '../services/protocol-simplified.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';
import * as pendingService from '../services/protocol-pending.service';
import {
  buildProtocolStageMetadataFromWorkflowStage,
  getWorkflowByServiceId
} from '../services/service-workflow.service';
import { validateProtocolUniqueness } from '../services/protocol-uniqueness.service';
import { syncCitizenPersonIdentity } from '../services/person-identity.service';
import type { WorkflowStage } from '../types/workflow.types';
import * as protocolAssignmentService from '../services/protocolAssignmentService';
import { runRevertExpiredDelegationsManually } from '../jobs/revertExpiredDelegations.job';
import { normalizeCpf, normalizeEmail, normalizeNullableString } from '../utils/identity';
import {
  assertProtocolAccess,
  canAccessDepartment,
  canAccessProtocol
} from '../services/protocol-access.service';
import { escapeHtml } from '../utils/escape-html';
import { renderPdfFromHtml } from '../utils/render-pdf';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

/**
 * Valida acesso do usuário logado ao protocolo (escopo por role) e já responde
 * 403/404 quando negado. Retorna null quando a resposta já foi enviada.
 */
async function ensureAccess(
  req: Request,
  res: Response,
  protocolId: string
): Promise<Awaited<ReturnType<typeof assertProtocolAccess>> | null> {
  const authReq = req as AuthenticatedRequest;
  try {
    return await assertProtocolAccess(
      {
        id: authReq.userId!,
        role: authReq.user.role,
        departmentId: authReq.user.departmentId
      },
      protocolId
    );
  } catch (error: any) {
    res.status(error?.statusCode || 403).json({
      success: false,
      error: error?.message || 'Você não tem permissão para acessar este protocolo'
    });
    return null;
  }
}

// ========================================
// ⚠️ ROTAS ESPECÍFICAS - DEVEM VIR ANTES DAS ROTAS PARAMETRIZADAS
// ========================================
// IMPORTANTE: Estas rotas devem estar ANTES de qualquer rota com /:id
// para evitar que "workload-stats", "department", etc sejam tratados como IDs

/**
 * GET /api/protocols/workload-stats
 * Obter métricas de carga de trabalho dos servidores
 */
router.get('/workload-stats', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { departmentId, protocolId, stageId } = req.query;

    // Escopo: gestor só enxerga métricas do próprio departamento
    const scopedDepartmentId =
      authReq.user.role === UserRole.ADMIN || authReq.user.role === UserRole.SUPER_ADMIN
        ? (departmentId as string | undefined)
        : authReq.user.departmentId || undefined;

    const stats = await protocolAssignmentService.getWorkloadStats(
      scopedDepartmentId,
      {
        protocolId: protocolId as string | undefined,
        stageId: stageId as string | undefined
      }
    );

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('❌ [WORKLOAD-STATS] Erro ao buscar métricas de carga:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar métricas de carga'
    });
  }
});

/**
 * GET /api/protocols/department/:departmentId
 * Lista protocolos por departamento
 * Escopo: gestor/coordenador apenas do próprio departamento; ADMIN+ qualquer um.
 */
router.get('/department/:departmentId', requireMinRole(UserRole.COORDINATOR), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { departmentId } = req.params;

    if (!canAccessDepartment(
      { id: authReq.userId!, role: authReq.user.role, departmentId: authReq.user.departmentId },
      departmentId
    )) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver protocolos deste departamento'
      });
    }

    // Filtros passam por whitelist dentro do service
    const q = req.query as Record<string, any>;
    const protocols = await protocolServiceSimplified.listByDepartment(
      departmentId,
      {
        status: q.status,
        moduleType: q.moduleType,
        citizenId: q.citizenId,
        assignedUserId: q.assignedUserId,
        createdAt: q.startDate || q.endDate
          ? { gte: q.startDate, lte: q.endDate }
          : undefined
      } as any
    );

    return res.json({
      success: true,
      data: protocols,
      count: protocols.length
    });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
    });
  }
});

/**
 * GET /api/protocols/module/:moduleType/pending
 * Listar protocolos pendentes de um módulo específico
 * ⚠️ DEVE vir ANTES de /module/:departmentId/:moduleType — registrada depois,
 * era sombreada e nunca alcançada (departmentId="<module>", moduleType="pending").
 */
router.get(
  '/module/:moduleType/pending',
  requireMinRole(UserRole.MANAGER),
  async (req, res) => {
    try {
      const { moduleType } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await protocolModuleService.getPendingProtocolsByModule(
        moduleType,
        Number(page),
        Number(limit)
      );

      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Get pending protocols error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar protocolos pendentes'
      });
    }
  }
);

/**
 * GET /api/protocols/module/:departmentId/:moduleType
 * Lista protocolos por módulo
 */
router.get('/module/:departmentId/:moduleType', requireMinRole(UserRole.COORDINATOR), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { departmentId, moduleType } = req.params;

    if (!canAccessDepartment(
      { id: authReq.userId!, role: authReq.user.role, departmentId: authReq.user.departmentId },
      departmentId
    )) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver protocolos deste departamento'
      });
    }

    const protocols = await protocolServiceSimplified.listByModule(
      departmentId,
      moduleType
    );

    return res.json({
      success: true,
      data: protocols,
      count: protocols.length
    });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
    });
  }
});

/**
 * GET /api/protocols/citizen/:citizenId
 * Lista protocolos do cidadão
 * Escopo: ADMIN+ vê todos; gestor/coordenador vê apenas os do seu departamento.
 */
router.get('/citizen/:citizenId', requireMinRole(UserRole.COORDINATOR), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { citizenId } = req.params;

    const isAdmin =
      authReq.user.role === UserRole.ADMIN || authReq.user.role === UserRole.SUPER_ADMIN;

    if (!isAdmin && !authReq.user.departmentId) {
      return res.status(403).json({
        success: false,
        error: 'Usuário sem departamento vinculado'
      });
    }

    const protocols = await protocolServiceSimplified.listByCitizen(citizenId);
    const scoped = isAdmin
      ? protocols
      : protocols.filter((p: any) => p.departmentId === authReq.user.departmentId);

    return res.json({
      success: true,
      data: scoped,
      count: scoped.length
    });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
    });
  }
});

// ========================================
// CRIAR PROTOCOLO (INTEGRADO COM MÓDULOS)
// ========================================

/**
 * POST /api/protocols-simplified
 * Criar novo protocolo (integrado com módulos)
 */
router.post('/', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    const {
      serviceId,
      citizenData,
      formData,
      latitude,
      longitude,
      address,
      attachments
        } = req.body;

    // Validações
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        error: 'serviceId é obrigatório'
        });
    }

    const cleanCpf = normalizeCpf(citizenData?.cpf);

    if (!citizenData || !cleanCpf) {
      return res.status(400).json({
        success: false,
        error: 'Dados do cidadão são obrigatórios (cpf mínimo)'
        });
    }

    // Buscar ou criar cidadão
    let citizen = await prisma.citizen.findFirst({
      where: {
        cpf: cleanCpf
        }
        });

    if (!citizen) {
      citizen = await prisma.$transaction(async (tx) => {
        const createdCitizen = await tx.citizen.create({
          data: {
            cpf: cleanCpf,
            name: normalizeNullableString(citizenData.name) || 'Cidadão',
            email: normalizeEmail(citizenData.email) || `temp_${cleanCpf}@temp.com`,
            phone: normalizeNullableString(citizenData.phone),
            password: 'TEMP_PASSWORD',
            registrationSource: 'ADMIN'
          }
        });

        await syncCitizenPersonIdentity(tx, {
          citizenId: createdCitizen.id,
          currentPersonId: createdCitizen.personId,
          cpf: createdCitizen.cpf,
          name: createdCitizen.name,
          email: createdCitizen.email,
          phone: createdCitizen.phone,
          birthDate: createdCitizen.birthDate,
          rg: createdCitizen.rg,
          isActive: createdCitizen.isActive,
        });

        return createdCitizen;
      });
    }

    // ✅ VALIDAÇÃO DE UNICIDADE: Verificar se cidadão pode criar este protocolo
    console.log('🔍 [ADMIN] Validando unicidade do protocolo...');
    const uniquenessValidation = await validateProtocolUniqueness(
      citizen.id,
      serviceId,
      formData
    );

    if (!uniquenessValidation.canCreate) {
      console.log(`   ❌ Validação falhou: ${uniquenessValidation.reason}`);
      return res.status(400).json({
        success: false,
        error: uniquenessValidation.errorMessage || 'Não é possível criar este protocolo',
        reason: uniquenessValidation.reason,
        existingProtocolNumber: uniquenessValidation.existingProtocolNumber
      });
    }
    console.log('   ✓ Validação de unicidade passou');

    // Criar protocolo com integração de módulo
    const result = await protocolModuleService.createProtocolWithModule({
      citizenId: citizen.id,
      serviceId,
      formData: formData || {},
      createdById: userId,
      latitude,
      longitude,
      address,
      attachments
        });

    return res.status(201).json({
      success: true,
      data: {
        protocol: result.protocol,
        hasModule: result.hasModule,
        moduleType: result.protocol.moduleType || null
        },
      message: result.hasModule
        ? `Protocolo ${result.protocol.number} criado e vinculado ao módulo`
        : `Protocolo ${result.protocol.number} criado (informativo)`
        });
  } catch (error: any) {
    console.error('Create protocol error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar protocolo'
        });
  }
});

// ========================================
// LISTAR CHAMADOS RECEBIDOS (NOVO)
// ========================================

/**
 * GET /api/protocols/incoming-calls
 * Lista chamados criados por ADMIN/MANAGER para os departamentos
 * Apenas MANAGER e ADMIN podem acessar
 */
router.get('/incoming-calls', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;

    const {
      status,
      priority,
      assignedFilter, // 'all' | 'assigned' | 'unassigned'
      page = '1',
      limit = '50'
    } = req.query;

    // Filtro base: chamados criados por gestão (ADMIN/MANAGER) — filtrar pelo
    // role do criador, não por "tem createdById" (USER também preenche o campo)
    const where: any = {
      createdById: { not: null },
      createdBy: { role: { in: [UserRole.ADMIN, UserRole.MANAGER] } }
    };

    // MANAGER vê apenas chamados do seu departamento
    if (user.role === UserRole.MANAGER && user.departmentId) {
      where.departmentId = user.departmentId;
    }
    // ADMIN vê todos os chamados

    // Filtros opcionais
    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = parseInt(priority as string);
    }

    // Filtro de atribuição
    if (assignedFilter === 'assigned') {
      where.assignedUserId = { not: null };
    } else if (assignedFilter === 'unassigned') {
      where.assignedUserId = null;
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          _count: {
            select: {
              history: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // Estatísticas adicionais (em paralelo)
    const [unassigned, assigned] = await Promise.all([
      prisma.protocolSimplified.count({ where: { ...where, assignedUserId: null } }),
      prisma.protocolSimplified.count({ where: { ...where, assignedUserId: { not: null } } })
    ]);
    const stats = { total, unassigned, assigned };

    return res.json({
      success: true,
      protocols,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar chamados recebidos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar chamados recebidos'
    });
  }
});

// ========================================
// LISTAR TODOS OS PROTOCOLOS (NOVO)
// ========================================

/**
 * GET /api/protocols
 * Lista todos os protocolos com filtros
 */
router.get('/', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;

    const {
      status,
      priority,
      search,
      departmentId,
      serviceId,
      serviceIds,  // ✅ NOVO: suporte para múltiplos serviceIds
      assignedUserId,
      include,     // ✅ NOVO: incluir dados adicionais (stages,documents,pendings)
      page = '1',
      limit = '50'
    } = req.query;

    // Montar filtros baseado no role do usuário
    const where: any = {};

    // Filtros opcionais
    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = parseInt(priority as string);
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // ✅ FILTRO POR SERVIÇO (para módulos específicos)
    if (serviceId) {
      where.serviceId = serviceId;
    }

    // ✅ NOVO: Filtro por múltiplos serviços (para view agregada SEM_DADOS)
    if (serviceIds) {
      const ids = (serviceIds as string).split(',').filter(id => id.trim());
      if (ids.length > 0) {
        where.serviceId = { in: ids };
      }
    }

    // Filtro por servidor: considerar os DOIS campos de atribuição
    // (assignedUserId legado + currentAssignedUserId de delegação/encaminhamento)
    const andConditions: any[] = [];
    if (assignedUserId) {
      andConditions.push({
        OR: [
          { assignedUserId: assignedUserId },
          { currentAssignedUserId: assignedUserId }
        ]
      });
    }

    // Busca por número, título ou nome do cidadão
    if (search) {
      andConditions.push({
        OR: [
          { number: { contains: search as string, mode: 'insensitive' } },
          { title: { contains: search as string, mode: 'insensitive' } },
          { citizen: { name: { contains: search as string, mode: 'insensitive' } } },
        ]
      });
    }

    // Restrição de acesso baseado no role
    if (user.role === 'USER') {
      // Usuários comuns veem apenas protocolos atribuídos a eles
      // (inclui protocolos delegados/encaminhados — currentAssignedUserId)
      andConditions.push({
        OR: [
          { assignedUserId: userId },
          { currentAssignedUserId: userId }
        ]
      });
    } else if (user.role === 'MANAGER' || user.role === 'COORDINATOR') {
      // Gestão/coordenação vê protocolos do seu departamento.
      // Sem departamento vinculado → não vê nada (erro de cadastro, não acesso total)
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      } else {
        where.id = '__no_department__';
      }
    }
    // ADMIN vê todos os protocolos

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // ✅ NOVO: Montar includes dinamicamente baseado no parâmetro 'include'
    const includeArray = include ? (include as string).split(',').map(i => i.trim()) : [];
    const includeStages = includeArray.includes('stages');
    const includeDocuments = includeArray.includes('documents');
    const includePendings = includeArray.includes('pendings');

    // Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true
        }
      },
          service: {
            select: {
              id: true,
              name: true,
              category: true
        }
      },
          department: {
            select: {
              id: true,
              name: true,
              code: true
        }
      },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
        }
      },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
        }
      },
          // ✅ INCLUIR HISTÓRICO (para dashboard mostrar cobranças de agilidade)
          history: {
            where: {
              action: 'REQUEST_UPDATE'
            },
            orderBy: {
              timestamp: 'desc'
            },
            take: 1
          },
          // ✅ INCLUIR STAGES SE SOLICITADO
          ...(includeStages && {
            stages: {
              orderBy: {
                stageOrder: 'asc'
              }
            }
          }),
          // ✅ INCLUIR DOCUMENTS SE SOLICITADO
          ...(includeDocuments && {
            documentFiles: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }),
          // ✅ INCLUIR PENDINGS SE SOLICITADO
          ...(includePendings && {
            pendings: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }),
          _count: {
            select: {
              history: true
        }
      }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
        }),
      prisma.protocolSimplified.count({ where }),
    ]);

    return res.json({
      success: true,
      protocols,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
        }
        });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
        });
  }
});

// ========================================
// BUSCAR PROTOCOLO POR ID
// ========================================

/**
 * GET /api/protocols-simplified/:id
 * Buscar protocolo específico por ID
 */
router.get('/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;
    const { id } = req.params;

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            address: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            requiredDocuments: true,
            requiresDocuments: true,
            formSchema: true,
            formFieldsConfig: true,
            enabledFields: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        history: {
          orderBy: { timestamp: 'desc' }
        },
        citizenLinks: {
          include: {
            linkedCitizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
                birthDate: true,
                rg: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Verificar permissões (regra única de escopo por role)
    if (!canAccessProtocol(
      { id: userId!, role: user.role, departmentId: user.departmentId },
      protocol
    )) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver este protocolo'
      });
    }

    return res.json({
      success: true,
      data: protocol
    });
  } catch (error: any) {
    console.error('Erro ao buscar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar protocolo'
    });
  }
});

// ========================================
// APROVAR/REJEITAR PROTOCOLO (NOVO)
// ========================================

/**
 * PUT /api/protocols-simplified/:id/approve
 * Aprovar protocolo (ativa registro no módulo)
 */
router.put('/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { id } = req.params;
    const { comment, additionalData } = req.body;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const protocol = await protocolModuleService.approveProtocol({
      protocolId: id,
      userId,
      actorRole: authReq.user.role,
      comment,
      additionalData
        });

    return res.json({
      success: true,
      data: protocol,
      message: 'Protocolo aprovado com sucesso'
        });
  } catch (error: any) {
    console.error('Approve protocol error:', error);
    const isValidationError =
      error?.name === 'InvalidTransitionError' || error?.name === 'PermissionDeniedError';
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: error.message || 'Erro ao aprovar protocolo'
        });
  }
});

/**
 * PUT /api/protocols-simplified/:id/reject
 * Rejeitar protocolo
 */
router.put('/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Motivo da rejeição é obrigatório'
        });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const protocol = await protocolModuleService.rejectProtocol({
      protocolId: id,
      userId,
      actorRole: authReq.user.role,
      reason
        });

    return res.json({
      success: true,
      data: protocol,
      message: 'Protocolo rejeitado'
        });
  } catch (error: any) {
    console.error('Reject protocol error:', error);
    const isValidationError =
      error?.name === 'InvalidTransitionError' || error?.name === 'PermissionDeniedError';
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: error.message || 'Erro ao rejeitar protocolo'
        });
  }
});

// ========================================
// ATUALIZAR STATUS
// ========================================

/**
 * PATCH /api/protocols-simplified/:id/status
 * Atualiza status do protocolo
 */
router.patch('/:id/status', requireMinRole(UserRole.USER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!status || !Object.values(ProtocolStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
        });
    }

    // Escopo: só quem tem acesso ao protocolo pode mudar status
    const access = await ensureAccess(req, res, id);
    if (!access) return;

    // Usar motor centralizado de status.
    // ⚠️ actorId é SEMPRE o usuário autenticado — nunca aceitar do body
    // (permitia registrar outro usuário como autor no histórico).
    const result = await protocolStatusEngine.updateStatus({
      protocolId: id,
      newStatus: status,
      actorId: authReq.userId!,
      actorRole: authReq.user.role,
      comment,
      metadata: {
        source: 'protocols-simplified-routes'
      }
    });

    return res.json({
      success: true,
      data: result.protocol,
      message: 'Status atualizado com sucesso'
        });
  } catch (error: any) {
    console.error('Erro ao atualizar status:', error);
    const isValidationError =
      error?.name === 'InvalidTransitionError' || error?.name === 'PermissionDeniedError';
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: error.message || 'Erro ao atualizar status'
        });
  }
});

// ========================================
// ADICIONAR COMENTÁRIO
// ========================================

/**
 * POST /api/protocols-simplified/:id/comments
 * Adiciona comentário ao protocolo
 */
// ========================================
// SOLICITAR AGILIDADE (COBRANCA DE ATUALIZACAO)
// ========================================

/**
 * POST /api/protocols/:id/request-update
 * Registra cobranca de agilidade para o protocolo.
 */
router.post('/:id/request-update', requireMinRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const message =
      typeof req.body?.message === 'string' && req.body.message.trim().length > 0
        ? req.body.message.trim()
        : 'Solicitacao de agilidade na resolucao deste protocolo.';

    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        assignedUserId: true,
        departmentId: true,
      },
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado',
      });
    }

    if (protocol.status === 'CONCLUIDO') {
      return res.status(400).json({
        success: false,
        error: 'Nao e possivel solicitar atualizacao de protocolo concluido',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.protocolHistorySimplified.create({
        data: {
          protocolId: id,
          action: 'REQUEST_UPDATE',
          comment: message,
          userId: authReq.userId,
          metadata: {
            requestedByRole: authReq.user?.role || UserRole.ADMIN,
            requestedByName: authReq.user?.name || 'Administrador',
            assignedUserId: protocol.assignedUserId,
            departmentId: protocol.departmentId,
          } as any,
        },
      });

      await tx.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'URGENCY_REQUEST',
          authorType: 'SERVER',
          authorId: authReq.userId,
          authorName: authReq.user?.name || 'Administrador',
          message: `Cobranca de agilidade registrada: ${message}`,
          isInternal: true,
          metadata: {
            action: 'REQUEST_UPDATE',
            protocolNumber: protocol.number,
          } as any,
        },
      });
    });

    return res.json({
      success: true,
      message: 'Solicitacao de atualizacao registrada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao solicitar atualizacao do protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao solicitar atualizacao',
    });
  }
});

router.post('/:id/comments', requireMinRole(UserRole.USER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comentário é obrigatório'
        });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    // Autor é SEMPRE o usuário autenticado (nunca do body)
    await protocolServiceSimplified.addComment(id, comment, authReq.userId);

    return res.json({
      success: true,
      message: 'Comentário adicionado com sucesso'
        });
  } catch (error: any) {
    console.error('Erro ao adicionar comentário:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao adicionar comentário'
        });
  }
});

// ========================================
// ATRIBUIR PROTOCOLO
// ========================================

/**
 * PATCH /api/protocols-simplified/:id/assign
 * ✅ REFATORADO: Integração com Sistema Unificado V2.0
 * Atribui protocolo a um usuário com validações completas
 */
router.patch('/:id/assign', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { assignedUserId, motivo, comment, stageId } = req.body;

    if (!assignedUserId) {
      return res.status(400).json({
        success: false,
        error: 'assignedUserId é obrigatório'
      });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    // ✅ NOVO: Usar serviço de atribuição integrado
    const result = await protocolAssignmentService.assignProtocolToServer({
      protocolId: id,
      assignedUserId,
      assignedById: authReq.userId!,
      assignedByName: authReq.user.name,
      motivo,
      comment,
      stageId
    });

    return res.json({
      success: true,
      data: result.protocol,
      assignment: result.assignment,
      employeeAssignment: result.employeeAssignment,
      message: `Protocolo atribuído com sucesso para ${result.protocol.assignedUser?.name}`
    });
  } catch (error: any) {
    console.error('Erro ao atribuir protocolo:', error);

    // ✅ NOVO: Tratamento de erros específicos (FERIAS, AFASTADO)
    if (error.code && error.code.startsWith('SERVIDOR_')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        suggestedDelegates: error.suggestedDelegates || []
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atribuir protocolo'
    });
  }
});

// ========================================
// ✅ NOVO: DELEGAÇÃO TEMPORÁRIA
// ========================================

/**
 * POST /api/protocols-simplified/:id/delegate
 * Delegar protocolo temporariamente (férias, afastamento)
 */
router.post('/:id/delegate', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { delegadoParaUserId, motivoDelegacao, ativaAte, comentario } = req.body;

    if (!delegadoParaUserId || !motivoDelegacao || !ativaAte) {
      return res.status(400).json({
        success: false,
        error: 'delegadoParaUserId, motivoDelegacao e ativaAte são obrigatórios'
      });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const assignment = await protocolAssignmentService.delegateProtocol({
      protocolId: id,
      delegadoParaUserId,
      delegadoPorUserId: authReq.userId!,
      delegadoPorName: authReq.user.name,
      motivoDelegacao,
      ativaAte: new Date(ativaAte),
      comentario
    });

    return res.json({
      success: true,
      data: assignment,
      message: 'Protocolo delegado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao delegar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao delegar protocolo'
    });
  }
});

// ========================================
// ✅ NOVO: ENCAMINHAMENTO INTERDEPARTAMENTAL
// ========================================

/**
 * POST /api/protocols-simplified/:id/forward
 * Encaminhar protocolo para outro servidor/departamento
 */
router.post('/:id/forward', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const {
      forwardToUserId,
      forwardToDepartmentId,
      tipoEncaminhamento,
      motivo,
      prazoResposta,
      comentario
    } = req.body;

    if (!forwardToUserId || !tipoEncaminhamento || !motivo) {
      return res.status(400).json({
        success: false,
        error: 'forwardToUserId, tipoEncaminhamento e motivo são obrigatórios'
      });
    }

    if (!['ENCAMINHADO', 'CONSULTA'].includes(tipoEncaminhamento)) {
      return res.status(400).json({
        success: false,
        error: 'tipoEncaminhamento deve ser ENCAMINHADO ou CONSULTA'
      });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const assignment = await protocolAssignmentService.forwardProtocol({
      protocolId: id,
      forwardToUserId,
      forwardToDepartmentId,
      forwardedById: authReq.userId!,
      forwardedByName: authReq.user.name,
      tipoEncaminhamento,
      motivo,
      prazoResposta: prazoResposta ? new Date(prazoResposta) : undefined,
      comentario
    });

    return res.json({
      success: true,
      data: assignment,
      message: `Protocolo ${tipoEncaminhamento === 'ENCAMINHADO' ? 'encaminhado' : 'enviado para consulta'} com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao encaminhar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao encaminhar protocolo'
    });
  }
});

// ========================================
// ✅ NOVO: ATRIBUIÇÃO PARA EQUIPE
// ========================================

/**
 * POST /api/protocols-simplified/:id/assign-team
 * Atribuir protocolo para uma equipe completa
 */
router.post('/:id/assign-team', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { teamId, comentario } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'teamId é obrigatório'
      });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const result = await protocolAssignmentService.assignProtocolToTeam({
      protocolId: id,
      teamId,
      assignedById: authReq.userId!,
      assignedByName: authReq.user.name,
      comentario
    });

    return res.json({
      success: true,
      data: result,
      message: `Protocolo atribuído para equipe ${result.team.nome} (${result.assignments.length} membros)`
    });
  } catch (error: any) {
    console.error('Erro ao atribuir protocolo para equipe:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atribuir protocolo para equipe'
    });
  }
});

// ========================================
// ✅ NOVO: HISTÓRICO DE ATRIBUIÇÕES
// ========================================

/**
 * GET /api/protocols-simplified/:id/assignments
 * Listar histórico de atribuições de um protocolo
 */
router.get('/:id/assignments', requireMinRole(UserRole.USER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const result = await protocolAssignmentService.getProtocolAssignments(id);

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico de atribuições:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar histórico de atribuições'
    });
  }
});

// ========================================
// ✅ NOVO: MÉTRICAS DE CARGA DE TRABALHO
// ========================================
// MOVIDO PARA O TOPO DO ARQUIVO (linha ~30) para evitar conflito com /:id

// ========================================
// ✅ NOVO: SUGESTÃO INTELIGENTE DE ATRIBUIÇÃO
// ========================================

/**
 * GET /api/protocols-simplified/:id/suggest-assignee
 * Sugerir melhor servidor para atribuição
 */
router.get('/:id/suggest-assignee', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { departmentId, stageId } = req.query;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const suggestions = await protocolAssignmentService.suggestAssignee(
      id,
      departmentId as string | undefined,
      stageId as string | undefined
    );

    return res.json({
      success: true,
      data: suggestions
    });
  } catch (error: any) {
    console.error('Erro ao sugerir servidores:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao sugerir servidores'
    });
  }
});

// ========================================
// LISTAR PROTOCOLOS
// ========================================
// MOVIDAS PARA O TOPO DO ARQUIVO (linha ~30) para evitar conflito com /:id

// ========================================
// HISTÓRICO
// ========================================

/**
 * GET /api/protocols-simplified/:id/history
 * Obtém histórico completo do protocolo
 */
router.get('/:id/history', requireMinRole(UserRole.USER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const history = await protocolServiceSimplified.getHistory(id);

    return res.json({
      success: true,
      data: history
        });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar histórico'
        });
  }
});

// ========================================
// AVALIAÇÃO
// ========================================
// ⚠️ REMOVIDO: POST /:id/evaluate (rota admin). Avaliação é ATO DO CIDADÃO —
// o caminho legítimo é POST /api/internal/evaluations (bot/portal), que valida
// posse do protocolo e deduplica. Servidores não avaliam protocolos.

// ========================================
// ESTATÍSTICAS
// ========================================

/**
 * GET /api/protocols-simplified/stats/:departmentId
 * Obtém estatísticas de protocolos por departamento
 */
router.get('/stats/:departmentId', requireMinRole(UserRole.COORDINATOR), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!canAccessDepartment(
      { id: authReq.userId!, role: authReq.user.role, departmentId: authReq.user.departmentId },
      departmentId
    )) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver estatísticas deste departamento'
      });
    }

    const stats = await protocolServiceSimplified.getDepartmentStats(
      departmentId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.json({
      success: true,
      data: stats
        });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar estatísticas'
        });
  }
});

// ========================================
// BUSCAR PROTOCOLO POR NÚMERO
// ========================================

/**
 * GET /api/protocols/by-number/:number
 * Busca protocolo por número
 * Rota específica para evitar conflito com /:id
 */
router.get('/by-number/:number', requireMinRole(UserRole.USER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { number } = req.params;

    const protocol = await protocolServiceSimplified.findByNumber(number);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
        });
    }

    // Mesmo escopo por role das demais rotas de leitura
    if (!canAccessProtocol(
      { id: authReq.userId!, role: authReq.user.role, departmentId: authReq.user.departmentId },
      protocol as any
    )) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver este protocolo'
      });
    }

    return res.json({
      success: true,
      data: protocol
        });
  } catch (error: any) {
    console.error('Erro ao buscar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar protocolo'
        });
  }
});

// ========================================
// CONCLUIR PROTOCOLO
// ========================================

/**
 * POST /api/protocols/:id/complete
 * Marca o protocolo como concluído (finalizado)
 */
router.post('/:id/complete', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const { finalNotes, documentUrl } = req.body;
    const authReq = req as AuthenticatedRequest;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    // ✅ Conclusão passa pelo MOTOR de status: validação de transição,
    // histórico, SLA e notificações. (Antes era update direto no Prisma —
    // concluía COM_DADOS em VINCULADO, sem histórico e sem SLA.)
    const result = await protocolStatusEngine.updateStatus({
      protocolId: id,
      newStatus: ProtocolStatus.CONCLUIDO,
      actorId: authReq.userId!,
      actorRole: authReq.user.role,
      comment: finalNotes || undefined,
      metadata: {
        source: 'protocols-simplified-routes:complete',
        documentUrl: documentUrl || null,
        finalNotes: finalNotes || null
      }
    });

    const updatedProtocol = result.protocol;

    // Registrar interação visível ao cidadão
    await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: 'STATUS_CHANGED',
        message: `Protocolo concluído${finalNotes ? ': ' + finalNotes : ''}`,
        authorType: 'SERVER',
        authorId: authReq.userId,
        authorName: authReq.user?.name || 'Sistema',
        isInternal: false,
        metadata: {
          oldStatus: result.previousStatus,
          newStatus: 'CONCLUIDO',
          documentUrl: documentUrl || null,
          finalNotes: finalNotes || null
        }
      }
    });

    // ✅ AUTO-CATEGORIZAÇÃO: Atribuir categorias automaticamente
    if (updatedProtocol.moduleType) {
      try {
        const { assignCategoriesOnProtocolApproval } = await import('../services/auto-categorization.service');
        const result = await assignCategoriesOnProtocolApproval(
          updatedProtocol.citizenId,
          updatedProtocol.id,
          updatedProtocol.moduleType
        );

        if (result.categoriesAssigned > 0) {
          console.log(`✅ ${result.categoriesAssigned} categoria(s) atribuída(s) automaticamente`);
        }
      } catch (error: any) {
        console.error('⚠️ Erro na auto-categorização (não crítico):', error.message);
        // Não falhar a conclusão do protocolo por erro na categorização
      }
    }

    return res.json({
      success: true,
      data: updatedProtocol,
      message: `Protocolo ${updatedProtocol.number} concluído com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao concluir protocolo:', error);
    const isValidationError =
      error?.name === 'InvalidTransitionError' || error?.name === 'PermissionDeniedError';
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: error.message || 'Erro ao concluir protocolo'
    });
  }
});

// ========================================
// REABRIR PROTOCOLO (NOVO)
// ========================================

/**
 * POST /api/protocols/:id/reopen
 * Reabre um protocolo concluído/cancelado
 * mode: 'restart' | 'append'
 */
router.post('/:id/reopen', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.body;
    const authReq = req as AuthenticatedRequest;
    const pendingOptions = req.body?.pendingOptions || {};
    const pendingDocuments = pendingOptions.documents || { selected: [], custom: [] };
    const pendingDataFields = pendingOptions.dataFields || { selected: [], custom: [] };
    const pendingOther = pendingOptions.other || { title: '', description: '' };
    const selectedDocumentTypes = (pendingDocuments.selected || []).map((item: string) => item?.trim()).filter(Boolean);
    const customDocumentItemsRaw = pendingDocuments.custom || [];
    const customDocumentItems = customDocumentItemsRaw
      .map((item: any) => (typeof item === 'string' ? { label: item, kind: 'OUTRO' } : item))
      .map((item: any) => ({
        label: String(item.label || '').trim(),
        kind: String(item.kind || 'OUTRO').trim().toUpperCase() || 'OUTRO'
      }))
      .filter((item: any) => item.label);

    const selectedDataFieldIds = (pendingDataFields.selected || []).map((item: string) => item?.trim()).filter(Boolean);
    const customDataFieldItemsRaw = pendingDataFields.custom || [];
    const customDataFieldItems = customDataFieldItemsRaw
      .map((item: any) => (typeof item === 'string' ? { label: item, fieldType: 'text' } : item))
      .map((item: any) => ({
        label: String(item.label || '').trim(),
        fieldType: String(item.fieldType || 'text').trim().toLowerCase() || 'text'
      }))
      .filter((item: any) => item.label);

    const normalizedDocuments = [...new Set([...selectedDocumentTypes, ...customDocumentItems.map((item: any) => item.label)])];
    const normalizedOtherTitle = (pendingOther.title || '').trim();
    const normalizedOtherDescription = (pendingOther.description || '').trim();

    if (!mode || (mode !== 'restart' && mode !== 'append')) {
      return res.status(400).json({
        success: false,
        error: 'Modo inválido. Use "restart" ou "append".'
      });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    if (mode === 'append' && normalizedDocuments.length === 0 && selectedDataFieldIds.length === 0 && customDataFieldItems.length === 0 && !normalizedOtherDescription) {
      return res.status(400).json({
        success: false,
        error: 'Selecione ao menos uma pendência para reabrir como pendência'
      });
    }

    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { stageOrder: 'asc' } },
        service: true
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    if (protocol.status !== ProtocolStatus.CONCLUIDO && protocol.status !== ProtocolStatus.CANCELADO) {
      return res.status(400).json({
        success: false,
        error: 'Apenas protocolos concluídos ou cancelados podem ser reabertos'
      });
    }

    const workflow = await getWorkflowByServiceId(protocol.serviceId);
    const workflowStages = (workflow?.stages || []) as unknown as WorkflowStage[];
    const sortedWorkflowStages = [...workflowStages].sort((a, b) => a.order - b.order);

    if (mode === 'restart' && (!workflow || !workflow.isActive || sortedWorkflowStages.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Serviço sem workflow ativo configurado para reiniciar'
      });
    }

    const now = new Date();
    const maxStageOrder = protocol.stages.reduce(
      (max, stage) => Math.max(max, stage.stageOrder),
      0
    );

    const reopenStatus = mode === 'append' ? ProtocolStatus.PENDENCIA : ProtocolStatus.PROGRESSO;
    const reopenLabel = mode === 'restart' ? 'workflow reiniciado' : 'pendencia criada';

    // ⚠️ ATÔMICO: encerramento de stages abertas, criação das novas stages,
    // transição de status (engine — que também limpa concludedAt) e o ponteiro
    // currentStageId rodam numa única transação.
    const createdStages: any[] = await prisma.$transaction(async (tx) => {
      if (protocol.stages.some(stage => stage.status === 'IN_PROGRESS')) {
        await tx.protocolStage.updateMany({
          where: {
            protocolId: id,
            status: 'IN_PROGRESS'
          },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            result: 'REOPENED',
            notes: 'Encerrada automaticamente na reabertura'
          }
        });
      }

      let stages: any[] = [];

      if (mode === 'restart') {
        for (const [index, stage] of sortedWorkflowStages.entries()) {
          const isFirstStage = index === 0;
          stages.push(await tx.protocolStage.create({
            data: {
              protocolId: id,
              stageName: stage.name,
              stageOrder: maxStageOrder + stage.order,
              status: isFirstStage ? 'IN_PROGRESS' : 'PENDING',
              startedAt: isFirstStage ? now : undefined,
              dueDate: stage.slaDays
                ? new Date(now.getTime() + stage.slaDays * 24 * 60 * 60 * 1000)
                : undefined,
              metadata: buildProtocolStageMetadataFromWorkflowStage(stage)
            }
          }));
        }
      } else {
        const reopenMetadata = {
          description: 'Reabertura do protocolo (pendência)',
          availableTabs: ['resumo', 'documentos', 'dados', 'pendencias', 'comunicacao'],
          primaryTab: 'pendencias',
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          requiredStageOutputs: [],
          allowedActions: ['REQUEST_INFO', 'CREATE_PENDING', 'APPROVE', 'REJECT'],
          canSkip: false
        };

        const stage = await tx.protocolStage.create({
          data: {
            protocolId: id,
            stageName: 'Reabertura (Pendência)',
            stageOrder: maxStageOrder + 1,
            status: 'IN_PROGRESS',
            startedAt: now,
            metadata: reopenMetadata
          }
        });
        stages = [stage];
      }

      // Transição via engine (registra histórico ÚNICO de reabertura e limpa
      // concludedAt) — dentro da mesma transação
      await protocolStatusEngine.updateStatus(
        {
          protocolId: id,
          newStatus: reopenStatus,
          actorId: authReq.userId,
          actorRole: authReq.user.role,
          comment: `Protocolo reaberto (${reopenLabel})`,
          metadata: {
            action: 'reopen',
            mode,
            previousStatus: protocol.status,
            previousConcludedAt: protocol.concludedAt
          }
        },
        tx
      );

      await tx.protocolSimplified.update({
        where: { id },
        data: {
          currentStageId: stages[0]?.id
        }
      });

      return stages;
    }, { timeout: 15000 });

    if (mode === 'append') {
      const dataFields = selectedDataFieldIds.length > 0
        ? await prisma.protocolDataField.findMany({
            where: { id: { in: selectedDataFieldIds } },
            select: { id: true, fieldKey: true, fieldLabel: true }
          })
        : [];

      const customDocumentLabelSet = new Set(
        customDocumentItems.map((item: { label: string }) => item.label.toLowerCase())
      );

      for (const documentType of selectedDocumentTypes) {
        if (customDocumentLabelSet.has(documentType.toLowerCase())) {
          continue;
        }
        await pendingService.createPending({
          protocolId: id,
          type: PendingType.DOCUMENT,
          title: `Documento pendente: ${documentType}`,
          description: `Envie ou atualize o documento "${documentType}".`,
          blocksProgress: true,
          metadata: { source: 'reopen', documentType },
          createdBy: authReq.userId
        });
      }

      for (const item of customDocumentItems) {
        await pendingService.createPending({
          protocolId: id,
          type: PendingType.DOCUMENT,
          title: `Documento pendente: ${item.label}`,
          description: `Envie ou atualize o documento "${item.label}".`,
          blocksProgress: true,
          metadata: {
            source: 'reopen',
            documentType: item.label,
            documentKind: item.kind,
            custom: true
          },
          createdBy: authReq.userId
        });
      }

      for (const field of dataFields) {
        await pendingService.createPending({
          protocolId: id,
          type: PendingType.INFORMATION,
          title: `Dados pendentes: ${field.fieldLabel}`,
          description: `Informe ou atualize o dado "${field.fieldLabel}".`,
          blocksProgress: true,
          metadata: { source: 'reopen', fieldId: field.id, fieldKey: field.fieldKey, fieldLabel: field.fieldLabel },
          createdBy: authReq.userId
        });
      }

      for (const item of customDataFieldItems) {
        await pendingService.createPending({
          protocolId: id,
          type: PendingType.INFORMATION,
          title: `Dados pendentes: ${item.label}`,
          description: `Informe ou atualize o dado "${item.label}".`,
          blocksProgress: true,
          metadata: {
            source: 'reopen',
            customFieldLabel: item.label,
            fieldType: item.fieldType
          },
          createdBy: authReq.userId
        });
      }

      if (normalizedOtherDescription) {
        await pendingService.createPending({
          protocolId: id,
          type: PendingType.INFORMATION,
          title: normalizedOtherTitle || 'Pendência adicional',
          description: normalizedOtherDescription,
          blocksProgress: true,
          metadata: { source: 'reopen' },
          createdBy: authReq.userId
        });
      }
    }


    // Status, concludedAt e currentStageId já foram atualizados na transação
    const updatedProtocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        citizen: true,
        service: true
      }
    });

    if (mode === 'restart' && createdStages[0]?.id) {
      try {
        await protocolAssignmentService.autoAssignProtocolToStageResponsible({
          protocolId: id,
          stageId: createdStages[0].id,
          assignedById: authReq.userId,
          assignedByName: authReq.user.name,
          notifyCitizen: false
        });
      } catch (error) {
        console.warn('[protocols-simplified] Falha ao reaplicar atribuição automática na reabertura', {
          protocolId: id,
          stageId: createdStages[0].id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Histórico de reabertura já é registrado pelo engine (entrada única,
    // com previousStatus/previousConcludedAt no metadata).

    await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: 'STATUS_CHANGED',
        authorType: 'SERVER',
        authorId: authReq.userId,
        authorName: authReq.user?.name || 'Servidor',
        message: `Protocolo reaberto (${reopenLabel}).`,
        isInternal: false,
        metadata: {
          mode,
          action: 'reopen'
        }
      }
    });

    return res.json({
      success: true,
      data: {
        protocol: updatedProtocol,
        stagesCreated: createdStages.length
      },
      message: 'Protocolo reaberto com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao reabrir protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao reabrir protocolo'
    });
  }
});

/**
 * POST /api/protocols/:id/realign-workflow
 * Re-alinha um protocolo existente com o workflow atualizado do serviço, de forma
 * NÃO-DESTRUTIVA: reescreve a metadata das etapas (documentos exigidos, campos,
 * abas, ações) a partir do ServiceWorkflow atual — que já traz os documentos
 * reconciliados com a fonte única (serviço) — e reconcilia os ProtocolDocument.
 *
 * Resolve protocolos criados antes da correção de alinhamento, que ficavam presos
 * exigindo documentos que não existiam no formulário do serviço (não-aprováveis).
 */
router.post('/:id/realign-workflow', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const { realignProtocolWorkflow } = await import('../services/service-workflow.service');
    const result = await realignProtocolWorkflow(id);

    if (result.skipped === 'no_workflow') {
      return res.status(400).json({
        success: false,
        error: 'O serviço deste protocolo não possui workflow configurado.'
      });
    }

    if (result.skipped === 'no_stages') {
      return res.status(400).json({
        success: false,
        error: 'Este protocolo não possui etapas para re-alinhar.'
      });
    }

    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: id,
        action: 'FLUXO_REALINHADO',
        comment: `Fluxo re-alinhado com o serviço: ${result.stagesUpdated} etapa(s) atualizada(s)` +
          (result.stagesUnmatched > 0 ? `, ${result.stagesUnmatched} sem correspondência` : ''),
        userId: authReq.userId!
      }
    });

    return res.json({
      success: true,
      message: 'Fluxo re-alinhado com sucesso. As exigências de documentos foram atualizadas conforme o serviço.',
      data: result
    });
  } catch (error) {
    console.error('Erro ao re-alinhar fluxo do protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao re-alinhar fluxo do protocolo'
    });
  }
});

// ========================================
// RELATÓRIO COMPLETO DO PROTOCOLO
// ========================================

/**
 * GET /api/protocols/:id/report
 * Gerar relatório completo do protocolo (PDF ou JSON)
 */
router.get('/:id/report', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format as string || 'pdf';

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    // Buscar todos os dados do protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            address: true
          }
        },
        service: {
          include: {
            department: true
          }
        },
        department: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        history: {
          orderBy: { timestamp: 'asc' }
        },
        interactions: {
          orderBy: { createdAt: 'asc' }
        },
        documentFiles: {
          orderBy: { createdAt: 'asc' }
        },
        dataFields: {
          orderBy: { createdAt: 'asc' }
        },
        pendings: {
          orderBy: { createdAt: 'asc' }
        },
        stages: {
          orderBy: { stageOrder: 'asc' }
        },
        sla: true,
        citizenLinks: {
          include: {
            linkedCitizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true
              }
            }
          }
        },
        generatedDocuments: {
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Calcular estatísticas
    const stats = {
      totalDays: protocol.concludedAt || protocol.updatedAt
        ? Math.ceil(
            (new Date(protocol.concludedAt || protocol.updatedAt).getTime() -
              new Date(protocol.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
      completedStages: protocol.stages.filter(s => s.status === 'COMPLETED').length,
      totalStages: protocol.stages.length,
      approvedDocs: protocol.documentFiles.filter(d => d.status === 'APPROVED').length,
      rejectedDocs: protocol.documentFiles.filter(d => d.status === 'REJECTED').length,
      totalDocs: protocol.documentFiles.length,
      generatedDocs: protocol.generatedDocuments.length,
      totalInteractions: protocol.interactions.length,
      citizenMessages: protocol.interactions.filter(i => i.authorType === 'CITIZEN').length,
      pendingsResolved: protocol.pendings.filter(p => p.status === 'RESOLVED').length,
      totalPendings: protocol.pendings.length
    };

    // Montar relatório completo
    const report = {
      protocol: {
        id: protocol.id,
        number: protocol.number,
        title: protocol.title,
        description: protocol.description,
        status: protocol.status,
        priority: protocol.priority,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
        concludedAt: protocol.concludedAt,
        dueDate: protocol.dueDate
      },
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      assignedUser: protocol.assignedUser,
      createdBy: protocol.createdBy,
      statistics: stats,
      timeline: {
        history: protocol.history,
        interactions: protocol.interactions,
        stages: protocol.stages,
        pendings: protocol.pendings
      },
      documents: {
        received: protocol.documentFiles,
        generated: protocol.generatedDocuments
      },
      dataFields: protocol.dataFields,
      sla: protocol.sla,
      citizenLinks: protocol.citizenLinks,
      generatedAt: new Date()
    };

    // Se formato for JSON, retornar como JSON
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="protocolo_${protocol.number}_relatorio.json"`);
      return res.json(report);
    }

    // Se formato for PDF, gerar com Playwright (util com fila + rede bloqueada)
    if (format === 'pdf') {
      // ⚠️ TODO conteúdo dinâmico é escapado — mensagens/títulos digitados por
      // usuários não podem virar HTML executável no Chromium do servidor.
      const e = escapeHtml;
      const concludedLabel = protocol.status === 'CANCELADO' ? 'Data de Encerramento' : 'Data de Conclusão';

      // Gerar HTML do relatório
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #2563eb; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .status-concluido { background: #d1fae5; color: #065f46; }
            .status-cancelado { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Relatório Completo do Protocolo</h1>

          <div class="header">
            <h2 style="margin-top: 0;">Protocolo #${e(protocol.number)}</h2>
            <p><strong>Título:</strong> ${e(protocol.title) || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status status-${e(protocol.status.toLowerCase())}">${e(protocol.status)}</span></p>
            <p><strong>Data de Criação:</strong> ${new Date(protocol.createdAt).toLocaleString('pt-BR')}</p>
            ${protocol.concludedAt ? `<p><strong>${concludedLabel}:</strong> ${new Date(protocol.concludedAt).toLocaleString('pt-BR')}</p>` : ''}
          </div>

          <h2>Estatísticas</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${stats.totalDays}</div>
              <div class="stat-label">Dias Totais</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.completedStages}/${stats.totalStages}</div>
              <div class="stat-label">Etapas Concluídas</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.approvedDocs}</div>
              <div class="stat-label">Docs Aprovados</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.generatedDocs}</div>
              <div class="stat-label">Docs Gerados</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.totalInteractions}</div>
              <div class="stat-label">Interações</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.pendingsResolved}/${stats.totalPendings}</div>
              <div class="stat-label">Pendências Resolvidas</div>
            </div>
          </div>

          <h2>Informações do Cidadão</h2>
          <table>
            <tr><td><strong>Nome:</strong></td><td>${e(protocol.citizen?.name) || 'N/A'}</td></tr>
            <tr><td><strong>CPF:</strong></td><td>${e(protocol.citizen?.cpf) || 'N/A'}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${e(protocol.citizen?.email) || 'N/A'}</td></tr>
            <tr><td><strong>Telefone:</strong></td><td>${e(protocol.citizen?.phone) || 'N/A'}</td></tr>
          </table>

          <h2>Serviço Solicitado</h2>
          <table>
            <tr><td><strong>Serviço:</strong></td><td>${e(protocol.service?.name) || 'N/A'}</td></tr>
            <tr><td><strong>Departamento:</strong></td><td>${e(protocol.service?.department?.name || protocol.department?.name) || 'N/A'}</td></tr>
          </table>

          ${protocol.documentFiles.length > 0 ? `
          <h2>Documentos Recebidos (${protocol.documentFiles.length})</h2>
          <table>
            <thead><tr><th>Documento</th><th>Status</th><th>Data de Envio</th></tr></thead>
            <tbody>
            ${protocol.documentFiles.map(doc => `
              <tr>
                <td>${e(doc.documentType)}</td>
                <td>${e(doc.status)}</td>
                <td>${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('pt-BR') : 'N/A'}</td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          ` : ''}

          ${protocol.stages.length > 0 ? `
          <h2>Etapas do Processo (${protocol.stages.length})</h2>
          <table>
            <thead><tr><th>Etapa</th><th>Status</th><th>Início</th><th>Conclusão</th></tr></thead>
            <tbody>
            ${protocol.stages.map(stage => `
              <tr>
                <td>${e(stage.stageName)}</td>
                <td>${e(stage.status)}</td>
                <td>${stage.startedAt ? new Date(stage.startedAt).toLocaleString('pt-BR') : 'N/A'}</td>
                <td>${stage.completedAt ? new Date(stage.completedAt).toLocaleString('pt-BR') : '-'}</td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          ` : ''}

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Sistema DigiUrban - Gestão de Protocolos</p>
          </div>
        </body>
        </html>
      `;

      const pdfBuffer = await renderPdfFromHtml(html);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="protocolo_${protocol.number}_relatorio.pdf"`);
      return res.send(pdfBuffer);
    }

    return res.status(400).json({
      success: false,
      error: 'Formato não suportado. Use format=pdf ou format=json'
    });

  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar relatório'
    });
  }
});

/**
 * GET /api/protocols/:id/timeline/export
 * Exportar timeline do protocolo em PDF
 */
router.get('/:id/timeline/export', requireMinRole(UserRole.USER), async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    // Buscar protocolo completo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' }
        },
        documentFiles: {
          orderBy: { uploadedAt: 'desc' }
        },
        pendings: {
          orderBy: { createdAt: 'desc' }
        },
        interactions: {
          orderBy: { createdAt: 'desc' }
        },
        history: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Montar eventos da timeline
    const timelineEvents = [];

    // Evento de criação do protocolo
    timelineEvents.push({
      type: 'protocol',
      timestamp: protocol.createdAt,
      title: 'Protocolo Criado',
      description: `Protocolo ${protocol.number} foi criado`,
      status: 'created'
    });

    // Eventos de etapas
    protocol.stages.forEach(stage => {
      if (stage.startedAt) {
        timelineEvents.push({
          type: 'stage',
          timestamp: stage.startedAt,
          title: `Etapa Iniciada: ${stage.stageName}`,
          description: stage.notes || '',
          status: 'started'
        });
      }
      if (stage.completedAt) {
        timelineEvents.push({
          type: 'stage',
          timestamp: stage.completedAt,
          title: `Etapa Concluída: ${stage.stageName}`,
          description: stage.notes || '',
          status: 'completed'
        });
      }
    });

    // Eventos de documentos
    protocol.documentFiles.forEach(doc => {
      timelineEvents.push({
        type: 'document',
        timestamp: doc.uploadedAt,
        title: `Documento Enviado: ${doc.documentType}`,
        description: doc.fileName,
        status: doc.status
      });
      if (doc.validatedAt) {
        timelineEvents.push({
          type: 'document',
          timestamp: doc.validatedAt,
          title: `Documento ${doc.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}: ${doc.documentType}`,
          description: doc.rejectionReason || '',
          status: doc.status
        });
      }
    });

    // Eventos de pendências
    protocol.pendings.forEach(pending => {
      timelineEvents.push({
        type: 'pending',
        timestamp: pending.createdAt,
        title: `Pendência Criada`,
        description: pending.description,
        status: 'created'
      });
      if (pending.resolvedAt) {
        timelineEvents.push({
          type: 'pending',
          timestamp: pending.resolvedAt,
          title: `Pendência Resolvida`,
          description: pending.resolution || pending.description,
          status: pending.status
        });
      }
    });

    // Eventos de interações
    protocol.interactions.forEach(interaction => {
      timelineEvents.push({
        type: 'interaction',
        timestamp: interaction.createdAt,
        title: `${interaction.authorType === 'CITIZEN' ? 'Mensagem do Cidadão' : 'Mensagem da Equipe'}`,
        description: interaction.message || '',
        status: interaction.type
      });
    });

    // Ordenar eventos por data
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Gerar PDF (util com fila + rede bloqueada). Todo conteúdo dinâmico
    // (títulos, mensagens de cidadão, notas) é escapado.
    const e = escapeHtml;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; font-size: 18px; }
          .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .timeline { position: relative; padding-left: 40px; }
          .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e5e7eb; }
          .timeline-item { position: relative; margin-bottom: 25px; }
          .timeline-dot { position: absolute; left: -32px; width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; border: 3px solid white; box-shadow: 0 0 0 2px #3b82f6; }
          .timeline-dot.created { background: #10b981; box-shadow: 0 0 0 2px #10b981; }
          .timeline-dot.completed { background: #10b981; box-shadow: 0 0 0 2px #10b981; }
          .timeline-dot.rejected { background: #ef4444; box-shadow: 0 0 0 2px #ef4444; }
          .timeline-dot.pending { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
          .timeline-content { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 3px solid #3b82f6; }
          .timeline-title { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
          .timeline-time { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
          .timeline-description { font-size: 13px; color: #4b5563; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-top: 5px; }
          .status-created { background: #d1fae5; color: #065f46; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-approved { background: #d1fae5; color: #065f46; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .summary-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .summary-label { font-size: 11px; color: #6b7280; margin-top: 5px; }
        </style>
      </head>
      <body>
        <h1>Timeline do Protocolo ${e(protocol.number)}</h1>

        <div class="header">
          <p><strong>Protocolo:</strong> ${e(protocol.number)}</p>
          <p><strong>Status Atual:</strong> ${e(protocol.status)}</p>
          <p><strong>Criado em:</strong> ${new Date(protocol.createdAt).toLocaleString('pt-BR')}</p>
        </div>

        <h2>Resumo de Eventos</h2>
        <div class="summary">
          <div class="summary-box">
            <div class="summary-value">${timelineEvents.length}</div>
            <div class="summary-label">Total de Eventos</div>
          </div>
          <div class="summary-box">
            <div class="summary-value">${protocol.stages.length}</div>
            <div class="summary-label">Etapas</div>
          </div>
          <div class="summary-box">
            <div class="summary-value">${protocol.documentFiles.length}</div>
            <div class="summary-label">Documentos</div>
          </div>
        </div>

        <h2>Linha do Tempo Completa (${timelineEvents.length} eventos)</h2>
        <div class="timeline">
          ${timelineEvents.map(event => `
            <div class="timeline-item">
              <div class="timeline-dot ${e(event.status.toLowerCase())}"></div>
              <div class="timeline-content">
                <div class="timeline-title">${e(event.title)}</div>
                <div class="timeline-time">${new Date(event.timestamp).toLocaleString('pt-BR')}</div>
                ${event.description ? `<div class="timeline-description">${e(event.description)}</div>` : ''}
                <span class="status-badge status-${e(event.status.toLowerCase())}">${e(event.type.toUpperCase())}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>Relatório de Timeline gerado em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Sistema DigiUrban</p>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await renderPdfFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="timeline_protocolo_${protocol.number}_${Date.now()}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Erro ao exportar timeline:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao exportar timeline'
    });
  }
});

// ========================================
// ENVIAR INFORMAÇÕES DE PAGAMENTO
// ========================================

/**
 * POST /api/protocols/:id/send-payment-info
 * Enviar guia de pagamento e/ou chave PIX para o cidadão
 */
router.post('/:id/send-payment-info', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
      paymentFileUrl,
      pixKey,
      pixQRCode
    } = req.body;

    // Validações
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Email do destinatário é obrigatório'
      });
    }

    if (!paymentFileUrl && !pixKey && !pixQRCode) {
      return res.status(400).json({
        success: false,
        error: 'É necessário fornecer ao menos uma forma de pagamento (guia, chave PIX ou QR Code)'
      });
    }

    const access = await ensureAccess(req, res, id);
    if (!access) return;

    const authReq = req as AuthenticatedRequest;

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        citizen: true,
        service: true
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Montar mensagem de pagamento para o cidadão
    let paymentMessage = message ? `${message}\n\n` : '';
    if (paymentFileUrl) {
      paymentMessage += `📄 Guia de Pagamento: ${paymentFileUrl}\n`;
    }
    if (pixKey) {
      paymentMessage += `💳 Chave PIX: ${pixKey}\n`;
    }
    if (pixQRCode) {
      paymentMessage += `📱 QR Code PIX (copie e cole no app do banco):\n${pixQRCode}\n`;
    }

    // ✅ Canal REAL de entrega: interação do protocolo visível ao cidadão
    // (portal + bot). E-mail permanece pendente de integração — a resposta
    // não pode alegar envio de e-mail que não acontece.
    await prisma.$transaction([
      prisma.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'MESSAGE',
          authorType: 'SERVER',
          authorId: authReq.userId,
          authorName: authReq.user?.name || 'Servidor',
          message: `Informações de pagamento:\n\n${paymentMessage}`,
          isInternal: false,
          isRead: false,
          metadata: {
            kind: 'PAYMENT_INFO',
            subject: subject || null,
            hasPaymentFile: !!paymentFileUrl,
            hasPixKey: !!pixKey,
            hasQRCode: !!pixQRCode
          } as any
        }
      }),
      prisma.protocolHistorySimplified.create({
        data: {
          protocolId: id,
          action: 'PAYMENT_INFO_SENT',
          comment: `Informações de pagamento registradas no protocolo (destinatário informado: ${recipientEmail})`,
          userId: authReq.userId,
          metadata: {
            recipientEmail,
            paymentFileUrl,
            pixKey: pixKey ? '***' : undefined, // Não armazenar chave completa
            hasQRCode: !!pixQRCode
          } as any
        }
      })
    ]);

    return res.json({
      success: true,
      message: 'Informações de pagamento registradas no protocolo e enviadas ao cidadão pela central de mensagens',
      data: {
        recipientEmail,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao enviar informações de pagamento:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao enviar informações de pagamento'
    });
  }
});

// ========================================
// ✅ NOVO: JOB MANUAL - REVERTER DELEGAÇÕES
// ========================================

/**
 * POST /api/protocols-simplified/jobs/revert-delegations
 * Executar job de reversão de delegações manualmente (apenas ADMIN)
 */
router.post('/jobs/revert-delegations', requireMinRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const result = await runRevertExpiredDelegationsManually();

    return res.json({
      success: true,
      data: result,
      message: `Job executado com sucesso. ${result.processedCount} delegações processadas.`
    });
  } catch (error: any) {
    console.error('Erro ao executar job:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao executar job'
    });
  }
});

/**
 * GET /api/protocols/secretaria/:departmentId
 * Módulo Protocolos geral da secretaria (reforma de módulos por secretaria).
 * - scope=mine (default): só os protocolos atribuídos ao servidor logado
 *   (assignedUserId OU currentAssignedUserId).
 * - scope=department: todos os protocolos da secretaria (respeita role —
 *   USER só enxerga os seus mesmo pedindo department).
 * Query: ?scope=mine|department&status=&search=&page=&limit=
 */
router.get('/secretaria/:departmentId', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;
    const { departmentId } = req.params;
    const {
      scope = 'mine',
      status,
      search,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const where: any = { departmentId };

    // Escopo: meus vs secretaria. USER nunca vê além dos seus (mesmo em department).
    // Gestor/coordenador só enxerga a PRÓPRIA secretaria em scope=department.
    const wantDepartment = scope === 'department';
    const isAdminRole = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const canSeeDepartment =
      user.role !== 'USER' && (isAdminRole || user.departmentId === departmentId);
    if (!wantDepartment || !canSeeDepartment) {
      where.OR = [{ assignedUserId: userId }, { currentAssignedUserId: userId }];
    }

    if (status && status !== 'all') where.status = status;

    if (search) {
      const s = { contains: search, mode: 'insensitive' as const };
      const searchOr = [
        { number: s },
        { title: s },
        { citizen: { name: s } },
      ];
      // Combina com o filtro de escopo (AND) sem sobrescrever o OR de atribuição.
      where.AND = [{ OR: searchOr }];
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          citizen: { select: { id: true, name: true, cpf: true } },
          service: { select: { id: true, name: true, serviceType: true } },
          department: { select: { id: true, name: true } },
          assignedUser: { select: { id: true, name: true } },
          currentAssignedUser: { select: { id: true, name: true } },
          sla: { select: { isOverdue: true, daysOverdue: true, expectedEndDate: true } },
          _count: { select: { history: true } },
        },
      }),
      prisma.protocolSimplified.count({ where }),
    ]);

    return res.json({
      scope: wantDepartment && canSeeDepartment ? 'department' : 'mine',
      data: data.map((p) => ({
        id: p.id,
        number: p.number,
        title: p.title,
        description: p.description,
        status: p.status,
        priority: p.priority,
        createdAt: p.createdAt,
        dueDate: p.dueDate,
        citizen: p.citizen,
        service: p.service,
        department: p.department,
        assignedUser: p.currentAssignedUser || p.assignedUser,
        hasData: p.service?.serviceType === 'COM_DADOS',
        sla: p.sla,
        _count: { history: p._count?.history ?? 0 },
      })),
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[protocols/secretaria] erro:', error);
    return res.status(500).json({ error: 'Erro ao listar protocolos da secretaria' });
  }
});

export default router;

