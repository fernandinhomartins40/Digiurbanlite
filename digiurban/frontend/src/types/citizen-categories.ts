/**
 * ============================================================================
 * CITIZEN CATEGORIES TYPES
 * ============================================================================
 * Tipos TypeScript para categorias de cidadãos
 */

export interface CitizenCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  department: string;
  icon: string | null;
  color: string | null;
  active: boolean;
  triggerServices: string[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    citizens: number;
  };
}

export interface CitizenCategoryAssignment {
  id: string;
  citizenId: string;
  categoryId: string;
  protocolId: string | null;
  assignedAt: string;
  assignedBy: string | null;
  active: boolean;
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  deactivationReason: string | null;
  metadata: any;
  category?: CitizenCategory;
}

export interface CitizenWithCategories {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string | null;
  categories: CitizenCategoryAssignment[];
}

export interface CategoryStats {
  category: CitizenCategory;
  totalCitizens: number;
  activeCitizens: number;
  deactivatedCitizens: number;
}

export interface AssignCategoryParams {
  categoryId: string;
  metadata?: any;
}

export interface DeactivateCategoryParams {
  reason?: string;
}

export interface CategoryAssignmentResult {
  success: boolean;
  assignment?: CitizenCategoryAssignment;
  message: string;
  isNew?: boolean;
}
