// ============================================================================
// SECRETARIAS-ESPORTES.TS - Rotas da Secretaria de Esportes
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
 * GET /api/admin/secretarias/esportes/stats
 * Obter estatísticas consolidadas da Secretaria de Esportes
 * VERSÃO SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de esportes
      const sportsDept = await prisma.department.findFirst({
        where: { code: 'ESPORTES' }
        });

      if (!sportsDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Esportes não encontrado'
        });
      }

      // Módulos de esportes do MODULE_MAPPING
      const sportsModules = MODULE_BY_DEPARTMENT.ESPORTES || [];

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        athletesCount,
        teamsCount,
        schoolsCount,
        infrastructuresCount,
        competitionsCount,
      ] = await Promise.all([
        // 1. Estatísticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: sportsDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por módulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: sportsDept.id,
            moduleType: { in: sportsModules }
        },
          _count: { id: true }
        }),

        // 3. Atletas
        prisma.athlete.aggregate({
                    _count: { id: true }
        }),

        // 4. Equipes Esportivas
        prisma.sportsTeam.aggregate({
                    _count: { id: true }
        }),

        // 5. Escolinhas
        prisma.sportsSchool.aggregate({
                    _count: { id: true }
        }),

        // 6. Infraestruturas
        prisma.sportsInfrastructure.aggregate({
                    _count: { id: true }
        }),

        // 7. Competições
        prisma.competition.aggregate({
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
        athletes: {
          total: athletesCount._count?.id || 0,
          active: athletesCount._count?.id || 0,
          inactive: 0
        },
        teams: {
          total: teamsCount._count?.id || 0,
          active: teamsCount._count?.id || 0
        },
        schools: {
          total: schoolsCount._count?.id || 0,
          active: schoolsCount._count?.id || 0
        },
        infrastructures: {
          total: infrastructuresCount._count?.id || 0,
          active: infrastructuresCount._count?.id || 0
        },
        competitions: {
          total: competitionsCount._count?.id || 0,
          upcoming: 0
        },
        protocols: protocolData,
        moduleStats, // Estatísticas detalhadas por módulo
      };

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Sports stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar estatísticas de esportes'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/esportes/services
 * Listar serviços da Secretaria de Esportes
 */
router.get(
  '/services',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de esportes
      const sportsDept = await prisma.department.findFirst({
        where: { code: 'ESPORTES' }
        });

      if (!sportsDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Esportes não encontrado'
        });
      }

      // Buscar serviços simplificados
      const services = await prisma.serviceSimplified.findMany({
        where: {
                    departmentId: sportsDept.id,
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
      console.error('Get sports services error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar serviços'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/esportes/atletas
 * Listar atletas
 */
router.get(
  '/atletas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, sport, category, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (sport && sport !== 'all') {
        where.sport = sport;
      }

      if (category && category !== 'all') {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { cpf: { contains: search as string } },
        ];
      }

      const [data, total, activeCount] = await Promise.all([
        prisma.athlete.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.athlete.count({ where }),
        prisma.athlete.count({ where: { isActive: true } }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total,
          active: activeCount,
          inactive: total - activeCount
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get athletes error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/esportes/equipes
 * Listar equipes esportivas
 */
router.get(
  '/equipes',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, sport, category, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (sport && sport !== 'all') {
        where.sport = sport;
      }

      if (category && category !== 'all') {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { coach: { contains: search as string } },
        ];
      }

      const [data, total, activeCount] = await Promise.all([
        prisma.sportsTeam.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.sportsTeam.count({ where }),
        prisma.sportsTeam.count({ where: { isActive: true } }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total,
          active: activeCount
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get sports teams error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/esportes/escolinhas
 * Listar escolinhas esportivas
 */
router.get(
  '/escolinhas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, sport, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (sport && sport !== 'all') {
        where.sport = sport;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { instructor: { contains: search as string } },
        ];
      }

      const [data, total, activeCount] = await Promise.all([
        prisma.sportsSchool.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.sportsSchool.count({ where }),
        prisma.sportsSchool.count({ where: { isActive: true } }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total,
          active: activeCount
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get sports schools error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/esportes/infraestrutura
 * Listar infraestruturas esportivas
 */
router.get(
  '/infraestrutura',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, type, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (type && type !== 'all') {
        where.type = type;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { address: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.sportsInfrastructure.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.sportsInfrastructure.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get sports infrastructures error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/esportes/competicoes
 * Listar competições
 */
router.get(
  '/competicoes',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, sport, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (sport && sport !== 'all') {
        where.sport = sport;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { organizer: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.competition.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { startDate: 'desc' }
        }),
        prisma.competition.count({ where }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get competitions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

export default router;
