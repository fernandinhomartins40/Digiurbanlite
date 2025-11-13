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

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: 'AGRICULTURA' }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }

      // Programas rurais são entidades administrativas, não protocolos de cidadãos
      // Vamos criar como registros administrativos usando customData table ou retornar erro
      // Por enquanto, retornar resposta indicando que deve usar nova API
      console.log('[POST /programas] ⚠️  Programas rurais devem ser criados via nova API de gerenciamento');

      return res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Programas rurais devem ser gerenciados via /api/admin/tab-modules/agricultura/PROGRAMA_RURAL',
        migrationNote: 'Esta funcionalidade foi migrada para o sistema unificado de gerenciamento'
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
      const authReq = req as AuthenticatedRequest;
      const { page = 1, limit = 20, trainingType } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        moduleType: 'INSCRICAO_CURSO_RURAL'
      };

      const [protocols, total] = await Promise.all([
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

      // Criar protocolo com dados da capacitação em customData
      const protocol = await prisma.protocolSimplified.create({
        data: {
          citizenId: authReq.user!.id,
          serviceId: 'agricultura-capacitacao',
          departmentId: 'agricultura',
          number: `AGRI-CAP-${Date.now()}`,
          title: `Capacitação Rural - ${title}`,
          moduleType: 'INSCRICAO_CURSO_RURAL',
          status: ProtocolStatus.CONCLUIDO,
          customData: {
            title,
            trainingType,
            description,
            objectives: objectives || {},
            targetAudience: targetAudience || '',
            requirements: requirements || '',
            certificate: certificate !== undefined ? certificate : false,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
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
            requiredDocuments: requiredDocuments || null,
            _meta: {
              entityType: 'INSCRICAO_CURSO_RURAL',
              status: 'ACTIVE',
              isActive: true,
              createdAt: new Date().toISOString(),
              createdBy: authReq.user?.id
            }
          }
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
          }
        }
      });

      console.log('[POST /capacitacoes] ✅ Capacitação criada com sucesso:', protocol.id);
      console.log('========== FIM POST /capacitacoes ==========\n');

      const trainingData = {
        id: protocol.id,
        protocolNumber: protocol.number,
        status: protocol.status,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
        citizen: protocol.citizen,
        ...(protocol.customData as object)
      };

      return res.status(201).json({
        success: true,
        data: trainingData,
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

      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'INSCRICAO_CURSO_RURAL'
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
          error: 'Training not found'
        });
      }

      const trainingData = {
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
        data: trainingData
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

      // Verificar se o protocolo existe
      const existingProtocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'INSCRICAO_CURSO_RURAL'
        }
      });

      if (!existingProtocol) {
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

      // Preparar dados de atualização
      const currentData = (existingProtocol.customData as Record<string, any>) || {};
      const updateData: Record<string, any> = {};

      if (title !== undefined) updateData.title = title;
      if (trainingType !== undefined) updateData.trainingType = trainingType;
      if (description !== undefined) updateData.description = description;
      if (objectives !== undefined) updateData.objectives = objectives;
      if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
      if (requirements !== undefined) updateData.requirements = requirements;
      if (certificate !== undefined) updateData.certificate = certificate;
      if (startDate !== undefined) updateData.startDate = new Date(startDate).toISOString();
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate).toISOString() : null;
      if (duration !== undefined) updateData.duration = parseInt(duration);
      if (schedule !== undefined) updateData.schedule = schedule;
      if (content !== undefined) updateData.content = content;
      if (instructor !== undefined) updateData.instructor = instructor;
      if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants);
      if (location !== undefined) updateData.location = location;
      if (materials !== undefined) updateData.materials = materials;
      if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
      if (status !== undefined) updateData.status = status;
      if (formSchema !== undefined) updateData.customFields = formSchema;
      if (requiredDocuments !== undefined) updateData.requiredDocuments = requiredDocuments;

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
      const protocol = await prisma.protocolSimplified.update({
        where: { id },
        data: {
          customData: updatedCustomData,
          title: title ? `Capacitação Rural - ${title}` : existingProtocol.title
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
          }
        }
      });

      console.log('[PUT /capacitacoes] ✅ Capacitação atualizada com sucesso:', protocol.id);
      console.log('========== FIM PUT /capacitacoes ==========\n');

      const trainingData = {
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
        data: trainingData,
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
      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id,
          moduleType: 'INSCRICAO_CURSO_RURAL'
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Training not found'
        });
      }

      // Cancelar protocolo (soft delete)
      await prisma.protocolSimplified.update({
        where: { id },
        data: {
          status: ProtocolStatus.CANCELADO
        }
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

      // Buscar protocolos de produtores com status PENDING_APPROVAL em customData._meta
      const allProtocols = await prisma.protocolSimplified.findMany({
        where: {
          moduleType: 'CADASTRO_PRODUTOR'
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

      console.log(`[GET /pending] Found ${allProtocols.length} CADASTRO_PRODUTOR protocols`);

      // Filtrar apenas protocolos cujo _meta.status é PENDING_APPROVAL
      const pendingProtocols = allProtocols.filter(p => {
        const customData = p.customData as any;
        return customData?._meta?.status === 'PENDING_APPROVAL' && customData?._meta?.isActive === false;
      });

      console.log(`[GET /pending] Found ${pendingProtocols.length} pending producers`);

      // Paginar os resultados
      const total = pendingProtocols.length;
      const paginatedProtocols = pendingProtocols.slice(skip, skip + limit);

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

export default router;
