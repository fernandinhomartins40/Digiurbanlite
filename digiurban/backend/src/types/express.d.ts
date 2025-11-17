// ============================================================================
// TIPOS AUXILIARES EXPRESS - SEM DECLARAÇÕES GLOBAIS
// ============================================================================

import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
// Re-exporta tipos de outros módulos para compatibilidade
export type { UserWithRelations, CitizenWithRelations } from './common';
// removido - import circular

// Interface para filtros de dados baseados em role
export interface DataFilters {

  assignedUserId?: string;
  departmentId?: string;
  createdById?: string; // ✅ Correto: createdById
  id?: string; // Para caso de 'no-access'
}

// Tipos utilitários para requests/responses tipados (temporariamente simplificados)
export type TypedRequest<TBody = unknown, TQuery = unknown, TParams = unknown> = Request & {
  body: TBody;
  query: TQuery;
  params: TParams;
};

export type TypedResponse<TResponse = unknown> = Response;