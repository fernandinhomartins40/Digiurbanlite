/**
 * ============================================================================
 * SEED DE SERVIÇOS - ARQUITETURA SIMPLIFICADA (COMPLETO)
 * ============================================================================
 *
 * Baseado em: docs/PLANO_IMPLEMENTACAO_SIMPLIFICACAO.md
 *
 * TOTAL: 114 SERVIÇOS MAPEADOS
 * - 102 Serviços COM_DADOS (capturam dados para módulos)
 * - 12 Serviços INFORMATIVOS (consultas, sem dados estruturados)
 *
 * DISTRIBUIÇÃO POR SECRETARIA:
 * 1. Saúde                    - 11 serviços (10 COM_DADOS + 1 GESTÃO)
 * 2. Educação                 - 11 serviços (8 COM_DADOS + 2 GESTÃO + 1 INFO)
 * 3. Assistência Social       - 9 serviços  (8 COM_DADOS + 1 GESTÃO)
 * 4. Agricultura              - 6 serviços  (6 COM_DADOS)
 * 5. Cultura                  - 9 serviços  (8 COM_DADOS + 1 INFO)
 * 6. Esportes                 - 9 serviços  (8 COM_DADOS + 1 INFO)
 * 7. Habitação                - 7 serviços  (6 COM_DADOS + 1 INFO)
 * 8. Meio Ambiente            - 7 serviços  (6 COM_DADOS + 1 GESTÃO)
 * 9. Obras Públicas           - 7 serviços  (5 COM_DADOS + 2 INFO)
 * 10. Planejamento Urbano     - 9 serviços  (7 COM_DADOS + 2 INFO)
 * 11. Segurança Pública       - 11 serviços (8 COM_DADOS + 2 GESTÃO + 1 INFO)
 * 12. Serviços Públicos       - 9 serviços  (7 COM_DADOS + 1 GESTÃO + 1 INFO)
 * 13. Turismo                 - 9 serviços  (7 COM_DADOS + 2 INFO)
 *
 * Estrutura:
 * - serviceType: 'COM_DADOS' | 'INFORMATIVO'
 * - moduleType: string (ex: 'CADASTRO_PRODUTOR') - para roteamento
 * - formSchema: JSON Schema do formulário (quando aplicável)
 */

import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

interface ServiceDefinition {
  name: string;
  description: string;
  departmentCode: string;
  serviceType: ServiceType;
  moduleType: string | null; // null = serviço informativo
  requiresDocuments: boolean;
  requiredDocuments?: string[];
  estimatedDays: number | null;
  priority: number;
  category?: string;
  icon?: string;
  color?: string;
  formSchema?: any;
}

// ============================================================================
// SECRETARIA DE SAÚDE (11 serviços)
// ============================================================================
const HEALTH_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Saúde',
    description: 'Registro geral de atendimentos na área da saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SAUDE',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Activity',
    color: '#10b981'
        },
  {
    name: 'Agendamento de Consulta Médica',
    description: 'Agende consultas médicas nas unidades de saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'AGENDAMENTOS_MEDICOS',
    requiresDocuments: true,
    requiredDocuments: ['Cartão SUS', 'Documento de Identidade'],
    estimatedDays: 7,
    priority: 4,
    category: 'Agendamento',
    icon: 'Calendar',
    color: '#3b82f6'
        },
  {
    name: 'Controle de Medicamentos',
    description: 'Solicitação e controle de medicamentos da farmácia básica',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CONTROLE_MEDICAMENTOS',
    requiresDocuments: true,
    requiredDocuments: ['Receita Médica', 'Cartão SUS'],
    estimatedDays: 2,
    priority: 5,
    category: 'Medicamentos',
    icon: 'Pill',
    color: '#ef4444'
        },
  {
    name: 'Campanhas de Vacinação',
    description: 'Registro de participação em campanhas de vacinação',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CAMPANHAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina', 'Documento de Identidade'],
    estimatedDays: 1,
    priority: 5,
    category: 'Prevenção',
    icon: 'Syringe',
    color: '#8b5cf6'
        },
  {
    name: 'Programas de Saúde',
    description: 'Inscrição em programas de saúde (hipertensão, diabetes, etc)',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico', 'Cartão SUS'],
    estimatedDays: 5,
    priority: 4,
    category: 'Programas',
    icon: 'Heart',
    color: '#ec4899'
        },
  {
    name: 'Encaminhamento TFD (Tratamento Fora do Domicílio)',
    description: 'Solicitação de transporte e tratamento fora do município',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'ENCAMINHAMENTOS_TFD',
    requiresDocuments: true,
    requiredDocuments: ['Encaminhamento Médico', 'Exames', 'Cartão SUS'],
    estimatedDays: 15,
    priority: 5,
    category: 'TFD',
    icon: 'Ambulance',
    color: '#f59e0b'
        },
  {
    name: 'Solicitação de Exames',
    description: 'Agendamento de exames laboratoriais e de imagem',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'EXAMES',
    requiresDocuments: true,
    requiredDocuments: ['Pedido Médico', 'Cartão SUS'],
    estimatedDays: 10,
    priority: 4,
    category: 'Exames',
    icon: 'FileText',
    color: '#06b6d4'
        },
  {
    name: 'Transporte de Pacientes',
    description: 'Solicitação de ambulância para transporte de pacientes',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSPORTE_PACIENTES',
    requiresDocuments: true,
    requiredDocuments: ['Atestado Médico', 'Comprovante de Endereço'],
    estimatedDays: 3,
    priority: 5,
    category: 'Transporte',
    icon: 'Truck',
    color: '#dc2626'
        },
  {
    name: 'Cartão Nacional de Saúde (Cartão SUS)',
    description: 'Cadastro e emissão do Cartão SUS',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PACIENTE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'CreditCard',
    color: '#10b981'
        },
  {
    name: 'Registro de Vacinação',
    description: 'Registro e acompanhamento de vacinação',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'VACINACAO',
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina', 'Documento de Identidade'],
    estimatedDays: 1,
    priority: 5,
    category: 'Vacinação',
    icon: 'Shield',
    color: '#8b5cf6'
        },
  {
    name: 'Gestão de Agentes Comunitários de Saúde (ACS)',
    description: 'Administração e acompanhamento de ACS',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_ACS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Users',
    color: '#64748b'
        },
];

