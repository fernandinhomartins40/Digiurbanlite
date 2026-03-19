import { DocumentTemplateType, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TemplateProfileKey =
  | 'TECHNICAL_REPORT'
  | 'AUTHORIZATION'
  | 'NOTIFICATION'
  | 'RECEIPT'
  | 'COMPLETION'
  | 'OFFICIAL_DOCUMENT';

type WorkflowStageRecord = Record<string, any>;

interface SeedOptions {
  prisma?: PrismaClient;
  createdBy?: string;
}

export interface WorkflowDocumentTemplateSeedSummary {
  templatesCreated: number;
  templatesUpdated: number;
  generationStagesLinked: number;
  conclusionTemplatesUpserted: number;
  workflowsUpdated: number;
  skippedStages: number;
}

const LEGACY_WORKFLOW_TAB_MAP: Record<string, string> = {
  generated: 'documentos-gerados',
  'document-generation': 'documentos-gerados',
  send: 'enviar',
  documents: 'documentos',
  communication: 'comunicacao',
  involved: 'envolvidos',
  location: 'dados',
  photos: 'documentos',
};

const GENERATION_STAGE_KEYWORDS = [
  'emiss',
  'emitir',
  'expedi',
  'gera',
  'assin',
  'publica',
  'homolog',
  'comprov',
  'recib',
  'certid',
  'declar',
  'alvara',
  'licenc',
  'autoriza',
  'notific',
  'laudo',
  'parecer',
];

const ANALYSIS_STAGE_KEYWORDS = [
  'analise',
  'analis',
  'valid',
  'vistoria',
  'triagem',
  'parecer',
  'fiscal',
  'tecnic',
  'socioeconom',
  'conferencia',
];

const PROFILE_KEYWORDS = {
  TECHNICAL_REPORT: ['laudo', 'parecer', 'vistoria', 'pericia', 'inspec', 'tecnico', 'diagnost', 'analise_solo'],
  AUTHORIZATION: ['autoriz', 'licenc', 'alvara', 'permiss', 'viabilidade', 'aprov', 'credenc', 'homolog'],
  NOTIFICATION: ['notific', 'intim', 'oficio', 'comunicado', 'despacho'],
  RECEIPT: ['comprov', 'recib', 'certidao', 'declaracao', 'cadastro', 'registro', 'inscricao', 'matricula', 'cartao', 'entrega'],
};

const COMMON_AVAILABLE_VARIABLES = [
  { name: 'protocolNumber', description: 'Numero do protocolo', example: '2026/000123' },
  { name: 'protocolTitle', description: 'Titulo do protocolo', example: 'Solicitacao de alvara' },
  { name: 'protocolDescription', description: 'Descricao do protocolo', example: 'Pedido registrado pelo cidadao' },
  { name: 'protocolCreatedAtFull', description: 'Data e hora da abertura do protocolo', example: '19/03/2026 14:30' },
  { name: 'protocolConcludedAtFull', description: 'Data e hora de conclusao do protocolo', example: '21/03/2026 16:45' },
  { name: 'protocolStatus', description: 'Status atual do protocolo', example: 'EM_ANDAMENTO' },
  { name: 'citizenName', description: 'Nome do cidadao', example: 'Joao da Silva' },
  { name: 'citizenCpf', description: 'CPF do cidadao', example: '123.456.789-00' },
  { name: 'citizenEmail', description: 'Email do cidadao', example: 'joao@email.com' },
  { name: 'citizenPhone', description: 'Telefone do cidadao', example: '(11) 99999-0000' },
  { name: 'serviceName', description: 'Nome do servico', example: 'Alvara de Funcionamento' },
  { name: 'departmentName', description: 'Nome do departamento responsavel', example: 'Secretaria de Obras' },
  { name: 'dataFields', description: 'Campos aprovados do protocolo', example: '[{label, value}]' },
  { name: 'documents', description: 'Documentos aprovados do protocolo', example: '[{type, fileName}]' },
  { name: 'history', description: 'Historico do protocolo', example: '[{date, action, comment}]' },
  { name: 'stages', description: 'Etapas do protocolo', example: '[{name, status, completedAt}]' },
  { name: 'generatedAt', description: 'Data e hora da geracao', example: '19/03/2026 15:00' },
  { name: 'generatedAtDate', description: 'Data da geracao', example: '19/03/2026' },
  { name: 'templateName', description: 'Nome do template usado', example: 'Autorizacao - Alvara de Funcionamento' },
  { name: 'validationCode', description: 'Codigo de validacao do documento', example: 'ABCD-1234-EFGH' },
];

const PROFILE_AVAILABLE_VARIABLES: Record<TemplateProfileKey, Array<{ name: string; description: string; example: string }>> = {
  TECHNICAL_REPORT: [
    { name: 'documentTitle', description: 'Titulo do documento', example: 'Laudo Tecnico' },
    { name: 'reportNumber', description: 'Numero do laudo ou parecer', example: 'LT-2026/001' },
    { name: 'inspectionDate', description: 'Data da vistoria ou analise', example: '2026-03-19' },
    { name: 'technicalAnalysis', description: 'Analise tecnica detalhada', example: 'Apos vistoria in loco...' },
    { name: 'legalBasis', description: 'Fundamentacao normativa', example: 'Lei Municipal 123/2024' },
    { name: 'requirements', description: 'Condicoes, exigencias ou recomendacoes', example: 'Regularizar o item X em 30 dias' },
    { name: 'conclusion', description: 'Conclusao tecnica', example: 'Favoravel com ressalvas' },
    { name: 'observations', description: 'Observacoes adicionais', example: 'Retorno necessario apos adequacao' },
  ],
  AUTHORIZATION: [
    { name: 'documentTitle', description: 'Titulo do documento', example: 'Autorizacao de Uso' },
    { name: 'authorizationNumber', description: 'Numero do ato administrativo', example: 'AUT-2026/015' },
    { name: 'authorizationSummary', description: 'Resumo do objeto autorizado', example: 'Liberacao para funcionamento da atividade' },
    { name: 'legalBasis', description: 'Base legal aplicavel', example: 'Lei Municipal 456/2025' },
    { name: 'validityPeriod', description: 'Periodo de validade', example: '12 meses a partir da assinatura' },
    { name: 'conditions', description: 'Condicoes e restricoes', example: 'Manter documentos visiveis no local' },
    { name: 'decision', description: 'Resultado administrativo', example: 'Autorizado' },
    { name: 'observations', description: 'Observacoes adicionais', example: 'Sujeito a fiscalizacao permanente' },
  ],
  NOTIFICATION: [
    { name: 'documentTitle', description: 'Titulo do documento', example: 'Notificacao Oficial' },
    { name: 'notificationNumber', description: 'Numero da notificacao', example: 'NOT-2026/011' },
    { name: 'subject', description: 'Assunto principal', example: 'Regularizacao documental' },
    { name: 'description', description: 'Descricao detalhada', example: 'Constatou-se a necessidade de complementacao documental' },
    { name: 'requirements', description: 'Providencias exigidas', example: 'Apresentar ART e comprovante de endereco' },
    { name: 'deadline', description: 'Prazo para atendimento', example: '10 dias corridos' },
    { name: 'legalBasis', description: 'Fundamentacao legal', example: 'Decreto Municipal 77/2025' },
    { name: 'observations', description: 'Observacoes adicionais', example: 'O nao atendimento pode gerar arquivamento' },
  ],
  RECEIPT: [
    { name: 'documentTitle', description: 'Titulo do documento', example: 'Comprovante de Cadastro' },
    { name: 'documentNumber', description: 'Numero do documento', example: 'COMP-2026/090' },
    { name: 'statement', description: 'Declaracao principal do documento', example: 'Certificamos o deferimento e registro da solicitacao' },
    { name: 'issuedItems', description: 'Itens entregues, concedidos ou registrados', example: 'Cadastro ativo, numero de inscricao e orientacoes iniciais' },
    { name: 'validityNotes', description: 'Informacoes de validade ou uso', example: 'Valido ate nova atualizacao cadastral' },
    { name: 'observations', description: 'Observacoes adicionais', example: 'Apresentar este comprovante quando solicitado' },
  ],
  COMPLETION: [
    { name: 'documentTitle', description: 'Titulo do documento', example: 'Relatorio de Conclusao' },
    { name: 'resultSummary', description: 'Resumo do resultado final', example: 'Solicitacao concluida com deferimento' },
    { name: 'finalDecision', description: 'Decisao final', example: 'Concluido' },
    { name: 'finalNotes', description: 'Observacoes finais', example: 'Documento disponibilizado ao cidadao apos assinatura' },
    { name: 'nextSteps', description: 'Orientacoes posteriores, se houver', example: 'Renovacao anual obrigatoria' },
  ],
  OFFICIAL_DOCUMENT: [
    { name: 'documentTitle', description: 'Titulo do documento', example: 'Documento Oficial' },
    { name: 'documentNumber', description: 'Numero do documento', example: 'DOC-2026/040' },
    { name: 'summary', description: 'Resumo do conteudo do documento', example: 'Documento emitido para formalizar a decisao do protocolo' },
    { name: 'legalBasis', description: 'Base legal ou normativa', example: 'Regulamento interno do servico' },
    { name: 'decision', description: 'Resultado ou decisao vinculada', example: 'Deferido' },
    { name: 'observations', description: 'Observacoes adicionais', example: 'Emitido para fins de controle interno e publicacao' },
  ],
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  const normalized: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
    if (!trimmed || unique.has(trimmed)) {
      continue;
    }

    unique.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function normalizeWorkflowTab(tab: unknown): string | null {
  if (typeof tab !== 'string') {
    return null;
  }

  const trimmed = tab.trim();
  if (!trimmed) {
    return null;
  }

  return LEGACY_WORKFLOW_TAB_MAP[trimmed] || trimmed;
}

function normalizeWorkflowTabs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeWorkflowTab)
    .filter((tab): tab is string => Boolean(tab));
}

