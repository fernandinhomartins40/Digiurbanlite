// Tipos compartilhados para todas as sugestões de serviços

export interface FormFieldSuggestion {
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'cpf' | 'cnpj' | 'cep' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export enum ServiceSubtype {
  CAPTURA_COMPLETA = 'CAPTURA_COMPLETA',
  SOLICITACAO_SIMPLES = 'SOLICITACAO_SIMPLES',
  PAGAMENTO = 'PAGAMENTO',
  CONSULTIVO = 'CONSULTIVO',
  CONSULTA_PUBLICA = 'CONSULTA_PUBLICA',
  CONSULTA_AUTENTICADA = 'CONSULTA_AUTENTICADA',
  EMISSAO_AUTOMATICA = 'EMISSAO_AUTOMATICA',
  EMISSAO_ASSISTIDA = 'EMISSAO_ASSISTIDA',
}

export enum ServiceType {
  COM_DADOS = 'COM_DADOS',
  SEM_DADOS = 'SEM_DADOS',
}

export const SERVICE_SUBTYPE_EMOJI: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: '🟦',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: '🟩',
  [ServiceSubtype.PAGAMENTO]: '🟥',
  [ServiceSubtype.CONSULTIVO]: '🟨',
  [ServiceSubtype.CONSULTA_PUBLICA]: '🔍',
  [ServiceSubtype.CONSULTA_AUTENTICADA]: '🔐',
  [ServiceSubtype.EMISSAO_AUTOMATICA]: '⚡',
  [ServiceSubtype.EMISSAO_ASSISTIDA]: '📄',
};

export const SERVICE_SUBTYPE_LABEL: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: 'Solicitação com Captura de Dados',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: 'Solicitação Simples',
  [ServiceSubtype.PAGAMENTO]: 'Serviço de Pagamento',
  [ServiceSubtype.CONSULTIVO]: 'Serviço Consultivo',
  [ServiceSubtype.CONSULTA_PUBLICA]: 'Consulta Pública',
  [ServiceSubtype.CONSULTA_AUTENTICADA]: 'Consulta Autenticada',
  [ServiceSubtype.EMISSAO_AUTOMATICA]: 'Emissão Automática',
  [ServiceSubtype.EMISSAO_ASSISTIDA]: 'Emissão Assistida',
};

export interface ServiceSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedFields: FormFieldSuggestion[];
  category: string;
  estimatedDays: number;
  requiresDocuments: boolean;
  serviceType: ServiceType;
  serviceSubtype: ServiceSubtype;
  departmentCode: string;
  moduleType?: string | null;
  priority?: number;
  color?: string;
  requiredDocuments?: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'IMPLEMENTED' | 'DEPRECATED';
  implementedAsServiceId?: string;
  votes?: number;
  usage?: number;
  linkedCitizensConfig?: {
    enabled: boolean;
    minLinked?: number;
    maxLinked?: number;
    label?: string;
    description?: string;
    links?: Array<Record<string, any>>;
  };
  generatesDocuments?: string[];
}