// ============================================================================
// SECRETARIA DE AGRICULTURA (6 serviços)
// ============================================================================
const AGRICULTURE_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Agricultura',
    description: 'Registro geral de atendimentos na área agrícola',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_AGRICULTURA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Sprout',
    color: '#10b981'
        },
  {
    name: 'Cadastro de Produtor Rural',
    description: 'Cadastro de produtores rurais e agricultores familiares no sistema',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PRODUTOR',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço', 'Documento da Propriedade'],
    estimatedDays: 7,
    priority: 4,
    category: 'Cadastro',
    icon: 'UserPlus',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', title: 'Nome Completo' },
        cpf: { type: 'string', title: 'CPF' },
        rg: { type: 'string', title: 'RG' },
        dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },
        telefone: { type: 'string', title: 'Telefone' },
        email: { type: 'string', format: 'email', title: 'E-mail' },
        endereco: { type: 'string', title: 'Endereço' },
        tipoProdutor: {
          type: 'string',
          title: 'Tipo de Produtor',
          enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena']
        },
        dap: { type: 'string', title: 'DAP (Declaração de Aptidão ao PRONAF)' },
        areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)' },
        principaisProducoes: { type: 'string', title: 'Principais Produções' }
        },
      required: ['nome', 'cpf', 'telefone', 'tipoProdutor']
    }
  },
  {
    name: 'Assistência Técnica Rural',
    description: 'Solicitação de assistência técnica para produtores rurais (ATER)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ASSISTENCIA_TECNICA',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor', 'Documento da Propriedade'],
    estimatedDays: 15,
    priority: 4,
    category: 'Assistência',
    icon: 'Headphones',
    color: '#059669'
        },
  {
    name: 'Inscrição em Curso Rural',
    description: 'Inscrição em cursos e capacitações para produtores rurais',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_CURSO_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor', 'RG', 'CPF'],
    estimatedDays: 5,
    priority: 3,
    category: 'Capacitação',
    icon: 'GraduationCap',
    color: '#10b981'
        },
  {
    name: 'Inscrição em Programa Rural',
    description: 'Inscrição em programas agrícolas (PRONAF, PAA, PNAE, etc)',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Cadastro de Produtor', 'DAP', 'Documentação da Propriedade'],
    estimatedDays: 20,
    priority: 5,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#16a34a'
        },
  {
    name: 'Cadastro de Propriedade Rural',
    description: 'Cadastro e regularização de propriedades rurais',
    departmentCode: 'AGRICULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PROPRIEDADE_RURAL',
    requiresDocuments: true,
    requiredDocuments: ['Escritura ou Contrato', 'CAR (Cadastro Ambiental Rural)', 'ITR'],
    estimatedDays: 30,
    priority: 4,
    category: 'Cadastro',
    icon: 'Map',
    color: '#059669'
        },
];

