// ============================================================================
// CITIZEN-CATEGORY-EXPANDED.SERVICE.TS - Sistema Expandido de Categorização
// ============================================================================
// Versão 2.0 - Sistema completo com:
// - Histórico de protocolos
// - Relacionamentos entre categorias
// - Progressão e gamificação
// - Validade e renovação
// - Auditoria completa
// ============================================================================

import { prisma } from '../lib/prisma';
import { CitizenCategory, CitizenCategoryAssignment, Prisma } from '@prisma/client';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface CategoryWithFullStats extends CitizenCategory {
  _count: {
    citizens: number;
    badges: number;
    relationshipsAsSource: number;
    relationshipsAsTarget: number;
  };
  statistics?: {
    totalCitizens: number;
    activeCitizens: number;
    expiredCitizens: number;
    avgProtocolsPerCitizen: number;
    totalProtocols: number;
    lastActivity: Date | null;
  };
}

export interface AssignmentWithHistory extends CitizenCategoryAssignment {
  category: CitizenCategory;
  protocolHistory: Array<{
    id: string;
    protocolNumber: string | null;
    serviceName: string | null;
    eventType: string;
    eventDate: Date;
  }>;
  auditLog: Array<{
    action: string;
    actionDate: Date;
    performedByType: string | null;
  }>;
}

export interface CategoryAssignmentExtendedResult {
  success: boolean;
  assignment?: AssignmentWithHistory;
  message: string;
  isNew?: boolean;
  progressionApplied?: boolean;
  badgesEarned?: string[];
  relationshipsProcessed?: Array<{
    categoryCode: string;
    action: string;
    success: boolean;
  }>;
}

export interface ProgressionCriteria {
  minProtocolCount?: number;
  minExperiencePoints?: number;
  minDaysActive?: number;
  requiredBadges?: string[];
  customConditions?: Record<string, any>;
}

export interface CategoryRelationshipConfig {
  type: 'PARENT' | 'CHILD' | 'PREREQUISITE' | 'COMPLEMENTARY' | 'CONFLICTING' | 'UPGRADE';
  targetCategoryCode: string;
  isRequired: boolean;
  autoAssign: boolean;
  weight?: number;
  metadata?: any;
}

// ============================================================================
// SISTEMA DE HISTÓRICO DE PROTOCOLOS
// ============================================================================

/**
 * Registra um protocolo no histórico da categoria do cidadão
 */
export async function addProtocolToHistory(params: {
  assignmentId: string;
  protocolId: string;
  citizenId: string;
  categoryId: string;
  eventType: 'ASSIGNED' | 'RENEWED' | 'UPGRADED' | 'REACTIVATED';
  protocolNumber?: string;
  moduleType?: string;
  serviceName?: string;
  metadata?: any;
}) {
  const {
    assignmentId,
    protocolId,
    citizenId,
    categoryId,
    eventType,
    protocolNumber,
    moduleType,
    serviceName,
    metadata,
  } = params;

  // Criar registro no histórico
  const historyEntry = await prisma.citizenCategoryProtocolHistory.create({
    data: {
      assignmentId,
      protocolId,
      citizenId,
      categoryId,
      eventType,
      protocolNumber,
      moduleType,
      serviceName,
      metadata,
    },
  });

  // Atualizar estatísticas do assignment
  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (assignment) {
    await prisma.citizenCategoryAssignment.update({
      where: { id: assignmentId },
      data: {
        protocolCount: assignment.protocolCount + 1,
        lastProtocolDate: new Date(),
        experiencePoints: assignment.experiencePoints + 10, // +10 XP por protocolo
      },
    });
  }

  return historyEntry;
}

/**
 * Busca histórico completo de protocolos de uma categoria
 */
export async function getProtocolHistory(assignmentId: string) {
  return prisma.citizenCategoryProtocolHistory.findMany({
    where: { assignmentId },
    include: {
      protocol: {
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          concludedAt: true,
        },
      },
    },
    orderBy: { eventDate: 'desc' },
  });
}

// ============================================================================
// SISTEMA DE AUDITORIA
// ============================================================================

/**
 * Registra ação no log de auditoria
 */
