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
import { UserRole, ProtocolStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { getManagementConfig } from './management-configs';

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
// MAPEAMENTO: MODULE CODE -> PRISMA MODEL
// ============================================================================
// Define qual tabela do Prisma usar para cada módulo

const MODULE_TO_MODEL_MAP: Record<string, string> = {
  // AGRICULTURA
  'CADASTRO_PRODUTOR': 'ruralProducer',
  'CADASTRO_PROPRIEDADE_RURAL': 'ruralProperty',
  'INSCRICAO_PROGRAMA_RURAL': 'ruralProgramEnrollment',
  'INSCRICAO_CURSO_RURAL': 'ruralTrainingEnrollment',
  'ASSISTENCIA_TECNICA_RURAL': 'ruralTechnicalAssistance',
  'ATENDIMENTOS_AGRICULTURA': 'agricultureService',
  'DISTRIBUICAO_SEMENTES': 'seedDistribution',

  // SAÚDE
  'CADASTRO_PACIENTE': 'patient',
  'AGENDAMENTO_CONSULTA': 'healthAppointment',
  'SOLICITACAO_TRANSPORTE': 'healthTransportRequest',
  'ATENDIMENTOS_SAUDE': 'healthService',
  'VACINACAO': 'vaccination',
  'CAMPANHA_VACINACAO': 'vaccinationCampaign',
  'SOLICITACAO_MEDICAMENTO': 'medicationRequest',
  'SOLICITACAO_EXAME': 'examRequest',
  'PROGRAMA_SAUDE': 'healthProgramEnrollment',
  'VISITA_ACS': 'acsVisit',
  'TRANSPORTE_TFD': 'tfdTransport',

  // EDUCAÇÃO
  'CADASTRO_ESTUDANTE': 'student',
  'TRANSFERENCIA_ESTUDANTE': 'studentTransfer',
  'ATENDIMENTOS_EDUCACAO': 'educationService',
  'REGISTRO_FREQUENCIA': 'attendanceRecord',
  'REGISTRO_NOTAS': 'gradeRecord',
  'REGISTRO_DISCIPLINAR': 'disciplinaryRecord',
  'GESTAO_ESCOLAS': 'schoolManagement',
  'TRANSPORTE_ESCOLAR': 'schoolTransport',
  'MERENDA_ESCOLAR': 'schoolMeal',
  'DOCUMENTOS_ESCOLARES': 'schoolDocument',

  // ASSISTÊNCIA SOCIAL
  'CADASTRO_FAMILIA_VULNERAVEL': 'vulnerableFamily',
  'INSCRICAO_PROGRAMA_SOCIAL': 'socialProgramEnrollment',
  'INSCRICAO_GRUPO_SOCIAL': 'socialGroupEnrollment',
  'SOLICITACAO_BENEFICIO': 'benefitRequest',
  'VISITA_DOMICILIAR': 'homeVisit',
  'AGENDAMENTO_SOCIAL': 'socialAppointment',
  'ATENDIMENTOS_SOCIAL': 'socialService',
  'ENTREGA_EMERGENCIAL': 'emergencyDelivery',
  'EQUIPAMENTOS_SOCIAIS': 'socialEquipment',

  // CULTURA
  'EVENTO_CULTURAL': 'culturalEvent',
  'PROJETO_CULTURAL': 'culturalProject',
  'GRUPO_ARTISTICO': 'artisticGroup',
  'MANIFESTACAO_CULTURAL': 'culturalManifestation',
  'ESPACO_CULTURAL': 'culturalSpace',
  'OFICINA_CURSO': 'culturalWorkshop',
  'ATENDIMENTOS_CULTURA': 'cultureService',

  // ESPORTES
  'CADASTRO_ATLETA': 'athlete',
  'INSCRICAO_ESCOLINHA': 'sportsSchoolEnrollment',
  'RESERVA_ESPACO': 'sportsReservation',
  'COMPETICAO_ESPORTIVA': 'competition',
  'TORNEIO_ESPORTIVO': 'tournament',
  'EQUIPE_ESPORTIVA': 'sportsTeam',
  'MODALIDADE_ESPORTIVA': 'sportsModality',
  'ATENDIMENTOS_ESPORTES': 'sportsService',

  // HABITAÇÃO
  'INSCRICAO_FILA_HABITACAO': 'housingQueue',
  'SOLICITACAO_AUXILIO_ALUGUEL': 'rentAssistance',
  'REGULARIZACAO_FUNDIARIA': 'landRegularization',
  'PROGRAMA_HABITACIONAL': 'housingProgramEnrollment',
  'UNIDADE_HABITACIONAL': 'housingUnit',
  'CONSULTA_PROGRAMA_HABITACAO': 'housingProgramQuery',
  'ATENDIMENTOS_HABITACAO': 'housingService',

  // MEIO AMBIENTE
  'SOLICITACAO_PODA_CORTE': 'treePruningRequest',
  'DENUNCIA_AMBIENTAL': 'environmentalComplaint',
  'SOLICITACAO_LICENCA_AMBIENTAL': 'environmentalLicense',
  'SOLICITACAO_VISTORIA': 'environmentalInspection',
  'PROGRAMA_AMBIENTAL': 'environmentalProgram',
  'AREA_PROTEGIDA': 'protectedArea',
  'ATENDIMENTOS_MEIO_AMBIENTE': 'environmentService',

  // OBRAS PÚBLICAS
  'SOLICITACAO_OBRA': 'publicWork',
  'SOLICITACAO_MANUTENCAO': 'maintenanceRequest',
  'FISCALIZACAO_OBRA': 'workInspection',
  'REGISTRO_PROBLEMA_INFRAESTRUTURA': 'infrastructureProblem',
  'ATENDIMENTOS_OBRAS': 'publicWorksService',

  // PLANEJAMENTO URBANO
  'SOLICITACAO_ALVARA_CONSTRUCAO': 'constructionPermit',
  'SOLICITACAO_ALVARA_FUNCIONAMENTO': 'operatingLicense',
  'APROVACAO_PROJETO': 'projectApproval',
  'SOLICITACAO_CERTIDAO': 'certificate',
  'SOLICITACAO_NUMERACAO': 'numberingRequest',
  'LOTEAMENTO': 'subdivision',
  'ZONEAMENTO': 'zoning',
  'PROJETO_URBANO': 'urbanProject',
  'ATENDIMENTOS_PLANEJAMENTO': 'urbanPlanningService',

  // SEGURANÇA PÚBLICA
  'REGISTRO_OCORRENCIA': 'securityIncident',
  'DENUNCIA_ANONIMA': 'anonymousReport',
  'SOLICITACAO_RONDA': 'patrolRequest',
  'ALERTA_SEGURANCA': 'securityAlert',
  'GUARDA_MUNICIPAL': 'municipalGuard',
  'PATRULHA_PREVENTIVA': 'preventivePatrol',
  'PONTO_CRITICO': 'criticalPoint',
  'CAMERA_MONITORAMENTO': 'surveillanceCamera',
  'VIGILANCIA_PATRIMONIAL': 'assetSurveillance',
  'ATENDIMENTOS_SEGURANCA': 'securityService',

  // SERVIÇOS PÚBLICOS
  'REGISTRO_PROBLEMA_URBANO': 'urbanProblem',
  'SOLICITACAO_LIMPEZA': 'cleaningRequest',
  'SOLICITACAO_CAPINA': 'weedingRequest',
  'SOLICITACAO_PODA_ARVORES': 'treePruningRequest',
  'SOLICITACAO_ILUMINACAO': 'lightingRequest',
  'SOLICITACAO_COLETA_ESPECIAL': 'specialCollectionRequest',
  'SOLICITACAO_DESOBSTRUCAO': 'drainageRequest',
  'GESTAO_EQUIPES': 'teamManagement',
  'ATENDIMENTOS_SERVICOS_PUBLICOS': 'publicService',

  // TURISMO
  'CADASTRO_ATRATIVO': 'touristAttraction',
  'CADASTRO_ESTABELECIMENTO': 'touristEstablishment',
  'CADASTRO_GUIA': 'tourGuide',
  'EVENTO_TURISTICO': 'touristEvent',
  'ROTEIRO_TURISTICO': 'touristRoute',
  'PROGRAMA_TURISTICO': 'touristProgram',
  'ATENDIMENTOS_TURISMO': 'tourismService',
};

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
          : { in: [ProtocolStatus.VINCULADO, ProtocolStatus.ATUALIZACAO] }
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

      // Atualizar status para CONCLUIDO (aprovado)
      await prisma.protocolSimplified.update({
        where: { id },
        data: {
          status: ProtocolStatus.CONCLUIDO,
          updatedAt: new Date(),
        }
      });

      // Registrar interação
      await prisma.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'STATUS_CHANGED',
          authorType: 'ADMIN',
          authorName: userName,
          message: comment || 'Solicitação aprovada',
          metadata: {
            previousStatus: protocol.status,
            newStatus: 'CONCLUIDO',
            approvedBy: userId,
            approvedAt: new Date().toISOString(),
          }
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

      // Atualizar status para CANCELADO (rejeitado)
      await prisma.protocolSimplified.update({
        where: { id },
        data: {
          status: ProtocolStatus.CANCELADO,
          updatedAt: new Date(),
        }
      });

      // Registrar interação
      await prisma.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'STATUS_CHANGED',
          authorType: 'ADMIN',
          authorName: userName,
          message: `Solicitação rejeitada: ${comment}`,
          metadata: {
            previousStatus: protocol.status,
            newStatus: 'CANCELADO',
            rejectedBy: userId,
            rejectedAt: new Date().toISOString(),
            reason: comment,
          }
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

      // Gerar número de protocolo
      const year = new Date().getFullYear();
      const count = await prisma.protocolSimplified.count({
        where: {
          departmentId: dept.id,
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`)
          }
        }
      });

      const protocolNumber = `${dept.code}${year}${String(count + 1).padStart(6, '0')}`;

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

      // Atualizar protocolo
      const updated = await prisma.protocolSimplified.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          customData: { ...protocol.customData as object, ...data },
          updatedAt: new Date(),
        }
      });

      // Registrar interação
      await prisma.protocolInteraction.create({
        data: {
          protocolId: id,
          type: 'STATUS_CHANGED',
          authorType: 'ADMIN',
          authorName: userName,
          message: 'Registro atualizado',
          metadata: {
            updatedBy: userId,
            updatedAt: new Date().toISOString(),
            changes: data,
          }
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
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10000, // Limite de segurança
      });

      // Gerar CSV
      if (format === 'csv') {
        const rows: string[] = [];

        // Cabeçalho
        rows.push(['Protocolo', 'Título', 'Status', 'Cidadão', 'CPF', 'Data'].join(','));

        // Dados
        protocols.forEach(p => {
          rows.push([
            p.number,
            `"${p.title || ''}"`,
            p.status,
            `"${p.citizen?.name || ''}"`,
            p.citizen?.cpf || '',
            p.createdAt.toISOString().split('T')[0]
          ].join(','));
        });

        const csv = rows.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${module}_${Date.now()}.csv"`);
        return res.send('\ufeff' + csv);
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
      const period = req.query.period as string || 'month';

      console.log(`\n[TAB-MODULES] GET /${department}/${module}/dashboard/export (${format})`);

      // Por enquanto retornar erro indicando que será implementado
      return res.status(501).json({
        success: false,
        error: 'Exportação de dashboard será implementada em breve'
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