// ============================================================================
// SECRETARIA DE EDUCAÇÃO (11 serviços)
// ============================================================================
const EDUCATION_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Educação',
    description: 'Registro geral de atendimentos na área educacional',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_EDUCACAO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'GraduationCap',
    color: '#3b82f6'
        },
  {
    name: 'Matrícula de Aluno',
    description: 'Matrícula e rematrícula de alunos na rede municipal',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'MATRICULA_ALUNO',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento', 'RG do Responsável', 'Comprovante de Endereço', 'Cartão de Vacina'],
    estimatedDays: 7,
    priority: 5,
    category: 'Matrícula',
    icon: 'UserPlus',
    color: '#2563eb'
        },
  {
    name: 'Transporte Escolar',
    description: 'Solicitação de vaga em transporte escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSPORTE_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Matrícula', 'Comprovante de Endereço'],
    estimatedDays: 10,
    priority: 4,
    category: 'Transporte',
    icon: 'Bus',
    color: '#f59e0b'
        },
  {
    name: 'Registro de Ocorrência Escolar',
    description: 'Registro de ocorrências disciplinares e comportamentais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Disciplina',
    icon: 'AlertTriangle',
    color: '#ef4444'
        },
  {
    name: 'Solicitação de Documento Escolar',
    description: 'Solicitação de histórico, declaração ou certificado',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'Comprovante de Matrícula'],
    estimatedDays: 5,
    priority: 3,
    category: 'Documentos',
    icon: 'FileText',
    color: '#06b6d4'
        },
  {
    name: 'Transferência Escolar',
    description: 'Solicitação de transferência entre unidades escolares',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Histórico Escolar', 'Comprovante de Endereço'],
    estimatedDays: 15,
    priority: 4,
    category: 'Transferência',
    icon: 'ArrowRightLeft',
    color: '#8b5cf6'
        },
  {
    name: 'Consulta de Frequência',
    description: 'Consulta ao registro de frequência do aluno',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CONSULTA_FREQUENCIA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 2,
    category: 'Consulta',
    icon: 'Calendar',
    color: '#10b981'
        },
  {
    name: 'Consulta de Notas e Boletim',
    description: 'Consulta de notas e desempenho escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CONSULTA_NOTAS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 2,
    category: 'Consulta',
    icon: 'ClipboardList',
    color: '#3b82f6'
        },
  {
    name: 'Gestão Escolar',
    description: 'Administração de unidades escolares',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Building',
    color: '#64748b'
        },
  {
    name: 'Gestão de Merenda Escolar',
    description: 'Planejamento de cardápios e controle de estoque',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_MERENDA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'UtensilsCrossed',
    color: '#64748b'
        },
  {
    name: 'Calendário Escolar',
    description: 'Consulta ao calendário letivo e eventos escolares',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE ASSISTÊNCIA SOCIAL (10 serviços)
// ============================================================================
const SOCIAL_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Assistência Social',
    description: 'Registro geral de atendimentos na área social',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Heart',
    color: '#ec4899'
        },
  {
    name: 'Cadastro Único (CadÚnico)',
    description: 'Cadastro de famílias vulneráveis no CadÚnico',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_UNICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço', 'Comprovante de Renda'],
    estimatedDays: 7,
    priority: 5,
    category: 'Cadastro',
    icon: 'UserCheck',
    color: '#db2777'
        },
  {
    name: 'Solicitação de Benefício Social',
    description: 'Solicitação de benefícios sociais (BPC, Bolsa Família, etc)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_BENEFICIO',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda'],
    estimatedDays: 15,
    priority: 5,
    category: 'Benefícios',
    icon: 'DollarSign',
    color: '#16a34a'
        },
  {
    name: 'Entrega Emergencial (Cesta Básica)',
    description: 'Solicitação de auxílio emergencial e cestas básicas',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'ENTREGA_EMERGENCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Endereço', 'Declaração de Vulnerabilidade'],
    estimatedDays: 3,
    priority: 5,
    category: 'Emergencial',
    icon: 'Package',
    color: '#dc2626'
        },
  {
    name: 'Inscrição em Grupo ou Oficina Social',
    description: 'Inscrição em grupos e oficinas do CRAS/CREAS',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_GRUPO_OFICINA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 3,
    category: 'Programas',
    icon: 'Users',
    color: '#a855f7'
        },
  {
    name: 'Visitas Domiciliares',
    description: 'Agendamento de visitas técnicas domiciliares',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'VISITAS_DOMICILIARES',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Endereço'],
    estimatedDays: 7,
    priority: 4,
    category: 'Atendimento',
    icon: 'Home',
    color: '#f97316'
        },
  {
    name: 'Inscrição em Programa Social',
    description: 'Inscrição em programas sociais municipais',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Documentos Pessoais'],
    estimatedDays: 10,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#8b5cf6'
        },
  {
    name: 'Agendamento de Atendimento Social',
    description: 'Agendamento de atendimento com assistente social',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 3,
    category: 'Agendamento',
    icon: 'Calendar',
    color: '#06b6d4'
        },
  {
    name: 'Gestão CRAS/CREAS',
    description: 'Administração de equipamentos sociais (CRAS e CREAS)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_CRAS_CREAS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Building2',
    color: '#64748b'
        },
];