export async function logCategoryAction(params: {
  assignmentId: string;
  citizenId: string;
  categoryId: string;
  action: 'ASSIGNED' | 'ACTIVATED' | 'DEACTIVATED' | 'RENEWED' | 'UPGRADED' | 'EXPIRED';
  performedBy?: string;
  performedByType?: 'SYSTEM' | 'ADMIN' | 'CITIZEN';
  reason?: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
}) {
  return prisma.citizenCategoryAuditLog.create({
    data: {
      assignmentId: params.assignmentId,
      citizenId: params.citizenId,
      categoryId: params.categoryId,
      action: params.action,
      performedBy: params.performedBy,
      performedByType: params.performedByType,
      reason: params.reason,
      previousState: params.previousState,
      newState: params.newState,
      metadata: params.metadata,
    },
  });
}

/**
 * Busca log de auditoria completo
 */
export async function getAuditLog(assignmentId: string) {
  return prisma.citizenCategoryAuditLog.findMany({
    where: { assignmentId },
    orderBy: { actionDate: 'desc' },
  });
}

// ============================================================================
// SISTEMA DE VALIDADE E RENOVAÇÃO
// ============================================================================

/**
 * Calcula data de expiração baseada na categoria
 */
export async function calculateExpiryDate(categoryId: string, fromDate: Date = new Date()): Promise<Date | null> {
  const category = await prisma.citizenCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category || !category.hasValidity || !category.validityDays) {
    return null;
  }

  const expiryDate = new Date(fromDate);
  expiryDate.setDate(expiryDate.getDate() + category.validityDays);
  return expiryDate;
}

/**
 * Verifica e marca categorias expiradas
 */
export async function checkAndMarkExpiredCategories() {
  const now = new Date();

  // Buscar categorias que deveriam estar expiradas
  const expiredAssignments = await prisma.citizenCategoryAssignment.findMany({
    where: {
      active: true,
      isExpired: false,
      expiresAt: {
        lt: now,
      },
    },
    include: {
      category: true,
    },
  });

  const results = [];

  for (const assignment of expiredAssignments) {
    // Marcar como expirada
    const updated = await prisma.citizenCategoryAssignment.update({
      where: { id: assignment.id },
      data: {
        isExpired: true,
        // Se categoria exige desativação automática
        active: assignment.category.autoDeactivateOnExpiry ? false : assignment.active,
        deactivatedAt: assignment.category.autoDeactivateOnExpiry ? now : assignment.deactivatedAt,
        deactivationReason: assignment.category.autoDeactivateOnExpiry
          ? 'Categoria expirada automaticamente'
          : assignment.deactivationReason,
      },
    });

    // Log de auditoria
    await logCategoryAction({
      assignmentId: assignment.id,
      citizenId: assignment.citizenId,
      categoryId: assignment.categoryId,
      action: 'EXPIRED',
      performedByType: 'SYSTEM',
      reason: 'Categoria atingiu data de expiração',
      previousState: { isExpired: false, active: assignment.active },
      newState: { isExpired: true, active: updated.active },
    });

    results.push({
      assignmentId: assignment.id,
      categoryCode: assignment.category.code,
      autoDeactivated: assignment.category.autoDeactivateOnExpiry,
    });
  }

  return {
    total: results.length,
    expired: results,
  };
}

/**
 * Renova uma categoria
 */
export async function renewCategory(assignmentId: string, renewedBy?: string) {
  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: { id: assignmentId },
    include: { category: true },
  });

  if (!assignment) {
    throw new Error('Atribuição não encontrada');
  }

  if (!assignment.category.hasValidity) {
    throw new Error('Esta categoria não requer renovação');
  }

  const now = new Date();
  const newExpiryDate = await calculateExpiryDate(assignment.categoryId, now);

  const updated = await prisma.citizenCategoryAssignment.update({
    where: { id: assignmentId },
    data: {
      isExpired: false,
      lastRenewalDate: now,
      renewalCount: assignment.renewalCount + 1,
      expiresAt: newExpiryDate,
      active: true, // Reativar se estava inativa
    },
  });

  // Log de auditoria
  await logCategoryAction({
    assignmentId,
    citizenId: assignment.citizenId,
    categoryId: assignment.categoryId,
    action: 'RENEWED',
    performedBy: renewedBy,
    performedByType: renewedBy ? 'ADMIN' : 'SYSTEM',
    reason: 'Categoria renovada',
    previousState: { renewalCount: assignment.renewalCount, expiresAt: assignment.expiresAt },
    newState: { renewalCount: updated.renewalCount, expiresAt: updated.expiresAt },
  });

  return updated;
}

