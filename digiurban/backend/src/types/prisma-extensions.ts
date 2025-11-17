/**
 * Extensões e Tipos Específicos do Prisma - Versão Simplificada
 */

// Tipos básicos para agregações Prisma
export interface PrismaAggregateResult<T> {
  _sum: T | null;
  _count: { _all: number } | null;
}

// Interfaces para resultados de analytics
export interface MonthlyProtocolData {
  month: string;
  count: number;
  status?: string;
  department?: string;
}

// Map para conversão de prioridades
export const PRIORITY_MAP = {
  LOW: 1,
  NORMAL: 2,
  MEDIUM: 3,
  HIGH: 4,
  URGENT: 5
        } as const;

// Tipos para integrações com Prisma
export interface PrismaIntegrationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}