// ============================================================================
// SECRETARIA DE CULTURA (9 serviços)
// ============================================================================
const CULTURE_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Cultura',
    description: 'Registro geral de atendimentos na área cultural',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_CULTURA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Palette',
    color: '#a855f7'
        },
  {
    name: 'Reserva de Espaço Cultural',
    description: 'Agendamento de teatros, centros culturais e auditórios',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'RESERVA_ESPACO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Projeto do Evento'],
    estimatedDays: 10,
    priority: 3,
    category: 'Reserva',
    icon: 'Building',
    color: '#8b5cf6'
        },
  {
    name: 'Inscrição em Oficina Cultural',
    description: 'Inscrição em oficinas de arte, música, teatro, dança',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_OFICINA_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 3,
    category: 'Oficinas',
    icon: 'Music',
    color: '#d946ef'
        },
  {
    name: 'Cadastro de Grupo Artístico',
    description: 'Cadastro de grupos culturais e artísticos',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GRUPO_ARTISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Documentos dos Integrantes', 'Portfólio', 'Estatuto (se houver)'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#a855f7'
        },
  {
    name: 'Projeto Cultural',
    description: 'Submissão de projetos culturais',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'PROJETO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Detalhado', 'Orçamento', 'Currículo do Proponente'],
    estimatedDays: 30,
    priority: 4,
    category: 'Projetos',
    icon: 'FileText',
    color: '#9333ea'
        },
  {
    name: 'Submissão de Projeto Cultural (Lei de Incentivo)',
    description: 'Submissão de projetos para Lei de Incentivo à Cultura',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'SUBMISSAO_PROJETO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Detalhado', 'Orçamento', 'Documentação Legal', 'Plano de Divulgação'],
    estimatedDays: 45,
    priority: 5,
    category: 'Incentivo',
    icon: 'DollarSign',
    color: '#7c3aed'
        },
  {
    name: 'Cadastro de Evento Cultural',
    description: 'Registro de eventos culturais no município',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EVENTO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Autorizações Necessárias'],
    estimatedDays: 15,
    priority: 3,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#c026d3'
        },
  {
    name: 'Registro de Manifestação Cultural',
    description: 'Registro de patrimônio cultural imaterial',
    departmentCode: 'CULTURA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL',
    requiresDocuments: true,
    requiredDocuments: ['Documentação Histórica', 'Fotos', 'Depoimentos'],
    estimatedDays: 60,
    priority: 4,
    category: 'Patrimônio',
    icon: 'Landmark',
    color: '#86198f'
        },
  {
    name: 'Agenda de Eventos Culturais',
    description: 'Consulta ao calendário de eventos culturais da cidade',
    departmentCode: 'CULTURA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE ESPORTES (9 serviços)
// ============================================================================
const SPORTS_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Esportes',
    description: 'Registro geral de atendimentos na área esportiva',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_ESPORTES',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Trophy',
    color: '#f59e0b'
        },
  {
    name: 'Inscrição em Escolinha Esportiva',
    description: 'Inscrição em escolinhas de futebol, vôlei, basquete, etc',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_ESCOLINHA',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento', 'Atestado Médico', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 4,
    category: 'Escolinhas',
    icon: 'Users',
    color: '#ea580c'
        },
  {
    name: 'Cadastro de Atleta',
    description: 'Cadastro de atletas federados no município',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ATLETA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Atestado Médico', 'Comprovante de Federação'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'User',
    color: '#f97316'
        },
  {
    name: 'Reserva de Espaço Esportivo',
    description: 'Agendamento de quadras, ginásios e campos',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Termo de Responsabilidade'],
    estimatedDays: 3,
    priority: 3,
    category: 'Reserva',
    icon: 'Building',
    color: '#fb923c'
        },
  {
    name: 'Inscrição em Competição',
    description: 'Inscrição em campeonatos e competições municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_COMPETICAO',
    requiresDocuments: true,
    requiredDocuments: ['Fichas dos Atletas', 'Atestados Médicos', 'Comprovante de Pagamento'],
    estimatedDays: 10,
    priority: 4,
    category: 'Competições',
    icon: 'Medal',
    color: '#facc15'
        },
  {
    name: 'Cadastro de Equipe Esportiva',
    description: 'Cadastro de equipes municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EQUIPE_ESPORTIVA',
    requiresDocuments: true,
    requiredDocuments: ['Fichas dos Atletas', 'Documentação do Técnico', 'Regimento'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#eab308'
        },
  {
    name: 'Inscrição em Torneio',
    description: 'Inscrição de equipes em torneios esportivos',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_TORNEIO',
    requiresDocuments: true,
    requiredDocuments: ['Súmula da Equipe', 'Comprovante de Pagamento'],
    estimatedDays: 5,
    priority: 3,
    category: 'Torneios',
    icon: 'Trophy',
    color: '#ca8a04'
        },
  {
    name: 'Cadastro de Modalidade Esportiva',
    description: 'Cadastro de novas modalidades esportivas no município',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_MODALIDADE',
    requiresDocuments: true,
    requiredDocuments: ['Regras da Modalidade', 'Documentação do Instrutor'],
    estimatedDays: 15,
    priority: 2,
    category: 'Cadastro',
    icon: 'Plus',
    color: '#a16207'
        },
  {
    name: 'Agenda de Eventos Esportivos',
    description: 'Consulta ao calendário esportivo municipal',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE HABITAÇÃO (7 serviços)
// ============================================================================
const HOUSING_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Habitação',
    description: 'Registro geral de atendimentos na área habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_HABITACAO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Home',
    color: '#06b6d4'
        },
  {
    name: 'Inscrição em Programa Habitacional',
    description: 'Inscrição em programas habitacionais (Minha Casa Minha Vida)',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
    estimatedDays: 30,
    priority: 5,
    category: 'Programas',
    icon: 'Building',
    color: '#0891b2'
        },
  {
    name: 'Regularização Fundiária',
    description: 'Solicitação de regularização e título de propriedade',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    requiresDocuments: true,
    requiredDocuments: ['Documentos Pessoais', 'Comprovante de Posse', 'Planta do Imóvel'],
    estimatedDays: 90,
    priority: 5,
    category: 'Regularização',
    icon: 'FileCheck',
    color: '#0e7490'
        },
  {
    name: 'Solicitação de Auxílio Aluguel',
    description: 'Solicitação de auxílio moradia temporário',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
    estimatedDays: 15,
    priority: 5,
    category: 'Auxílio',
    icon: 'DollarSign',
    color: '#155e75'
        },
  {
    name: 'Cadastro de Unidade Habitacional',
    description: 'Cadastro de imóveis no programa habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_UNIDADE_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['Matrícula do Imóvel', 'Planta', 'Documentação do Proprietário'],
    estimatedDays: 20,
    priority: 3,
    category: 'Cadastro',
    icon: 'MapPin',
    color: '#06b6d4'
        },
  {
    name: 'Inscrição na Fila de Habitação',
    description: 'Inscrição em lista de espera para moradia popular',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_FILA_HABITACAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrição',
    icon: 'List',
    color: '#0891b2'
        },
  {
    name: 'Consulta de Programas Habitacionais',
    description: 'Informações sobre programas habitacionais disponíveis',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Info',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE MEIO AMBIENTE (7 serviços)
// ============================================================================
const ENVIRONMENT_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Meio Ambiente',
    description: 'Registro geral de atendimentos na área ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_MEIO_AMBIENTE',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Leaf',
    color: '#10b981'
        },
  {
    name: 'Licença Ambiental',
    description: 'Solicitação de licenciamento ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'LICENCA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Estudos Ambientais', 'ART do Responsável Técnico'],
    estimatedDays: 60,
    priority: 5,
    category: 'Licenciamento',
    icon: 'FileCheck',
    color: '#059669'
        },
  {
    name: 'Denúncia Ambiental',
    description: 'Registro de denúncias e reclamações ambientais',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_AMBIENTAL',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Denúncia',
    icon: 'AlertTriangle',
    color: '#dc2626'
        },
  {
    name: 'Programa Ambiental',
    description: 'Inscrição em programas de educação ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 10,
    priority: 3,
    category: 'Programas',
    icon: 'GraduationCap',
    color: '#16a34a'
        },
  {
    name: 'Autorização de Poda ou Corte de Árvore',
    description: 'Solicitação de autorização para poda ou corte',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_PODA_CORTE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Técnico', 'Fotos', 'Comprovante de Propriedade'],
    estimatedDays: 15,
    priority: 4,
    category: 'Autorização',
    icon: 'TreeDeciduous',
    color: '#15803d'
        },
  {
    name: 'Vistoria Ambiental',
    description: 'Solicitação de inspeção ambiental',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'VISTORIA_AMBIENTAL',
    requiresDocuments: true,
    requiredDocuments: ['Solicitação Formal', 'Documentação do Imóvel'],
    estimatedDays: 20,
    priority: 3,
    category: 'Vistoria',
    icon: 'Search',
    color: '#14532d'
        },
  {
    name: 'Gestão de Áreas Protegidas',
    description: 'Administração de APPs e reservas ambientais',
    departmentCode: 'MEIO_AMBIENTE',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_AREAS_PROTEGIDAS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'ShieldCheck',
    color: '#64748b'
        },
];

