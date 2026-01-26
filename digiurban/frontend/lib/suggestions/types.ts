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

// 🆕 NOVO: Enum de subtipos de serviços (alinhado com backend)
export enum ServiceSubtype {
  CAPTURA_COMPLETA = 'CAPTURA_COMPLETA',      // 🔵 COM_DADOS extenso
  SOLICITACAO_SIMPLES = 'SOLICITACAO_SIMPLES', // 🟢 COM_DADOS simples
  PAGAMENTO = 'PAGAMENTO',                     // 🔴 COM_DADOS com pagamento
  CONSULTIVO = 'CONSULTIVO'                    // 🟡 SEM_DADOS consulta/emissão
}

// 🆕 NOVO: Enum de tipos de serviços
export enum ServiceType {
  COM_DADOS = 'COM_DADOS',
  SEM_DADOS = 'SEM_DADOS'
}

// 🆕 NOVO: Mapeamento visual de emojis
export const SERVICE_SUBTYPE_EMOJI: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: '🔵',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: '🟢',
  [ServiceSubtype.PAGAMENTO]: '🔴',
  [ServiceSubtype.CONSULTIVO]: '🟡'
};

// 🆕 NOVO: Labels descritivos
export const SERVICE_SUBTYPE_LABEL: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: 'Solicitação com Captura de Dados',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: 'Solicitação Simples',
  [ServiceSubtype.PAGAMENTO]: 'Serviço de Pagamento',
  [ServiceSubtype.CONSULTIVO]: 'Serviço Consultivo'
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

  // 🆕 FASE 1: Campos críticos alinhados com backend
  serviceType: ServiceType;
  serviceSubtype: ServiceSubtype;
  departmentCode: string;

  // 🆕 FASE 3: Campos adicionais
  moduleType?: string | null;
  priority?: number;
  color?: string;
  requiredDocuments?: string[];

  // 🆕 FASE 4: Metadados de governança
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
}
