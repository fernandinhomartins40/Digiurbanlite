/**
 * Tipos compartilhados para seeds de serviços
 */

import { ServiceType } from '@prisma/client';

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
}