/**
 * Busca categorias que precisam de renovação em breve
 */
export async function getCategoriesNeedingRenewal(daysAhead: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return prisma.citizenCategoryAssignment.findMany({
    where: {
      active: true,
      isExpired: false,
      expiresAt: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    include: {
      category: true,
      citizen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      expiresAt: 'asc',
    },
  });
}

// ============================================================================
// SISTEMA DE PROGRESSÃO E GAMIFICAÇÃO
// ============================================================================

/**
 * Verifica se cidadão pode progredir para próximo nível
 */
export async function checkProgression(assignmentId: string) {
  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: { id: assignmentId },
    include: { category: true },
  });

  if (!assignment || !assignment.category.hasProgression || !assignment.category.nextLevelCategory) {
    return { canProgress: false, reason: 'Categoria não tem progressão configurada' };
  }

  const criteria = assignment.category.progressionCriteria as ProgressionCriteria | null;
  if (!criteria) {
    return { canProgress: false, reason: 'Critérios de progressão não definidos' };
  }

  const blockers: string[] = [];

  // Verificar protocolo mínimo
  if (criteria.minProtocolCount && assignment.protocolCount < criteria.minProtocolCount) {
    blockers.push(`Necessário ${criteria.minProtocolCount} protocolos (atual: ${assignment.protocolCount})`);
  }

  // Verificar experiência mínima
  if (criteria.minExperiencePoints && assignment.experiencePoints < criteria.minExperiencePoints) {
    blockers.push(`Necessário ${criteria.minExperiencePoints} XP (atual: ${assignment.experiencePoints})`);
  }

  // Verificar dias ativos
  if (criteria.minDaysActive) {
    const daysActive = Math.floor(
      (Date.now() - assignment.assignedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysActive < criteria.minDaysActive) {
      blockers.push(`Necessário ${criteria.minDaysActive} dias ativos (atual: ${daysActive})`);
    }
  }

  // Verificar badges necessários
  if (criteria.requiredBadges && criteria.requiredBadges.length > 0) {
    const currentBadges = (assignment.badges as string[]) || [];
    const missingBadges = criteria.requiredBadges.filter((b) => !currentBadges.includes(b));
    if (missingBadges.length > 0) {
      blockers.push(`Badges faltando: ${missingBadges.join(', ')}`);
    }
  }

  if (blockers.length > 0) {
    return {
      canProgress: false,
      reason: blockers.join('; '),
      blockers,
    };
  }

  // Buscar próxima categoria
  const nextCategory = await prisma.citizenCategory.findFirst({
    where: { code: assignment.category.nextLevelCategory },
  });

  return {
    canProgress: true,
    nextCategory,
  };
}

/**
 * Aplica progressão para próxima categoria
 */
