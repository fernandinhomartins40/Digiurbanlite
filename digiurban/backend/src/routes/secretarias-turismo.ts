// ============================================================================
// SECRETARIAS-TURISMO.TS - Rotas da Secretaria de Turismo
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
 * GET /api/admin/secretarias/turismo/stats
 * Obter estatísticas consolidadas da Secretaria de Turismo
 * VERSÃO SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de turismo
      // ✅ Buscar departamento global
      const tourismDept = await prisma.department.findFirst({
        where: { code: 'TURISMO' }
      });

      if (!tourismDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Turismo não encontrado'
        });
      }

      // Módulos de turismo do MODULE_MAPPING
      const tourismModules = MODULE_BY_DEPARTMENT.TURISMO || [];

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        attendancesCount,
        attractionsCount,
        businessesCount,
        programsCount,
        guidesCount,
        routesCount,
        eventsCount,
      ] = await Promise.all([
        // 1. Estatísticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: tourismDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por módulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: tourismDept.id,
            moduleType: { in: tourismModules }
        },
          _count: { id: true }
        }),

        // 3. Atendimentos de Turismo
        prisma.tourismAttendance.aggregate({
                    _count: { id: true }
        }),

        // 4. Atrativos Turísticos
        prisma.touristAttraction.aggregate({
          where: { isActive: true },
          _count: { id: true }
        }),

        // 5. Estabelecimentos Turísticos
        prisma.localBusiness.aggregate({
          where: { isActive: true, isTourismPartner: true },
          _count: { id: true }
        }),

        // 6. Programas Turísticos
        prisma.tourismProgram.aggregate({
          where: { isActive: true },
          _count: { id: true }
        }),

        // 7. Guias Turísticos
        prisma.tourismGuide.aggregate({
          where: { isActive: true },
          _count: { id: true }
        }),

        // 8. Roteiros Turísticos
        prisma.tourismRoute.aggregate({
          where: { isActive: true },
          _count: { id: true }
        }),

        // 9. Eventos Turísticos
        prisma.tourismEvent.aggregate({
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

      // Retornar resposta
      return res.json({
        success: true,
        data: {
          department: {
            id: tourismDept.id,
            name: tourismDept.name,
            code: tourismDept.code
        },
          protocols: protocolData,
          modules: moduleStats,
          counts: {
            attendances: attendancesCount._count?.id || 0,
            attractions: attractionsCount._count?.id || 0,
            businesses: businessesCount._count?.id || 0,
            programs: programsCount._count?.id || 0,
            guides: guidesCount._count?.id || 0,
            routes: routesCount._count?.id || 0,
            events: eventsCount._count?.id || 0
        }
        }
        });
    } catch (error: any) {
      console.error('Error in tourism stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message || 'Erro ao buscar estatísticas'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/atendimentos
 * Listar atendimentos de turismo
 */
router.get(
  '/atendimentos',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) {
        where.status = status;
      }

      const [attendances, total] = await Promise.all([
        prisma.tourismAttendance.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: {
              select: { id: true, name: true, email: true, phone: true }
      },
            protocolRel: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.tourismAttendance.count({ where }),
      ]);

      return res.json({
        success: true,
        data: attendances,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching tourism attendances:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar atendimentos'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/atrativos
 * Listar atrativos turísticos
 */
router.get(
  '/atrativos',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, type, isActive } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [attractions, total] = await Promise.all([
        prisma.touristAttraction.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            protocolRel: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.touristAttraction.count({ where }),
      ]);

      return res.json({
        success: true,
        data: attractions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching tourist attractions:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar atrativos'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/estabelecimentos
 * Listar estabelecimentos turísticos
 */
router.get(
  '/estabelecimentos',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, businessType, category } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { isTourismPartner: true };

      if (businessType) where.businessType = businessType;
      if (category) where.category = category;

      const [businesses, total] = await Promise.all([
        prisma.localBusiness.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            protocolRel: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.localBusiness.count({ where }),
      ]);

      return res.json({
        success: true,
        data: businesses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching local businesses:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar estabelecimentos'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/guias
 * Listar guias turísticos
 */
router.get(
  '/guias',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, isActive } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) where.status = status;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [guides, total] = await Promise.all([
        prisma.tourismGuide.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            protocol: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.tourismGuide.count({ where }),
      ]);

      return res.json({
        success: true,
        data: guides,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching tourism guides:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar guias'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/programas
 * Listar programas turísticos
 */
router.get(
  '/programas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, programType } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) where.status = status;
      if (programType) where.programType = programType;

      const [programs, total] = await Promise.all([
        prisma.tourismProgram.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            protocol: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.tourismProgram.count({ where }),
      ]);

      return res.json({
        success: true,
        data: programs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching tourism programs:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar programas'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/roteiros
 * Listar roteiros turísticos
 */
router.get(
  '/roteiros',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, routeType, difficulty } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { isActive: true };

      if (routeType) where.routeType = routeType;
      if (difficulty) where.difficulty = difficulty;

      const [routes, total] = await Promise.all([
        prisma.tourismRoute.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            protocol: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.tourismRoute.count({ where }),
      ]);

      return res.json({
        success: true,
        data: routes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching tourism routes:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar roteiros'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/turismo/eventos
 * Listar eventos turísticos
 */
router.get(
  '/eventos',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, eventType } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) where.status = status;
      if (eventType) where.eventType = eventType;

      const [events, total] = await Promise.all([
        prisma.tourismEvent.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { startDate: 'desc' },
          include: {
            protocol: {
              select: { id: true, number: true, status: true }
      }
        }
        }),
        prisma.tourismEvent.count({ where }),
      ]);

      return res.json({
        success: true,
        data: events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error: any) {
      console.error('Error fetching tourism events:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar eventos'
        });
    }
  }
);

export default router;