// ============================================================================
// SECRETARIA DE OBRAS PÚBLICAS (7 serviços)
// ============================================================================
const PUBLIC_WORKS_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Obras Públicas',
    description: 'Registro geral de atendimentos na área de obras',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_OBRAS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'HardHat',
    color: '#f59e0b'
        },
  {
    name: 'Solicitação de Reparo de Via',
    description: 'Solicitação de tapa-buraco e pavimentação',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_REPARO_VIA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Manutenção',
    icon: 'Construction',
    color: '#ea580c'
        },
  {
    name: 'Vistoria Técnica de Obras',
    description: 'Solicitação de inspeção técnica em obras',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'VISTORIA_TECNICA_OBRAS',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Documentação do Imóvel'],
    estimatedDays: 10,
    priority: 3,
    category: 'Vistoria',
    icon: 'ClipboardCheck',
    color: '#f97316'
        },
  {
    name: 'Cadastro de Obra Pública',
    description: 'Registro de obras públicas no município',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_OBRA_PUBLICA',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'Orçamento', 'Cronograma'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'Building2',
    color: '#fb923c'
        },
  {
    name: 'Inspeção de Obra',
    description: 'Inspeção de andamento de obras públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'COM_DADOS',
    moduleType: 'INSPECAO_OBRA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Inspeção',
    icon: 'Eye',
    color: '#fdba74'
        },
  {
    name: 'Acompanhamento de Obras',
    description: 'Consulta ao progresso de obras públicas',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Info',
    color: '#94a3b8'
        },
  {
    name: 'Mapa de Obras',
    description: 'Visualização geoespacial de obras no município',
    departmentCode: 'OBRAS_PUBLICAS',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE PLANEJAMENTO URBANO (9 serviços)
// ============================================================================
const URBAN_PLANNING_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Planejamento Urbano',
    description: 'Registro geral de atendimentos em planejamento',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_PLANEJAMENTO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Map',
    color: '#6366f1'
        },
  {
    name: 'Aprovação de Projeto Arquitetônico',
    description: 'Aprovação de projetos de construção e reforma',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'APROVACAO_PROJETO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'ART', 'Documentação do Imóvel'],
    estimatedDays: 30,
    priority: 5,
    category: 'Aprovação',
    icon: 'FileCheck',
    color: '#4f46e5'
        },
  {
    name: 'Alvará de Construção',
    description: 'Solicitação de licença para construção',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ALVARA_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Aprovado', 'Matrícula do Imóvel', 'ART'],
    estimatedDays: 20,
    priority: 5,
    category: 'Alvará',
    icon: 'Building',
    color: '#4338ca'
        },
  {
    name: 'Alvará de Funcionamento',
    description: 'Licença comercial para estabelecimentos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'ALVARA_FUNCIONAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Contrato Social', 'Laudo Técnico', 'Comprovante de Endereço'],
    estimatedDays: 15,
    priority: 5,
    category: 'Alvará',
    icon: 'Store',
    color: '#3730a3'
        },
  {
    name: 'Solicitação de Certidão Municipal',
    description: 'Emissão de certidões municipais',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CERTIDAO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Documentação do Imóvel'],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidão',
    icon: 'FileText',
    color: '#312e81'
        },
  {
    name: 'Denúncia de Construção Irregular',
    description: 'Registro de denúncias de obras irregulares',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Denúncia',
    icon: 'AlertTriangle',
    color: '#dc2626'
        },
  {
    name: 'Cadastro de Loteamento',
    description: 'Registro e aprovação de loteamentos',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_LOTEAMENTO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto de Loteamento', 'Matrícula', 'Estudos Técnicos', 'ART'],
    estimatedDays: 90,
    priority: 5,
    category: 'Loteamento',
    icon: 'Grid3x3',
    color: '#6366f1'
        },
  {
    name: 'Consultas Públicas (Plano Diretor)',
    description: 'Participação em audiências e consultas públicas',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Users',
    color: '#94a3b8'
        },
  {
    name: 'Mapa Urbano (Zoneamento)',
    description: 'Consulta ao mapa de zoneamento e uso do solo',
    departmentCode: 'PLANEJAMENTO_URBANO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE SEGURANÇA PÚBLICA (11 serviços)
// ============================================================================
const SECURITY_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Segurança Pública',
    description: 'Registro geral de atendimentos em segurança',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SEGURANCA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Shield',
    color: '#dc2626'
        },
  {
    name: 'Registro de Ocorrência (BO)',
    description: 'Registro de boletim de ocorrência',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_OCORRENCIA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF'],
    estimatedDays: 1,
    priority: 5,
    category: 'Ocorrência',
    icon: 'FileWarning',
    color: '#b91c1c'
        },
  {
    name: 'Solicitação de Ronda Policial',
    description: 'Solicitação de patrulhamento em área específica',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_RONDA',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 4,
    category: 'Ronda',
    icon: 'Car',
    color: '#991b1b'
        },
  {
    name: 'Solicitação de Câmera de Segurança',
    description: 'Solicitação de instalação de câmera de monitoramento',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CAMERA_SEGURANCA',
    requiresDocuments: true,
    requiredDocuments: ['Justificativa', 'Abaixo-assinado', 'Fotos do Local'],
    estimatedDays: 30,
    priority: 4,
    category: 'Câmeras',
    icon: 'Camera',
    color: '#7f1d1d'
        },
  {
    name: 'Denúncia Anônima (Disque Denúncia)',
    description: 'Registro de denúncias anônimas',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'DENUNCIA_ANONIMA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Denúncia',
    icon: 'AlertCircle',
    color: '#ef4444'
        },
  {
    name: 'Cadastro de Ponto Crítico',
    description: 'Registro de áreas de risco e vulnerabilidade',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_PONTO_CRITICO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Mapeamento',
    icon: 'MapPin',
    color: '#f87171'
        },
  {
    name: 'Alerta de Segurança',
    description: 'Registro de avisos e alertas de segurança',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'ALERTA_SEGURANCA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Alerta',
    icon: 'Bell',
    color: '#fca5a5'
        },
  {
    name: 'Registro de Patrulha',
    description: 'Registro de patrulhamento realizado',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_PATRULHA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Patrulha',
    icon: 'Route',
    color: '#dc2626'
        },
  {
    name: 'Gestão da Guarda Municipal',
    description: 'Administração de escala de serviço e viaturas',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_GUARDA_MUNICIPAL',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Users',
    color: '#64748b'
        },
  {
    name: 'Gestão de Vigilância (Central de Operações)',
    description: 'Administração de câmeras e central de monitoramento',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_VIGILANCIA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Monitor',
    color: '#64748b'
        },
  {
    name: 'Estatísticas de Segurança',
    description: 'Consulta a análises e estatísticas regionais',
    departmentCode: 'SEGURANCA_PUBLICA',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'BarChart',
    color: '#94a3b8'
        },
];

