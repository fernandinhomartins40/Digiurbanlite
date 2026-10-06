/**
 * Tipos compartilhados para seeds de serviços
 */

import { ServiceType, CitizenLinkType, ServiceRole } from '@prisma/client';

// 🆕 NOVO: Enum de subtipos de serviços
export enum ServiceSubtype {
  CAPTURA_COMPLETA = 'CAPTURA_COMPLETA',      // 🔵 COM_DADOS extenso
  SOLICITACAO_SIMPLES = 'SOLICITACAO_SIMPLES', // 🟢 COM_DADOS simples
  PAGAMENTO = 'PAGAMENTO',                     // 🔴 COM_DADOS com pagamento
  CONSULTIVO = 'CONSULTIVO',                   // 🟡 legado SEM_DADOS
  CONSULTA_PUBLICA = 'CONSULTA_PUBLICA',       // ⚪ consulta sem protocolo
  CONSULTA_AUTENTICADA = 'CONSULTA_AUTENTICADA', // 🟣 consulta autenticada
  EMISSAO_AUTOMATICA = 'EMISSAO_AUTOMATICA',   // 🟠 emissão sem análise manual
  EMISSAO_ASSISTIDA = 'EMISSAO_ASSISTIDA'      // 🟤 emissão com validação administrativa
}

// 🆕 NOVO: Mapeamento visual de emojis
export const SERVICE_SUBTYPE_EMOJI: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: '🔵',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: '🟢',
  [ServiceSubtype.PAGAMENTO]: '🔴',
  [ServiceSubtype.CONSULTIVO]: '🟡',
  [ServiceSubtype.CONSULTA_PUBLICA]: '⚪',
  [ServiceSubtype.CONSULTA_AUTENTICADA]: '🟣',
  [ServiceSubtype.EMISSAO_AUTOMATICA]: '🟠',
  [ServiceSubtype.EMISSAO_ASSISTIDA]: '🟤'
};

// 🆕 NOVO: Labels descritivos
export const SERVICE_SUBTYPE_LABEL: Record<ServiceSubtype, string> = {
  [ServiceSubtype.CAPTURA_COMPLETA]: 'Solicitação com Captura de Dados',
  [ServiceSubtype.SOLICITACAO_SIMPLES]: 'Solicitação Simples',
  [ServiceSubtype.PAGAMENTO]: 'Serviço de Pagamento',
  [ServiceSubtype.CONSULTIVO]: 'Serviço Consultivo (legado)',
  [ServiceSubtype.CONSULTA_PUBLICA]: 'Consulta Pública',
  [ServiceSubtype.CONSULTA_AUTENTICADA]: 'Consulta Autenticada',
  [ServiceSubtype.EMISSAO_AUTOMATICA]: 'Emissão Automática',
  [ServiceSubtype.EMISSAO_ASSISTIDA]: 'Emissão Assistida'
};

export interface LinkedCitizenConfig {
  enabled: boolean;
  links: LinkedCitizenLinkConfig[];
}

export interface LinkedCitizenLinkConfig {
  linkType: CitizenLinkType | string;
  role: ServiceRole | string;
  label: string;
  description?: string;
  required?: boolean;
  mapFromLegacyFields?: {
    cpf?: string;
    name?: string;
    birthDate?: string;
    [key: string]: string | undefined;
  };
  contextFields?: Array<{
    id: string;
    sourceField?: string;
    value?: any;
  }>;
  expectedRelationships?: string[];
}

export interface ServiceDefinition {
  name: string;
  description: string;
  departmentCode: string;
  serviceType: ServiceType;
  serviceSubtype?: ServiceSubtype;  // 🆕 NOVO: Campo opcional de subtipo
  moduleType: string | null;
  requiresDocuments: boolean;
  requiredDocuments?: string[];
  estimatedDays: number | null;
  priority: number;
  category?: string;
  icon?: string;
  color?: string;
  formSchema?: any;
  linkedCitizensConfig?: LinkedCitizenConfig;
  // Campos de validação de unicidade de protocolos
  allowMultipleActiveProtocols?: boolean;
  uniquenessScope?: string;
  uniquenessRules?: any;
}
