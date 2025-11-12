// ============================================================================
// SECRETARIAS-ASSISTENCIA-SOCIAL.TS - Rotas da Secretaria de Assistência Social
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
 * GET /api/admin/secretarias/assistencia-social/stats
 * Obter estatísticas consolidadas da Secretaria de Assistência Social
 * VERSÃO SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de assistência social
      // ✅ Buscar departamento global
      const socialDept = await prisma.department.findFirst({
        where: { code: 'ASSISTENCIA_SOCIAL' }
      });

      if (!socialDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Assistência Social não encontrado'
        });
      }

      // Módulos de assistência social do MODULE_MAPPING
      const socialModules = MODULE_BY_DEPARTMENT.ASSISTENCIA_SOCIAL || [];

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        familiesCount,
        benefitsCount,
        deliveriesCount,
        visitsCount,
        programsCount,
        unitsCount,
      ] = await Promise.all([
        // 1. Estatísticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: socialDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por módulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: socialDept.id,
            moduleType: { in: socialModules }
        },
          _count: { id: true }
        }),

        // 3. Famílias Vulneráveis
        prisma.vulnerableFamily.groupBy({
          by: ['status', 'riskLevel'],
                    _count: { id: true }
        }),

        // 4. Benefícios
        prisma.benefitRequest.groupBy({
          by: ['status'],
                    _count: { id: true }
        }),

        // 5. Entregas Emergenciais
        prisma.emergencyDelivery.groupBy({
          by: ['status'],
                    _count: { id: true }
        }),

        // 6. Visitas Domiciliares
        prisma.homeVisit.groupBy({
          by: ['status'],
                    _count: { id: true }
        }),

        // 7. Programas Sociais
        prisma.socialProgram.aggregate({
                    _count: { id: true }
        }),

        // 8. Unidades SUAS (CRAS/CREAS)
        prisma.socialEquipment.groupBy({
          by: ['equipmentType'],
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

      protocolStats.forEach((item: any) => {
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

      protocolsByModule.forEach((item: any) => {
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

      // Processar famílias
      const familyData = {
        total: 0,
        vulnerable: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        active: 0
        };

      familiesCount.forEach((item: any) => {
        const count = item._count?.id || 0;
        familyData.total += count;

        if (item.status === 'ACTIVE') {
          familyData.active += count;
          familyData.vulnerable += count;
        }

        if (item.riskLevel === 'HIGH') familyData.highRisk += count;
        if (item.riskLevel === 'MEDIUM') familyData.mediumRisk += count;
        if (item.riskLevel === 'LOW') familyData.lowRisk += count;
      });

      // Processar benefícios
      const benefitData = {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0
        };

      benefitsCount.forEach((item: any) => {
        const count = item._count?.id || 0;
        benefitData.total += count;

        if (item.status === 'PENDING') benefitData.pending += count;
        if (item.status === 'APPROVED') benefitData.approved += count;
        if (item.status === 'DENIED') benefitData.denied += count;
      });

      // Processar entregas
      const deliveryData = {
        total: 0,
        pending: 0,
        inTransit: 0,
        delivered: 0
        };

      deliveriesCount.forEach((item: any) => {
        const count = item._count?.id || 0;
        deliveryData.total += count;

        if (item.status === 'PENDING') deliveryData.pending += count;
        if (item.status === 'IN_TRANSIT') deliveryData.inTransit += count;
        if (item.status === 'DELIVERED') deliveryData.delivered += count;
      });

      // Processar visitas
      const visitData = {
        total: 0,
        scheduled: 0,
        completed: 0,
        canceled: 0
        };

      visitsCount.forEach((item: any) => {
        const count = item._count?.id || 0;
        visitData.total += count;

        if (item.status === 'SCHEDULED') visitData.scheduled += count;
        if (item.status === 'COMPLETED') visitData.completed += count;
        if (item.status === 'CANCELED') visitData.canceled += count;
      });

      // Processar unidades por tipo
      let crasCount = 0;
      let creasCount = 0;
      let totalUnits = 0;

      unitsCount.forEach((item: any) => {
        const count = item._count?.id || 0;
        totalUnits += count;

        if (item.equipmentType === 'CRAS') crasCount += count;
        if (item.equipmentType === 'CREAS') creasCount += count;
      });

      // Montar resposta consolidada
      const stats = {
        families: familyData,
        attendances: {
          total: protocolData.total,
          thisMonth: protocolData.total,
          variation: 0
        },
        beneficiaries: {
          total: benefitData.approved,
          active: benefitData.approved
        },
        units: {
          total: totalUnits,
          cras: crasCount,
          creas: creasCount
        },
        benefits: benefitData,
        deliveries: deliveryData,
        visits: visitData,
        programs: {
          total: programsCount._count?.id || 0,
          active: programsCount._count?.id || 0
        },
        protocols: protocolData,
        moduleStats, // Estatísticas detalhadas por módulo
      };

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Social assistance stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar estatísticas da assistência social'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/services
 * Listar serviços da Secretaria de Assistência Social
 */
router.get(
  '/services',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de assistência social
      // ✅ Buscar departamento global
      const socialDept = await prisma.department.findFirst({
        where: { code: 'ASSISTENCIA_SOCIAL' }
      });

      if (!socialDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Assistência Social não encontrado'
        });
      }

      // Buscar serviços simplificados
      const services = await prisma.serviceSimplified.findMany({
        where: {
                    departmentId: socialDept.id,
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
      console.error('Get social assistance services error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar serviços'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/familias
 * Listar famílias vulneráveis
 */
router.get(
  '/familias',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, riskLevel, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (riskLevel && riskLevel !== 'all') {
        where.riskLevel = riskLevel;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { responsibleName: { contains: search as string } },
          { familyCode: { contains: search as string } },
        ];
      }

      const [data, total, highRiskCount] = await Promise.all([
        prisma.vulnerableFamily.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: [{ riskLevel: 'desc' }, { createdAt: 'desc' }],
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                cpf: true
        }
      }
        }
        }),
        prisma.vulnerableFamily.count({ where }),
        prisma.vulnerableFamily.count({
          where: { status: 'ACTIVE', riskLevel: 'HIGH' }
        }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total,
          highRisk: highRiskCount
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get vulnerable families error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/beneficios
 * Listar solicitações de benefícios
 */
router.get(
  '/beneficios',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, benefitType, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (benefitType && benefitType !== 'all') {
        where.benefitType = benefitType;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { familyId: { contains: search as string } },
          { reason: { contains: search as string } },
        ];
      }

      const [data, total, pendingCount] = await Promise.all([
        prisma.benefitRequest.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: [{ urgency: 'desc' }, { requestDate: 'desc' }]
        }),
        prisma.benefitRequest.count({ where }),
        prisma.benefitRequest.count({ where: { status: 'PENDING' } }),
      ]);

      return res.json({
        success: true,
        data,
        stats: {
          total,
          pending: pendingCount
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get benefit requests error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/entregas
 * Listar entregas emergenciais
 */
router.get(
  '/entregas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, deliveryType, status } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (deliveryType && deliveryType !== 'all') {
        where.deliveryType = deliveryType;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      const [data, total] = await Promise.all([
        prisma.emergencyDelivery.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { deliveryDate: 'asc' }
        }),
        prisma.emergencyDelivery.count({ where }),
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
      console.error('Get emergency deliveries error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/visitas
 * Listar visitas domiciliares
 */
router.get(
  '/visitas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, status, socialWorker } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (socialWorker) {
        where.socialWorker = socialWorker;
      }

      const [data, total] = await Promise.all([
        prisma.homeVisit.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { visitDate: 'desc' }
        }),
        prisma.homeVisit.count({ where }),
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
      console.error('Get home visits error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/programas
 * Listar programas sociais
 */
router.get(
  '/programas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, programType } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (programType && programType !== 'all') {
        where.programType = programType;
      }

      const [data, total, activeCount] = await Promise.all([
        prisma.socialProgram.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' }
        }),
        prisma.socialProgram.count({ where }),
        prisma.socialProgram.count({
          where: {
                        startDate: { lte: new Date() },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ]
        }
        }),
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
      console.error('Get social programs error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/assistencia-social/cras-creas
 * Listar unidades SUAS (CRAS/CREAS)
 */
router.get(
  '/cras-creas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      const [data, total] = await Promise.all([
        prisma.socialEquipment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { equipmentName: 'asc' }
        }),
        prisma.socialEquipment.count({ where }),
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
      console.error('Get service units error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

export default router;
