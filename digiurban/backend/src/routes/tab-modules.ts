/**
 * @file tab-modules.ts
 * @description Rotas unificadas para sistema de abas dos módulos
 * @module routes/tab-modules
 *
 * Este arquivo implementa rotas genéricas que funcionam para TODOS os módulos
 * baseados no sistema de abas (BaseModuleView).
 *
 * Endpoints disponíveis:
 * - GET /api/:department/:module/list - Listagem
 * - GET /api/:department/:module/approval - Fila de aprovação
 * - GET /api/:department/:module/dashboard - Dados do dashboard
 * - GET /api/:department/:module/management - Entidades gerenciáveis
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { NEEDS_CITIZEN_ACTION } from '../config/protocol-status.config'; // ✅ FASE 2
import { UserRole, ProtocolStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { getManagementConfig } from './management-configs';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(adminAuthMiddleware);

// ============================================================================
// ANÁLISE DE DADOS CUSTOMIZADOS POR MÓDULO
// ============================================================================

interface ProtocolData {
  id: string;
  status: string;
  customData: any;
  createdAt: Date;
}

function analyzeCustomData(moduleType: string, protocols: ProtocolData[]) {
  const kpis: any[] = [];
  const charts: any[] = [];
  const trends: any[] = [];

  if (protocols.length === 0) {
    return { kpis, charts, trends };
  }

  // Análises específicas por módulo
  switch (moduleType) {
    case 'CADASTRO_PRODUTOR':
      return analyzeProdutorRural(protocols);

    case 'CADASTRO_PACIENTE':
      return analyzePacientes(protocols);

    case 'CADASTRO_ESTUDANTE':
      return analyzeEstudantes(protocols);

    // Adicione mais módulos conforme necessário
    default:
      return { kpis, charts, trends };
  }
}

function analyzeProdutorRural(protocols: ProtocolData[]) {
  const kpis: any[] = [];
  const charts: any[] = [];

  // Análise de tipo de produtor
  const tiposProdutor: Record<string, number> = {};
  const tiposPropriedade: Record<string, number> = {};
  const rendaFamiliar: Record<string, number> = {};
  let totalAreaHectares = 0;
  let produtoresComDAP = 0;
  let produtoresComCertificacao = 0;

  protocols.forEach(p => {
    const data = p.customData;

    // Tipo de produtor
    if (data?.tipoProdutor) {
      tiposProdutor[data.tipoProdutor] = (tiposProdutor[data.tipoProdutor] || 0) + 1;
    }

    // Tipo de propriedade
    if (data?.tipoPropriedade) {
      tiposPropriedade[data.tipoPropriedade] = (tiposPropriedade[data.tipoPropriedade] || 0) + 1;
    }

    // Renda familiar
    if (data?.rendaFamiliar) {
      rendaFamiliar[data.rendaFamiliar] = (rendaFamiliar[data.rendaFamiliar] || 0) + 1;
    }

    // Área total
    if (data?.areaTotalHectares) {
      totalAreaHectares += Number(data.areaTotalHectares) || 0;
    }

    // DAP
    if (data?.dap) {
      produtoresComDAP++;
    }

    // Certificação
    if (data?.possuiCertificacaoOrganica) {
      produtoresComCertificacao++;
    }
  });

  // KPIs
  kpis.push({
    label: 'Área Total (hectares)',
    value: totalAreaHectares,
    format: 'number',
    icon: 'Map',
    color: 'green',
  });

  kpis.push({
    label: 'Média de Área',
    value: protocols.length > 0 ? Math.round(totalAreaHectares / protocols.length) : 0,
    format: 'number',
    icon: 'TrendingUp',
    color: 'blue',
  });

  kpis.push({
    label: 'Com DAP',
    value: produtoresComDAP,
    format: 'number',
    icon: 'CheckCircle',
    color: 'green',
  });

  kpis.push({
    label: 'Com Certificação Orgânica',
    value: produtoresComCertificacao,
    format: 'number',
    icon: 'Award',
    color: 'purple',
  });

  // Charts
  charts.push({
    type: 'pie',
    title: 'Distribuição por Tipo de Produtor',
    data: Object.entries(tiposProdutor).map(([key, value]) => ({
      name: key,
      value,
    })),
  });

  charts.push({
    type: 'pie',
    title: 'Distribuição por Tipo de Propriedade',
    data: Object.entries(tiposPropriedade).map(([key, value]) => ({
      name: key,
      value,
    })),
  });

  charts.push({
    type: 'bar',
    title: 'Distribuição por Renda Familiar',
    data: Object.entries(rendaFamiliar).map(([key, value]) => ({
      name: key,
      value,
    })),
  });

  return { kpis, charts, trends: [] };
}

function analyzePacientes(protocols: ProtocolData[]) {
  // TODO: Implementar análise para pacientes
  return { kpis: [], charts: [], trends: [] };
}

function analyzeEstudantes(protocols: ProtocolData[]) {
  // TODO: Implementar análise para estudantes
  return { kpis: [], charts: [], trends: [] };
}

// ============================================================================
// DEFINIÇÃO DE ENTIDADES GERENCIÁVEIS POR MÓDULO
// ============================================================================

function getManagementEntities(moduleType: string) {
  switch (moduleType) {
    case 'CADASTRO_PRODUTOR':
      return {
        entities: [
          {
            name: 'programas_rurais',
            label: 'Programas Rurais',
            description: 'Gerenciar programas e benefícios para produtores rurais',
            icon: 'Briefcase',
            fields: [
              { name: 'nome', label: 'Nome do Programa', type: 'text', required: true },
              { name: 'descricao', label: 'Descrição', type: 'textarea', required: true },
              { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
                { value: 'PAA', label: 'PAA - Programa de Aquisição de Alimentos' },
                { value: 'PNAE', label: 'PNAE - Programa Nacional de Alimentação Escolar' },
                { value: 'PRONAF', label: 'PRONAF - Programa Nacional de Fortalecimento da Agricultura Familiar' },
                { value: 'ATER', label: 'ATER - Assistência Técnica e Extensão Rural' },
                { value: 'OUTROS', label: 'Outros' },
              ]},
              { name: 'ativo', label: 'Ativo', type: 'boolean', required: true },
              { name: 'dataInicio', label: 'Data de Início', type: 'date', required: false },
              { name: 'dataFim', label: 'Data de Fim', type: 'date', required: false },
            ]
          },
          {
            name: 'cursos_capacitacoes',
            label: 'Cursos e Capacitações',
            description: 'Gerenciar cursos e treinamentos para produtores',
            icon: 'GraduationCap',
            fields: [
              { name: 'nome', label: 'Nome do Curso', type: 'text', required: true },
              { name: 'descricao', label: 'Descrição', type: 'textarea', required: true },
              { name: 'instrutor', label: 'Instrutor', type: 'text', required: true },
              { name: 'cargaHoraria', label: 'Carga Horária', type: 'number', required: true },
              { name: 'vagas', label: 'Número de Vagas', type: 'number', required: true },
              { name: 'dataInicio', label: 'Data de Início', type: 'date', required: true },
              { name: 'dataFim', label: 'Data de Fim', type: 'date', required: true },
              { name: 'local', label: 'Local', type: 'text', required: true },
            ]
          },
          {
            name: 'insumos_sementes',
            label: 'Insumos e Sementes',
            description: 'Controle de estoque de sementes e insumos',
            icon: 'Package',
            fields: [
              { name: 'nome', label: 'Nome do Produto', type: 'text', required: true },
              { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
                { value: 'SEMENTE', label: 'Semente' },
                { value: 'FERTILIZANTE', label: 'Fertilizante' },
                { value: 'MUDAS', label: 'Mudas' },
                { value: 'FERRAMENTAS', label: 'Ferramentas' },
                { value: 'OUTROS', label: 'Outros' },
              ]},
              { name: 'quantidade', label: 'Quantidade em Estoque', type: 'number', required: true },
              { name: 'unidade', label: 'Unidade', type: 'select', required: true, options: [
                { value: 'KG', label: 'Quilogramas (kg)' },
                { value: 'LITROS', label: 'Litros (L)' },
                { value: 'UNIDADES', label: 'Unidades' },
                { value: 'SACAS', label: 'Sacas' },
              ]},
              { name: 'fornecedor', label: 'Fornecedor', type: 'text', required: false },
              { name: 'validade', label: 'Data de Validade', type: 'date', required: false },
            ]
          }
        ]
      };

    case 'CADASTRO_PACIENTE':
      return {
        entities: [
          {
            name: 'campanhas_saude',
            label: 'Campanhas de Saúde',
            description: 'Gerenciar campanhas de vacinação e prevenção',
            icon: 'Heart',
            fields: [
              { name: 'nome', label: 'Nome da Campanha', type: 'text', required: true },
              { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
                { value: 'VACINACAO', label: 'Vacinação' },
                { value: 'PREVENCAO', label: 'Prevenção' },
                { value: 'EXAMES', label: 'Exames' },
              ]},
              { name: 'descricao', label: 'Descrição', type: 'textarea', required: true },
              { name: 'dataInicio', label: 'Data de Início', type: 'date', required: true },
              { name: 'dataFim', label: 'Data de Fim', type: 'date', required: true },
              { name: 'publicoAlvo', label: 'Público Alvo', type: 'text', required: true },
            ]
          },
          {
            name: 'medicamentos',
            label: 'Estoque de Medicamentos',
            description: 'Controle de estoque da farmácia básica',
            icon: 'Pill',
            fields: [
              { name: 'nome', label: 'Nome do Medicamento', type: 'text', required: true },
              { name: 'principioAtivo', label: 'Princípio Ativo', type: 'text', required: true },
              { name: 'quantidade', label: 'Quantidade', type: 'number', required: true },
              { name: 'validade', label: 'Data de Validade', type: 'date', required: true },
              { name: 'lote', label: 'Lote', type: 'text', required: true },
            ]
          }
        ]
      };

    case 'CADASTRO_ESTUDANTE':
      return {
        entities: [
          {
            name: 'turmas',
            label: 'Turmas',
            description: 'Gerenciar turmas e salas de aula',
            icon: 'Users',
            fields: [
              { name: 'nome', label: 'Nome da Turma', type: 'text', required: true },
              { name: 'serie', label: 'Série', type: 'text', required: true },
              { name: 'ano', label: 'Ano Letivo', type: 'number', required: true },
              { name: 'turno', label: 'Turno', type: 'select', required: true, options: [
                { value: 'MATUTINO', label: 'Matutino' },
                { value: 'VESPERTINO', label: 'Vespertino' },
                { value: 'NOTURNO', label: 'Noturno' },
              ]},
              { name: 'capacidade', label: 'Capacidade', type: 'number', required: true },
            ]
          },
          {
            name: 'materiais_escolares',
            label: 'Kits de Material Escolar',
            description: 'Gerenciar distribuição de materiais',
            icon: 'BookOpen',
            fields: [
              { name: 'nome', label: 'Nome do Kit', type: 'text', required: true },
              { name: 'descricao', label: 'Itens Inclusos', type: 'textarea', required: true },
              { name: 'quantidadeDisponivel', label: 'Quantidade Disponível', type: 'number', required: true },
              { name: 'serie', label: 'Série', type: 'text', required: true },
            ]
          }
        ]
      };

    default:
      return {
        entities: []
      };
  }
}

// ============================================================================
// NOTA: Mapeamento MODULE -> MODEL removido
// ============================================================================
// Agora usamos entidades virtuais em customData ao invés de tabelas específicas

// ============================================================================
// ABA DE LISTAGEM - GET /api/:department/:module/list
// ============================================================================

router.get(
  '/:department/:module/list',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { department, module } = req.params;

      // Parâmetros de paginação e filtros
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const search = req.query.search as string;
      const status = req.query.status as string;

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/list`);
      console.log(`  - Page: ${page}, Limit: ${limit}`);
      console.log(`  - Search: ${search || 'none'}, Status: ${status || 'all'}`);

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: department.toUpperCase() }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          message: `Departamento ${department} não encontrado`
        });
      }

      // Construir filtro WHERE baseado em ProtocolSimplified
      const where: any = {
        departmentId: dept.id,
        moduleType: module.toUpperCase()
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { number: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Buscar protocolos
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.protocolSimplified.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
              }
            },
            service: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        }),
        prisma.protocolSimplified.count({ where }),
      ]);

      // Transformar para formato esperado pelo frontend
      const transformedData = data.map(protocol => ({
        id: protocol.id,
        protocol: protocol.number,
        title: protocol.title || `Protocolo ${protocol.number}`,
        description: protocol.description || '',
        status: protocol.status,
        createdAt: protocol.createdAt.toISOString(),
        updatedAt: protocol.updatedAt.toISOString(),
        citizen: protocol.citizen,
        service: protocol.service,
      }));

      const totalPages = Math.ceil(total / limit);

      console.log(`  ✅ Found ${total} protocols, returning ${transformedData.length}`);

      return res.json({
        data: transformedData,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      });

    } catch (error) {
      console.error('[TAB-MODULES] List error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Erro ao buscar dados'
      });
    }
  }
);

// ============================================================================
// ABA DE APROVAÇÃO - GET /api/:department/:module/approval
// ============================================================================

router.get(
  '/:department/:module/approval',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const pendingOnly = req.query.pendingOnly === 'true';

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/approval`);

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: department.toUpperCase() }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }

      // Protocolos pendentes de aprovação
      const where: any = {
        departmentId: dept.id,
        moduleType: module.toUpperCase(),
        status: pendingOnly
          ? ProtocolStatus.VINCULADO
          : { in: [ProtocolStatus.VINCULADO, ...NEEDS_CITIZEN_ACTION] } // ✅ FASE 2: Constante centralizada
      };

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.protocolSimplified.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' }, // Mais antigos primeiro
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
              }
            },
            service: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        }),
        prisma.protocolSimplified.count({ where }),
      ]);

      // Transformar dados para formato esperado pelo frontend
      const transformedData = data.map(protocol => ({
        id: protocol.id,
        protocol: protocol.number,
        title: protocol.title || `Protocolo ${protocol.number}`,
        description: protocol.description || '',
        status: protocol.status,
        requestedBy: protocol.citizen?.name || 'Não informado',
        requestedAt: protocol.createdAt.toISOString(),
        createdAt: protocol.createdAt.toISOString(),
        updatedAt: protocol.updatedAt.toISOString(),
        citizen: protocol.citizen,
        service: protocol.service,
      }));

      console.log(`  ✅ Found ${total} pending approvals`);

      return res.json({
        data: transformedData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error) {
      console.error('[TAB-MODULES] Approval error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// ABA DE DASHBOARD - GET /api/:department/:module/dashboard
// ============================================================================

router.get(
  '/:department/:module/dashboard',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const dateFrom = req.query.dateFrom as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo as string || new Date().toISOString();

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/dashboard`);

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: department.toUpperCase() }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }

      const where = {
        departmentId: dept.id,
        moduleType: module.toUpperCase(),
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      };

      // Buscar todos os protocolos para análise de customData
      const allProtocols = await prisma.protocolSimplified.findMany({
        where,
        select: {
          id: true,
          status: true,
          customData: true,
          createdAt: true,
        },
      });

      const total = allProtocols.length;

      // Estatísticas por status
      const byStatus = allProtocols.reduce((acc: any[], protocol) => {
        const existing = acc.find(item => item.status === protocol.status);
        if (existing) {
          existing._count.id++;
        } else {
          acc.push({ status: protocol.status, _count: { id: 1 } });
        }
        return acc;
      }, []);

      // KPIs básicos
      const kpis = [
        {
          label: 'Total de Solicitações',
          value: total,
          format: 'number',
          icon: 'FileText',
        },
      ];

      // Adicionar KPIs por status
      byStatus.forEach(item => {
        kpis.push({
          label: item.status.replace('_', ' '),
          value: item._count.id,
          format: 'number',
          icon: 'Activity',
        });
      });

      // Métricas específicas por módulo baseadas em customData
      const moduleSpecificMetrics = analyzeCustomData(module.toUpperCase(), allProtocols);

      console.log(`  ✅ Dashboard data: ${total} total protocols`);

      return res.json({
        kpis: [...kpis, ...moduleSpecificMetrics.kpis],
        trends: moduleSpecificMetrics.trends || [],
        distribution: byStatus.map(item => ({
          category: item.status,
          value: item._count.id,
          percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0,
        })),
        charts: moduleSpecificMetrics.charts || [],
      });

    } catch (error) {
      console.error('[TAB-MODULES] Dashboard error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// ABA DE GERENCIAMENTO INTELIGENTE - Gerencia dados dos protocolos
// ============================================================================

// GET /api/:department/:module/management - Obter configuração do módulo
router.get(
  '/:department/:module/management',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/management - Config`);

      const config = getManagementConfig(module.toUpperCase());

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração de gerenciamento não encontrada para este módulo'
        });
      }

      return res.json({
        success: true,
        config,
      });

    } catch (error) {
      console.error('[TAB-MODULES] Management config error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Helper: Aplicar filtros dinâmicos nos protocolos
function applyFilters(where: any, filters: any, searchFields: string[], search?: string) {
  // Busca por texto em múltiplos campos
  if (search && searchFields.length > 0) {
    const searchConditions = searchFields.map(field => ({
      customData: {
        path: `$.${field}`,
        string_contains: search
      }
    }));

    where.OR = searchConditions;
  }

  // Aplicar filtros específicos
  if (filters) {
    try {
      const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;

      Object.keys(parsedFilters).forEach(key => {
        const value = parsedFilters[key];

        // Filtros especiais
        if (value === null || value === undefined) return;

        // Filtro booleano
        if (typeof value === 'boolean') {
          where[`customData.${key}`] = value;
        }
        // Filtro de range
        else if (typeof value === 'object' && (value.$gte !== undefined || value.$lte !== undefined)) {
          if (value.$gte !== undefined) {
            where[`customData.${key}`] = { ...where[`customData.${key}`], gte: value.$gte };
          }
          if (value.$lte !== undefined) {
            where[`customData.${key}`] = { ...where[`customData.${key}`], lte: value.$lte };
          }
        }
        // Filtro de array (contém)
        else if (Array.isArray(value)) {
          where[`customData.${key}`] = { in: value };
        }
        // Filtro simples
        else {
          where[`customData.${key}`] = value;
        }
      });
    } catch (e) {
      console.error('Error parsing filters:', e);
    }
  }

  return where;
}

// GET /api/:department/:module/management/data - Listar dados dos protocolos
router.get(
  '/:department/:module/management/data',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const search = req.query.search as string;
      const filters = req.query.filters as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/management/data`);
      console.log('Filters:', filters);
      console.log('Search:', search);

      // Obter configuração do módulo
      const config = getManagementConfig(module.toUpperCase());
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração não encontrada'
        });
      }

      // Buscar serviço
      const service = await prisma.serviceSimplified.findFirst({
        where: { moduleType: module.toUpperCase() }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      // Construir condições de busca
      let where: any = {
        serviceId: service.id,
        status: { notIn: ['CANCELADO'] }
      };

      // Campos pesquisáveis
      const searchableFields = config.fields
        .filter(f => f.searchable)
        .map(f => f.key);

      // Aplicar filtros
      where = applyFilters(where, filters, searchableFields, search);

      const skip = (page - 1) * limit;

      // Buscar protocolos
      const [protocols, total] = await Promise.all([
        prisma.protocolSimplified.findMany({
          where,
          include: {
            citizen: {
              select: {
                name: true,
                cpf: true,
                email: true,
              }
            },
          },
          skip,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }
        }),
        prisma.protocolSimplified.count({ where })
      ]);

      // Transformar dados
      const data = protocols.map(protocol => ({
        id: protocol.id,
        protocolNumber: protocol.number,
        status: protocol.status,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
        citizen: protocol.citizen,
        ...protocol.customData as object,
      }));

      // Calcular estatísticas rápidas
      const summary = {
        total,
        approved: protocols.filter(p => p.status === 'CONCLUIDO').length,
        pending: protocols.filter(p => p.status === 'PROGRESSO' || p.status === 'PENDENCIA').length,
      };

      return res.json({
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        summary,
      });

    } catch (error) {
      console.error('[TAB-MODULES] Management data error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/:department/:module/management/data/:id - Detalhes de um registro
router.get(
  '/:department/:module/management/data/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`\n[TAB-MODULES] GET /management/data/${id}`);

      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id },
        include: {
          citizen: true,
          service: true,
          department: true,
          documentFiles: true,
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Registro não encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          id: protocol.id,
          protocolNumber: protocol.number,
          status: protocol.status,
          createdAt: protocol.createdAt,
          updatedAt: protocol.updatedAt,
          citizen: protocol.citizen,
          service: protocol.service,
          department: protocol.department,
          documents: protocol.documentFiles,
          interactions: protocol.interactions,
          customData: protocol.customData,
        }
      });

    } catch (error) {
      console.error('[TAB-MODULES] Management detail error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// PUT /api/:department/:module/management/data/:id - Editar customData
router.put(
  '/:department/:module/management/data/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { customData, changeReason } = req.body;
      const userId = (req as any).user?.id;

      console.log(`\n[TAB-MODULES] PUT /management/data/${id}`);

      // Buscar protocolo atual
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Registro não encontrado'
        });
      }

      // Salvar versão anterior (auditoria)
      await prisma.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'STATUS_CHANGED',
          authorType: 'ADMIN',
          authorName: 'Sistema',
          message: changeReason || 'Dados editados via gerenciamento',
          metadata: {
            previousData: protocol.customData,
            newData: customData,
            editedAt: new Date().toISOString(),
            editedBy: userId || 'system',
          }
        }
      });

      // Atualizar customData
      const updated = await prisma.protocolSimplified.update({
        where: { id },
        data: {
          customData,
          updatedAt: new Date(),
        }
      });

      return res.json({
        success: true,
        message: 'Dados atualizados com sucesso',
        data: {
          id: updated.id,
          customData: updated.customData,
          updatedAt: updated.updatedAt,
        }
      });

    } catch (error) {
      console.error('[TAB-MODULES] Management update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// POST /api/:department/:module/management/export - Exportar dados
router.post(
  '/:department/:module/management/export',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const { format, filters, columns } = req.body;

      console.log(`\n[TAB-MODULES] POST /${department}/${module}/management/export`);

      // Obter configuração do módulo
      const config = getManagementConfig(module.toUpperCase());
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração não encontrada'
        });
      }

      // Buscar serviço
      const service = await prisma.serviceSimplified.findFirst({
        where: { moduleType: module.toUpperCase() }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      // Construir query (sem paginação para exportar tudo)
      let where: any = {
        serviceId: service.id,
        status: { notIn: ['CANCELADO', 'REJEITADO'] }
      };

      const searchableFields = config.fields
        .filter(f => f.searchable)
        .map(f => f.key);

      where = applyFilters(where, filters, searchableFields);

      // Buscar todos os registros
      const protocols = await prisma.protocolSimplified.findMany({
        where,
        include: {
          citizen: {
            select: {
              name: true,
              cpf: true,
              email: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' }
      });

      // Colunas a exportar
      const exportColumns = columns && columns.length > 0
        ? columns
        : config.defaultTableColumns;

      // Gerar CSV
      if (format === 'csv' || !format) {
        const rows: string[] = [];

        // Cabeçalho
        const headers = ['Protocolo', 'Status', 'Data', ...exportColumns];
        rows.push(headers.join(','));

        // Dados
        protocols.forEach(protocol => {
          const customData = protocol.customData as any || {};
          const row = [
            protocol.number,
            protocol.status,
            protocol.createdAt.toISOString().split('T')[0],
            ...exportColumns.map((col: string) => {
              const value = customData[col];
              if (Array.isArray(value)) return `"${value.join(', ')}"`;
              if (value === null || value === undefined) return '';
              return `"${String(value).replace(/"/g, '""')}"`;
            })
          ];
          rows.push(row.join(','));
        });

        const csv = rows.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${module}_${Date.now()}.csv"`);
        return res.send('\ufeff' + csv); // BOM para UTF-8
      }

      return res.status(400).json({
        success: false,
        error: 'Formato não suportado'
      });

    } catch (error) {
      console.error('[TAB-MODULES] Export error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// DETALHES DE UM PROTOCOLO - GET /api/:department/:module/:id
// ============================================================================

router.get(
  '/:department/:module/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module, id } = req.params;

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/${id}`);

      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id },
        include: {
          citizen: true,
          service: true,
          department: true,
          documentFiles: true,
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocol not found'
        });
      }

      console.log(`  ✅ Found protocol ${protocol.number}`);

      return res.json({
        success: true,
        data: protocol,
      });

    } catch (error) {
      console.error('[TAB-MODULES] Get details error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// AÇÕES DE APROVAÇÃO
// ============================================================================

// POST /api/:department/:module/approval/:id/approve - Aprovar solicitação
router.post(
  '/:department/:module/approval/:id/approve',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || 'Admin';

      console.log(`\n[TAB-MODULES] POST /approval/${id}/approve`);

      // Buscar protocolo
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocolo não encontrado'
        });
      }

      // Atualizar status para CONCLUIDO usando motor centralizado
      const authReq = req as any;
      await protocolStatusEngine.updateStatus({
        protocolId: id,
        newStatus: ProtocolStatus.CONCLUIDO,
        actorId: authReq.user?.id || 'system',
        actorRole: authReq.user?.role || 'ADMIN',
        comment: comment || 'Solicitação aprovada',
        metadata: {
          source: 'tab-modules-approval',
          previousStatus: protocol.status,
          approvedBy: comment,
          approvedAt: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Solicitação aprovada com sucesso'
      });

    } catch (error) {
      console.error('[TAB-MODULES] Approve error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// POST /api/:department/:module/approval/:id/reject - Rejeitar solicitação
router.post(
  '/:department/:module/approval/:id/reject',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || 'Admin';

      if (!comment || comment.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Motivo da rejeição é obrigatório'
        });
      }

      console.log(`\n[TAB-MODULES] POST /approval/${id}/reject`);

      // Buscar protocolo
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocolo não encontrado'
        });
      }

      // Atualizar status para PENDENCIA usando motor centralizado (rejeição)
      const authReq = req as any;
      await protocolStatusEngine.updateStatus({
        protocolId: id,
        newStatus: ProtocolStatus.PENDENCIA,
        actorId: authReq.user?.id || 'system',
        actorRole: authReq.user?.role || 'ADMIN',
        comment: `Solicitação rejeitada: ${comment}`,
        reason: comment,
        metadata: {
          source: 'tab-modules-rejection',
          previousStatus: protocol.status,
          rejectedBy: authReq.user?.name || userName,
          rejectedAt: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Solicitação rejeitada com sucesso'
      });

    } catch (error) {
      console.error('[TAB-MODULES] Reject error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// POST /api/:department/:module/approval/:id/comment - Adicionar comentário
router.post(
  '/:department/:module/approval/:id/comment',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || 'Admin';

      if (!comment || comment.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Comentário é obrigatório'
        });
      }

      console.log(`\n[TAB-MODULES] POST /approval/${id}/comment`);

      // Buscar protocolo
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocolo não encontrado'
        });
      }

      // Registrar comentário
      await prisma.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'NOTE',
          authorType: 'ADMIN',
          authorName: userName,
          message: comment,
          metadata: {
            commentedBy: userId,
            commentedAt: new Date().toISOString(),
          }
        }
      });

      return res.json({
        success: true,
        message: 'Comentário adicionado com sucesso'
      });

    } catch (error) {
      console.error('[TAB-MODULES] Comment error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// AÇÕES DE LISTAGEM (CRUD)
// ============================================================================

// POST /api/:department/:module/create - Criar novo registro
router.post(
  '/:department/:module/create',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const data = req.body;
      const userId = (req as any).user?.id;

      console.log(`\n[TAB-MODULES] POST /${department}/${module}/create`);

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: department.toUpperCase() }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Departamento não encontrado'
        });
      }

      // Buscar serviço
      const service = await prisma.serviceSimplified.findFirst({
        where: {
          departmentId: dept.id,
          moduleType: module.toUpperCase()
        }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      // Gerar número de protocolo - Sistema centralizado com lock
      const protocolNumber = await generateProtocolNumberSafe();

      // Criar protocolo (citizenId será null para registros administrativos)
      const protocol = await prisma.protocolSimplified.create({
        data: {
          number: protocolNumber,
          title: data.title || 'Novo registro',
          description: data.description,
          departmentId: dept.id,
          serviceId: service.id,
          citizenId: data.citizenId || userId, // Usa citizenId fornecido ou userId como fallback
          moduleType: module.toUpperCase(),
          status: data.status || ProtocolStatus.VINCULADO,
          customData: data,
        }
      });

      return res.json({
        success: true,
        message: 'Registro criado com sucesso',
        data: {
          id: protocol.id,
          protocolNumber: protocol.number,
        }
      });

    } catch (error) {
      console.error('[TAB-MODULES] Create error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// PUT /api/:department/:module/update/:id - Atualizar registro
router.put(
  '/:department/:module/update/:id',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name || 'Admin';

      console.log(`\n[TAB-MODULES] PUT /update/${id}`);

      // Buscar protocolo atual
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Registro não encontrado'
        });
      }

      // Se houver mudança de status, usar motor centralizado
      if (data.status && data.status !== protocol.status) {
        const authReq = req as any;
        await protocolStatusEngine.updateStatus({
          protocolId: id,
          newStatus: data.status,
          actorId: authReq.user?.id || 'system',
          actorRole: authReq.user?.role || 'ADMIN',
          comment: 'Registro atualizado',
          metadata: {
            source: 'tab-modules-update',
            changes: data,
            updatedBy: userName
          }
        });
      }

      // Atualizar outros campos (exceto status, já tratado acima)
      const updated = await prisma.protocolSimplified.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          customData: { ...protocol.customData as object, ...data },
          updatedAt: new Date(),
        }
      });

      return res.json({
        success: true,
        message: 'Registro atualizado com sucesso',
        data: updated
      });

    } catch (error) {
      console.error('[TAB-MODULES] Update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// GET /api/:department/:module/export - Exportar lista
router.get(
  '/:department/:module/export',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const format = req.query.format as string || 'csv';
      const search = req.query.search as string;
      const status = req.query.status as string;

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/export (${format})`);

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: department.toUpperCase() }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Departamento não encontrado'
        });
      }

      // Construir filtro
      const where: any = {
        departmentId: dept.id,
        moduleType: module.toUpperCase()
      };

      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { number: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Buscar dados
      const protocols = await prisma.protocolSimplified.findMany({
        where,
        include: {
          citizen: {
            select: {
              name: true,
              cpf: true,
              email: true,
              phone: true,
            }
          },
          service: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10000, // Limite de segurança
      });

      // Gerar CSV
      if (format === 'csv') {
        const rows: string[] = [];

        // Identificar colunas de customData (pegar as chaves do primeiro protocolo)
        const customDataKeys: string[] = [];
        if (protocols.length > 0 && protocols[0].customData) {
          const customData = protocols[0].customData as any;
          Object.keys(customData).forEach(key => {
            if (!['id', 'createdAt', 'updatedAt'].includes(key)) {
              customDataKeys.push(key);
            }
          });
        }

        // Cabeçalho
        const headers = [
          'Protocolo',
          'Título',
          'Status',
          'Serviço',
          'Cidadão',
          'CPF',
          'Email',
          'Telefone',
          'Criado em',
          'Atualizado em',
          ...customDataKeys.map(key => key.replace(/_/g, ' ').toUpperCase())
        ];
        rows.push(headers.join(';'));

        // Dados
        protocols.forEach(p => {
          const customData = (p.customData as any) || {};
          const row = [
            p.number || '',
            `"${(p.title || '').replace(/"/g, '""')}"`, // Escapar aspas
            p.status || '',
            `"${(p.service?.name || '').replace(/"/g, '""')}"`,
            `"${(p.citizen?.name || '').replace(/"/g, '""')}"`,
            p.citizen?.cpf || '',
            p.citizen?.email || '',
            p.citizen?.phone || '',
            new Date(p.createdAt).toLocaleString('pt-BR'),
            new Date(p.updatedAt).toLocaleString('pt-BR'),
            ...customDataKeys.map(key => {
              const value = customData[key];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              return `"${String(value).replace(/"/g, '""')}"`;
            })
          ];
          rows.push(row.join(';'));
        });

        const csv = rows.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${module}_${Date.now()}.csv"`);
        return res.send('\ufeff' + csv); // BOM para Excel
      }

      return res.status(400).json({
        success: false,
        error: 'Formato não suportado'
      });

    } catch (error) {
      console.error('[TAB-MODULES] Export error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// EXPORTAÇÃO DE DASHBOARD
// ============================================================================

// GET /api/:department/:module/dashboard/export - Exportar dashboard
router.get(
  '/:department/:module/dashboard/export',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { department, module } = req.params;
      const format = req.query.format as string || 'pdf';
      const dateFrom = req.query.dateFrom as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = req.query.dateTo as string || new Date().toISOString();

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/dashboard/export (${format})`);

      // Buscar departamento
      const dept = await prisma.department.findFirst({
        where: { code: department.toUpperCase() }
      });

      if (!dept) {
        return res.status(404).json({
          success: false,
          error: 'Departamento não encontrado'
        });
      }

      const where = {
        departmentId: dept.id,
        moduleType: module.toUpperCase(),
        createdAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      };

      // Buscar dados do dashboard
      const allProtocols = await prisma.protocolSimplified.findMany({
        where,
        select: {
          id: true,
          status: true,
          customData: true,
          createdAt: true,
          number: true,
        },
      });

      const total = allProtocols.length;

      // Estatísticas por status
      const byStatus = allProtocols.reduce((acc: any[], protocol) => {
        const existing = acc.find(item => item.status === protocol.status);
        if (existing) {
          existing._count.id++;
        } else {
          acc.push({ status: protocol.status, _count: { id: 1 } });
        }
        return acc;
      }, []);

      // Análise temporal (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const dailyData = last7Days.map(date => {
        const count = allProtocols.filter(p =>
          p.createdAt.toISOString().split('T')[0] === date
        ).length;
        return { date, count };
      });

      if (format === 'pdf') {
        const { chromium } = require('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Gerar HTML do dashboard
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
              .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
              .kpi-box { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
              .kpi-value { font-size: 32px; font-weight: bold; color: #2563eb; }
              .kpi-label { font-size: 12px; color: #6b7280; margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #2563eb; color: white; padding: 12px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
              .chart { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
              .bar-container { display: flex; align-items: flex-end; gap: 10px; height: 200px; margin-top: 10px; }
              .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; }
              .bar { width: 100%; background: #3b82f6; border-radius: 4px 4px 0 0; }
              .bar-label { font-size: 10px; margin-top: 5px; color: #6b7280; }
              .bar-value { font-size: 11px; font-weight: bold; margin-bottom: 5px; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <h1>Dashboard - ${module.toUpperCase()}</h1>

            <div class="header">
              <h2 style="margin-top: 0;">Resumo do Período</h2>
              <p><strong>Departamento:</strong> ${dept.name}</p>
              <p><strong>Período:</strong> ${new Date(dateFrom).toLocaleDateString('pt-BR')} até ${new Date(dateTo).toLocaleDateString('pt-BR')}</p>
            </div>

            <h2>Indicadores Principais</h2>
            <div class="kpis">
              <div class="kpi-box">
                <div class="kpi-value">${total}</div>
                <div class="kpi-label">Total de Solicitações</div>
              </div>
              ${byStatus.map(item => `
                <div class="kpi-box">
                  <div class="kpi-value">${item._count.id}</div>
                  <div class="kpi-label">${item.status.replace(/_/g, ' ')}</div>
                </div>
              `).join('')}
            </div>

            <h2>Distribuição por Status</h2>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Quantidade</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${byStatus.map(item => `
                  <tr>
                    <td>${item.status.replace(/_/g, ' ')}</td>
                    <td>${item._count.id}</td>
                    <td>${total > 0 ? Math.round((item._count.id / total) * 100) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2>Solicitações por Dia (Últimos 7 dias)</h2>
            <div class="chart">
              <div class="bar-container">
                ${dailyData.map(day => {
                  const maxCount = Math.max(...dailyData.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return `
                    <div class="bar-wrapper">
                      <div class="bar-value">${day.count}</div>
                      <div class="bar" style="height: ${height}%"></div>
                      <div class="bar-label">${new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="footer">
              <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
              <p>Sistema DigiUrban - Dashboard de Módulos</p>
            </div>
          </body>
          </html>
        `;

        await page.setContent(html);
        const pdfBuffer = await page.pdf({
          format: 'A4',
          landscape: true,
          printBackground: true,
          margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="dashboard_${module}_${Date.now()}.pdf"`);
        return res.send(pdfBuffer);
      }

      // Formato Excel (CSV com separador de ponto e vírgula)
      if (format === 'excel' || format === 'csv') {
        const csv = [
          ['Dashboard - ' + module.toUpperCase()],
          ['Departamento', dept.name],
          ['Período', `${new Date(dateFrom).toLocaleDateString('pt-BR')} até ${new Date(dateTo).toLocaleDateString('pt-BR')}`],
          [],
          ['INDICADORES'],
          ['Métrica', 'Valor'],
          ['Total de Solicitações', total.toString()],
          ...byStatus.map(item => [item.status.replace(/_/g, ' '), item._count.id.toString()]),
          [],
          ['DISTRIBUIÇÃO POR STATUS'],
          ['Status', 'Quantidade', 'Percentual'],
          ...byStatus.map(item => [
            item.status.replace(/_/g, ' '),
            item._count.id.toString(),
            `${total > 0 ? Math.round((item._count.id / total) * 100) : 0}%`
          ]),
          [],
          ['SOLICITAÇÕES POR DIA (ÚLTIMOS 7 DIAS)'],
          ['Data', 'Quantidade'],
          ...dailyData.map(day => [
            new Date(day.date).toLocaleDateString('pt-BR'),
            day.count.toString()
          ])
        ].map(row => row.join(';')).join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="dashboard_${module}_${Date.now()}.csv"`);
        return res.send('\ufeff' + csv); // BOM para Excel reconhecer UTF-8
      }

      return res.status(400).json({
        success: false,
        error: 'Formato não suportado. Use format=pdf ou format=excel'
      });

    } catch (error) {
      console.error('[TAB-MODULES] Dashboard export error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;