// ============================================================================
// SECRETARIA DE SERVIÇOS PÚBLICOS (9 serviços)
// ============================================================================
const PUBLIC_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Serviços Públicos',
    description: 'Registro geral de atendimentos em serviços públicos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_SERVICOS_PUBLICOS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Settings',
    color: '#64748b'
        },
  {
    name: 'Iluminação Pública (Poste Queimado)',
    description: 'Solicitação de reparo em iluminação pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'ILUMINACAO_PUBLICA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 4,
    category: 'Iluminação',
    icon: 'Lightbulb',
    color: '#facc15'
        },
  {
    name: 'Limpeza Urbana (Coleta de Lixo)',
    description: 'Agendamento de coleta e limpeza urbana',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'LIMPEZA_URBANA',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Limpeza',
    icon: 'Trash2',
    color: '#22c55e'
        },
  {
    name: 'Coleta Especial (Entulho e Móveis)',
    description: 'Agendamento de coleta de entulho e móveis velhos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'COLETA_ESPECIAL',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Coleta',
    icon: 'Truck',
    color: '#f97316'
        },
  {
    name: 'Solicitação de Capina',
    description: 'Solicitação de capina de terreno ou via pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_CAPINA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Manutenção',
    icon: 'Scissors',
    color: '#84cc16'
        },
  {
    name: 'Solicitação de Desobstrução (Bueiro Entupido)',
    description: 'Solicitação de limpeza de boca de lobo e bueiro',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_DESOBSTRUCAO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Drenagem',
    icon: 'Droplets',
    color: '#06b6d4'
        },
  {
    name: 'Solicitação de Poda de Árvore',
    description: 'Solicitação de poda de árvore em via pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_PODA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Poda',
    icon: 'TreeDeciduous',
    color: '#16a34a'
        },
  {
    name: 'Registro de Problema com Foto (Funcionalidade Transversal)',
    description: 'Registro geolocalizado de problemas com foto',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Transversal',
    icon: 'Camera',
    color: '#94a3b8'
        },
  {
    name: 'Gestão de Equipes de Serviços',
    description: 'Programação de equipes e rotas de trabalho',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    moduleType: 'GESTAO_EQUIPES_SERVICOS',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 2,
    category: 'Gestão Interna',
    icon: 'Users',
    color: '#64748b'
        },
];

