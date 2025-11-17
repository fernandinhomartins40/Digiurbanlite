/**
 * ============================================================================
 * MÓDULOS DE PLANEJAMENTO URBANO - CONFIGURAÇÃO
 * ============================================================================
 */

import { ModuleConfig } from './types';

// =============================================================================
// 1. ATENDIMENTOS
// =============================================================================

export const atendimentosUrbanosConfig: ModuleConfig = {
  key: 'atendimentos',
  entityName: 'UrbanPlanningAttendance',
  departmentType: 'urban-planning',
  displayName: 'Atendimentos Urbanísticos',
  displayNameSingular: 'Atendimento Urbanístico',
  description: 'Registro de atendimentos gerais sobre questões urbanísticas',
  icon: 'FileText',
  color: 'blue',

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
      name: 'contactInfo',
      label: 'Contato',
      type: 'text',
      required: true,
      placeholder: '(00) 00000-0000',
      showInList: true,
      showInForm: true,
      showInDetails: true,
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
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'OPEN', label: 'Aberto' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'RESOLVED', label: 'Resolvido' },
        { value: 'CLOSED', label: 'Fechado' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'attendanceDate',
      label: 'Data do Atendimento',
      type: 'date',
      showInList: true,
      showInDetails: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Atendimentos', icon: 'FileText' },
    { key: 'open', label: 'Abertos', icon: 'Clock', variant: 'warning' },
    { key: 'inProgress', label: 'Em Andamento', icon: 'Activity', variant: 'info' },
    { key: 'resolved', label: 'Resolvidos', icon: 'CheckCircle', variant: 'success' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/atendimentos',
};

// =============================================================================
// 2. APROVAÇÃO DE PROJETOS
// =============================================================================

export const aprovacaoProjetosConfig: ModuleConfig = {
  key: 'aprovacao-projetos',
  departmentType: 'planejamento-urbano',
  entityName: 'ProjectApproval',
  displayName: 'Aprovação de Projetos',
  displayNameSingular: 'Projeto',
  description: 'Análise e aprovação de projetos arquitetônicos e urbanísticos',
  icon: 'Building',
  color: 'blue',

  fields: [
    {
      name: 'projectName',
      label: 'Nome do Projeto',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'applicantName',
      label: 'Requerente',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'projectType',
      label: 'Tipo de Projeto',
      type: 'select',
      required: true,
      options: [
        { value: 'NOVA_CONSTRUCAO', label: 'Nova Construção' },
        { value: 'AMPLIACAO', label: 'Ampliação' },
        { value: 'REFORMA', label: 'Reforma' },
        { value: 'DEMOLICAO', label: 'Demolição' },
        { value: 'REGULARIZACAO', label: 'Regularização' },
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
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'UNDER_REVIEW', label: 'Em Análise' },
        { value: 'PENDING_DOCUMENTS', label: 'Pendente Documentos' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'REJECTED', label: 'Rejeitado' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'submissionDate',
      label: 'Data de Submissão',
      type: 'date',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'approvalDate',
      label: 'Data de Aprovação',
      type: 'date',
      showInDetails: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Projetos', icon: 'Building' },
    { key: 'underReview', label: 'Em Análise', icon: 'Search', variant: 'warning' },
    { key: 'approved', label: 'Aprovados', icon: 'CheckCircle', variant: 'success' },
    { key: 'rejected', label: 'Rejeitados', icon: 'XCircle', variant: 'danger' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'projectType', label: 'Tipo de Projeto', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/aprovacao-projetos',
};

// =============================================================================
// 3. ALVARÁS DE CONSTRUÇÃO
// =============================================================================

export const alvarasConstrucaoConfig: ModuleConfig = {
  key: 'alvaras-construcao',
  departmentType: 'planejamento-urbano',
  entityName: 'BuildingPermit',
  displayName: 'Alvarás de Construção',
  displayNameSingular: 'Alvará de Construção',
  description: 'Emissão e gestão de alvarás de construção',
  icon: 'Hammer',
  color: 'orange',

  fields: [
    {
      name: 'applicantName',
      label: 'Requerente',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'applicantCpf',
      label: 'CPF/CNPJ',
      type: 'text',
      placeholder: '000.000.000-00',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'applicantPhone',
      label: 'Telefone',
      type: 'text',
      placeholder: '(00) 00000-0000',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'applicantEmail',
      label: 'E-mail',
      type: 'email',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyAddress',
      label: 'Endereço do Imóvel',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyNumber',
      label: 'Número',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'neighborhood',
      label: 'Bairro',
      type: 'text',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'lotNumber',
      label: 'Número do Lote',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'blockNumber',
      label: 'Número da Quadra',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'totalArea',
      label: 'Área Total (m²)',
      type: 'number',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'builtArea',
      label: 'Área Construída (m²)',
      type: 'number',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'floors',
      label: 'Número de Andares',
      type: 'number',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'constructionType',
      label: 'Tipo de Construção',
      type: 'select',
      options: [
        { value: 'RESIDENCIAL', label: 'Residencial' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'INDUSTRIAL', label: 'Industrial' },
        { value: 'MISTO', label: 'Misto' },
      ],
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'permitType',
      label: 'Tipo de Alvará',
      type: 'select',
      required: true,
      options: [
        { value: 'NOVA_CONSTRUCAO', label: 'Nova Construção' },
        { value: 'AMPLIACAO', label: 'Ampliação' },
        { value: 'REFORMA', label: 'Reforma' },
        { value: 'DEMOLICAO', label: 'Demolição' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'projectValue',
      label: 'Valor do Projeto (R$)',
      type: 'number',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'description',
      label: 'Descrição',
      type: 'textarea',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'observations',
      label: 'Observações',
      type: 'textarea',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'REJECTED', label: 'Rejeitado' },
        { value: 'ISSUED', label: 'Emitido' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'permitNumber',
      label: 'Número do Alvará',
      type: 'text',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'submissionDate',
      label: 'Data de Submissão',
      type: 'date',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'validUntil',
      label: 'Válido Até',
      type: 'date',
      showInDetails: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Alvarás', icon: 'Hammer' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock', variant: 'warning' },
    { key: 'approved', label: 'Aprovados', icon: 'CheckCircle', variant: 'success' },
    { key: 'issued', label: 'Emitidos', icon: 'Award', variant: 'info' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'permitType', label: 'Tipo de Alvará', type: 'select' },
    { key: 'constructionType', label: 'Tipo de Construção', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/alvaras-construcao',
};

// =============================================================================
// 4. ALVARÁS DE FUNCIONAMENTO
// =============================================================================

export const alvarasFuncionamentoConfig: ModuleConfig = {
  key: 'alvaras-funcionamento',
  departmentType: 'planejamento-urbano',
  entityName: 'BusinessLicense',
  displayName: 'Alvarás de Funcionamento',
  displayNameSingular: 'Alvará de Funcionamento',
  description: 'Emissão e gestão de alvarás de funcionamento para estabelecimentos comerciais',
  icon: 'Store',
  color: 'purple',

  fields: [
    {
      name: 'applicantName',
      label: 'Responsável Legal',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'applicantCpfCnpj',
      label: 'CPF/CNPJ',
      type: 'text',
      required: true,
      placeholder: '00.000.000/0000-00',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'applicantPhone',
      label: 'Telefone',
      type: 'text',
      placeholder: '(00) 00000-0000',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'applicantEmail',
      label: 'E-mail',
      type: 'email',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'businessName',
      label: 'Nome do Estabelecimento',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'businessType',
      label: 'Tipo de Estabelecimento',
      type: 'select',
      required: true,
      options: [
        { value: 'COMERCIO', label: 'Comércio' },
        { value: 'SERVICO', label: 'Serviço' },
        { value: 'INDUSTRIA', label: 'Indústria' },
        { value: 'MISTO', label: 'Misto' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'businessActivity',
      label: 'Atividade Econômica (CNAE)',
      type: 'text',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyAddress',
      label: 'Endereço do Estabelecimento',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyNumber',
      label: 'Número',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'neighborhood',
      label: 'Bairro',
      type: 'text',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'licenseType',
      label: 'Tipo de Alvará',
      type: 'select',
      required: true,
      options: [
        { value: 'PROVISORIO', label: 'Provisório' },
        { value: 'DEFINITIVO', label: 'Definitivo' },
        { value: 'RENOVACAO', label: 'Renovação' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'observations',
      label: 'Observações',
      type: 'textarea',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
        { value: 'APPROVED', label: 'Aprovado' },
        { value: 'REJECTED', label: 'Rejeitado' },
        { value: 'ISSUED', label: 'Emitido' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'licenseNumber',
      label: 'Número do Alvará',
      type: 'text',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'submissionDate',
      label: 'Data de Submissão',
      type: 'date',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'validUntil',
      label: 'Válido Até',
      type: 'date',
      showInDetails: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Alvarás', icon: 'Store' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock', variant: 'warning' },
    { key: 'approved', label: 'Aprovados', icon: 'CheckCircle', variant: 'success' },
    { key: 'issued', label: 'Emitidos', icon: 'Award', variant: 'info' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'licenseType', label: 'Tipo de Alvará', type: 'select' },
    { key: 'businessType', label: 'Tipo de Estabelecimento', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/alvaras-funcionamento',
};

// =============================================================================
// 5. CERTIDÕES
// =============================================================================

export const certidoesConfig: ModuleConfig = {
  key: 'certidoes',
  departmentType: 'planejamento-urbano',
  entityName: 'CertificateRequest',
  displayName: 'Certidões',
  displayNameSingular: 'Certidão',
  description: 'Emissão de certidões urbanísticas e imobiliárias',
  icon: 'FileCheck',
  color: 'indigo',

  fields: [
    {
      name: 'applicantName',
      label: 'Requerente',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'applicantCpfCnpj',
      label: 'CPF/CNPJ',
      type: 'text',
      required: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'applicantPhone',
      label: 'Telefone',
      type: 'text',
      placeholder: '(00) 00000-0000',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'applicantEmail',
      label: 'E-mail',
      type: 'email',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'certificateType',
      label: 'Tipo de Certidão',
      type: 'select',
      required: true,
      options: [
        { value: 'USO_SOLO', label: 'Uso do Solo' },
        { value: 'LOCALIZACAO', label: 'Localização' },
        { value: 'ZONEAMENTO', label: 'Zoneamento' },
        { value: 'ALINHAMENTO', label: 'Alinhamento' },
        { value: 'VIABILIDADE', label: 'Viabilidade' },
        { value: 'NADA_CONSTA', label: 'Nada Consta' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'purpose',
      label: 'Finalidade',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyAddress',
      label: 'Endereço do Imóvel',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyNumber',
      label: 'Número',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'neighborhood',
      label: 'Bairro',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'observations',
      label: 'Observações',
      type: 'textarea',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'PROCESSING', label: 'Em Processamento' },
        { value: 'ISSUED', label: 'Emitida' },
        { value: 'REJECTED', label: 'Rejeitada' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'certificateNumber',
      label: 'Número da Certidão',
      type: 'text',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'submissionDate',
      label: 'Data de Solicitação',
      type: 'date',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'issuedDate',
      label: 'Data de Emissão',
      type: 'date',
      showInDetails: true,
    },
    {
      name: 'validUntil',
      label: 'Válido Até',
      type: 'date',
      showInDetails: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Certidões', icon: 'FileCheck' },
    { key: 'pending', label: 'Pendentes', icon: 'Clock', variant: 'warning' },
    { key: 'processing', label: 'Em Processamento', icon: 'Activity', variant: 'info' },
    { key: 'issued', label: 'Emitidas', icon: 'CheckCircle', variant: 'success' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'certificateType', label: 'Tipo de Certidão', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/certidoes',
};

// =============================================================================
// 6. DENÚNCIAS URBANAS
// =============================================================================

export const denunciasUrbanasConfig: ModuleConfig = {
  key: 'denuncias-urbanas',
  departmentType: 'planejamento-urbano',
  entityName: 'UrbanInfraction',
  displayName: 'Denúncias Urbanas',
  displayNameSingular: 'Denúncia Urbana',
  description: 'Registro e fiscalização de infrações urbanísticas',
  icon: 'AlertTriangle',
  color: 'red',

  fields: [
    {
      name: 'complainantName',
      label: 'Nome do Denunciante',
      type: 'text',
      placeholder: 'Opcional - Pode ser anônimo',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'complainantPhone',
      label: 'Telefone do Denunciante',
      type: 'text',
      placeholder: '(00) 00000-0000',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'complainantEmail',
      label: 'E-mail do Denunciante',
      type: 'email',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'infractionType',
      label: 'Tipo de Infração',
      type: 'select',
      required: true,
      options: [
        { value: 'CONSTRUCAO_IRREGULAR', label: 'Construção Irregular' },
        { value: 'OBRA_SEM_ALVARA', label: 'Obra sem Alvará' },
        { value: 'USO_INADEQUADO_SOLO', label: 'Uso Inadequado do Solo' },
        { value: 'INVASAO_AREA_PUBLICA', label: 'Invasão de Área Pública' },
        { value: 'POLUICAO_VISUAL', label: 'Poluição Visual' },
        { value: 'DESMATAMENTO', label: 'Desmatamento' },
        { value: 'OUTROS', label: 'Outros' },
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
      name: 'propertyAddress',
      label: 'Endereço do Local',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'propertyNumber',
      label: 'Número',
      type: 'text',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'neighborhood',
      label: 'Bairro',
      type: 'text',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'priority',
      label: 'Prioridade',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Baixa' },
        { value: 'MEDIUM', label: 'Média' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'URGENT', label: 'Urgente' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'observations',
      label: 'Observações',
      type: 'textarea',
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
        { value: 'NOTIFIED', label: 'Notificado' },
        { value: 'RESOLVED', label: 'Resolvida' },
        { value: 'DISMISSED', label: 'Arquivada' },
      ],
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
    {
      name: 'submissionDate',
      label: 'Data da Denúncia',
      type: 'date',
      showInList: true,
      showInDetails: true,
    },
    {
      name: 'inspectionDate',
      label: 'Data da Inspeção',
      type: 'date',
      showInDetails: true,
    },
    {
      name: 'resolutionDate',
      label: 'Data de Resolução',
      type: 'date',
      showInDetails: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Denúncias', icon: 'AlertTriangle' },
    { key: 'open', label: 'Abertas', icon: 'AlertCircle', variant: 'danger' },
    { key: 'underInvestigation', label: 'Em Investigação', icon: 'Search', variant: 'warning' },
    { key: 'resolved', label: 'Resolvidas', icon: 'CheckCircle', variant: 'success' },
  ],

  filters: [
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'infractionType', label: 'Tipo de Infração', type: 'select' },
    { key: 'priority', label: 'Prioridade', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/denuncias-urbanas',
};

// =============================================================================
// 7. LOTEAMENTOS (ZONEAMENTO URBANO)
// =============================================================================

export const loteamentosConfig: ModuleConfig = {
  key: 'loteamentos',
  departmentType: 'planejamento-urbano',
  entityName: 'UrbanZoning',
  displayName: 'Loteamentos e Zoneamento',
  displayNameSingular: 'Zona Urbana',
  description: 'Gestão de loteamentos e zoneamento urbano',
  icon: 'Map',
  color: 'green',

  fields: [
    {
      name: 'name',
      label: 'Nome',
      type: 'text',
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'zoneName',
      label: 'Nome da Zona',
      type: 'text',
      required: true,
      showInList: true,
      showInForm: true,
      showInDetails: true,
      sortable: true,
      filterable: true,
    },
    {
      name: 'code',
      label: 'Código',
      type: 'text',
      showInList: true,
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'zoneType',
      label: 'Tipo de Zona',
      type: 'select',
      required: true,
      options: [
        { value: 'RESIDENCIAL', label: 'Residencial' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'INDUSTRIAL', label: 'Industrial' },
        { value: 'MISTA', label: 'Mista' },
        { value: 'RURAL', label: 'Rural' },
        { value: 'PROTECAO_AMBIENTAL', label: 'Proteção Ambiental' },
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
      showInForm: true,
      showInDetails: true,
    },
    {
      name: 'isActive',
      label: 'Ativo',
      type: 'checkbox',
      showInList: true,
      showInForm: true,
      showInDetails: true,
      filterable: true,
    },
  ],

  stats: [
    { key: 'total', label: 'Total de Zonas', icon: 'Map' },
    { key: 'active', label: 'Ativas', icon: 'CheckCircle', variant: 'success' },
    { key: 'residential', label: 'Residenciais', icon: 'Home', variant: 'info' },
    { key: 'commercial', label: 'Comerciais', icon: 'Store', variant: 'warning' },
  ],

  filters: [
    { key: 'zoneType', label: 'Tipo de Zona', type: 'select' },
    { key: 'isActive', label: 'Status', type: 'select' },
  ],

  apiEndpoint: '/api/admin/secretarias/planejamento-urbano/loteamentos',
};

// =============================================================================
// EXPORT ALL CONFIGS
// =============================================================================

export const configsPlanejamentoUrbano = {
  atendimentos: atendimentosUrbanosConfig,
  'aprovacao-projetos': aprovacaoProjetosConfig,
  'alvaras-construcao': alvarasConstrucaoConfig,
  'alvaras-funcionamento': alvarasFuncionamentoConfig,
  certidoes: certidoesConfig,
  'denuncias-urbanas': denunciasUrbanasConfig,
  loteamentos: loteamentosConfig,
};
