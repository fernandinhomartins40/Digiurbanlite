// ============================================================================
// SECRETARIAS-SERVICOS-PUBLICOS.TS - Rotas da Secretaria de Serviços Públicos
// ============================================================================
// VERSÃO SIMPLIFICADA - Usa 100% do sistema novo (ProtocolSimplified + MODULE_MAPPING)

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import {
  adminAuthMiddleware,
  requireMinRole
        } from '../middleware/admin-auth';
import { UserRole, ProtocolStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { MODULE_BY_DEPARTMENT } from '../config/module-mapping';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/secretarias/servicos-publicos/stats
 * Obter estatísticas consolidadas da Secretaria de Serviços Públicos
 * VERSÃO SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de serviços públicos
      const servicosPublicosDept = await prisma.department.findFirst({
        where: { code: 'SERVICOS_PUBLICOS' }
        });

      if (!servicosPublicosDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Serviços Públicos não encontrado'
        });
      }

      // Módulos de serviços públicos do MODULE_MAPPING
      const servicosPublicosModules = MODULE_BY_DEPARTMENT.SERVICOS_PUBLICOS || [];

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        publicServiceAttendanceCount,
        streetLightingCount,
        urbanCleaningCount,
        specialCollectionCount,
        weedingRequestCount,
        drainageRequestCount,
        treePruningRequestCount,
        serviceTeamCount,
        cleaningScheduleCount,
        teamScheduleCount,
        publicServiceRequestCount,
      ] = await Promise.all([
        // 1. Estatísticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: servicosPublicosDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por módulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: servicosPublicosDept.id,
            moduleType: { in: servicosPublicosModules }
        },
          _count: { id: true }
        }),

        // 3. Atendimentos Gerais (novo)
        prisma.publicServiceAttendance.aggregate({
                    _count: { id: true }
        }),

        // 4. Iluminação Pública
        prisma.streetLighting.aggregate({
                    _count: { id: true }
        }),

        // 5. Limpeza Urbana (novo)
        prisma.urbanCleaning.aggregate({
                    _count: { id: true }
        }),

        // 6. Coleta Especial
        prisma.specialCollection.aggregate({
                    _count: { id: true }
        }),

        // 7. Solicitações de Capina
        prisma.weedingRequest.aggregate({
                    _count: { id: true }
        }),

        // 8. Desobstruções
        prisma.drainageRequest.aggregate({
                    _count: { id: true }
        }),

        // 9. Podas de Árvore
        prisma.treePruningRequest.aggregate({
                    _count: { id: true }
        }),

        // 10. Gestão de Equipes (novo)
        prisma.serviceTeam.aggregate({
                    _count: { id: true }
        }),

        // 11. Cronogramas de Limpeza (legado)
        prisma.cleaningSchedule.aggregate({
                    _count: { id: true }
        }),

        // 12. Team Schedule (legado)
        prisma.teamSchedule.aggregate({
                    _count: { id: true }
        }),

        // 13. Public Service Request (legado)
        prisma.publicServiceRequest.aggregate({
                    _count: { id: true }
        }),
      ]);

      // Processar estatísticas de Protocolos
      const protocolData = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
        };

      protocolStats.forEach((item) => {
        const count = item._count?.id || 0;
        protocolData.total += count;

        if (item.status === ProtocolStatus.VINCULADO || item.status === ProtocolStatus.PENDENCIA) {
          protocolData.pending += count;
        } else if (item.status === ProtocolStatus.PROGRESSO) {
          protocolData.inProgress += count;
        } else if (item.status === ProtocolStatus.CONCLUIDO) {
          protocolData.completed += count;
        }
      });

      // Processar estatísticas por módulo
      const moduleStats: Record<string, any> = {};

      protocolsByModule.forEach((item) => {
        if (!item.moduleType) return;

        if (!moduleStats[item.moduleType]) {
          moduleStats[item.moduleType] = {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0
        };
        }

        const count = item._count?.id || 0;
        moduleStats[item.moduleType].total += count;

        if (item.status === ProtocolStatus.VINCULADO || item.status === ProtocolStatus.PENDENCIA) {
          moduleStats[item.moduleType].pending += count;
        } else if (item.status === ProtocolStatus.PROGRESSO) {
          moduleStats[item.moduleType].inProgress += count;
        } else if (item.status === ProtocolStatus.CONCLUIDO) {
          moduleStats[item.moduleType].completed += count;
        }
      });

      // Montar resposta consolidada
      const stats = {
        publicServiceAttendances: {
          total: publicServiceAttendanceCount._count?.id || 0
        },
        streetLighting: {
          total: streetLightingCount._count?.id || 0
        },
        urbanCleanings: {
          total: urbanCleaningCount._count?.id || 0
        },
        specialCollections: {
          total: specialCollectionCount._count?.id || 0
        },
        weedingRequests: {
          total: weedingRequestCount._count?.id || 0
        },
        drainageRequests: {
          total: drainageRequestCount._count?.id || 0
        },
        treePruningRequests: {
          total: treePruningRequestCount._count?.id || 0
        },
        serviceTeams: {
          total: serviceTeamCount._count?.id || 0
        },
        // Legado
        publicServiceRequests: {
          total: publicServiceRequestCount._count?.id || 0
        },
        cleaningSchedules: {
          total: cleaningScheduleCount._count?.id || 0
        },
        teamSchedules: {
          total: teamScheduleCount._count?.id || 0
        },
        protocols: protocolData,
        moduleStats, // Estatísticas detalhadas por módulo
      };

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Servicos Publicos stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar estatísticas de serviços públicos'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/services
 * Listar serviços da Secretaria de Serviços Públicos
 */