function normalizeLookupToken(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeIdentifier(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function escapeHtml(value: string | null | undefined) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStageType(stage: WorkflowStageRecord) {
  return typeof stage.stageType === 'string' && stage.stageType.trim()
    ? stage.stageType.trim()
    : undefined;
}

function isConclusionStage(stage: WorkflowStageRecord) {
  const stageType = getStageType(stage);
  if (stageType === 'CONCLUSION') {
    return true;
  }

  const stageName = normalizeLookupToken(stage.name);
  return stageName.includes('conclus');
}

function isDocumentGenerationStage(stage: WorkflowStageRecord) {
  const stageType = getStageType(stage);
  if (stageType === 'DOCUMENT_GENERATION') {
    return true;
  }

  if (stageType === 'RECEPTION' || stageType === 'CONCLUSION') {
    return false;
  }

  const stageName = normalizeLookupToken(stage.name);
  const primaryTab = normalizeWorkflowTab(stage.primaryTab) || '';
  const availableTabs = normalizeWorkflowTabs(stage.availableTabs);
  const hasGeneratedTab = primaryTab === 'documentos-gerados' || availableTabs.includes('documentos-gerados');
  const hasGenerationKeyword = GENERATION_STAGE_KEYWORDS.some(keyword => stageName.includes(keyword));
  const hasAnalysisKeyword = ANALYSIS_STAGE_KEYWORDS.some(keyword => stageName.includes(keyword));

  if (hasGeneratedTab) {
    return true;
  }

  if (hasAnalysisKeyword) {
    return false;
  }

  return hasGenerationKeyword;
}

function getProfileLabel(profile: TemplateProfileKey, stageName: string, serviceName: string) {
  const normalizedContext = normalizeLookupToken(`${stageName} ${serviceName}`);

  switch (profile) {
    case 'TECHNICAL_REPORT':
      if (normalizedContext.includes('laudo')) return 'Laudo Tecnico';
      if (normalizedContext.includes('vistoria')) return 'Laudo de Vistoria';
      if (normalizedContext.includes('pericia')) return 'Laudo Pericial';
      if (normalizedContext.includes('parecer')) return 'Parecer Tecnico';
      return 'Relatorio Tecnico';
    case 'AUTHORIZATION':
      if (normalizedContext.includes('alvara')) return 'Alvara';
      if (normalizedContext.includes('licenc')) return 'Licenca';
      if (normalizedContext.includes('credenc')) return 'Credenciamento';
      if (normalizedContext.includes('aprov')) return 'Aprovacao';
      return 'Autorizacao';
    case 'NOTIFICATION':
      if (normalizedContext.includes('oficio')) return 'Oficio';
      if (normalizedContext.includes('intim')) return 'Intimacao';
      return 'Notificacao Oficial';
    case 'RECEIPT':
      if (normalizedContext.includes('certidao')) return 'Certidao';
      if (normalizedContext.includes('declaracao')) return 'Declaracao';
      if (normalizedContext.includes('recib')) return 'Recibo';
      if (normalizedContext.includes('matricula')) return 'Comprovante de Matricula';
      if (normalizedContext.includes('cadastro')) return 'Comprovante de Cadastro';
      if (normalizedContext.includes('registro')) return 'Comprovante de Registro';
      return 'Comprovante';
    case 'COMPLETION':
      return 'Relatorio de Conclusao';
    case 'OFFICIAL_DOCUMENT':
    default:
      return 'Documento Oficial';
  }
}

function inferTemplateProfile(
  service: { name: string; moduleType?: string | null },
  stage: WorkflowStageRecord,
  stageType: string
): TemplateProfileKey {
  if (stageType === 'CONCLUSION') {
    return 'COMPLETION';
  }

  const context = normalizeLookupToken(`${service.name} ${service.moduleType || ''} ${stage.name || ''}`);

  if (PROFILE_KEYWORDS.TECHNICAL_REPORT.some(keyword => context.includes(keyword))) {
    return 'TECHNICAL_REPORT';
  }

  if (PROFILE_KEYWORDS.AUTHORIZATION.some(keyword => context.includes(keyword))) {
    return 'AUTHORIZATION';
  }

  if (PROFILE_KEYWORDS.NOTIFICATION.some(keyword => context.includes(keyword))) {
    return 'NOTIFICATION';
  }

  if (PROFILE_KEYWORDS.RECEIPT.some(keyword => context.includes(keyword))) {
    return 'RECEIPT';
  }

  return 'OFFICIAL_DOCUMENT';
}

function getTemplateDocumentType(profile: TemplateProfileKey): DocumentTemplateType {
  switch (profile) {
    case 'AUTHORIZATION':
      return 'AUTHORIZATION';
    case 'NOTIFICATION':
      return 'NOTIFICATION';
    case 'COMPLETION':
      return 'COMPLETION_REPORT';
    case 'RECEIPT':
      return 'RECEIPT';
    case 'TECHNICAL_REPORT':
    case 'OFFICIAL_DOCUMENT':
    default:
      return 'CUSTOM';
  }
}

function buildInputSchema(profile: TemplateProfileKey, label: string) {
  const baseFields = {
    documentTitle: {
      type: 'string',
      title: 'Titulo do documento',
      description: `Titulo exibido no documento. Padrao: ${label}`,
      default: label,
      maxLength: 140,
    },
    observations: {
      type: 'string',
      title: 'Observacoes',
      description: 'Informacoes adicionais ou ressalvas',
      widget: 'textarea',
      maxLength: 2000,
    },
  };

  switch (profile) {
    case 'TECHNICAL_REPORT':
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...baseFields,
          reportNumber: {
            type: 'string',
            title: 'Numero do laudo',
            description: 'Identificador administrativo do laudo ou parecer',
            maxLength: 80,
          },
          inspectionDate: {
            type: 'string',
            title: 'Data da vistoria',
            description: 'Data da vistoria ou analise tecnica',
            format: 'date',
          },
          technicalAnalysis: {
            type: 'string',
            title: 'Analise tecnica',
            description: 'Descreva a analise tecnica realizada',
            widget: 'textarea',
            minLength: 10,
            maxLength: 6000,
          },
          legalBasis: {
            type: 'string',
            title: 'Fundamentacao legal',
            description: 'Normas, leis ou regulamentos utilizados',
            widget: 'textarea',
            maxLength: 4000,
          },
          requirements: {
            type: 'string',
            title: 'Exigencias ou recomendacoes',
            description: 'Liste condicoes, pendencias ou recomendacoes',
            widget: 'textarea',
            maxLength: 4000,
          },
          conclusion: {
            type: 'string',
            title: 'Conclusao tecnica',
            description: 'Resultado tecnico final',
            enum: ['Favoravel', 'Favoravel com ressalvas', 'Desfavoravel', 'Pendente de adequacao'],
          },
        },
        required: ['technicalAnalysis', 'conclusion'],
      };
    case 'AUTHORIZATION':
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...baseFields,
          authorizationNumber: {
            type: 'string',
            title: 'Numero da autorizacao',
            description: 'Identificador administrativo do documento',
            maxLength: 80,
          },
          authorizationSummary: {
            type: 'string',
            title: 'Objeto autorizado',
            description: 'Descreva o que esta sendo autorizado, aprovado ou licenciado',
            widget: 'textarea',
            minLength: 10,
            maxLength: 4000,
          },
          legalBasis: {
            type: 'string',
            title: 'Base legal',
            description: 'Normas ou fundamentos utilizados',
            widget: 'textarea',
            maxLength: 4000,
          },
          validityPeriod: {
            type: 'string',
            title: 'Validade',
            description: 'Periodo de validade do documento',
            maxLength: 200,
          },
          conditions: {
            type: 'string',
            title: 'Condicoes e restricoes',
            description: 'Condicoes para uso, renovacao ou manutencao',
            widget: 'textarea',
            maxLength: 4000,
          },
          decision: {
            type: 'string',
            title: 'Decisao',
            description: 'Resultado administrativo registrado',
            enum: ['Autorizado', 'Autorizado com condicionantes', 'Deferido', 'Aprovado', 'Homologado'],
          },
        },
        required: ['authorizationSummary', 'decision'],
      };
    case 'NOTIFICATION':
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...baseFields,
          notificationNumber: {
            type: 'string',
            title: 'Numero da notificacao',
            description: 'Identificador administrativo da notificacao',
            maxLength: 80,
          },
          subject: {
            type: 'string',
            title: 'Assunto',
            description: 'Assunto principal da notificacao',
            maxLength: 180,
          },
          description: {
            type: 'string',
            title: 'Descricao',
            description: 'Detalhamento da notificacao',
            widget: 'textarea',
            minLength: 10,
            maxLength: 5000,
          },
          requirements: {
            type: 'string',
            title: 'Providencias exigidas',
            description: 'Acoes ou documentos que devem ser apresentados',
            widget: 'textarea',
            maxLength: 4000,
          },
          deadline: {
            type: 'string',
            title: 'Prazo',
            description: 'Prazo para atendimento',
            maxLength: 200,
          },
          legalBasis: {
            type: 'string',
            title: 'Base legal',
            description: 'Fundamentacao normativa da notificacao',
            widget: 'textarea',
            maxLength: 4000,
          },
        },
        required: ['subject', 'description'],
      };
    case 'RECEIPT':
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...baseFields,
          documentNumber: {
            type: 'string',
            title: 'Numero do documento',
            description: 'Numero do comprovante, recibo ou certidao',
            maxLength: 80,
          },
          statement: {
            type: 'string',
            title: 'Declaracao principal',
            description: 'Texto principal que comprova o ato praticado',
            widget: 'textarea',
            minLength: 10,
            maxLength: 4000,
          },
          issuedItems: {
            type: 'string',
            title: 'Itens concedidos ou registrados',
            description: 'Itens emitidos, entregues ou registrados',
            widget: 'textarea',
            maxLength: 4000,
          },
          validityNotes: {
            type: 'string',
            title: 'Informacoes de validade',
            description: 'Validade, uso ou observacoes de apresentacao',
            widget: 'textarea',
            maxLength: 3000,
          },
        },
        required: ['statement'],
      };
    case 'COMPLETION':
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...baseFields,
          resultSummary: {
            type: 'string',
            title: 'Resumo do resultado',
            description: 'Sintese da conclusao do protocolo',
            widget: 'textarea',
            minLength: 10,
            maxLength: 4000,
          },
          finalDecision: {
            type: 'string',
            title: 'Decisao final',
            description: 'Situacao final do protocolo',
            enum: ['Concluido', 'Deferido', 'Indeferido', 'Arquivado', 'Concluido com ressalvas'],
          },
          finalNotes: {
            type: 'string',
            title: 'Observacoes finais',
            description: 'Registro de orientacoes finais, publicacao e entrega',
            widget: 'textarea',
            maxLength: 4000,
          },
          nextSteps: {
            type: 'string',
            title: 'Proximos passos',
            description: 'Orientacoes posteriores, renovacoes ou acompanhamento',
            widget: 'textarea',
            maxLength: 3000,
          },
        },
        required: ['resultSummary', 'finalDecision'],
      };
    case 'OFFICIAL_DOCUMENT':
    default:
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...baseFields,
          documentNumber: {
            type: 'string',
            title: 'Numero do documento',
            description: 'Identificador administrativo',
            maxLength: 80,
          },
          summary: {
            type: 'string',
            title: 'Resumo',
            description: 'Descreva o objetivo do documento',
            widget: 'textarea',
            minLength: 10,
            maxLength: 4000,
          },
          legalBasis: {
            type: 'string',
            title: 'Base legal',
            description: 'Fundamentacao aplicavel',
            widget: 'textarea',
            maxLength: 4000,
          },
          decision: {
            type: 'string',
            title: 'Resultado',
            description: 'Resultado ou decisao registrada',
            maxLength: 200,
          },
        },
        required: ['summary'],
      };
  }
}

