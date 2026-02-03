/**
 * SHARED TYPES: Family Composition System
 * Tipos compartilhados entre backend e frontend
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum FamilyRelationship {
  SPOUSE = 'SPOUSE',
  SON = 'SON',
  DAUGHTER = 'DAUGHTER',
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  BROTHER = 'BROTHER',
  SISTER = 'SISTER',
  GRANDFATHER = 'GRANDFATHER',
  GRANDMOTHER = 'GRANDMOTHER',
  GRANDSON = 'GRANDSON',
  GRANDDAUGHTER = 'GRANDDAUGHTER',
  OTHER = 'OTHER'
}

export enum FamilyLinkStatus {
  PENDING = 'PENDING',       // Aguardando confirmação do membro
  ACTIVE = 'ACTIVE',         // Ambos confirmaram
  REJECTED = 'REJECTED'      // Membro rejeitou
}

export enum InviteStatus {
  PENDING = 'PENDING',       // Aguardando resposta
  ACCEPTED = 'ACCEPTED',     // Aceito e vínculo criado
  REJECTED = 'REJECTED',     // Rejeitado pelo convidado
  EXPIRED = 'EXPIRED',       // Expirou (7 dias)
  CANCELLED = 'CANCELLED'    // Cancelado pelo remetente
}

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

export interface FamilyData {
  head: FamilyHeadWithDetails
  members: FamilyMemberWithDetails[]
  memberOf: Array<{
    id: string
    relationship: FamilyRelationship
    isDependent: boolean
    status: FamilyLinkStatus
    head: CitizenBasic
  }>
  stats: FamilyStats
}

export interface FamilyStats {
  totalMembers: number
  totalDependents: number
  totalChildren: number
  totalElderly: number
  totalWithDisability: number
  totalIncome: number
  incomePerCapita: number
  averageAge: number | null
  membersByRelationship: Record<string, number>
  activeLinks: number
  pendingLinks: number
}

// ============================================================================
// INTERFACES - API REQUESTS
// ============================================================================

export interface AddFamilyMemberRequest {
  memberId: string
  relationship: FamilyRelationship
  isDependent: boolean
  monthlyIncome?: number
  occupation?: string
  education?: string
  hasDisability?: boolean
}

export interface UpdateFamilyMemberRequest {
  relationship?: FamilyRelationship
  isDependent?: boolean
  monthlyIncome?: number
  occupation?: string
  education?: string
  hasDisability?: boolean
}

export interface SendFamilyInviteRequest {
  email: string
  cpf?: string
  phone?: string
  name?: string
  relationship: FamilyRelationship
  isDependent?: boolean
  message?: string
  monthlyIncome?: number
  occupation?: string
  education?: string
  hasDisability?: boolean
}

export interface RespondToInviteRequest {
  token: string
  accept: boolean
  reason?: string
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
  field: string
  message: string
  severity: 'warning' | 'error'
}

export interface RelationshipSuggestion {
  relationship: FamilyRelationship
  confidence: number
  reason: string
}
