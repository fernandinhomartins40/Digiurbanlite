// Tipos específicos para Lead com tratamento correto de nullable fields

export interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  position: string | null;
  source: string;
  message: string | null;
  createdAt: Date;
}

export interface TrialData extends LeadData {

  tenantName: string;
  cnpj: string;
  // domain removido
  population: number | null;
  loginUrl: string;
  temporaryPassword: string;
}

// Interfaces para serviços que esperam undefined ao invés de null
export interface LeadDataForService {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  position?: string;
  source: string;
  message?: string;
  createdAt: Date;
}

export interface TrialDataForService extends LeadDataForService {

  tenantName: string;
  cnpj: string;
  // domain removido
  population?: number;
  loginUrl: string;
  temporaryPassword: string;
}

// Type guards para validação segura
export function isValidLeadData(value: unknown): value is LeadData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.company === 'string' &&
    typeof obj.source === 'string' &&
    obj.createdAt instanceof Date
  );
}

// Helper functions para conversão segura entre tipos
export function convertLeadToService(lead: LeadData): LeadDataForService {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone || undefined,
    company: lead.company,
    position: lead.position || undefined,
    source: lead.source,
    message: lead.message || undefined,
    createdAt: lead.createdAt
        };
}

export function convertTrialToService(trial: TrialData): TrialDataForService {
  return {
    ...convertLeadToService(trial),
    tenantName: trial.tenantName,
    cnpj: trial.cnpj,
    // ❌ REMOVIDO: domain (não usamos mais)
    population: trial.population || undefined,
    loginUrl: trial.loginUrl,
    temporaryPassword: trial.temporaryPassword
        };
}

// Helper functions para tratamento consistente de campos nullable
export function safeString(value: string | null | undefined): string {
  return value || '';
}

export function safeStringWithDefault(
  value: string | null | undefined,
  defaultValue: string
): string {
  return value || defaultValue;
}

export function safeStringOptional(value: string | null | undefined): string | undefined {
  return value || undefined;
}

// Constantes para valores padrão
export const DEFAULT_VALUES = {
  PHONE: 'Não informado',
  POSITION: 'Não informado',
  MESSAGE: 'Nenhuma mensagem adicional',
  COMPANY: 'Não informado'
        } as const;