function buildSharedCss() {
  return `
    @page {
      size: A4;
      margin: 14mm 14mm 18mm 14mm;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #0f172a;
      line-height: 1.5;
    }

    .document {
      width: 100%;
    }

    .header {
      border-bottom: 2px solid #1d4ed8;
      padding-bottom: 14px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22pt;
      color: #1e3a8a;
    }

    .header p {
      margin: 2px 0;
      color: #475569;
    }

    .meta-grid {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 22px 0;
    }

    .meta-grid td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      vertical-align: top;
    }

    .meta-grid td.label {
      width: 180px;
      background: #f8fafc;
      font-weight: bold;
    }

    .section {
      margin: 18px 0;
    }

    .section h2 {
      font-size: 13pt;
      margin: 0 0 8px 0;
      color: #1e3a8a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }

    .section p {
      margin: 8px 0;
      white-space: pre-wrap;
    }

    .decision-box {
      margin: 20px 0;
      padding: 14px;
      border: 2px solid #1d4ed8;
      background: #eff6ff;
      font-weight: bold;
      text-align: center;
      font-size: 13pt;
    }

    .signature-placeholder {
      margin-top: 42px;
      min-height: 90px;
      border-top: 1px solid #334155;
      padding-top: 12px;
      text-align: center;
      color: #334155;
    }

    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 9pt;
    }
  `;
}