export async function applyProgression(assignmentId: string, performedBy?: string) {
  const check = await checkProgression(assignmentId);

  if (!check.canProgress || !check.nextCategory) {
    throw new Error(check.reason || 'Não é possível progredir');
  }

  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: { id: assignmentId },
    include: { category: true },
  });

  if (!assignment) {
    throw new Error('Atribuição não encontrada');
  }

  // Criar nova categoria (upgrade)
  const newAssignment = await prisma.citizenCategoryAssignment.create({
    data: {
      citizenId: assignment.citizenId,
      categoryId: check.nextCategory.id,
      assignedBy: performedBy,
      level: 1,
      experiencePoints: 0, // Resetar XP na nova categoria
      protocolCount: 0, // Contador específico da nova categoria
      metadata: {
        upgradedFrom: assignment.category.code,
        upgradedAt: new Date().toISOString(),
        previousLevel: assignment.level,
        previousXP: assignment.experiencePoints,
      },
    },
  });

  // Desativar categoria anterior (opcional - depende da lógica)
  await prisma.citizenCategoryAssignment.update({
    where: { id: assignmentId },
    data: {
      active: false,
      deactivatedAt: new Date(),
      deactivationReason: `Progrediu para: ${check.nextCategory.name}`,
    },
  });

  // Log de auditoria
  await logCategoryAction({
    assignmentId: newAssignment.id,
    citizenId: assignment.citizenId,
    categoryId: check.nextCategory.id,
    action: 'UPGRADED',
    performedBy,
    performedByType: performedBy ? 'ADMIN' : 'SYSTEM',
    reason: 'Progressão automática aplicada',
    metadata: {
      fromCategory: assignment.category.code,
      toCategory: check.nextCategory.code,
    },
  });

  return {
    success: true,
    newAssignment,
    previousCategory: assignment.category,
    newCategory: check.nextCategory,
  };
}

/**
 * Atribui badge a um cidadão
 */
export async function awardBadge(assignmentId: string, badgeCode: string, reason?: string) {
  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new Error('Atribuição não encontrada');
  }

  const currentBadges = (assignment.badges as any[]) || [];

  // Verificar se já possui o badge
  if (currentBadges.some((b: any) => b.code === badgeCode)) {
    return {
      success: false,
      message: 'Cidadão já possui este badge',
    };
  }

  // Buscar informações do badge
  const badge = await prisma.citizenCategoryBadge.findUnique({
    where: { code: badgeCode },
  });

  if (!badge) {
    throw new Error('Badge não encontrado');
  }

  // Adicionar badge
  const updatedBadges = [
    ...currentBadges,
    {
      code: badge.code,
      name: badge.name,
      earnedAt: new Date().toISOString(),
      reason,
    },
  ];

  await prisma.citizenCategoryAssignment.update({
    where: { id: assignmentId },
    data: {
      badges: updatedBadges,
      experiencePoints: assignment.experiencePoints + 50, // +50 XP por badge
    },
  });

  return {
    success: true,
    badge,
    message: `Badge "${badge.name}" conquistado!`,
  };
}

/**
 * Verifica e aplica badges automaticamente baseado em critérios
 */
export async function checkAndAwardAutomaticBadges(assignmentId: string) {
  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: { id: assignmentId },
    include: { category: true },
  });

  if (!assignment) return [];

  // Buscar badges disponíveis para esta categoria
  const availableBadges = await prisma.citizenCategoryBadge.findMany({
    where: {
      categoryId: assignment.categoryId,
      active: true,
    },
  });

  const currentBadges = (assignment.badges as any[]) || [];
  const earnedBadges = [];

  for (const badge of availableBadges) {
    // Verificar se já possui
    if (currentBadges.some((b: any) => b.code === badge.code)) {
      continue;
    }

    let meetsRequirements = true;

    // Verificar requisitos
    if (badge.requiredProtocolCount && assignment.protocolCount < badge.requiredProtocolCount) {
      meetsRequirements = false;
    }

    if (badge.requiredExperiencePoints && assignment.experiencePoints < badge.requiredExperiencePoints) {
      meetsRequirements = false;
    }

    if (badge.requiredDays) {
      const daysActive = Math.floor(
        (Date.now() - assignment.assignedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysActive < badge.requiredDays) {
        meetsRequirements = false;
      }
    }

    if (meetsRequirements) {
      await awardBadge(assignmentId, badge.code, 'Conquistado automaticamente');
      earnedBadges.push(badge);
    }
  }

  return earnedBadges;
}

// ============================================================================
// EXPORTAR TODAS FUNÇÕES
// ============================================================================

export default {
  // Histórico
  addProtocolToHistory,
  getProtocolHistory,

  // Auditoria
  logCategoryAction,
  getAuditLog,

  // Validade
  calculateExpiryDate,
  checkAndMarkExpiredCategories,
  renewCategory,
  getCategoriesNeedingRenewal,

  // Progressão
  checkProgression,
  applyProgression,
  awardBadge,
  checkAndAwardAutomaticBadges,
};
