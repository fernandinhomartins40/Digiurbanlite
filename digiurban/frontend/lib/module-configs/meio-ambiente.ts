/**
 * ============================================================================
 * MÓDULOS DE MEIO AMBIENTE - CONFIGURAÇÃO
 * ============================================================================
 */

import { ModuleConfig } from './types';

// =============================================================================
// 1. ATENDIMENTOS AMBIENTAIS
// =============================================================================

export const atendimentosAmbientaisConfig: ModuleConfig = {
  key: 'atendimentos',
  entityName: 'EnvironmentalAttendance',
  departmentType: 'environment',
  displayName: 'Atendimentos Ambientais',
  displayNameSingular: 'Atendimento Ambiental',
  description: 'Registro de atendimentos gerais sobre questões ambientais',
  icon: 'FileText',
  color: 'green',

  fields: [
    {
      name: 'citizenName',
      label: 'Nome do Cidadão',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'citizenCpf',
      label: 'CPF',
      type: 'text',
      placeholder: '000.000.000-00',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'contact',
      label: 'Contato',
      type: 'text',
      required: true,
      placeholder: '(00) 00000-0000',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'serviceType',
      label: 'Tipo de Serviço',
      type: 'select',
      required: true,
      options: [
        { value: 'INFORMACAO', label: 'Informação' },
        { value: 'CONSULTORIA', label: 'Consultoria' },
        { value: 'DENUNCIA', label: 'Denúncia' },
        { value: 'LICENCIAMENTO', label: 'Licenciamento' },
        { value: 'AUTORIZACAO', label: 'Autorização' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'subject',
      label: 'Assunto',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'description',
      label: 'Descrição',
      type: 'textarea',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'urgency',
      label: 'Urgência',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Baixa' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'URGENT', label: 'Urgente' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'RESOLVED', label: 'Resolvido' },
        { value: 'CLOSED', label: 'Fechado' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Atendimentos', icon: 'FileText' },
    { key: 'pendingAttendances', label: 'Pendentes', icon: 'Clock', variant: 'warning' },
    { key: 'inProgress', label: 'Em Andamento', icon: 'Activity', variant: 'info' },
    { key: 'resolved', label: 'Resolvidos', icon: 'CheckCircle', variant: 'success' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'urgency', label: 'Urgência', type: 'select' },
    { key: 'serviceType', label: 'Tipo de Serviço', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/atendimentos',
};

// =============================================================================
// 2. LICENÇAS AMBIENTAIS
// =============================================================================

export const licencasAmbientaisConfig: ModuleConfig = {
  key: 'licencas',
  departmentType: 'meio-ambiente',
  entityName: 'EnvironmentalLicense',
  displayName: 'Licenças Ambientais',
  displayNameSingular: 'Licença Ambiental',
  description: 'Gestão de licenças ambientais para atividades e empreendimentos',
  icon: 'Award',
  color: 'blue',

  fields: [
    {
      name: 'licenseNumber',
      label: 'Número da Licença',
      type: 'text',
      showInList: true,
      showInDetails: true,
      sortable: true,
    },
    {
      name: 'applicantName',
      label: 'Nome do Requerente',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'applicantCpf',
      label: 'CPF/CNPJ',
      type: 'text',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'businessName',
      label: 'Razão Social/Nome do Empreendimento',
      type: 'text',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'licenseType',
      label: 'Tipo de Licença',
      type: 'select',
      required: true,
      options: [
        { value: 'PREVIA', label: 'Licença Prévia (LP)' },
        { value: 'INSTALACAO', label: 'Licença de Instalação (LI)' },
        { value: 'OPERACAO', label: 'Licença de Operação (LO)' },
        { value: 'SIMPLIFICADA', label: 'Licença Simplificada' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'activity',
      label: 'Atividade',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'location',
      label: 'Localização',
      type: 'text',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
        { value: 'ADDITIONAL_INFO_REQUIRED', label: 'Informações Adicionais Necessárias' },
        { value: 'APPROVED', label: 'Aprovada' },
        { value: 'DENIED', label: 'Negada' },
        { value: 'SUSPENDED', label: 'Suspensa' },
        { value: 'EXPIRED', label: 'Vencida' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Licenças', icon: 'Award' },
    { key: 'underAnalysisLicenses', label: 'Em Análise', icon: 'FileSearch', variant: 'warning' },
    { key: 'approved', label: 'Aprovadas', icon: 'CheckCircle', variant: 'success' },
    { key: 'active', label: 'Ativas', icon: 'Check', variant: 'info' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'licenseType', label: 'Tipo de Licença', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/licencas',
};

// =============================================================================
// 3. DENÚNCIAS AMBIENTAIS
// =============================================================================

export const denunciasAmbientaisConfig: ModuleConfig = {
  key: 'denuncias',
  departmentType: 'meio-ambiente',
  entityName: 'EnvironmentalComplaint',
  displayName: 'Denúncias Ambientais',
  displayNameSingular: 'Denúncia Ambiental',
  description: 'Registro e acompanhamento de denúncias ambientais',
  icon: 'AlertTriangle',
  color: 'red',

  fields: [
    {
      name: 'protocol',
      label: 'Protocolo',
      type: 'text',
      showInList: true,
      showInDetails: true,
      sortable: true,
    },
    {
      name: 'isAnonymous',
      label: 'Denúncia Anônima?',
      type: 'boolean',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'reporterName',
      label: 'Nome do Denunciante',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'complaintType',
      label: 'Tipo de Denúncia',
      type: 'select',
      required: true,
      options: [
        { value: 'POLUICAO_AGUA', label: 'Poluição da Água' },
        { value: 'POLUICAO_AR', label: 'Poluição do Ar' },
        { value: 'POLUICAO_SONORA', label: 'Poluição Sonora' },
        { value: 'DESMATAMENTO', label: 'Desmatamento' },
        { value: 'MAUS_TRATOS_ANIMAIS', label: 'Maus Tratos a Animais' },
        { value: 'DESCARTE_IRREGULAR', label: 'Descarte Irregular de Resíduos' },
        { value: 'QUEIMADA', label: 'Queimada' },
        { value: 'OUTROS', label: 'Outros' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'severity',
      label: 'Gravidade',
      type: 'select',
      required: true,
      options: [
        { value: 'LOW', label: 'Baixa' },
        { value: 'MEDIUM', label: 'Média' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'CRITICAL', label: 'Crítica' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'description',
      label: 'Descrição da Denúncia',
      type: 'textarea',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'location',
      label: 'Localização',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'OPEN', label: 'Aberta' },
        { value: 'UNDER_INVESTIGATION', label: 'Em Investigação' },
        { value: 'RESOLVED', label: 'Resolvida' },
        { value: 'UNFOUNDED', label: 'Improcedente' },
        { value: 'CLOSED', label: 'Fechada' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Denúncias', icon: 'AlertTriangle' },
    { key: 'openComplaints', label: 'Abertas', icon: 'AlertCircle', variant: 'error' },
    { key: 'underInvestigation', label: 'Em Investigação', icon: 'Search', variant: 'warning' },
    { key: 'resolved', label: 'Resolvidas', icon: 'CheckCircle', variant: 'success' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'complaintType', label: 'Tipo', type: 'select' },
    { key: 'severity', label: 'Gravidade', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/denuncias',
};

// =============================================================================
// 4. PROGRAMAS AMBIENTAIS
// =============================================================================

export const programasAmbientaisConfig: ModuleConfig = {
  key: 'programas',
  departmentType: 'meio-ambiente',
  entityName: 'EnvironmentalProgram',
  displayName: 'Programas Ambientais',
  displayNameSingular: 'Programa Ambiental',
  description: 'Gestão de programas de educação e preservação ambiental',
  icon: 'TreePine',
  color: 'green',

  fields: [
    {
      name: 'name',
      label: 'Nome do Programa',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'programType',
      label: 'Tipo de Programa',
      type: 'select',
      required: true,
      options: [
        { value: 'EDUCACAO_AMBIENTAL', label: 'Educação Ambiental' },
        { value: 'REFLORESTAMENTO', label: 'Reflorestamento' },
        { value: 'RECICLAGEM', label: 'Reciclagem' },
        { value: 'PRESERVACAO', label: 'Preservação' },
        { value: 'RECURSOS_HIDRICOS', label: 'Recursos Hídricos' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'description',
      label: 'Descrição',
      type: 'textarea',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'coordinator',
      label: 'Coordenador',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'startDate',
      label: 'Data de Início',
      type: 'date',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
    },
    {
      name: 'endDate',
      label: 'Data de Término',
      type: 'date',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Ativo' },
        { value: 'INACTIVE', label: 'Inativo' },
        { value: 'COMPLETED', label: 'Concluído' },
        { value: 'SUSPENDED', label: 'Suspenso' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Programas', icon: 'TreePine' },
    { key: 'activePrograms', label: 'Ativos', icon: 'Activity', variant: 'success' },
    { key: 'completed', label: 'Concluídos', icon: 'CheckCircle', variant: 'info' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'programType', label: 'Tipo de Programa', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/programas',
};

// =============================================================================
// 5. AUTORIZAÇÕES DE PODA E CORTE
// =============================================================================

export const podaCorteConfig: ModuleConfig = {
  key: 'poda-corte',
  departmentType: 'meio-ambiente',
  entityName: 'TreeCuttingAuthorization',
  displayName: 'Autorizações de Poda e Corte',
  displayNameSingular: 'Autorização de Poda/Corte',
  description: 'Autorizações para poda, corte e transplante de árvores',
  icon: 'Tree',
  color: 'orange',

  fields: [
    {
      name: 'authorizationNumber',
      label: 'Número da Autorização',
      type: 'text',
      showInList: true,
      showInDetails: true,
      sortable: true,
    },
    {
      name: 'applicantName',
      label: 'Nome do Requerente',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'applicantCpf',
      label: 'CPF',
      type: 'text',
      required: true,
      placeholder: '000.000.000-00',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyAddress',
      label: 'Endereço do Imóvel',
      type: 'text',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'requestType',
      label: 'Tipo de Solicitação',
      type: 'select',
      required: true,
      options: [
        { value: 'PODA', label: 'Poda' },
        { value: 'CORTE', label: 'Corte' },
        { value: 'TRANSPLANTE', label: 'Transplante' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'treeSpecies',
      label: 'Espécie da Árvore',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'treeQuantity',
      label: 'Quantidade',
      type: 'number',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'justification',
      label: 'Justificativa',
      type: 'textarea',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
        { value: 'APPROVED', label: 'Aprovada' },
        { value: 'DENIED', label: 'Negada' },
        { value: 'EXECUTED', label: 'Executada' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Autorizações', icon: 'Tree' },
    { key: 'pendingTreeCuttings', label: 'Em Análise', icon: 'Clock', variant: 'warning' },
    { key: 'approved', label: 'Aprovadas', icon: 'CheckCircle', variant: 'success' },
    { key: 'executed', label: 'Executadas', icon: 'Check', variant: 'info' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'requestType', label: 'Tipo', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/poda-corte',
};

// =============================================================================
// 6. VISTORIAS AMBIENTAIS
// =============================================================================

export const vistoriasAmbientaisConfig: ModuleConfig = {
  key: 'vistorias',
  departmentType: 'meio-ambiente',
  entityName: 'EnvironmentalInspection',
  displayName: 'Vistorias Ambientais',
  displayNameSingular: 'Vistoria Ambiental',
  description: 'Agendamento e registro de vistorias ambientais',
  icon: 'FileSearch',
  color: 'purple',

  fields: [
    {
      name: 'inspectionNumber',
      label: 'Número da Vistoria',
      type: 'text',
      showInList: true,
      showInDetails: true,
      sortable: true,
    },
    {
      name: 'inspectionType',
      label: 'Tipo de Vistoria',
      type: 'select',
      required: true,
      options: [
        { value: 'LICENCIAMENTO', label: 'Licenciamento' },
        { value: 'DENUNCIA', label: 'Denúncia' },
        { value: 'ROTINA', label: 'Rotina' },
        { value: 'SEGUIMENTO', label: 'Seguimento' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'subject',
      label: 'Assunto',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'location',
      label: 'Local',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'scheduledDate',
      label: 'Data Agendada',
      type: 'date',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
    },
    {
      name: 'inspector',
      label: 'Fiscal Responsável',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'priority',
      label: 'Prioridade',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Baixa' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'URGENT', label: 'Urgente' },
      ],
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'SCHEDULED', label: 'Agendada' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'COMPLETED', label: 'Concluída' },
        { value: 'CANCELED', label: 'Cancelada' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Vistorias', icon: 'FileSearch' },
    { key: 'scheduledInspections', label: 'Agendadas', icon: 'Calendar', variant: 'info' },
    { key: 'inProgress', label: 'Em Andamento', icon: 'Activity', variant: 'warning' },
    { key: 'completed', label: 'Concluídas', icon: 'CheckCircle', variant: 'success' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'inspectionType', label: 'Tipo', type: 'select' },
    { key: 'priority', label: 'Prioridade', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/vistorias',
};

// =============================================================================
// 7. ÁREAS PROTEGIDAS
// =============================================================================

export const areasProtegidasConfig: ModuleConfig = {
  key: 'areas-protegidas',
  departmentType: 'meio-ambiente',
  entityName: 'ProtectedArea',
  displayName: 'Áreas Protegidas',
  displayNameSingular: 'Área Protegida',
  description: 'Cadastro e gestão de áreas de preservação ambiental',
  icon: 'Shield',
  color: 'emerald',

  fields: [
    {
      name: 'name',
      label: 'Nome da Área',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'areaType',
      label: 'Tipo de Área',
      type: 'select',
      required: true,
      options: [
        { value: 'APA', label: 'Área de Proteção Ambiental (APA)' },
        { value: 'RESERVA', label: 'Reserva Ecológica' },
        { value: 'PARQUE', label: 'Parque Municipal' },
        { value: 'APP', label: 'Área de Preservação Permanente (APP)' },
        { value: 'OUTROS', label: 'Outros' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'description',
      label: 'Descrição',
      type: 'textarea',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'location',
      label: 'Localização',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'totalArea',
      label: 'Área Total (Alqueire)',
      type: 'number',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'protectionLevel',
      label: 'Nível de Proteção',
      type: 'select',
      required: true,
      options: [
        { value: 'INTEGRAL', label: 'Proteção Integral' },
        { value: 'USO_SUSTENTAVEL', label: 'Uso Sustentável' },
        { value: 'RECUPERACAO', label: 'Em Recuperação' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'guardian',
      label: 'Guardião/Responsável',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'isPublicAccess',
      label: 'Acesso Público?',
      type: 'boolean',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Ativa' },
        { value: 'INACTIVE', label: 'Inativa' },
        { value: 'UNDER_STUDY', label: 'Em Estudo' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Áreas', icon: 'Shield' },
    { key: 'activeProtectedAreas', label: 'Ativas', icon: 'Check', variant: 'success' },
    { key: 'publicAccess', label: 'Com Acesso Público', icon: 'Users', variant: 'info' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'areaType', label: 'Tipo', type: 'select' },
    { key: 'protectionLevel', label: 'Nível de Proteção', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/meio-ambiente/areas-protegidas',
};

// =============================================================================
// EXPORTAÇÃO
// =============================================================================

export const meioAmbienteConfigs = {
  atendimentos: atendimentosAmbientaisConfig,
  licencas: licencasAmbientaisConfig,
  denuncias: denunciasAmbientaisConfig,
  programas: programasAmbientaisConfig,
  'poda-corte': podaCorteConfig,
  vistorias: vistoriasAmbientaisConfig,
  'areas-protegidas': areasProtegidasConfig,
};
