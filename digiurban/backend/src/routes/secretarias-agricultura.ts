// ============================================================================
// SECRETARIAS-AGRICULTURA.TS - Rotas da Secretaria de Agricultura
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
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';

// Módulos de agricultura (migrado de module-mapping)
const AGRICULTURE_MODULES = [
  'CADASTRO_PRODUTOR',
  'CADASTRO_PROPRIEDADE_RURAL',
  'ASSISTENCIA_TECNICA_RURAL',
  'DISTRIBUICAO_SEMENTES'
];

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/secretarias/agricultura/stats
 * Obter estatísticas consolidadas da Secretaria de Agricultura
 * VERSÃO SIMPLIFICADA - Usa apenas ProtocolSimplified + moduleType
 */
router.get(
  '/stats',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      // Buscar departamento de agricultura
      // ✅ Buscar departamento global
      const agricultureDept = await prisma.department.findFirst({
        where: { code: 'AGRICULTURA' }
      });

      if (!agricultureDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Agricultura não encontrado'
        });
      }

      // Módulos de agricultura
      const agricultureModules = AGRICULTURE_MODULES;

      // Executar queries em paralelo
      const [
        protocolStats,
        protocolsByModule,
        producersCount,
        propertiesCount,
        programsCount,
        trainingsCount,
      ] = await Promise.all([
        // 1. Estatísticas gerais de Protocolos
        prisma.protocolSimplified.groupBy({
          by: ['status'],
          where: {
                        departmentId: agricultureDept.id
        },
          _count: { id: true }
        }),

        // 2. Protocolos por módulo (usando moduleType)
        prisma.protocolSimplified.groupBy({
          by: ['moduleType', 'status'],
          where: {
                        departmentId: agricultureDept.id,
            moduleType: { in: agricultureModules }
        },
          _count: { id: true }
        }),

        // 3. Produtores Rurais (via ProtocolSimplified)
        prisma.protocolSimplified.count({
          where: {
            departmentId: agricultureDept.id,
            moduleType: 'CADASTRO_PRODUTOR',
            status: ProtocolStatus.CONCLUIDO
          }
        }),

        // 4. Propriedades Rurais (via ProtocolSimplified)
        prisma.protocolSimplified.count({
          where: {
            departmentId: agricultureDept.id,
            moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
            status: ProtocolStatus.CONCLUIDO
          }
        }),

        // 5. Programas Rurais (via ProtocolSimplified)
        prisma.protocolSimplified.count({
          where: {
            departmentId: agricultureDept.id,
            moduleType: 'INSCRICAO_PROGRAMA_RURAL',
            status: ProtocolStatus.CONCLUIDO
          }
        }),

        // 6. Capacitações (via ProtocolSimplified)
        prisma.protocolSimplified.count({
          where: {
            departmentId: agricultureDept.id,
            moduleType: 'INSCRICAO_CURSO_RURAL',
            status: ProtocolStatus.CONCLUIDO
          }
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

      // Estatísticas de Assistência Técnica
      const technicalAssistanceStats = moduleStats['ASSISTENCIA_TECNICA'] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
        };

      // Montar resposta consolidada
      const stats = {
        producers: {
          total: producersCount || 0,
          active: producersCount || 0,
          inactive: 0
        },
        properties: {
          total: propertiesCount || 0,
          totalArea: 0 // Não podemos mais somar áreas sem tabela específica
        },
        programs: {
          total: programsCount || 0
        },
        trainings: {
          total: trainingsCount || 0
        },
        technicalAssistance: {
          totalActive: technicalAssistanceStats.pending + technicalAssistanceStats.inProgress,
          pending: technicalAssistanceStats.pending,
          inProgress: technicalAssistanceStats.inProgress,
          completedThisMonth: technicalAssistanceStats.completed
        },
        protocols: protocolData,
        moduleStats, // Estatísticas detalhadas por módulo
      };

      return res.json({
        success: true,
        data: stats
        });
    } catch (error) {
      console.error('Agriculture stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar estatísticas da agricultura'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/services
 * Listar serviços da Secretaria de Agricultura
 */
router.get(
  '/services',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      console.log('\n========== GET /api/admin/secretarias/agricultura/services ==========');
      console.log('[GET /services] TenantId:');
      console.log('[GET /services] User:', authReq.user?.email);

      // Buscar departamento de agricultura
      // ✅ Buscar departamento global
      const agricultureDept = await prisma.department.findFirst({
        where: { code: 'AGRICULTURA' }
      });

      console.log('[GET /services] Agriculture Dept:', agricultureDept ? `${agricultureDept.name} (${agricultureDept.id})` : 'NÃO ENCONTRADO');

      if (!agricultureDept) {
        console.log('[GET /services] ❌ Retornando 404 - Departamento não encontrado');
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Agricultura não encontrado'
        });
      }

      // Buscar serviços simplificados
      const services = await prisma.serviceSimplified.findMany({
        where: {
                    departmentId: agricultureDept.id,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
        });

      console.log('[GET /services] ✅ Services found:', services.length);
      console.log('[GET /services] Services details:');
      services.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.name}`);
        console.log(`     - moduleType: ${s.moduleType || 'null'}`);
        console.log(`     - serviceType: ${s.serviceType}`);
        console.log(`     - isActive: ${s.isActive}`);
      });

      const response = {
        success: true,
        data: services
        };

      console.log('[GET /services] Retornando resposta com', services.length, 'serviços');
      console.log('========== FIM GET /services ==========\n');

      return res.json(response);
    } catch (error) {
      console.error('[GET /services] ❌ ERROR:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar serviços'
        });
    }
  }
);

// ❌ ROTA REMOVIDA: GET /produtores
// Motivo: Duplicada com secretarias-agricultura-produtores.ts
// A rota dedicada em secretarias-agricultura-produtores.ts
// implementa CRUD completo (GET, POST, PUT, DELETE)
// Mantida apenas a rota dedicada para evitar conflitos

// ============================================================================
// PROPRIEDADES RURAIS - CRUD COMPLETO
// ============================================================================
// IMPORTANTE: Rotas com parâmetros (:id) devem vir ANTES das rotas genéricas

/**
 * GET /api/admin/secretarias/agricultura/propriedades/:id
 * Visualizar propriedade rural individual (via ProtocolSimplified)
 */
router.get(
  '/propriedades/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'CADASTRO_PROPRIEDADE_RURAL'
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true
            }
          },
          service: true
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          message: 'Propriedade não encontrada'
        });
      }

      // Extrair dados da propriedade do customData
      const propertyData = {
        id: protocol.id,
        protocolNumber: protocol.number,
        status: protocol.status,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
        citizen: protocol.citizen,
        ...(protocol.customData as object)
      };

      return res.json({
        success: true,
        data: propertyData
      });
    } catch (error) {
      console.error('Get rural property error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar propriedade'
      });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/propriedades/:id
 * Atualizar propriedade rural (via ProtocolSimplified)
 */
router.put(
  '/propriedades/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const updateData = req.body;

      // Verificar se o protocolo existe
      const existingProtocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'CADASTRO_PROPRIEDADE_RURAL'
        }
      });

      if (!existingProtocol) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          message: 'Propriedade não encontrada'
        });
      }

      // Mesclar dados existentes com novos dados
      const currentData = (existingProtocol.customData as Record<string, any>) || {};
      const updatedCustomData = {
        ...currentData,
        ...updateData,
        _meta: {
          ...(currentData._meta || {}),
          updatedAt: new Date().toISOString(),
          updatedBy: authReq.user?.id
        }
      };

      // Atualizar protocolo
      const updatedProtocol = await prisma.protocolSimplified.update({
        where: { id },
        data: {
          customData: updatedCustomData
        },
        include: {
          citizen: true,
          service: true
        }
      });

      return res.json({
        success: true,
        data: {
          id: updatedProtocol.id,
          protocolNumber: updatedProtocol.number,
          status: updatedProtocol.status,
          citizen: updatedProtocol.citizen,
          ...updatedCustomData
        },
        message: 'Propriedade atualizada com sucesso'
      });
    } catch (error) {
      console.error('Update rural property error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao atualizar propriedade'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/agricultura/propriedades/:id
 * Excluir propriedade rural (via ProtocolSimplified)
 */
router.delete(
  '/propriedades/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      // Verificar se o protocolo existe
      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'CADASTRO_PROPRIEDADE_RURAL'
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Property not found',
          message: 'Propriedade não encontrada'
        });
      }

      // Cancelar protocolo ao invés de deletar
      await prisma.protocolSimplified.update({
        where: { id },
        data: {
          status: ProtocolStatus.CANCELADO
        }
      });

      return res.json({
        success: true,
        message: 'Propriedade excluída com sucesso'
      });
    } catch (error) {
      console.error('Delete rural property error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao excluir propriedade'
      });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/propriedades
 * Listar propriedades rurais (via ProtocolSimplified)
 */
router.get(
  '/propriedades',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { page = 1, limit = 20, status, search } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        moduleType: 'CADASTRO_PROPRIEDADE_RURAL'
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [protocols, total] = await Promise.all([
        prisma.protocolSimplified.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                cpf: true
              }
            },
            service: true
          }
        }),
        prisma.protocolSimplified.count({ where })
      ]);

      // Transformar protocolos para formato de propriedades
      const data = protocols.map(p => ({
        id: p.id,
        protocolNumber: p.number,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        citizen: p.citizen,
        ...(p.customData as object)
      }));

      return res.json({
        success: true,
        data,
        stats: {
          total,
          totalArea: 0, // Não podemos somar sem fazer scan completo
          totalPlantedArea: 0
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get rural properties error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/admin/secretarias/agricultura/propriedades
 * Criar nova propriedade rural (via ProtocolSimplified)
 */
router.post(
  '/propriedades',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { citizenId, name, size, location, plantedArea, mainCrops, status } = req.body;

      // Validar campos obrigatórios
      if (!citizenId || !name || !size || !location) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Cidadão, nome, tamanho e localização são obrigatórios'
        });
      }

      // Verificar se o cidadão existe
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId }
      });

      if (!citizen) {
        return res.status(404).json({
          success: false,
          error: 'Citizen not found',
          message: 'Cidadão não encontrado'
        });
      }

      // Buscar departamento de agricultura
      const agricultureDept = await prisma.department.findFirst({
        where: { code: 'AGRICULTURA' }
      });

      if (!agricultureDept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: 'Departamento de Agricultura não encontrado'
        });
      }

      // Buscar ou criar serviço
      let service = await prisma.serviceSimplified.findFirst({
        where: {
          departmentId: agricultureDept.id,
          moduleType: 'CADASTRO_PROPRIEDADE_RURAL'
        }
      });

      if (!service) {
        service = await prisma.serviceSimplified.create({
          data: {
            departmentId: agricultureDept.id,
            name: 'Cadastro de Propriedade Rural',
            description: 'Cadastro manual de propriedade rural pelo sistema administrativo',
            serviceType: 'COM_DADOS',
            moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
            isActive: true
          }
        });
      }

      // Criar protocolo com dados em customData
      const result = await prisma.$transaction(async (tx) => {
        const protocolNumber = await generateProtocolNumberSafe(tx);

        const protocol = await tx.protocolSimplified.create({
          data: {
            citizenId,
            serviceId: service.id,
            departmentId: agricultureDept.id,
            number: protocolNumber,
            title: `Cadastro de Propriedade Rural - ${name}`,
            description: 'Cadastro manual realizado pela secretaria de agricultura',
            moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
            status: ProtocolStatus.CONCLUIDO,
            customData: {
              name,
              size: parseFloat(size),
              location,
              plantedArea: plantedArea ? parseFloat(plantedArea) : null,
              mainCrops: mainCrops || null,
              status: status || 'ACTIVE',
              _meta: {
                entityType: 'CADASTRO_PROPRIEDADE_RURAL',
                status: 'ACTIVE',
                isActive: true,
                createdAt: new Date().toISOString(),
                createdBy: authReq.user?.id,
                registeredBy: 'admin'
              }
            }
          },
          include: {
            citizen: true
          }
        });

        return { protocol };
      });

      return res.status(201).json({
        success: true,
        data: {
          id: result.protocol.id,
          protocolNumber: result.protocol.number,
          status: result.protocol.status,
          citizen: result.protocol.citizen,
          ...(result.protocol.customData as object)
        },
        message: 'Propriedade criada com sucesso'
      });
    } catch (error) {
      console.error('Create rural property error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao criar propriedade'
      });
    }
  }
);

// ============================================================================
// PROGRAMAS RURAIS - CRUD COMPLETO
// ============================================================================
// IMPORTANTE: Rotas com parâmetros (:id) devem vir ANTES das rotas genéricas

/**
 * GET /api/admin/secretarias/agricultura/programas/:id
 * Visualizar programa rural individual (via ProtocolSimplified)
 */
router.get(
  '/programas/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'INSCRICAO_PROGRAMA_RURAL'
        },
        include: {
          citizen: true,
          service: true
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
          message: 'Programa não encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          id: protocol.id,
          protocolNumber: protocol.number,
          status: protocol.status,
          citizen: protocol.citizen,
          ...(protocol.customData as object)
        }
      });
    } catch (error) {
      console.error('Get rural program error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar programa'
      });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/programas/:id
 * Atualizar programa rural (via ProtocolSimplified)
 */
router.put(
  '/programas/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const updateData = req.body;

      // Verificar se o protocolo existe
      const existingProtocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'INSCRICAO_PROGRAMA_RURAL'
        }
      });

      if (!existingProtocol) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
          message: 'Programa não encontrado'
        });
      }

      // Mesclar dados
      const currentData = (existingProtocol.customData as Record<string, any>) || {};
      const updatedCustomData = {
        ...currentData,
        ...updateData,
        _meta: {
          ...(currentData._meta || {}),
          updatedAt: new Date().toISOString(),
          updatedBy: authReq.user?.id
        }
      };

      // Atualizar protocolo
      const updatedProtocol = await prisma.protocolSimplified.update({
        where: { id },
        data: {
          customData: updatedCustomData
        },
        include: {
          citizen: true
        }
      });

      return res.json({
        success: true,
        data: {
          id: updatedProtocol.id,
          protocolNumber: updatedProtocol.number,
          status: updatedProtocol.status,
          citizen: updatedProtocol.citizen,
          ...updatedCustomData
        },
        message: 'Programa atualizado com sucesso'
      });
    } catch (error) {
      console.error('Update rural program error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao atualizar programa'
      });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/agricultura/programas/:id
 * Excluir programa rural (via ProtocolSimplified)
 */
router.delete(
  '/programas/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      // Verificar se o protocolo existe
      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'INSCRICAO_PROGRAMA_RURAL'
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
          message: 'Programa não encontrado'
        });
      }

      // Cancelar protocolo
      await prisma.protocolSimplified.update({
        where: { id },
        data: {
          status: ProtocolStatus.CANCELADO
        }
      });

      return res.json({
        success: true,
        message: 'Programa excluído com sucesso'
      });
    } catch (error) {
      console.error('Delete rural program error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao excluir programa'
      });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/programas
 * Listar programas rurais (via ProtocolSimplified)
 */
router.get(
  '/programas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { page = 1, limit = 20, status, programType } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        moduleType: 'INSCRICAO_PROGRAMA_RURAL'
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      const [protocols, total, activeCount] = await Promise.all([
        prisma.protocolSimplified.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: true
          }
        }),
        prisma.protocolSimplified.count({ where }),
        prisma.protocolSimplified.count({
          where: {
            moduleType: 'INSCRICAO_PROGRAMA_RURAL',
            status: ProtocolStatus.CONCLUIDO
          }
        }),
      ]);

      const data = protocols.map(p => ({
        id: p.id,
        protocolNumber: p.number,
        status: p.status,
        createdAt: p.createdAt,
        citizen: p.citizen,
        ...(p.customData as object)
      }));

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
      console.error('Get rural programs error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/admin/secretarias/agricultura/programas
 * Criar novo programa rural
 */
router.post(
  '/programas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      console.log('\n========== POST /api/admin/secretarias/agricultura/programas ==========');
      console.log('[POST /programas] TenantId:');
      console.log('[POST /programas] Body:', JSON.stringify(req.body, null, 2));

      const {
        name,
        programType,
        description,
        objectives,
        targetAudience,
        requirements,
        benefits,
        startDate,
        endDate,
        budget,
        coordinator,
        maxParticipants,
        applicationPeriod,
        selectionCriteria,
        partners,
        status,
        formSchema,
        requiredDocuments
        } = req.body;

      console.log('[POST /programas] Campos extraídos:', {
        name,
        programType,
        description,
        startDate,
        coordinator
        });

      // Validar campos obrigatórios
      if (!name || !programType || !description || !startDate || !coordinator) {
        console.log('[POST /programas] ❌ Validação falhou - campos faltando');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Nome, tipo, descrição, data de início e coordenador são obrigatórios'
        });
      }

      console.log('[POST /programas] ✅ Validação passou - criando programa...');

      // Criar programa rural
      const program = await prisma.ruralProgram.create({
        data: {
                    name,
          programType,
          description,
          objectives: objectives || {},
          targetAudience: targetAudience || '',
          requirements: requirements || {},
          benefits: benefits || {},
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          budget: budget ? parseFloat(budget) : null,
          coordinator,
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
          applicationPeriod: applicationPeriod || null,
          selectionCriteria: selectionCriteria || null,
          partners: partners || null,
          status: status || 'ACTIVE', // Padrão ACTIVE para aparecer no catálogo do cidadão
          customFields: formSchema || null, // Salvar formSchema como customFields
          requiredDocuments: requiredDocuments || null
        }
        });

      console.log('[POST /programas] ✅ Programa criado com sucesso:', program.id);
      console.log('========== FIM POST /programas ==========\n');

      return res.status(201).json({
        success: true,
        data: program,
        message: 'Programa rural criado com sucesso'
        });
    } catch (error) {
      console.error('[POST /programas] ❌ ERROR:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao criar programa rural'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/capacitacoes
 * Listar capacitações rurais
 */
router.get(
  '/capacitacoes',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { page = 1, limit = 20, trainingType } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (trainingType && trainingType !== 'all') {
        where.trainingType = trainingType;
      }

      const [data, total] = await Promise.all([
        prisma.ruralTraining.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { startDate: 'desc' }
        }),
        prisma.ruralTraining.count({ where }),
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
      console.error('Get rural trainings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/agricultura/capacitacoes
 * Criar nova capacitação rural
 */
router.post(
  '/capacitacoes',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      console.log('\n========== POST /api/admin/secretarias/agricultura/capacitacoes ==========');
      console.log('[POST /capacitacoes] TenantId:');
      console.log('[POST /capacitacoes] Body:', JSON.stringify(req.body, null, 2));

      const {
        title,
        trainingType,
        description,
        objectives,
        targetAudience,
        requirements,
        certificate,
        startDate,
        endDate,
        duration,
        instructor,
        maxParticipants,
        location,
        materials,
        cost,
        schedule,
        content,
        status,
        formSchema,
        requiredDocuments
        } = req.body;

      console.log('[POST /capacitacoes] Campos extraídos:', {
        title,
        trainingType,
        description,
        startDate,
        instructor
        });

      // Validar campos obrigatórios
      if (!title || !trainingType || !description || !startDate || !instructor) {
        console.log('[POST /capacitacoes] ❌ Validação falhou - campos faltando');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Título, tipo, descrição, data de início e instrutor são obrigatórios'
        });
      }

      console.log('[POST /capacitacoes] ✅ Validação passou - criando capacitação...');

      // Criar capacitação rural
      const training = await prisma.ruralTraining.create({
        data: {
                    title,
          trainingType,
          description,
          objectives: objectives || {},
          targetAudience: targetAudience || '',
          requirements: requirements || '',
          certificate: certificate !== undefined ? certificate : false,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          duration: duration ? parseInt(duration) : 0,
          schedule: schedule || {},
          content: content || {},
          instructor,
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : 0,
          location: location || '',
          materials: materials || null,
          cost: cost ? parseFloat(cost) : null,
          status: status || 'ACTIVE',
          customFields: formSchema || null,
          requiredDocuments: requiredDocuments || null
        }
        });

      console.log('[POST /capacitacoes] ✅ Capacitação criada com sucesso:', training.id);
      console.log('========== FIM POST /capacitacoes ==========\n');

      return res.status(201).json({
        success: true,
        data: training,
        message: 'Capacitação rural criada com sucesso'
        });
    } catch (error) {
      console.error('[POST /capacitacoes] ❌ ERROR:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao criar capacitação rural'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/capacitacoes/:id
 * Obter uma capacitação específica
 */
router.get(
  '/capacitacoes/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const training = await prisma.ruralTraining.findFirst({
        where: {
          id
        }
        });

      if (!training) {
        return res.status(404).json({
          success: false,
          error: 'Training not found'
        });
      }

      return res.json({
        success: true,
        data: training
        });
    } catch (error) {
      console.error('Get training error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/capacitacoes/:id
 * Atualizar capacitação rural
 */
router.put(
  '/capacitacoes/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      console.log('\n========== PUT /api/admin/secretarias/agricultura/capacitacoes/:id ==========');
      console.log('[PUT /capacitacoes] TenantId:');
      console.log('[PUT /capacitacoes] ID:', id);
      console.log('[PUT /capacitacoes] Body:', JSON.stringify(req.body, null, 2));

      // Verificar se a capacitação existe
      const existingTraining = await prisma.ruralTraining.findFirst({
        where: {
          id
        }
        });

      if (!existingTraining) {
        console.log('[PUT /capacitacoes] ❌ Capacitação não encontrada');
        return res.status(404).json({
          success: false,
          error: 'Training not found'
        });
      }

      const {
        title,
        trainingType,
        description,
        objectives,
        targetAudience,
        requirements,
        certificate,
        startDate,
        endDate,
        duration,
        instructor,
        maxParticipants,
        location,
        materials,
        cost,
        schedule,
        content,
        status,
        formSchema,
        requiredDocuments
        } = req.body;

      console.log('[PUT /capacitacoes] ✅ Capacitação encontrada - atualizando...');

      // Atualizar capacitação
      const training = await prisma.ruralTraining.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existingTraining.title,
          trainingType: trainingType !== undefined ? trainingType : existingTraining.trainingType,
          description: description !== undefined ? description : existingTraining.description,
          objectives: objectives !== undefined ? objectives : existingTraining.objectives,
          targetAudience: targetAudience !== undefined ? targetAudience : existingTraining.targetAudience,
          requirements: requirements !== undefined ? requirements : existingTraining.requirements,
          certificate: certificate !== undefined ? certificate : existingTraining.certificate,
          startDate: startDate !== undefined ? new Date(startDate) : existingTraining.startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingTraining.endDate,
          duration: duration !== undefined ? parseInt(duration) : existingTraining.duration,
          schedule: schedule !== undefined ? schedule : existingTraining.schedule,
          content: content !== undefined ? content : existingTraining.content,
          instructor: instructor !== undefined ? instructor : existingTraining.instructor,
          maxParticipants: maxParticipants !== undefined ? parseInt(maxParticipants) : existingTraining.maxParticipants,
          location: location !== undefined ? location : existingTraining.location,
          materials: materials !== undefined ? materials : existingTraining.materials,
          cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : existingTraining.cost,
          status: status !== undefined ? status : existingTraining.status,
          customFields: formSchema !== undefined ? formSchema : existingTraining.customFields,
          requiredDocuments: requiredDocuments !== undefined ? requiredDocuments : existingTraining.requiredDocuments
        }
        });

      console.log('[PUT /capacitacoes] ✅ Capacitação atualizada com sucesso:', training.id);
      console.log('========== FIM PUT /capacitacoes ==========\n');

      return res.json({
        success: true,
        data: training,
        message: 'Capacitação rural atualizada com sucesso'
        });
    } catch (error) {
      console.error('[PUT /capacitacoes] ❌ ERROR:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao atualizar capacitação rural'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/agricultura/capacitacoes/:id
 * Deletar capacitação rural
 */
router.delete(
  '/capacitacoes/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      // Verificar se existe
      const training = await prisma.ruralTraining.findFirst({
        where: {
          id
        }
        });

      if (!training) {
        return res.status(404).json({
          success: false,
          error: 'Training not found'
        });
      }

      // Deletar
      await prisma.ruralTraining.delete({
        where: { id }
        });

      return res.json({
        success: true,
        message: 'Capacitação deletada com sucesso'
        });
    } catch (error) {
      console.error('Delete training error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/CADASTRO_PRODUTOR/pending
 * Listar protocolos de cadastro de produtor pendentes de aprovação
 */
router.get(
  '/CADASTRO_PRODUTOR/pending',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      console.log('\n========== GET /api/admin/secretarias/agricultura/CADASTRO_PRODUTOR/pending ==========');
      console.log('[GET /pending] TenantId:');
      console.log('[GET /pending] Page:', page, 'Limit:', limit);

      // Buscar protocolos VINCULADOS (protocolo criado + entidade criada)
      // que têm produtor rural com status PENDING_APPROVAL
      const protocolsData = await prisma.protocolSimplified.findMany({
        where: {
                    moduleType: 'CADASTRO_PRODUTOR',
          status: {
            in: [ProtocolStatus.VINCULADO, ProtocolStatus.ATUALIZACAO], // Protocolos aguardando aprovação
          }
        },
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
              name: true
        }
      }
        },
        orderBy: {
          createdAt: 'desc'
        }
        });

      console.log(`[GET /pending] Found ${protocolsData.length} protocols with VINCULADO/ATUALIZACAO status`);

      // Filtrar apenas protocolos cujo produtor rural está PENDING
      const protocolIds = protocolsData.map(p => p.id);
      console.log('[GET /pending] Protocol IDs:', protocolIds);

      const pendingProducers = await prisma.ruralProducer.findMany({
        where: {
          protocolId: { in: protocolIds },
          status: 'PENDING',
          isActive: false, // Ainda não ativado
        },
        select: {
          protocolId: true,
          name: true,
          status: true,
          isActive: true
        }
      });

      console.log('[GET /pending] Pending producers found:', pendingProducers);

      const pendingProtocolIds = new Set(pendingProducers.map(p => p.protocolId));
      const protocols = protocolsData.filter(p => pendingProtocolIds.has(p.id));

      // Paginar os resultados
      const total = protocols.length;
      const paginatedProtocols = protocols.slice(skip, skip + limit);

      const [_, totalCount] = await Promise.all([
        Promise.resolve(paginatedProtocols),
        Promise.resolve(total),
      ]);

      console.log(`[GET /pending] Final result: ${paginatedProtocols.length} pending protocols (total: ${total})`);

      return res.json({
        data: paginatedProtocols,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
        });
    } catch (error) {
      console.error('Get pending rural producers error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

// ============================================================================
// PROGRAMAS RURAIS - CRUD COMPLETO
// ============================================================================

/**
 * GET /api/admin/secretarias/agricultura/programas
 * Listar todos os programas rurais
 */
router.get(
  '/programas',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const programs = await prisma.ruralProgram.findMany({
                orderBy: { createdAt: 'desc' }
        });

      return res.json({
        success: true,
        data: programs,
        total: programs.length
        });
    } catch (error) {
      console.error('Erro ao listar programas:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/programas/:id
 * Visualizar programa rural individual
 */
router.get(
  '/programas/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const program = await prisma.ruralProgram.findFirst({
        where: {
          id
        }
        });

      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Programa não encontrado'
        });
      }

      return res.json({
        success: true,
        data: program
        });
    } catch (error) {
      console.error('Erro ao buscar programa:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/agricultura/programas
 * Criar novo programa rural
 */
router.post(
  '/programas',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const {
        name,
        programType,
        description,
        startDate,
        endDate,
        budget,
        coordinator,
        targetAudience,
        maxParticipants,
        status,
        formSchema,
        requiredDocuments,
        enrollmentSettings
        } = req.body;

      // Validações básicas
      if (!name || !programType || !description || !startDate || !coordinator) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios faltando',
          message: 'Nome, tipo, descrição, data de início e coordenador são obrigatórios'
        });
      }

      // Criar programa
      const program = await prisma.ruralProgram.create({
        data: {
                    name,
          programType,
          description,
          objectives: {}, // JSON vazio por padrão
          targetAudience: targetAudience || '',
          requirements: {}, // JSON vazio por padrão
          benefits: {}, // JSON vazio por padrão
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          budget: budget || null,
          coordinator,
          maxParticipants: maxParticipants || null,
          currentParticipants: 0,
          status: status || 'PLANNED',
          customFields: formSchema || null, // Salvar formSchema como customFields
          requiredDocuments: requiredDocuments || null,
          enrollmentSettings: enrollmentSettings || null
        }
        });

      console.log('✅ Programa criado:', program.id);
      console.log('   - Nome:', program.name);
      console.log('   - Campos personalizados:', formSchema ? formSchema.length : 0);
      console.log('   - Documentos exigidos:', requiredDocuments ? requiredDocuments.length : 0);

      return res.status(201).json({
        success: true,
        data: program,
        message: 'Programa criado com sucesso'
        });
    } catch (error) {
      console.error('Erro ao criar programa:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao criar programa'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/programas/:id
 * Atualizar programa rural existente
 */
router.put(
  '/programas/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      const {
        name,
        programType,
        description,
        startDate,
        endDate,
        budget,
        coordinator,
        targetAudience,
        maxParticipants,
        status,
        formSchema,
        requiredDocuments,
        enrollmentSettings
        } = req.body;

      // Verificar se programa existe
      const existing = await prisma.ruralProgram.findFirst({
        where: { id }
        });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Programa não encontrado'
        });
      }

      // Atualizar programa
      const program = await prisma.ruralProgram.update({
        where: { id },
        data: {
          name: name || existing.name,
          programType: programType || existing.programType,
          description: description || existing.description,
          targetAudience: targetAudience !== undefined ? targetAudience : existing.targetAudience,
          startDate: startDate ? new Date(startDate) : existing.startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
          budget: budget !== undefined ? budget : existing.budget,
          coordinator: coordinator || existing.coordinator,
          maxParticipants: maxParticipants !== undefined ? maxParticipants : existing.maxParticipants,
          status: status || existing.status,
          customFields: formSchema !== undefined ? formSchema : existing.customFields,
          requiredDocuments: requiredDocuments !== undefined ? requiredDocuments : existing.requiredDocuments,
          enrollmentSettings: enrollmentSettings !== undefined ? enrollmentSettings : existing.enrollmentSettings
        }
        });

      console.log('✅ Programa atualizado:', program.id);
      console.log('   - Nome:', program.name);
      console.log('   - Campos personalizados:', formSchema ? formSchema.length : 'não alterado');
      console.log('   - Documentos exigidos:', requiredDocuments ? requiredDocuments.length : 'não alterado');

      return res.json({
        success: true,
        data: program,
        message: 'Programa atualizado com sucesso'
        });
    } catch (error) {
      console.error('Erro ao atualizar programa:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao atualizar programa'
        });
    }
  }
);

/**
 * DELETE /api/admin/secretarias/agricultura/programas/:id
 * Excluir programa rural
 */
router.delete(
  '/programas/:id',
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id } = req.params;

      // Verificar se programa existe
      const existing = await prisma.ruralProgram.findFirst({
        where: { id }
        });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Programa não encontrado'
        });
      }

      // Deletar programa
      await prisma.ruralProgram.delete({
        where: { id }
        });

      console.log('✅ Programa deletado:', id);

      return res.json({
        success: true,
        message: 'Programa excluído com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar programa:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao deletar programa'
        });
    }
  }
);

// ============================================================================
// INSCRIÇÕES EM PROGRAMAS - GESTÃO
// ============================================================================

/**
 * GET /api/admin/secretarias/agricultura/programas/:id/enrollments
 * Listar inscrições de um programa com filtros
 */
router.get(
  '/programas/:id/enrollments',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id: programId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { programId };

      if (status && status !== 'all') {
        where.status = status;
      }

      const [enrollments, total, stats] = await Promise.all([
        prisma.ruralProgramEnrollment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                phone: true
        }
      },
            protocol: {
              select: {
                id: true,
                number: true,
                status: true,
                createdAt: true
        }
      }
        }
        }),
        prisma.ruralProgramEnrollment.count({ where }),
        prisma.ruralProgramEnrollment.groupBy({
          by: ['status'],
          where: { programId },
          _count: { id: true }
        }),
      ]);

      const statusCount = {
        total,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0
        };

      stats.forEach((s) => {
        const count = s._count?.id || 0;
        if (s.status === 'PENDING') statusCount.pending = count;
        else if (s.status === 'APPROVED') statusCount.approved = count;
        else if (s.status === 'REJECTED') statusCount.rejected = count;
        else if (s.status === 'CANCELLED') statusCount.cancelled = count;
      });

      return res.json({
        success: true,
        data: enrollments,
        stats: statusCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
        });
    } catch (error) {
      console.error('Get program enrollments error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar inscrições'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/programas/:programId/enrollments/:enrollmentId/approve
 * Aprovar inscrição em programa
 */
router.put(
  '/programas/:programId/enrollments/:enrollmentId/approve',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { programId, enrollmentId } = req.params;
      const { adminNotes, startDate } = req.body;

      // Verificar se inscrição existe
      const enrollment = await prisma.ruralProgramEnrollment.findFirst({
        where: {
          id: enrollmentId,
          programId
        },
        include: {
          protocol: true
        }
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Inscrição não encontrada'
        });
      }

      if (enrollment.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Inscrição não está pendente'
        });
      }

      // Atualizar inscrição e protocolo em transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atualizar inscrição
        const updatedEnrollment = await tx.ruralProgramEnrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'APPROVED',
            approvedDate: new Date(),
            adminNotes: adminNotes || null,
            startDate: startDate ? new Date(startDate) : null
        }
        });

        // 2. Atualizar protocolo para CONCLUIDO usando motor centralizado
        if (enrollment.protocolId) {
          // Nota: Executado fora da transação após commit
          // para permitir validações do engine
        }

        return updatedEnrollment;
      });

      // Atualizar status do protocolo usando motor centralizado
      if (enrollment.protocolId) {
        await protocolStatusEngine.updateStatus({
          protocolId: enrollment.protocolId,
          newStatus: ProtocolStatus.CONCLUIDO,
          actorId: authReq.user.id,
          actorRole: authReq.user.role,
          comment: adminNotes || 'Inscrição aprovada pela secretaria de agricultura',
          metadata: {
            enrollmentId: enrollment.id,
            programId: programId,
            action: 'enrollment_approval'
          }
        });
      }

      return res.json({
        success: true,
        data: result,
        message: 'Inscrição aprovada com sucesso'
        });
    } catch (error) {
      console.error('Approve enrollment error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao aprovar inscrição'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/programas/:programId/enrollments/:enrollmentId/reject
 * Rejeitar inscrição em programa
 */
router.put(
  '/programas/:programId/enrollments/:enrollmentId/reject',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { programId, enrollmentId } = req.params;
      const { rejectionReason, adminNotes } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          error: 'Motivo da rejeição é obrigatório'
        });
      }

      // Verificar se inscrição existe
      const enrollment = await prisma.ruralProgramEnrollment.findFirst({
        where: {
          id: enrollmentId,
          programId
        }
        });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Inscrição não encontrada'
        });
      }

      if (enrollment.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Inscrição não está pendente'
        });
      }

      // Atualizar inscrição e protocolo em transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Atualizar inscrição
        const updatedEnrollment = await tx.ruralProgramEnrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'REJECTED',
            rejectedDate: new Date(),
            rejectionReason,
            adminNotes: adminNotes || null
        }
        });

        // 2. Atualizar protocolo para PENDENCIA usando motor centralizado
        if (enrollment.protocolId) {
          // Nota: Executado fora da transação após commit
        }

        return updatedEnrollment;
      });

      // Atualizar status do protocolo usando motor centralizado
      if (enrollment.protocolId) {
        await protocolStatusEngine.updateStatus({
          protocolId: enrollment.protocolId,
          newStatus: ProtocolStatus.PENDENCIA,
          actorId: authReq.user.id,
          actorRole: authReq.user.role,
          comment: `Inscrição rejeitada: ${rejectionReason}`,
          reason: rejectionReason,
          metadata: {
            enrollmentId: enrollment.id,
            programId: programId,
            action: 'enrollment_rejection',
            adminNotes: adminNotes
          }
        });
      }

      return res.json({
        success: true,
        data: result,
        message: 'Inscrição rejeitada'
        });
    } catch (error) {
      console.error('Reject enrollment error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao rejeitar inscrição'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/programas/:programId/enrollments/:enrollmentId
 * Visualizar detalhes de uma inscrição
 */
router.get(
  '/programas/:programId/enrollments/:enrollmentId',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { programId, enrollmentId } = req.params;

      const enrollment = await prisma.ruralProgramEnrollment.findFirst({
        where: {
          id: enrollmentId,
          programId
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true
        }
      },
          protocol: {
            include: {
              documentFiles: {
                orderBy: { createdAt: 'desc' }
      },
              interactions: {
                where: { type: 'PENDING_CREATED' },
                orderBy: { createdAt: 'desc' },
                take: 10
        }
        }
        },
          program: {
            select: {
              id: true,
              name: true,
              programType: true,
              customFields: true,
              requiredDocuments: true
        }
      }
        }
        });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Inscrição não encontrada'
        });
      }

      return res.json({
        success: true,
        data: enrollment
        });
    } catch (error) {
      console.error('Get enrollment details error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar detalhes da inscrição'
        });
    }
  }
);

/**
 * GET /api/admin/secretarias/agricultura/programas/:id/enrollments/export
 * Exportar relatório de inscrições em CSV/Excel
 */
router.get(
  '/programas/:id/enrollments/export',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { id: programId } = req.params;
      const { format = 'csv', status } = req.query;

      const where: any = { programId };
      if (status && status !== 'all') {
        where.status = status;
      }

      const enrollments = await prisma.ruralProgramEnrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          citizen: {
            select: {
              name: true,
              cpf: true,
              email: true,
              phone: true
        }
      },
          protocol: {
            select: {
              number: true,
              status: true
        }
      }
        }
        });

      // Gerar CSV
      const csvHeader = 'Nome,CPF,Email,Telefone,Status,Protocolo,Data Inscrição,Data Aprovação\n';
      const csvRows = enrollments.map((e) => {
        return [
          e.citizen?.name || '',
          e.citizen?.cpf || '',
          e.citizen?.email || '',
          e.citizen?.phone || '',
          e.status,
          e.protocol?.number || '',
          new Date(e.enrollmentDate).toLocaleDateString('pt-BR'),
          e.approvedDate ? new Date(e.approvedDate).toLocaleDateString('pt-BR') : '',
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inscricoes-programa-${programId}.csv`);
      return res.send(csv);
    } catch (error) {
      console.error('Export enrollments error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao exportar inscrições'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/programas/:programId/enrollments/:enrollmentId/documents/:documentId/approve
 * Aprovar documento individual
 */
router.put(
  '/programas/:programId/enrollments/:enrollmentId/documents/:documentId/approve',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { programId, enrollmentId, documentId } = req.params;
      const { notes } = req.body;

      // Verificar se a inscrição existe
      const enrollment = await prisma.ruralProgramEnrollment.findFirst({
        where: { id: enrollmentId, programId },
        include: { protocol: true }
      });

      if (!enrollment || !enrollment.protocolId) {
        return res.status(404).json({
          success: false,
          error: 'Inscrição não encontrada'
        });
      }

      // Aprovar documento
      const document = await prisma.protocolDocument.update({
        where: { id: documentId },
        data: {
          status: 'APPROVED',
          validatedAt: new Date(),
          validatedBy: authReq.user?.id ?? undefined
        }
        });

      // Registrar interação no protocolo
      await prisma.protocolInteraction.create({
        data: {
          protocolId: enrollment.protocolId,
          type: 'NOTE',
          authorType: 'SERVER',
          authorId: authReq.user?.id ?? undefined,
          authorName: authReq.user?.name || 'Sistema',
          message: `Documento aprovado: ${document.documentType}${notes ? ` - ${notes}` : ''}`,
          metadata: {
            documentId,
            documentType: document.documentType,
            action: 'APPROVE',
            notes
        }
        }
        });

      return res.json({
        success: true,
        message: 'Documento aprovado com sucesso',
        data: document
        });
    } catch (error) {
      console.error('Approve document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao aprovar documento'
        });
    }
  }
);