function buildDocumentHeader(title: string, subtitle: string) {
  return `
    <div class="header">
      <h1>{{#if documentTitle}}{{documentTitle}}{{else}}${escapeHtml(title)}{{/if}}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <p>Protocolo {{protocolNumber}} - Servico {{serviceName}}</p>
      <p>Departamento {{departmentName}}</p>
    </div>
  `;
}

function buildSignatureBlock() {
  return `
    <div class="signature-placeholder">
      Assinatura digital do servidor responsavel
    </div>
  `;
}

function buildFooter() {
  return `
    <div class="footer">
      <p>Documento gerado eletronicamente em {{generatedAt}}.</p>
      <p>Codigo de validacao: {{validationCode}}</p>
    </div>
  `;
}

function buildHtmlTemplate(
  profile: TemplateProfileKey,
  label: string,
  serviceName: string,
  stageName: string
) {
  const subtitle = `${serviceName} - Etapa ${stageName}`;
  const header = buildDocumentHeader(label, subtitle);
  const metaTable = `
    <table class="meta-grid">
      <tr>
        <td class="label">Cidadao</td>
        <td>{{citizenName}}</td>
      </tr>
      <tr>
        <td class="label">CPF</td>
        <td>{{citizenCpf}}</td>
      </tr>
      <tr>
        <td class="label">Abertura do protocolo</td>
        <td>{{protocolCreatedAtFull}}</td>
      </tr>
      {{#if protocolConcludedAtFull}}
      <tr>
        <td class="label">Conclusao do protocolo</td>
        <td>{{protocolConcludedAtFull}}</td>
      </tr>
      {{/if}}
    </table>
  `;

  switch (profile) {
    case 'TECHNICAL_REPORT':
      return `
        <div class="document">
          ${header}
          ${metaTable}
          <div class="section">
            <h2>Contexto</h2>
            <p>Este documento formaliza a analise tecnica vinculada ao protocolo {{protocolNumber}} do servico {{serviceName}}.</p>
            {{#if reportNumber}}<p><strong>Numero do laudo:</strong> {{reportNumber}}</p>{{/if}}
            {{#if inspectionDate}}<p><strong>Data da vistoria:</strong> {{inspectionDate}}</p>{{/if}}
          </div>
          <div class="section">
            <h2>Analise tecnica</h2>
            <p>{{technicalAnalysis}}</p>
          </div>
          {{#if legalBasis}}
          <div class="section">
            <h2>Fundamentacao legal</h2>
            <p>{{legalBasis}}</p>
          </div>
          {{/if}}
          {{#if requirements}}
          <div class="section">
            <h2>Exigencias e recomendacoes</h2>
            <p>{{requirements}}</p>
          </div>
          {{/if}}
          <div class="section">
            <h2>Conclusao tecnica</h2>
            <div class="decision-box">{{conclusion}}</div>
          </div>
          {{#if observations}}
          <div class="section">
            <h2>Observacoes</h2>
            <p>{{observations}}</p>
          </div>
          {{/if}}
          ${buildSignatureBlock()}
          ${buildFooter()}
        </div>
      `;
    case 'AUTHORIZATION':
      return `
        <div class="document">
          ${header}
          ${metaTable}
          <div class="section">
            <h2>Objeto</h2>
            <p>{{authorizationSummary}}</p>
            {{#if authorizationNumber}}<p><strong>Numero:</strong> {{authorizationNumber}}</p>{{/if}}
            {{#if validityPeriod}}<p><strong>Validade:</strong> {{validityPeriod}}</p>{{/if}}
          </div>
          {{#if legalBasis}}
          <div class="section">
            <h2>Base legal</h2>
            <p>{{legalBasis}}</p>
          </div>
          {{/if}}
          {{#if conditions}}
          <div class="section">
            <h2>Condicoes e restricoes</h2>
            <p>{{conditions}}</p>
          </div>
          {{/if}}
          <div class="section">
            <h2>Decisao</h2>
            <div class="decision-box">{{decision}}</div>
          </div>
          {{#if observations}}
          <div class="section">
            <h2>Observacoes</h2>
            <p>{{observations}}</p>
          </div>
          {{/if}}
          ${buildSignatureBlock()}
          ${buildFooter()}
        </div>
      `;
    case 'NOTIFICATION':
      return `
        <div class="document">
          ${header}
          ${metaTable}
          <div class="section">
            <h2>Assunto</h2>
            <p>{{subject}}</p>
            {{#if notificationNumber}}<p><strong>Numero:</strong> {{notificationNumber}}</p>{{/if}}
          </div>
          <div class="section">
            <h2>Descricao</h2>
            <p>{{description}}</p>
          </div>
          {{#if requirements}}
          <div class="section">
            <h2>Providencias exigidas</h2>
            <p>{{requirements}}</p>
          </div>
          {{/if}}
          {{#if deadline}}
          <div class="section">
            <h2>Prazo</h2>
            <p>{{deadline}}</p>
          </div>
          {{/if}}
          {{#if legalBasis}}
          <div class="section">
            <h2>Base legal</h2>
            <p>{{legalBasis}}</p>
          </div>
          {{/if}}
          {{#if observations}}
          <div class="section">
            <h2>Observacoes</h2>
            <p>{{observations}}</p>
          </div>
          {{/if}}
          ${buildSignatureBlock()}
          ${buildFooter()}
        </div>
      `;
    case 'RECEIPT':
      return `
        <div class="document">
          ${header}
          ${metaTable}
          <div class="section">
            <h2>Declaracao</h2>
            <p>{{statement}}</p>
            {{#if documentNumber}}<p><strong>Numero:</strong> {{documentNumber}}</p>{{/if}}
          </div>
          {{#if issuedItems}}
          <div class="section">
            <h2>Itens concedidos ou registrados</h2>
            <p>{{issuedItems}}</p>
          </div>
          {{/if}}
          {{#if validityNotes}}
          <div class="section">
            <h2>Validade e uso</h2>
            <p>{{validityNotes}}</p>
          </div>
          {{/if}}
          {{#if observations}}
          <div class="section">
            <h2>Observacoes</h2>
            <p>{{observations}}</p>
          </div>
          {{/if}}
          ${buildSignatureBlock()}
          ${buildFooter()}
        </div>
      `;
    case 'COMPLETION':
      return `
        <div class="document">
          ${header}
          ${metaTable}
          <div class="section">
            <h2>Resumo do resultado</h2>
            <p>{{resultSummary}}</p>
          </div>
          <div class="section">
            <h2>Decisao final</h2>
            <div class="decision-box">{{finalDecision}}</div>
          </div>
          {{#if finalNotes}}
          <div class="section">
            <h2>Observacoes finais</h2>
            <p>{{finalNotes}}</p>
          </div>
          {{/if}}
          {{#if nextSteps}}
          <div class="section">
            <h2>Proximos passos</h2>
            <p>{{nextSteps}}</p>
          </div>
          {{/if}}
          ${buildSignatureBlock()}
          ${buildFooter()}
        </div>
      `;
    case 'OFFICIAL_DOCUMENT':
    default:
      return `
        <div class="document">
          ${header}
          ${metaTable}
          <div class="section">
            <h2>Resumo</h2>
            <p>{{summary}}</p>
            {{#if documentNumber}}<p><strong>Numero:</strong> {{documentNumber}}</p>{{/if}}
          </div>
          {{#if legalBasis}}
          <div class="section">
            <h2>Base legal</h2>
            <p>{{legalBasis}}</p>
          </div>
          {{/if}}
          {{#if decision}}
          <div class="section">
            <h2>Resultado</h2>
            <div class="decision-box">{{decision}}</div>
          </div>
          {{/if}}
          {{#if observations}}
          <div class="section">
            <h2>Observacoes</h2>
            <p>{{observations}}</p>
          </div>
          {{/if}}
          ${buildSignatureBlock()}
          ${buildFooter()}
        </div>
      `;
  }
}

