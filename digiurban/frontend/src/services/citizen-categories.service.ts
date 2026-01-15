/**
 * ============================================================================
 * CITIZEN CATEGORIES SERVICE
 * ============================================================================
 * Serviço de API para gerenciamento de categorias de cidadãos
 */

import {
  CitizenCategory,
  CitizenCategoryAssignment,
  CitizenWithCategories,
  CategoryStats,
  AssignCategoryParams,
  DeactivateCategoryParams,
  CategoryAssignmentResult,
} from '@/types/citizen-categories';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  citizens: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ============================================================================
// CATEGORIAS
// ============================================================================

/**
 * Lista todas as categorias disponíveis
 */
export async function listCategories(
  token: string,
  activeOnly: boolean = true
): Promise<CitizenCategory[]> {
  const response = await fetch(
    `${API_URL}/admin/categories?activeOnly=${activeOnly}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<CitizenCategory[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao listar categorias');
  }

  return result.data!;
}

/**
 * Busca estatísticas de todas as categorias
 */
export async function getCategoryStats(token: string): Promise<CategoryStats[]> {
  const response = await fetch(`${API_URL}/admin/categories/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<CategoryStats[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao buscar estatísticas');
  }

  return result.data!;
}

/**
 * Busca categoria por ID
 */
export async function getCategoryById(
  categoryId: string,
  token: string
): Promise<CitizenCategory> {
  const response = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<CitizenCategory> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao buscar categoria');
  }

  return result.data!;
}

/**
 * Lista cidadãos de uma categoria
 */
export async function getCitizensByCategory(
  categoryId: string,
  token: string,
  options?: {
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<CitizenWithCategories>> {
  const params = new URLSearchParams();
  if (options?.activeOnly !== undefined) params.append('activeOnly', String(options.activeOnly));
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const response = await fetch(
    `${API_URL}/admin/categories/${categoryId}/citizens?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<PaginatedResponse<CitizenWithCategories>> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao buscar cidadãos');
  }

  return result.data!;
}

/**
 * Cria nova categoria
 */
export async function createCategory(
  data: Partial<CitizenCategory>,
  token: string
): Promise<CitizenCategory> {
  const response = await fetch(`${API_URL}/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<CitizenCategory> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar categoria');
  }

  return result.data!;
}

/**
 * Atualiza categoria existente
 */
export async function updateCategory(
  categoryId: string,
  data: Partial<CitizenCategory>,
  token: string
): Promise<CitizenCategory> {
  const response = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<CitizenCategory> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao atualizar categoria');
  }

  return result.data!;
}

// ============================================================================
// ATRIBUIÇÃO DE CATEGORIAS
// ============================================================================

/**
 * Lista categorias de um cidadão
 */
export async function getCitizenCategories(
  citizenId: string,
  token: string,
  activeOnly: boolean = true
): Promise<CitizenCategoryAssignment[]> {
  const response = await fetch(
    `${API_URL}/admin/categories/citizens/${citizenId}/all?activeOnly=${activeOnly}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<CitizenCategoryAssignment[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao buscar categorias do cidadão');
  }

  return result.data!;
}

/**
 * Atribui categoria a um cidadão
 */
export async function assignCategoryToCitizen(
  citizenId: string,
  params: AssignCategoryParams,
  token: string
): Promise<CategoryAssignmentResult> {
  const response = await fetch(
    `${API_URL}/admin/categories/citizens/${citizenId}/assign`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    }
  );

  const result: CategoryAssignmentResult = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Erro ao atribuir categoria');
  }

  return result;
}

/**
 * Remove (desativa) categoria de um cidadão
 */
export async function deactivateCategoryFromCitizen(
  citizenId: string,
  categoryId: string,
  params: DeactivateCategoryParams,
  token: string
): Promise<CategoryAssignmentResult> {
  const response = await fetch(
    `${API_URL}/admin/categories/citizens/${citizenId}/${categoryId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    }
  );

  const result: CategoryAssignmentResult = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Erro ao remover categoria');
  }

  return result;
}

/**
 * Busca cidadãos por múltiplas categorias
 */
export async function searchCitizensByCategories(
  categoryCodes: string[],
  token: string,
  matchAll: boolean = false
): Promise<CitizenWithCategories[]> {
  const response = await fetch(`${API_URL}/admin/categories/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      categoryCodes,
      matchAll,
    }),
  });

  const result: ApiResponse<CitizenWithCategories[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao buscar cidadãos');
  }

  return result.data!;
}