/**
 * PUT /api/admin/secretarias/agricultura/programas/:programId/enrollments/:enrollmentId/documents/:documentId/reject
 * Rejeitar documento individual
 */
router.put(
  '/programas/:programId/enrollments/:enrollmentId/documents/:documentId/reject',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { programId, enrollmentId, documentId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Motivo da rejeição é obrigatório'
        });
      }

      // Verificar se a inscrição existe
      const enrollment = await prisma.ruralProgramEnrollment.findFirst({
        where: { id: enrollmentId, programId },
        include: { protocol: true }
      });

      if (!enrollment || !enrollment.protocolId) {
        return res.status(404).json({
          success: false,
          error: 'Inscrição não encontrada'
        });
      }

      // Rejeitar documento
      const document = await prisma.protocolDocument.update({
        where: { id: documentId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: reason
        }
        });

      // Registrar interação no protocolo
      await prisma.protocolInteraction.create({
        data: {
          protocolId: enrollment.protocolId,
          type: 'NOTE',
          authorType: 'SERVER',
          authorId: authReq.user?.id ?? undefined,
          authorName: authReq.user?.name || 'Sistema',
          message: `Documento rejeitado: ${document.documentType} - Motivo: ${reason}`,
          metadata: {
            documentId,
            documentType: document.documentType,
            action: 'REJECT',
            reason
        }
        }
        });

      return res.json({
        success: true,
        message: 'Documento rejeitado',
        data: document
        });
    } catch (error) {
      console.error('Reject document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao rejeitar documento'
        });
    }
  }
);

