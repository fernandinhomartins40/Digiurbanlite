// ============================================================================
// SECRETARIAS-OBRAS-PUBLICAS.TS - Rotas da Secretaria de Obras Públicas
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
 * GET /api/admin/secretarias/obras-publicas/stats
 * Obter estatísticas consolidadas da Secretaria de Obras Públicas
 * VERSÃO SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de Obras Públicas
      const publicWorksDept = await prisma.department.findFirst({
        where: { code: 'OBRAS_PUBLICAS' }
        });

      if (!publicWorksDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Obras Públicas não encontrado'
        });
      }

      // Módulos de obras públicas do MODULE_MAPPING
      const publicWorksModules = MODULE_BY_DEPARTMENT.OBRAS_PUBLICAS || [];

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        attendancesCount,
        roadRepairsCount,
        technicalInspectionsCount,
        publicWorksCount,
        workInspectionsCount,
      ] = await Promise.all([
        // 1. Estatísticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: publicWorksDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por módulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: publicWorksDept.id,
            moduleType: { in: publicWorksModules }
        },
          _count: { id: true }
        }),

        // 3. Atendimentos de Obras Públicas
        prisma.publicWorksAttendance.aggregate({
                    _count: { id: true }
        }),

        // 4. Reparos de Vias
        prisma.roadRepairRequest.aggregate({
                    _count: { id: true }
        }),

        // 5. Vistorias Técnicas
        prisma.technicalInspection.aggregate({
                    _count: { id: true }
        }),

        // 6. Cadastro de Obras
        prisma.publicWork.aggregate({
                    _count: { id: true }
        }),

        // 7. Inspeções de Obras
        prisma.workInspection.aggregate({
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
        repairs: {
          total: roadRepairsCount._count?.id || 0,
          active: roadRepairsCount._count?.id || 0
        },
        inspections: {
          total: technicalInspectionsCount._count?.id || 0,
          pending: 0
        },
        projects: {
          total: publicWorksCount._count?.id || 0,
          active: 0,
          completed: 0
        },
        attendances: {
          total: attendancesCount._count?.id || 0
        },
        workInspections: {
          total: workInspectionsCount._count?.id || 0
        },
        protocols: protocolData,
        moduleStats, // Estatísticas detalhadas por módulo
      };

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Public works stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar estatísticas de obras públicas'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/obras-publicas/services
 * Listar serviços da Secretaria de Obras Públicas
 */
router.get(
  '/services',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de Obras Públicas
      const publicWorksDept = await prisma.department.findFirst({
        where: { code: 'OBRAS_PUBLICAS' }
        });

      if (!publicWorksDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Obras Públicas não encontrado'
        });
      }

      // Buscar serviços simplificados
      const services = await prisma.serviceSimplified.findMany({
        where: {
                    departmentId: publicWorksDept.id,
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
      console.error('Get public works services error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar serviços'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/obras-publicas/atendimentos
 * Listar atendimentos de obras públicas
 */
router.get(
  '/atendimentos',
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
          { protocol: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.publicWorksAttendance.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.publicWorksAttendance.count({ where }),
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
      console.error('Get public works attendances error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/obras-publicas/reparos-de-vias
 * Listar reparos de vias
 */
router.get(
  '/reparos-de-vias',
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
          { roadName: { contains: search as string } },
          { protocol: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.roadRepairRequest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.roadRepairRequest.count({ where }),
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
      console.error('Get road repairs error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/obras-publicas/vistorias-tecnicas
 * Listar vistorias técnicas
 */
router.get(
  '/vistorias-tecnicas',
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
          { requestorName: { contains: search as string } },
          { location: { contains: search as string } },
          { protocol: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.technicalInspection.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.technicalInspection.count({ where }),
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
      console.error('Get technical inspections error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/obras-publicas/cadastro-de-obras
 * Listar cadastro de obras
 */
router.get(
  '/cadastro-de-obras',
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
          { title: { contains: search as string } },
          { contractor: { contains: search as string } },
          { location: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.publicWork.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.publicWork.count({ where }),
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
      console.error('Get public works error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/obras-publicas/inspecao-de-obras
 * Listar inspeções de obras
 */
router.get(
  '/inspecao-de-obras',
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
          { workName: { contains: search as string } },
          { contractor: { contains: search as string } },
          { protocol: { contains: search as string } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.workInspection.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.workInspection.count({ where }),
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
      console.error('Get work inspections error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

export default router;