function buildTemplateCode(
  service: { name: string; moduleType?: string | null; id: string },
  stageName: string,
  stageType: string,
  profile: TemplateProfileKey
) {
  const serviceKey = normalizeIdentifier(service.moduleType || service.name || service.id) || service.id.toUpperCase();
  const stageKey = normalizeIdentifier(stageName) || stageType;
  const profileKey = normalizeIdentifier(profile);
  return `WF_${serviceKey}_${stageType}_${stageKey}_${profileKey}`.slice(0, 180);
}

function buildTemplateDefinition(
  service: { id: string; name: string; moduleType?: string | null },
  stage: WorkflowStageRecord,
  stageType: string,
  profile: TemplateProfileKey,
  createdBy: string
) {
  const stageName = typeof stage.name === 'string' && stage.name.trim() ? stage.name.trim() : stageType;
  const label = getProfileLabel(profile, stageName, service.name);
  const titleSuffix = stageType === 'CONCLUSION' ? service.name : `${service.name} - ${stageName}`;
  const name = `${label} - ${titleSuffix}`.slice(0, 191);

  return {
    code: buildTemplateCode(service, stageName, stageType, profile),
    name,
    description:
      stageType === 'CONCLUSION'
        ? `Template de conclusao gerado automaticamente para o servico ${service.name}.`
        : `Template gerado automaticamente para a etapa ${stageName} do servico ${service.name}.`,
    documentType: getTemplateDocumentType(profile),
    outputFormat: 'PDF' as const,
    serviceIds: [service.id],
    isGlobal: false,
    allowedStageTypes: [stageType],
    htmlTemplate: buildHtmlTemplate(profile, label, service.name, stageName),
    cssStyles: buildSharedCss(),
    availableVariables: [...COMMON_AVAILABLE_VARIABLES, ...PROFILE_AVAILABLE_VARIABLES[profile]],
    inputSchema: buildInputSchema(profile, label),
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: '14mm',
      right: '14mm',
      bottom: '18mm',
      left: '14mm',
    },
    requiresSignature: true,
    signatureFields: [
      {
        label: 'Assinatura do servidor responsavel',
        role: 'GENERATOR',
        position: 'manual',
      },
    ],
    createdBy,
  };
}

