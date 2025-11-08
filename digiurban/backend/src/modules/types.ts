/**
 * Tipos compartilhados do sistema de módulos
 * Separado para evitar imports circulares
 */

import { ProtocolSimplified as Protocol, PrismaClient } from '@prisma/client';

export interface ModuleExecutionContext {
  protocol: Protocol;
  service: any;
  requestData: any;
  citizenId: string;
  prisma: PrismaClient;
}

export interface ModuleExecutionResult {
  success: boolean;
  entityId?: string;
  entityType?: string;
  data?: any;
  message?: string;
  error?: string;
}

export type ModuleType =
  | 'education'
  | 'health'
  | 'housing'
  | 'social'
  | 'culture'
  | 'sports'
  | 'environment'
  | 'security'
  | 'urban_planning'
  | 'agriculture'
  | 'tourism'
  | 'public_works'
  | 'public_services'
  | 'custom';