/**
 * POST /api/admin/secretarias/agricultura/programas/:programId/enrollments/:enrollmentId/pendency
 * Criar pendência no protocolo
 */
router.post(
  '/programas/:programId/enrollments/:enrollmentId/pendency',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;      const { programId, enrollmentId } = req.params;
      const { description, pendencyItems } = req.body;

      if (!description) {
        return res.status(400).json({
          success: false,
          error: 'Descrição da pendência é obrigatória'
        });
      }

      // Verificar se a inscrição existe
      const enrollment = await prisma.ruralProgramEnrollment.findFirst({
        where: { id: enrollmentId, programId },
        include: { protocol: true }
      });

      if (!enrollment || !enrollment.protocolId) {
        return res.status(404).json({
          success: false,
          error: 'Inscrição não encontrada'
        });
      }

      // Criar pendência como interação
      const interaction = await prisma.protocolInteraction.create({
        data: {
          protocolId: enrollment.protocolId,
          type: 'PENDING_CREATED',
          authorType: 'SERVER',
          authorId: authReq.user?.id ?? undefined,
          authorName: authReq.user?.name || 'Sistema',
          message: description,
          metadata: {
            enrollmentId,
            pendencyItems: pendencyItems || [],
            createdBy: authReq.user?.name || 'Admin'
        }
        }
        });

      // Atualizar status do protocolo para PENDENCIA usando motor centralizado
      await protocolStatusEngine.updateStatus({
        protocolId: enrollment.protocolId,
        newStatus: 'PENDENCIA',
        actorId: authReq.user.id,
        actorRole: authReq.user.role,
        comment: `Pendência criada: ${description}`,
        metadata: {
          enrollmentId,
          pendencyItems: pendencyItems || [],
          action: 'pendency_created'
        }
      });

      return res.json({
        success: true,
        message: 'Pendência criada com sucesso',
        data: interaction
        });
    } catch (error) {
      console.error('Create pendency error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao criar pendência'
        });
    }
  }
);

export default router;