async function resolveCreatedBy(prismaClient: PrismaClient, explicitCreatedBy?: string) {
  if (explicitCreatedBy) {
    return explicitCreatedBy;
  }

  return 'SYSTEM_SEED';
}

async function upsertDocumentTemplate(
  prismaClient: PrismaClient,
  definition: ReturnType<typeof buildTemplateDefinition>
) {
  const existing = await prismaClient.documentTemplate.findUnique({
    where: { code: definition.code },
    select: { id: true },
  });

  const template = await prismaClient.documentTemplate.upsert({
    where: { code: definition.code },
    update: {
      name: definition.name,
      description: definition.description,
      documentType: definition.documentType,
      outputFormat: definition.outputFormat,
      serviceIds: asJson(definition.serviceIds),
      isGlobal: definition.isGlobal,
      allowedStageTypes: asJson(definition.allowedStageTypes),
      htmlTemplate: definition.htmlTemplate,
      cssStyles: definition.cssStyles,
      availableVariables: asJson(definition.availableVariables),
      inputSchema: asJson(definition.inputSchema),
      pageSize: definition.pageSize,
      orientation: definition.orientation,
      margins: asJson(definition.margins),
      requiresSignature: definition.requiresSignature,
      signatureFields: asJson(definition.signatureFields),
      isActive: true,
    },
    create: {
      name: definition.name,
      code: definition.code,
      description: definition.description,
      documentType: definition.documentType,
      outputFormat: definition.outputFormat,
      serviceIds: asJson(definition.serviceIds),
      isGlobal: definition.isGlobal,
      allowedStageTypes: asJson(definition.allowedStageTypes),
      htmlTemplate: definition.htmlTemplate,
      cssStyles: definition.cssStyles,
      availableVariables: asJson(definition.availableVariables),
      inputSchema: asJson(definition.inputSchema),
      pageSize: definition.pageSize,
      orientation: definition.orientation,
      margins: asJson(definition.margins),
      requiresSignature: definition.requiresSignature,
      signatureFields: asJson(definition.signatureFields),
      createdBy: definition.createdBy,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      isActive: true,
    },
  });

  return {
    template,
    created: !existing,
  };
}

