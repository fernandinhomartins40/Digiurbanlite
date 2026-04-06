import type { CreateWorkflowData, WorkflowStage } from '../types/workflow.types';

export const LEGACY_NO_DATA_SUBTYPE = 'CONSULTIVO';

export const COM_DATA_SERVICE_SUBTYPES = [
  'CAPTURA_COMPLETA',
  'SOLICITACAO_SIMPLES',
  'PAGAMENTO',
] as const;

export const NO_DATA_SERVICE_SUBTYPES = [
  'CONSULTA_PUBLICA',
  'CONSULTA_AUTENTICADA',
  'EMISSAO_AUTOMATICA',
  'EMISSAO_ASSISTIDA',
  'SOLICITACAO_SIMPLES',
] as const;

export type ComDataServiceSubtype = (typeof COM_DATA_SERVICE_SUBTYPES)[number];
export type NoDataServiceSubtype = (typeof NO_DATA_SERVICE_SUBTYPES)[number];

type ResolveServiceSubtypeInput = {
  serviceType?: string | null;
  serviceSubtype?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  requiresDocuments?: boolean | null;
  requiredDocuments?: unknown;
  formSchema?: unknown;
  moduleType?: string | null;
};

type NoDataWorkflowInput = {
  serviceName: string;
  serviceDescription?: string | null;
  estimatedDays?: number | null;
  subtype: NoDataServiceSubtype;
};

const PUBLIC_QUERY_KEYWORDS = [
  'agenda',
  'calendario',
  'guia',
  'mapa',
  'roteiro',
  'horario',
  'horarios',
  'itinerario',
  'itinerarios',
  'lista',
  'catalogo',
  'portal',
  'diario oficial',
  'legislacao',
  'concurso',
  'concursos',
  'dados abertos',
  'transparencia',
  'politica de privacidade',
  'status dos sistemas',
  'informacoes sobre',
  'rede de atendimento',
];

const AUTHENTICATED_QUERY_KEYWORDS = [
  'historico',
  'boletim',
  'resultado',
  'resultados',
  'situacao',
  'processo',
  'protocolo',
  'solicitacoes',
  'manifestacoes',
  'debitos',
  'pagamentos',
  'multas',
  'pontos na cnh',
  'beneficios',
  'elegibilidade',
  'cadastro',
  'cadastros',
  'atendimento',
  'atendimentos',
  'beneficio',
];

const DOCUMENT_EMISSION_KEYWORDS = [
  'certidao',
  'declaracao',
  'atestado',
  'comprovante',
  'segunda via',
  'emissao',
  'emitir',
  'alvara',
  'licenca',
  'carteira digital',
  'cartao sus',
  'cnd',
  'historico escolar',
];

const SIMPLE_REQUEST_KEYWORDS = [
  'laudo',
  'vistoria',
  'apoio',
  'material promocional',
  'regularizacao',
  'conformidade',
  'area construida',
  'conclusao de obra',
  'habite-se',
  'habitese',
  'ocupacao',
  'pedido',
  'solicitacao',
];

const PAYMENT_KEYWORDS = [
  'pagamento',
  'taxa',
  'boleto',
  'guia',
  'recolhimento',
  'iptu',
  'itbi',
  'debito',
  'debito',
  'tarifa',
];

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function includesAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isKnownComDataSubtype(value?: string | null): value is ComDataServiceSubtype {
  return COM_DATA_SERVICE_SUBTYPES.includes((value || '').toUpperCase() as ComDataServiceSubtype);
}

export function isKnownNoDataSubtype(value?: string | null): value is NoDataServiceSubtype {
  return NO_DATA_SERVICE_SUBTYPES.includes((value || '').toUpperCase() as NoDataServiceSubtype);
}

