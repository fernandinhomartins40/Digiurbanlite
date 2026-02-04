/**
 * SHARED TYPES: Family Composition System
 * Tipos compartilhados entre backend e frontend
 */

// ============================================================================
// ENUMS - Exportados como const objects E tipos para máxima compatibilidade
// ============================================================================

export const FamilyRelationship = {
  SPOUSE: 'SPOUSE',
  SON: 'SON',
  DAUGHTER: 'DAUGHTER',
  FATHER: 'FATHER',
  MOTHER: 'MOTHER',
  BROTHER: 'BROTHER',
  SISTER: 'SISTER',
  GRANDFATHER: 'GRANDFATHER',
  GRANDMOTHER: 'GRANDMOTHER',
  GRANDSON: 'GRANDSON',
  GRANDDAUGHTER: 'GRANDDAUGHTER',
  OTHER: 'OTHER',
} as const;

export type FamilyRelationship =
  (typeof FamilyRelationship)[keyof typeof FamilyRelationship];

export const FamilyLinkStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
} as const;

export type FamilyLinkStatus =
  (typeof FamilyLinkStatus)[keyof typeof FamilyLinkStatus];

export const InviteStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];

// ============================================================================
// INTERFACES - DATABASE MODELS
// ============================================================================

export interface FamilyComposition {
  id: string
  headId: string
  memberId: string
  relationship: FamilyRelationship
  isDependent: boolean
  status: FamilyLinkStatus

  // Campos adicionais Sprint 2
  monthlyIncome?: number | null
  occupation?: string | null
  education?: string | null
  hasDisability?: boolean | null

  createdAt: Date
  updatedAt: Date
}

export interface FamilyInvite {
  id: string
  headId: string
  email: string
  cpf?: string | null
  phone?: string | null
  name?: string | null
  relationship: FamilyRelationship
  isDependent: boolean
  status: InviteStatus
  token: string
  expiresAt: Date
  message?: string | null
  monthlyIncome?: number | null
  occupation?: string | null
  education?: string | null
  hasDisability?: boolean | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// INTERFACES - API RESPONSES
// ============================================================================

export interface CitizenBasic {
  id: string
  name: string
  cpf: string
  email: string
  phone?: string | null
  birthDate?: Date | null
}

export interface FamilyMember {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
}

export interface FamilyMemberWithDetails extends FamilyComposition {
  member: CitizenBasic
}

export interface FamilyHeadWithDetails {
  id: string
  name: string
  cpf: string
  email: string
  phone?: string | null
  birthDate?: Date | null
}

export interface FamilyCompositionItem {
  id: string;
  headId: string;
  memberId: string;
  relationship: FamilyRelationship;
  status: FamilyLinkStatus;
  notes: string | null;
  member: FamilyMember;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyData {
  head: FamilyMember;
  members: FamilyCompositionItem[];
  memberOf: Array<{
    id: string;
    headId: string;
    relationship: FamilyRelationship;
    status: FamilyLinkStatus;
    head: FamilyMember;
  }>;
  stats: FamilyStats;
}

export interface FamilyStats {
  totalMembers: number;
  activeMembersCount: number;
  pendingMembersCount: number;
  relationshipCounts: Record<string, number>;
  averageAge?: number | null;
  totalDependents?: number;
  totalChildren?: number;
  totalElderly?: number;
  totalWithDisability?: number;
  totalIncome?: number;
  incomePerCapita?: number;
  membersByRelationship?: Record<string, number>;
  activeLinks?: number;
  pendingLinks?: number;
}

// ============================================================================
// INTERFACES - API REQUESTS
// ============================================================================

export interface AddFamilyMemberRequest {
  memberId: string;
  relationship: FamilyRelationship;
  notes?: string;
  isDependent?: boolean;
  monthlyIncome?: number;
  occupation?: string;
  education?: string;
  hasDisability?: boolean;
}

export interface UpdateFamilyMemberRequest {
  relationship?: FamilyRelationship;
  status?: FamilyLinkStatus;
  notes?: string;
  isDependent?: boolean;
  monthlyIncome?: number;
  occupation?: string;
  education?: string;
  hasDisability?: boolean;
}

export interface SendFamilyInviteRequest {
  memberEmail?: string;
  memberPhone?: string;
  relationship: FamilyRelationship;
  message?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  name?: string;
  isDependent?: boolean;
}

export interface RespondToInviteRequest {
  accept: boolean;
  notes?: string;
  token?: string;
  reason?: string;
}

// ============================================================================
// INTERFACES - FORM DATA
// ============================================================================

export interface FamilyMemberFormData {
  memberId?: string
  relationship: FamilyRelationship | ''
  isDependent: boolean
  monthlyIncome?: string
  occupation?: string
  education?: string
  hasDisability: boolean
}

export interface FamilyInviteFormData {
  email: string
  cpf?: string
  phone?: string
  name?: string
  relationship: FamilyRelationship | ''
  isDependent: boolean
  message?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ValidationWarning {
  type: 'age' | 'relationship' | 'duplicate' | 'other';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface RelationshipSuggestion {
  relationship: FamilyRelationship
  confidence: number
  reason: string
}