export async function seedWorkflowDocumentTemplates(
  options: SeedOptions = {}
): Promise<WorkflowDocumentTemplateSeedSummary> {
  const prismaClient = options.prisma ?? prisma;
  const ownsPrismaClient = !options.prisma;
  const summary: WorkflowDocumentTemplateSeedSummary = {
    templatesCreated: 0,
    templatesUpdated: 0,
    generationStagesLinked: 0,
    conclusionTemplatesUpserted: 0,
    workflowsUpdated: 0,
    skippedStages: 0,
  };

  try {
    const createdBy = await resolveCreatedBy(prismaClient, options.createdBy);
    const workflows = await prismaClient.serviceWorkflow.findMany({
      where: {
        isActive: true,
        service: {
          is: {
            isActive: true,
          },
        },
      },
      include: {
        service: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const existingTemplates = await prismaClient.documentTemplate.findMany({
      select: {
        id: true,
        code: true,
        isActive: true,
      },
    });

    const templatesById = new Map(existingTemplates.map(template => [template.id, template]));

    console.log(`   -> Gerando templates por workflow para ${workflows.length} workflow(s) ativo(s)...`);

    for (const workflow of workflows) {
      const stages = Array.isArray(workflow.stages) ? (workflow.stages as WorkflowStageRecord[]) : [];
      if (stages.length === 0) {
        continue;
      }

      const nextStages = stages.map(stage => ({ ...stage }));
      let workflowChanged = false;
      let conclusionStage: WorkflowStageRecord | null = null;

      for (const stage of nextStages) {
        if (isConclusionStage(stage)) {
          conclusionStage = stage;
        }

        if (!isDocumentGenerationStage(stage)) {
          continue;
        }

        const currentTemplateIds = normalizeStringArray(stage.documentTemplateIds);
        const activeTemplateIds = currentTemplateIds.filter(templateId => templatesById.get(templateId)?.isActive);

        if (activeTemplateIds.length > 0) {
          if (activeTemplateIds.length !== currentTemplateIds.length) {
            stage.documentTemplateIds = activeTemplateIds;
            workflowChanged = true;
          }
          summary.skippedStages += 1;
          continue;
        }

        const stageType = getStageType(stage) || 'DOCUMENT_GENERATION';
        const profile = inferTemplateProfile(workflow.service, stage, stageType);
        const definition = buildTemplateDefinition(workflow.service, stage, stageType, profile, createdBy);
        const { template, created } = await upsertDocumentTemplate(prismaClient, definition);

        templatesById.set(template.id, template);
        stage.documentTemplateIds = [template.id];
        stage.stageType = stageType;
        workflowChanged = true;
        summary.generationStagesLinked += 1;

        if (created) {
          summary.templatesCreated += 1;
        } else {
          summary.templatesUpdated += 1;
        }
      }

      if (conclusionStage) {
        const definition = buildTemplateDefinition(
          workflow.service,
          conclusionStage,
          'CONCLUSION',
          'COMPLETION',
          createdBy
        );
        const { template, created } = await upsertDocumentTemplate(prismaClient, definition);
        templatesById.set(template.id, template);
        summary.conclusionTemplatesUpserted += 1;

        if (created) {
          summary.templatesCreated += 1;
        } else {
          summary.templatesUpdated += 1;
        }
      }

      if (workflowChanged) {
        await prismaClient.serviceWorkflow.update({
          where: { id: workflow.id },
          data: {
            stages: asJson(nextStages),
          },
        });
        summary.workflowsUpdated += 1;
      }
    }

    console.log(
      `   -> Templates por workflow: ${summary.templatesCreated} criado(s), ` +
        `${summary.templatesUpdated} atualizado(s), ` +
        `${summary.generationStagesLinked} etapa(s) de emissao vinculada(s), ` +
        `${summary.conclusionTemplatesUpserted} template(s) de conclusao upsertado(s).`
    );

    return summary;
  } finally {
    if (ownsPrismaClient) {
      await prismaClient.$disconnect();
    }
  }
}

if (require.main === module) {
  seedWorkflowDocumentTemplates()
    .then(summary => {
      console.log('Seed de templates por workflow concluido com sucesso.');
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro ao executar seed de templates por workflow:', error);
      process.exit(1);
    });
}