function extractRequiredDocumentCount(requiredDocuments: unknown) {
  if (!requiredDocuments) {
    return 0;
  }

  if (Array.isArray(requiredDocuments)) {
    return requiredDocuments.length;
  }

  if (typeof requiredDocuments === 'string') {
    try {
      const parsed = JSON.parse(requiredDocuments);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  return 0;
}

function extractFormFieldCount(formSchema: unknown) {
  if (!formSchema || typeof formSchema !== 'object') {
    return 0;
  }

  if (
    'properties' in (formSchema as Record<string, unknown>) &&
    (formSchema as { properties?: Record<string, unknown> }).properties
  ) {
    return Object.keys((formSchema as { properties: Record<string, unknown> }).properties).length;
  }

  if (
    'fields' in (formSchema as Record<string, unknown>) &&
    Array.isArray((formSchema as { fields?: unknown[] }).fields)
  ) {
    return (formSchema as { fields: unknown[] }).fields.length;
  }

  return 0;
}

export function resolveServiceType(input: Pick<ResolveServiceSubtypeInput, 'serviceType' | 'formSchema' | 'moduleType'>) {
  if (input.serviceType === 'COM_DADOS' || input.serviceType === 'SEM_DADOS') {
    return input.serviceType;
  }

  return input.formSchema || input.moduleType ? 'COM_DADOS' : 'SEM_DADOS';
}

export function inferNoDataServiceSubtype(input: ResolveServiceSubtypeInput): NoDataServiceSubtype {
  const normalizedSubtype = (input.serviceSubtype || '').toUpperCase();
  if (isKnownNoDataSubtype(normalizedSubtype)) {
    return normalizedSubtype;
  }

  const text = normalizeText([input.name, input.category, input.description].filter(Boolean).join(' '));
  const hasDocuments = Boolean(input.requiresDocuments) || extractRequiredDocumentCount(input.requiredDocuments) > 0;

  if (includesAnyKeyword(text, SIMPLE_REQUEST_KEYWORDS)) {
    return 'SOLICITACAO_SIMPLES';
  }

  if (includesAnyKeyword(text, DOCUMENT_EMISSION_KEYWORDS)) {
    return hasDocuments ? 'EMISSAO_ASSISTIDA' : 'EMISSAO_AUTOMATICA';
  }

  if (includesAnyKeyword(text, AUTHENTICATED_QUERY_KEYWORDS)) {
    return 'CONSULTA_AUTENTICADA';
  }

  if (includesAnyKeyword(text, PUBLIC_QUERY_KEYWORDS)) {
    return 'CONSULTA_PUBLICA';
  }

  if (normalizedSubtype === LEGACY_NO_DATA_SUBTYPE) {
    return hasDocuments ? 'EMISSAO_ASSISTIDA' : 'SOLICITACAO_SIMPLES';
  }

  return hasDocuments ? 'EMISSAO_ASSISTIDA' : 'SOLICITACAO_SIMPLES';
}

function inferComDataServiceSubtype(input: ResolveServiceSubtypeInput): ComDataServiceSubtype {
  const normalizedSubtype = (input.serviceSubtype || '').toUpperCase();
  if (isKnownComDataSubtype(normalizedSubtype)) {
    return normalizedSubtype;
  }

  const text = normalizeText([input.name, input.category, input.description, input.moduleType].filter(Boolean).join(' '));
  if (includesAnyKeyword(text, PAYMENT_KEYWORDS)) {
    return 'PAGAMENTO';
  }

  const formFieldCount = extractFormFieldCount(input.formSchema);
  const requiredDocumentCount = extractRequiredDocumentCount(input.requiredDocuments);
  if (formFieldCount > 8 || requiredDocumentCount > 3) {
    return 'CAPTURA_COMPLETA';
  }

  return 'SOLICITACAO_SIMPLES';
}

export function resolveServiceSubtype(input: ResolveServiceSubtypeInput) {
  const serviceType = resolveServiceType(input);
  if (serviceType === 'SEM_DADOS') {
    return inferNoDataServiceSubtype(input);
  }

  return inferComDataServiceSubtype(input);
}

export function shouldAutoCreateWorkflow(serviceType: string, serviceSubtype?: string | null) {
  if (serviceType !== 'SEM_DADOS') {
    return true;
  }

  return !['CONSULTA_PUBLICA', 'CONSULTA_AUTENTICADA'].includes((serviceSubtype || '').toUpperCase());
}

function buildStage(
  stage: Omit<WorkflowStage, 'id'>
): Omit<WorkflowStage, 'id'> {
  return stage;
}

export function buildNoDataWorkflowTemplate(input: NoDataWorkflowInput): CreateWorkflowData | null {
  const requestedSla = input.estimatedDays || 3;

  switch (input.subtype) {
    case 'CONSULTA_PUBLICA':
    case 'CONSULTA_AUTENTICADA':
      return null;
    case 'EMISSAO_AUTOMATICA': {
      const totalSLA = Math.max(4, requestedSla);
      const stages = [
        buildStage({
          name: 'Recepção',
          description: 'Registro da emissão automatizada',
          order: 1,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          stageType: 'RECEPTION',
          actionLabels: { APPROVE: 'Validar entrada' },
          availableTabs: ['resumo', 'comunicacao'],
          primaryTab: 'resumo',
        }),
        buildStage({
          name: 'Preparação da resposta',
          description: 'Conferência final e preparação da resposta ou documento',
          order: 2,
          slaDays: Math.max(1, totalSLA - 3),
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          actionLabels: { APPROVE: 'Preparar resposta' },
          availableTabs: ['resumo', 'documentos', 'comunicacao'],
          primaryTab: 'documentos',
        }),
        buildStage({
          name: 'Envio ao cidadão',
          description: 'Envio da resposta ou documento ao cidadão',
          order: 3,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          actionLabels: { APPROVE: 'Enviar resposta' },
          availableTabs: ['resumo', 'documentos', 'enviar', 'comunicacao'],
          primaryTab: 'enviar',
        }),
        buildStage({
          name: 'Conclusão',
          description: 'Encerramento da emissão automática',
          order: 4,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          stageType: 'CONCLUSION',
          actionLabels: { APPROVE: 'Concluir' },
          availableTabs: ['resumo-final', 'comunicacao'],
          primaryTab: 'resumo-final',
        }),
      ];

      return {
        moduleType: 'WORKFLOW_PLACEHOLDER',
        name: `Workflow - ${input.serviceName}`,
        description: input.serviceDescription || `Fluxo de emissão automática para ${input.serviceName}`,
        defaultSLA: stages.reduce((total, stage) => total + (stage.slaDays ?? 0), 0),
        stages,
        rules: {
          autoGenerated: true,
          generatedAt: new Date().toISOString(),
          source: 'no_data_creation',
          version: '4.1',
          subtype: input.subtype,
          alignment: 'NO_DATA_EMISSAO_AUTOMATICA',
        },
      };
    }
    case 'EMISSAO_ASSISTIDA': {
      const totalSLA = Math.max(4, requestedSla);
      const analysisSla = Math.max(1, totalSLA - 3);
      const stages = [
        buildStage({
          name: 'Recepção',
          description: 'Registro do pedido de emissão',
          order: 1,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: true,
          stageType: 'RECEPTION',
          actionLabels: { APPROVE: 'Receber pedido' },
          availableTabs: ['resumo', 'comunicacao'],
          primaryTab: 'resumo',
        }),
        buildStage({
          name: 'Análise',
          description: 'Validação administrativa da emissão',
          order: 2,
          slaDays: analysisSla,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE', 'CREATE_PENDING', 'REJECT'],
          canSkip: false,
          requiresApproval: true,
          actionLabels: {
            APPROVE: 'Aprovar emissão',
            CREATE_PENDING: 'Solicitar complemento',
            REJECT: 'Indeferir pedido',
          },
          availableTabs: ['resumo', 'pendencias', 'comunicacao'],
          primaryTab: 'resumo',
        }),
        buildStage({
          name: 'Resposta ao cidadão',
          description: 'Preparação e envio da resposta ou documento emitido',
          order: 3,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          actionLabels: { APPROVE: 'Enviar resposta' },
          availableTabs: ['resumo', 'documentos', 'enviar', 'comunicacao'],
          primaryTab: 'enviar',
        }),
        buildStage({
          name: 'Conclusão',
          description: 'Encerramento da emissão assistida',
          order: 4,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          stageType: 'CONCLUSION',
          actionLabels: { APPROVE: 'Concluir' },
          availableTabs: ['resumo-final', 'comunicacao'],
          primaryTab: 'resumo-final',
        }),
      ];

      return {
        moduleType: 'WORKFLOW_PLACEHOLDER',
        name: `Workflow - ${input.serviceName}`,
        description: input.serviceDescription || `Fluxo de emissão assistida para ${input.serviceName}`,
        defaultSLA: stages.reduce((total, stage) => total + (stage.slaDays ?? 0), 0),
        stages,
        rules: {
          autoGenerated: true,
          generatedAt: new Date().toISOString(),
          source: 'no_data_creation',
          version: '4.1',
          subtype: input.subtype,
          alignment: 'NO_DATA_EMISSAO_ASSISTIDA',
        },
      };
    }
    case 'SOLICITACAO_SIMPLES':
    default: {
      const totalSLA = Math.max(4, requestedSla);
      const analysisSla = Math.max(1, totalSLA - 3);
      const stages = [
        buildStage({
          name: 'Recepção',
          description: 'Registro do pedido simples',
          order: 1,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: true,
          stageType: 'RECEPTION',
          actionLabels: { APPROVE: 'Iniciar atendimento' },
          availableTabs: ['resumo', 'comunicacao'],
          primaryTab: 'resumo',
        }),
        buildStage({
          name: 'Atendimento',
          description: 'Tratativa administrativa do retorno solicitado',
          order: 2,
          slaDays: analysisSla,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE', 'CREATE_PENDING', 'REJECT', 'REQUEST_INFO'],
          canSkip: false,
          requiresApproval: true,
          actionLabels: {
            APPROVE: 'Preparar resposta',
            CREATE_PENDING: 'Solicitar complemento',
            REJECT: 'Indeferir pedido',
            REQUEST_INFO: 'Solicitar informação complementar',
          },
          availableTabs: ['resumo', 'pendencias', 'comunicacao'],
          primaryTab: 'resumo',
        }),
        buildStage({
          name: 'Resposta ao cidadão',
          description: 'Envio da resposta ou do documento relacionado ao pedido',
          order: 3,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          actionLabels: { APPROVE: 'Enviar resposta' },
          availableTabs: ['resumo', 'documentos', 'enviar', 'comunicacao'],
          primaryTab: 'enviar',
        }),
        buildStage({
          name: 'Conclusão',
          description: 'Encerramento do atendimento simples',
          order: 4,
          slaDays: 1,
          requiredDocumentTypes: [],
          requiredInputFieldIds: [],
          allowedActions: ['APPROVE'],
          canSkip: false,
          requiresApproval: false,
          stageType: 'CONCLUSION',
          actionLabels: { APPROVE: 'Concluir' },
          availableTabs: ['resumo-final', 'comunicacao'],
          primaryTab: 'resumo-final',
        }),
      ];

      return {
        moduleType: 'WORKFLOW_PLACEHOLDER',
        name: `Workflow - ${input.serviceName}`,
        description: input.serviceDescription || `Fluxo simplificado para ${input.serviceName}`,
        defaultSLA: stages.reduce((total, stage) => total + (stage.slaDays ?? 0), 0),
        stages,
        rules: {
          autoGenerated: true,
          generatedAt: new Date().toISOString(),
          source: 'no_data_creation',
          version: '4.1',
          subtype: input.subtype,
          alignment: 'NO_DATA_SOLICITACAO_SIMPLES',
        },
      };
    }
  }
}