router.get(
  '/services',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de serviços públicos
      const servicosPublicosDept = await prisma.department.findFirst({
        where: { code: 'SERVICOS_PUBLICOS' }
        });

      if (!servicosPublicosDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Serviços Públicos não encontrado'
        });
      }

      // Buscar serviços simplificados
      const services = await prisma.serviceSimplified.findMany({
        where: {
                    departmentId: servicosPublicosDept.id,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
        });

      return res.json({
        success: true,
        data: services
        });
    } catch (error) {
      console.error('Get servicos publicos services error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar serviços'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/citizens
 * Listar cidadãos do tenant
 */
router.get(
  '/citizens',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { cpf: { contains: search as string } },
          { email: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.citizen.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            createdAt: true
        }
      }),
        prisma.citizen.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get citizens error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - PublicServiceRequest
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/PublicServiceRequest
 * Listar atendimentos gerais
 */
router.get(
  '/PublicServiceRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { requestType: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.publicServiceRequest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.publicServiceRequest.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get public service requests error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/PublicServiceRequest
 * Criar atendimento geral
 */
router.post(
  '/PublicServiceRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const publicServiceRequest = await prisma.publicServiceRequest.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: publicServiceRequest
        });
    } catch (error) {
      console.error('Create public service request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/PublicServiceRequest/:id
 * Obter atendimento geral por ID
 */
router.get(
  '/PublicServiceRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const publicServiceRequest = await prisma.publicServiceRequest.findFirst({
        where: {
          id
        }
        });

      if (!publicServiceRequest) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: publicServiceRequest
        });
    } catch (error) {
      console.error('Get public service request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/PublicServiceRequest/:id
 * Atualizar atendimento geral
 */
router.put(
  '/PublicServiceRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const publicServiceRequest = await prisma.publicServiceRequest.updateMany({
        where: {
          id
        },
        data
        });

      if (publicServiceRequest.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.publicServiceRequest.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update public service request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/PublicServiceRequest/:id
 * Deletar atendimento geral
 */
router.delete(
  '/PublicServiceRequest/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.publicServiceRequest.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Atendimento deletado com sucesso'
        });
    } catch (error) {
      console.error('Delete public service request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - StreetLighting
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/StreetLighting
 * Listar iluminação pública
 */
router.get(
  '/StreetLighting',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { location: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.streetLighting.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.streetLighting.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get street lighting error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/StreetLighting
 * Criar iluminação pública
 */
router.post(
  '/StreetLighting',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const streetLighting = await prisma.streetLighting.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: streetLighting
        });
    } catch (error) {
      console.error('Create street lighting error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/StreetLighting/:id
 * Obter iluminação pública por ID
 */
router.get(
  '/StreetLighting/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const streetLighting = await prisma.streetLighting.findFirst({
        where: {
          id
        }
        });

      if (!streetLighting) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: streetLighting
        });
    } catch (error) {
      console.error('Get street lighting error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/StreetLighting/:id
 * Atualizar iluminação pública
 */
router.put(
  '/StreetLighting/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const streetLighting = await prisma.streetLighting.updateMany({
        where: {
          id
        },
        data
        });

      if (streetLighting.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.streetLighting.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update street lighting error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/StreetLighting/:id
 * Deletar iluminação pública
 */
router.delete(
  '/StreetLighting/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.streetLighting.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Iluminação pública deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete street lighting error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - SpecialCollection
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/SpecialCollection
 * Listar coletas especiais
 */
router.get(
  '/SpecialCollection',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { collectionType: { contains: search as string } },
          { location: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.specialCollection.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.specialCollection.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get special collection error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/SpecialCollection
 * Criar coleta especial
 */
router.post(
  '/SpecialCollection',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const specialCollection = await prisma.specialCollection.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: specialCollection
        });
    } catch (error) {
      console.error('Create special collection error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/SpecialCollection/:id
 * Obter coleta especial por ID
 */
router.get(
  '/SpecialCollection/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const specialCollection = await prisma.specialCollection.findFirst({
        where: {
          id
        }
        });

      if (!specialCollection) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: specialCollection
        });
    } catch (error) {
      console.error('Get special collection error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/SpecialCollection/:id
 * Atualizar coleta especial
 */
router.put(
  '/SpecialCollection/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const specialCollection = await prisma.specialCollection.updateMany({
        where: {
          id
        },
        data
        });

      if (specialCollection.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.specialCollection.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update special collection error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/SpecialCollection/:id
 * Deletar coleta especial
 */
router.delete(
  '/SpecialCollection/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.specialCollection.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Coleta especial deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete special collection error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - CleaningSchedule
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/CleaningSchedule
 * Listar cronogramas de limpeza
 */
router.get(
  '/CleaningSchedule',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { area: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.cleaningSchedule.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.cleaningSchedule.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get cleaning schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/CleaningSchedule
 * Criar cronograma de limpeza
 */
router.post(
  '/CleaningSchedule',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const cleaningSchedule = await prisma.cleaningSchedule.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: cleaningSchedule
        });
    } catch (error) {
      console.error('Create cleaning schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/CleaningSchedule/:id
 * Obter cronograma de limpeza por ID
 */
router.get(
  '/CleaningSchedule/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const cleaningSchedule = await prisma.cleaningSchedule.findFirst({
        where: {
          id
        }
        });

      if (!cleaningSchedule) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: cleaningSchedule
        });
    } catch (error) {
      console.error('Get cleaning schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/CleaningSchedule/:id
 * Atualizar cronograma de limpeza
 */
router.put(
  '/CleaningSchedule/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const cleaningSchedule = await prisma.cleaningSchedule.updateMany({
        where: {
          id
        },
        data
        });

      if (cleaningSchedule.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.cleaningSchedule.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update cleaning schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/CleaningSchedule/:id
 * Deletar cronograma de limpeza
 */
router.delete(
  '/CleaningSchedule/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.cleaningSchedule.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Cronograma de limpeza deletado com sucesso'
        });
    } catch (error) {
      console.error('Delete cleaning schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - TeamSchedule
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/TeamSchedule
 * Listar gestão de equipes
 */
router.get(
  '/TeamSchedule',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { teamName: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.teamSchedule.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.teamSchedule.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get team schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/TeamSchedule
 * Criar gestão de equipe
 */
router.post(
  '/TeamSchedule',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const teamSchedule = await prisma.teamSchedule.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: teamSchedule
        });
    } catch (error) {
      console.error('Create team schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/TeamSchedule/:id
 * Obter gestão de equipe por ID
 */
router.get(
  '/TeamSchedule/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const teamSchedule = await prisma.teamSchedule.findFirst({
        where: {
          id
        }
        });

      if (!teamSchedule) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: teamSchedule
        });
    } catch (error) {
      console.error('Get team schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/TeamSchedule/:id
 * Atualizar gestão de equipe
 */
router.put(
  '/TeamSchedule/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const teamSchedule = await prisma.teamSchedule.updateMany({
        where: {
          id
        },
        data
        });

      if (teamSchedule.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.teamSchedule.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update team schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/TeamSchedule/:id
 * Deletar gestão de equipe
 */
router.delete(
  '/TeamSchedule/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.teamSchedule.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Gestão de equipe deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete team schedule error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - WeedingRequest
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/WeedingRequest
 * Listar solicitações de capina
 */
router.get(
  '/WeedingRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { location: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.weedingRequest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.weedingRequest.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get weeding request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/WeedingRequest
 * Criar solicitação de capina
 */
router.post(
  '/WeedingRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const weedingRequest = await prisma.weedingRequest.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: weedingRequest
        });
    } catch (error) {
      console.error('Create weeding request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/WeedingRequest/:id
 * Obter solicitação de capina por ID
 */
router.get(
  '/WeedingRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const weedingRequest = await prisma.weedingRequest.findFirst({
        where: {
          id
        }
        });

      if (!weedingRequest) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: weedingRequest
        });
    } catch (error) {
      console.error('Get weeding request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/WeedingRequest/:id
 * Atualizar solicitação de capina
 */
router.put(
  '/WeedingRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const weedingRequest = await prisma.weedingRequest.updateMany({
        where: {
          id
        },
        data
        });

      if (weedingRequest.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.weedingRequest.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update weeding request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/WeedingRequest/:id
 * Deletar solicitação de capina
 */
router.delete(
  '/WeedingRequest/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.weedingRequest.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Solicitação de capina deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete weeding request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - DrainageRequest
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/DrainageRequest
 * Listar solicitações de desobstrução
 */
router.get(
  '/DrainageRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { location: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.drainageRequest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.drainageRequest.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get drainage request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/DrainageRequest
 * Criar solicitação de desobstrução
 */
router.post(
  '/DrainageRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const drainageRequest = await prisma.drainageRequest.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: drainageRequest
        });
    } catch (error) {
      console.error('Create drainage request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/DrainageRequest/:id
 * Obter solicitação de desobstrução por ID
 */
router.get(
  '/DrainageRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const drainageRequest = await prisma.drainageRequest.findFirst({
        where: {
          id
        }
        });

      if (!drainageRequest) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: drainageRequest
        });
    } catch (error) {
      console.error('Get drainage request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/DrainageRequest/:id
 * Atualizar solicitação de desobstrução
 */
router.put(
  '/DrainageRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const drainageRequest = await prisma.drainageRequest.updateMany({
        where: {
          id
        },
        data
        });

      if (drainageRequest.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.drainageRequest.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update drainage request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/DrainageRequest/:id
 * Deletar solicitação de desobstrução
 */
router.delete(
  '/DrainageRequest/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.drainageRequest.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Solicitação de desobstrução deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete drainage request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - TreePruningRequest
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/TreePruningRequest
 * Listar solicitações de poda de árvores
 */
router.get(
  '/TreePruningRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { location: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.treePruningRequest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.treePruningRequest.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get tree pruning request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/servicos-publicos/TreePruningRequest
 * Criar solicitação de poda de árvore
 */
router.post(
  '/TreePruningRequest',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const treePruningRequest = await prisma.treePruningRequest.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: treePruningRequest
        });
    } catch (error) {
      console.error('Create tree pruning request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/servicos-publicos/TreePruningRequest/:id
 * Obter solicitação de poda de árvore por ID
 */
router.get(
  '/TreePruningRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const treePruningRequest = await prisma.treePruningRequest.findFirst({
        where: {
          id
        }
        });

      if (!treePruningRequest) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: treePruningRequest
        });
    } catch (error) {
      console.error('Get tree pruning request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/servicos-publicos/TreePruningRequest/:id
 * Atualizar solicitação de poda de árvore
 */
router.put(
  '/TreePruningRequest/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const treePruningRequest = await prisma.treePruningRequest.updateMany({
        where: {
          id
        },
        data
        });

      if (treePruningRequest.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.treePruningRequest.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update tree pruning request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/servicos-publicos/TreePruningRequest/:id
 * Deletar solicitação de poda de árvore
 */
router.delete(
  '/TreePruningRequest/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.treePruningRequest.deleteMany({
        where: {
          id
        }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Solicitação de poda de árvore deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete tree pruning request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - UrbanCleaning
// ============================================================================

/**
 * GET /api/admin/secretarias/servicos-publicos/UrbanCleaning
 * Listar limpeza urbana
 */
router.get(
  '/UrbanCleaning',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { location: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.urbanCleaning.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.urbanCleaning.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get urban cleaning error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.post(
  '/UrbanCleaning',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const urbanCleaning = await prisma.urbanCleaning.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: urbanCleaning
        });
    } catch (error) {
      console.error('Create urban cleaning error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.get(
  '/UrbanCleaning/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const urbanCleaning = await prisma.urbanCleaning.findFirst({
        where: { id }
        });

      if (!urbanCleaning) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: urbanCleaning
        });
    } catch (error) {
      console.error('Get urban cleaning error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.put(
  '/UrbanCleaning/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const result = await prisma.urbanCleaning.updateMany({
        where: { id },
        data
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.urbanCleaning.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update urban cleaning error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.delete(
  '/UrbanCleaning/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.urbanCleaning.deleteMany({
        where: { id }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Limpeza urbana deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete urban cleaning error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - ServiceTeam
// ============================================================================

router.get(
  '/ServiceTeam',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { teamName: { contains: search as string } },
          { leader: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.serviceTeam.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.serviceTeam.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get service team error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.post(
  '/ServiceTeam',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const serviceTeam = await prisma.serviceTeam.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: serviceTeam
        });
    } catch (error) {
      console.error('Create service team error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.get(
  '/ServiceTeam/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const serviceTeam = await prisma.serviceTeam.findFirst({
        where: { id }
        });

      if (!serviceTeam) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: serviceTeam
        });
    } catch (error) {
      console.error('Get service team error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.put(
  '/ServiceTeam/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const result = await prisma.serviceTeam.updateMany({
        where: { id },
        data
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.serviceTeam.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update service team error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.delete(
  '/ServiceTeam/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.serviceTeam.deleteMany({
        where: { id }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Equipe deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete service team error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// ROTAS CRUD PARA MÓDULOS - PublicServiceAttendance
// ============================================================================

router.get(
  '/PublicServiceAttendance',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { citizenName: { contains: search as string } },
          { description: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.publicServiceAttendance.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.publicServiceAttendance.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get public service attendance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.post(
  '/PublicServiceAttendance',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const data = req.body;

      const attendance = await prisma.publicServiceAttendance.create({
        data: {
          ...data
        }
        });

      return res.status(201).json({
        success: true,
        data: attendance
        });
    } catch (error) {
      console.error('Create public service attendance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.get(
  '/PublicServiceAttendance/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const attendance = await prisma.publicServiceAttendance.findFirst({
        where: { id }
        });

      if (!attendance) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        data: attendance
        });
    } catch (error) {
      console.error('Get public service attendance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.put(
  '/PublicServiceAttendance/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;
      const data = req.body;

      const result = await prisma.publicServiceAttendance.updateMany({
        where: { id },
        data
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      const updated = await prisma.publicServiceAttendance.findFirst({
        where: { id }
        });

      return res.json({
        success: true,
        data: updated
        });
    } catch (error) {
      console.error('Update public service attendance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

router.delete(
  '/PublicServiceAttendance/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const result = await prisma.publicServiceAttendance.deleteMany({
        where: { id }
        });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found'
        });
      }

      return res.json({
        success: true,
        message: 'Atendimento deletado com sucesso'
        });
    } catch (error) {
      console.error('Delete public service attendance error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

export default router;
