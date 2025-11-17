/**
 * Tipos compartilhados para seeds de serviços
 */

import { ServiceType, CitizenLinkType, ServiceRole } from '@prisma/client';

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
}