// ============================================================================
// SECRETARIA DE TURISMO (9 serviços)
// ============================================================================
const TOURISM_SERVICES: ServiceDefinition[] = [
  {
    name: 'Atendimentos - Turismo',
    description: 'Registro geral de atendimentos na área turística',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTOS_TURISMO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Atendimento',
    icon: 'Plane',
    color: '#3b82f6'
        },
  {
    name: 'Cadastro de Estabelecimento Turístico',
    description: 'Cadastro de hotéis, pousadas, restaurantes',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Alvará de Funcionamento', 'Documentação do Responsável'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastro',
    icon: 'Building',
    color: '#2563eb'
        },
  {
    name: 'Cadastro de Guia Turístico',
    description: 'Cadastro de guias de turismo credenciados',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Cadastur', 'Certificado de Capacitação'],
    estimatedDays: 7,
    priority: 3,
    category: 'Cadastro',
    icon: 'User',
    color: '#1d4ed8'
        },
  {
    name: 'Inscrição em Programa Turístico',
    description: 'Inscrição em programas de desenvolvimento turístico',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ ou CPF', 'Projeto', 'Documentação do Estabelecimento'],
    estimatedDays: 15,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#1e40af'
        },
  {
    name: 'Registro de Atrativo Turístico',
    description: 'Cadastro de pontos turísticos e atrativos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_ATRATIVO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Fotos', 'Descrição', 'Localização GPS'],
    estimatedDays: 5,
    priority: 3,
    category: 'Atrativos',
    icon: 'MapPin',
    color: '#1e3a8a'
        },
  {
    name: 'Cadastro de Roteiro Turístico',
    description: 'Cadastro de roteiros e passeios turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ROTEIRO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Roteiro Detalhado', 'Fotos', 'Valores', 'Contatos'],
    estimatedDays: 10,
    priority: 3,
    category: 'Roteiros',
    icon: 'Route',
    color: '#3b82f6'
        },
  {
    name: 'Cadastro de Evento Turístico',
    description: 'Registro de eventos e festivais turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_EVENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto do Evento', 'Autorizações', 'Cronograma'],
    estimatedDays: 20,
    priority: 4,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#2563eb'
        },
  {
    name: 'Mapa Turístico',
    description: 'Visualização de atrativos turísticos no mapa',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8'
        },
  {
    name: 'Guia Turístico da Cidade',
    description: 'Informações gerais sobre a cidade',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Book',
    color: '#94a3b8'
        },
];

// ============================================================================
// EXPORTAR FUNÇÃO DE SEED
// ============================================================================

export async function seedServices(tenantId: string) {
  console.log('\n📦 Iniciando seed de serviços simplificados...');

  // Buscar departamentos GLOBAIS (não filtrar por tenantId)
  const departments = await prisma.department.findMany({
    // ✅ SEM filtro de tenant - departamentos são globais
  });

  const departmentMap = new Map(
    departments.map(dept => [dept.code, dept.id])
  );

  let totalCreated = 0;
  const allServices = [
    ...HEALTH_SERVICES,
    ...EDUCATION_SERVICES,
    ...SOCIAL_SERVICES,
    ...AGRICULTURE_SERVICES,
    ...CULTURE_SERVICES,
    ...SPORTS_SERVICES,
    ...HOUSING_SERVICES,
    ...ENVIRONMENT_SERVICES,
    ...PUBLIC_WORKS_SERVICES,
    ...URBAN_PLANNING_SERVICES,
    ...SECURITY_SERVICES,
    ...PUBLIC_SERVICES,
    ...TOURISM_SERVICES,
  ];

  for (const serviceDef of allServices) {
    const departmentId = departmentMap.get(serviceDef.departmentCode);

    if (!departmentId) {
      console.warn(`   ⚠️  Departamento ${serviceDef.departmentCode} não encontrado, pulando serviço: ${serviceDef.name}`);
      continue;
    }

    try {
      await prisma.serviceSimplified.create({
        data: {
          name: serviceDef.name,
          description: serviceDef.description,
          departmentId,
                    serviceType: serviceDef.serviceType,
          moduleType: serviceDef.moduleType,
          formSchema: serviceDef.formSchema || undefined,
          requiresDocuments: serviceDef.requiresDocuments,
          requiredDocuments: serviceDef.requiredDocuments
            ? JSON.stringify(serviceDef.requiredDocuments)
            : undefined,
          estimatedDays: serviceDef.estimatedDays,
          priority: serviceDef.priority,
          category: serviceDef.category,
          icon: serviceDef.icon,
          color: serviceDef.color,
          isActive: true
        }
      });

      totalCreated++;
      console.log(`   ✅ ${serviceDef.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`   ℹ️  Serviço já existe: ${serviceDef.name}`);
      } else {
        console.error(`   ❌ Erro ao criar serviço ${serviceDef.name}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Seed de serviços concluído: ${totalCreated} serviços criados`);
  return totalCreated;
}
