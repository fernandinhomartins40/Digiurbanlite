// ============================================================================
// CITIZEN-CATEGORY.SERVICE.TS - Serviço de Gerenciamento de Categorias de Cidadãos
// ============================================================================

import { prisma } from '../lib/prisma';
import { CitizenCategory, CitizenCategoryAssignment, Citizen } from '@prisma/client';
import * as expandedService from './citizen-category-expanded.service';
import * as relationshipsService from './citizen-category-relationships.service';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CategoryWithAssignmentCount extends CitizenCategory {
  _count: {
    citizens: number;
  };
}

export interface CitizenWithCategories extends Citizen {
  categories: Array<CitizenCategoryAssignment & { category: CitizenCategory }>;
}

export interface AssignCategoryParams {
  citizenId: string;
  categoryId: string;
  protocolId?: string;
  assignedBy?: string;
  metadata?: any;
}

export interface DeactivateCategoryParams {
  citizenId: string;
  categoryId: string;
  deactivatedBy?: string;
  deactivationReason?: string;
}

export interface CategoryAssignmentResult {
  success: boolean;
  assignment?: CitizenCategoryAssignment & { category?: CitizenCategory };
  message: string;
  isNew?: boolean;
}

// ============================================================================
// FUNÇÕES DE CATEGORIAS
// ============================================================================

/**
 * Lista todas as categorias disponíveis
 */
export async function listCategories(activeOnly: boolean = true): Promise<CategoryWithAssignmentCount[]> {
  return prisma.citizenCategory.findMany({
    where: activeOnly ? { active: true } : undefined,
    include: {
      _count: {
        select: {
          citizens: {
            where: { active: true },
          },
        },
      },
    },
    orderBy: [
      { department: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Busca categoria por código
 */
export async function getCategoryByCode(code: string): Promise<CitizenCategory | null> {
  return prisma.citizenCategory.findUnique({
    where: { code },
  });
}

/**
 * Busca categoria por ID
 */
export async function getCategoryById(id: string): Promise<CitizenCategory | null> {
  return prisma.citizenCategory.findUnique({
    where: { id },
  });
}

/**
 * Cria nova categoria
 */
export async function createCategory(data: Omit<CitizenCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<CitizenCategory> {
  return prisma.citizenCategory.create({
    data,
  });
}

/**
 * Atualiza categoria existente
 */
export async function updateCategory(id: string, data: Partial<CitizenCategory>): Promise<CitizenCategory> {
  return prisma.citizenCategory.update({
    where: { id },
    data,
  });
}

/**
 * Busca categorias que devem ser atribuídas para um moduleType
 */
export async function getCategoriesByModuleType(moduleType: string): Promise<CitizenCategory[]> {
  return prisma.citizenCategory.findMany({
    where: {
      active: true,
      triggerServices: {
        has: moduleType,
      },
    },
  });
}

// ============================================================================
// FUNÇÕES DE ATRIBUIÇÃO
// ============================================================================

/**
 * Atribui uma categoria a um cidadão (VERSÃO EXPANDIDA COM VALIDAÇÕES)
 */
export async function assignCategoryToCitizen(params: AssignCategoryParams): Promise<CategoryAssignmentResult> {
  const { citizenId, categoryId, protocolId, assignedBy, metadata } = params;

  console.log(`🏷️  [CategoryService] Atribuindo categoria ${categoryId} ao cidadão ${citizenId}`);

  // Verifica se cidadão existe
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
  });

  if (!citizen) {
    return {
      success: false,
      message: 'Cidadão não encontrado',
    };
  }

  // Verifica se categoria existe e está ativa
  const category = await prisma.citizenCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return {
      success: false,
      message: 'Categoria não encontrada',
    };
  }

  if (!category.active) {
    return {
      success: false,
      message: 'Categoria inativa',
    };
  }

  // Verifica se já existe atribuição
  const existingAssignment = await prisma.citizenCategoryAssignment.findUnique({
    where: {
      citizenId_categoryId: {
        citizenId,
        categoryId,
      },
    },
  });

  let assignment: CitizenCategoryAssignment;
  let isNew = false;

  if (existingAssignment) {
    // Se estava desativada, reativa
    if (!existingAssignment.active) {
      assignment = await prisma.citizenCategoryAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          active: true,
          deactivatedAt: null,
          deactivatedBy: null,
          deactivationReason: null,
          protocolId: protocolId || existingAssignment.protocolId,
          metadata: metadata || existingAssignment.metadata,
        },
      });
      return {
        success: true,
        assignment,
        message: 'Categoria reativada com sucesso',
        isNew: false,
      };
    } else {
      // Já está ativa, apenas atualiza metadados se fornecidos
      if (metadata || protocolId) {
        assignment = await prisma.citizenCategoryAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            metadata: metadata || existingAssignment.metadata,
            protocolId: protocolId || existingAssignment.protocolId,
          },
        });
      } else {
        assignment = existingAssignment;
      }
      return {
        success: true,
        assignment,
        message: 'Cidadão já possui esta categoria',
        isNew: false,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDAR RELACIONAMENTOS ANTES DE CRIAR
  // ═══════════════════════════════════════════════════════════════════
  const validation = await relationshipsService.validateCategoryAssignment(citizenId, category.code);

  if (!validation.isValid && category.requiresApproval === false) {
    // Se categoria não requer aprovação e tem violações, bloquear
    console.warn(`⚠️  [CategoryService] Validação falhou para ${category.code}:`, validation.violations);
    return {
      success: false,
      message: `Não é possível atribuir esta categoria: ${validation.violations.map(v => v.message).join('; ')}`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CALCULAR VALIDADE SE CATEGORIA REQUER
  // ═══════════════════════════════════════════════════════════════════
  const now = new Date();
  const expiresAt = await expandedService.calculateExpiryDate(categoryId, now);

  // Cria nova atribuição COM NOVOS CAMPOS
  assignment = await prisma.citizenCategoryAssignment.create({
    data: {
      citizenId,
      categoryId,
      protocolId,
      assignedBy,
      metadata,
      active: true,
      validFrom: now,
      expiresAt,
      protocolCount: protocolId ? 1 : 0,
      lastProtocolDate: protocolId ? now : null,
      experiencePoints: 10, // XP inicial
    },
  });

  isNew = true;

  console.log(`✅ [CategoryService] Categoria "${category.name}" atribuída com sucesso`);

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRAR NO HISTÓRICO SE TEM PROTOCOLO
  // ═══════════════════════════════════════════════════════════════════
  if (protocolId) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { number: true, moduleType: true, title: true },
    });

    await expandedService.addProtocolToHistory({
      assignmentId: assignment.id,
      protocolId,
      citizenId,
      categoryId,
      eventType: 'ASSIGNED',
      protocolNumber: protocol?.number,
      moduleType: protocol?.moduleType || undefined,
      serviceName: protocol?.title,
      metadata,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRAR NO LOG DE AUDITORIA
  // ═══════════════════════════════════════════════════════════════════
  await expandedService.logCategoryAction({
    assignmentId: assignment.id,
    citizenId,
    categoryId,
    action: 'ASSIGNED',
    performedBy: assignedBy,
    performedByType: assignedBy ? 'ADMIN' : 'SYSTEM',
    reason: 'Categoria atribuída via protocolo',
    newState: { active: true, expiresAt },
    metadata: { protocolId, ...metadata },
  });

  // ═══════════════════════════════════════════════════════════════════
  // PROCESSAR RELACIONAMENTOS AUTOMÁTICOS (complementares, etc)
  // ═══════════════════════════════════════════════════════════════════
  const autoRelationships = await relationshipsService.processAutoRelationships(
    citizenId,
    category.code,
    assignedBy
  );

  // ═══════════════════════════════════════════════════════════════════
  // VERIFICAR E ATRIBUIR BADGES AUTOMÁTICOS
  // ═══════════════════════════════════════════════════════════════════
  const earnedBadges = await expandedService.checkAndAwardAutomaticBadges(assignment.id);

  return {
    success: true,
    assignment,
    message: `Categoria "${category.name}" atribuída com sucesso`,
    isNew,
    relationshipsProcessed: autoRelationships,
    badgesEarned: earnedBadges.map(b => b.name),
    warnings: validation.warnings.map(w => w.message),
  };
}

/**
 * Atribui automaticamente categorias baseadas no tipo de serviço (protocolo)
 * Chamado após aprovação de protocolo
 * VERSÃO 2.0: Com histórico de protocolos e validações completas
 */
export async function autoAssignCategoriesByProtocol(
  protocolId: string,
  citizenId: string,
  moduleType: string,
  assignedBy?: string
): Promise<CategoryAssignmentResult[]> {
  console.log(`🏷️  [CategoryService] Auto-atribuindo categorias para moduleType: ${moduleType}`);

  // Busca categorias associadas ao moduleType
  const categories = await getCategoriesByModuleType(moduleType);

  if (categories.length === 0) {
    console.log(`ℹ️  [CategoryService] Nenhuma categoria configurada para ${moduleType}`);
    return [];
  }

  console.log(`📋 [CategoryService] Encontradas ${categories.length} categoria(s) para processar`);

  // Buscar informações do protocolo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: { number: true, moduleType: true, title: true },
  });

  // Atribui cada categoria encontrada
  const results: CategoryAssignmentResult[] = [];

  for (const category of categories) {
    console.log(`🔄 [CategoryService] Processando categoria: ${category.name} (${category.code})`);

    // Verificar se categoria JÁ EXISTE e está ATIVA
    const existingAssignment = await prisma.citizenCategoryAssignment.findUnique({
      where: {
        citizenId_categoryId: {
          citizenId,
          categoryId: category.id,
        },
      },
    });

    if (existingAssignment && existingAssignment.active) {
      // ═══════════════════════════════════════════════════════════════
      // CATEGORIA JÁ EXISTE E ESTÁ ATIVA
      // ADICIONAR PROTOCOLO AO HISTÓRICO
      // ═══════════════════════════════════════════════════════════════
      console.log(`♻️  [CategoryService] Categoria já existe, adicionando ao histórico`);

      // Adicionar ao histórico
      await expandedService.addProtocolToHistory({
        assignmentId: existingAssignment.id,
        protocolId,
        citizenId,
        categoryId: category.id,
        eventType: existingAssignment.isExpired ? 'RENEWED' : 'RENEWED',
        protocolNumber: protocol?.number,
        moduleType: protocol?.moduleType || undefined,
        serviceName: protocol?.title,
      });

      // Se categoria estava expirada, renovar
      if (existingAssignment.isExpired && category.hasValidity) {
        console.log(`🔄 [CategoryService] Renovando categoria expirada`);
        await expandedService.renewCategory(existingAssignment.id, assignedBy);
      }

      // Verificar badges e progressão
      const earnedBadges = await expandedService.checkAndAwardAutomaticBadges(existingAssignment.id);
      const progressionCheck = await expandedService.checkProgression(existingAssignment.id);

      results.push({
        success: true,
        assignment: {
          ...existingAssignment,
          category,
        } as any,
        message: `Protocolo adicionado ao histórico da categoria "${category.name}"`,
        isNew: false,
        badgesEarned: earnedBadges.map(b => b.name),
        progressionApplied: progressionCheck.canProgress,
      });

    } else {
      // ═══════════════════════════════════════════════════════════════
      // CATEGORIA NÃO EXISTE OU ESTÁ INATIVA
      // CRIAR/REATIVAR
      // ═══════════════════════════════════════════════════════════════
      const result = await assignCategoryToCitizen({
        citizenId,
        categoryId: category.id,
        protocolId,
        assignedBy,
        metadata: {
          autoAssigned: true,
          moduleType,
          assignedAt: new Date().toISOString(),
        },
      });

      // Adicionar a categoria no resultado
      if (result.assignment) {
        result.assignment.category = category;
      }

      results.push(result);
    }
  }

  console.log(`✅ [CategoryService] Processamento concluído: ${results.length} resultado(s)`);
  return results;
}

/**
 * Desativa (remove) uma categoria de um cidadão
 */
export async function deactivateCategoryFromCitizen(params: DeactivateCategoryParams): Promise<CategoryAssignmentResult> {
  const { citizenId, categoryId, deactivatedBy, deactivationReason } = params;

  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: {
      citizenId_categoryId: {
        citizenId,
        categoryId,
      },
    },
    include: {
      category: true,
    },
  });

  if (!assignment) {
    return {
      success: false,
      message: 'Atribuição não encontrada',
    };
  }

  if (!assignment.active) {
    return {
      success: false,
      message: 'Categoria já está desativada',
    };
  }

  const updated = await prisma.citizenCategoryAssignment.update({
    where: { id: assignment.id },
    data: {
      active: false,
      deactivatedAt: new Date(),
      deactivatedBy,
      deactivationReason,
    },
  });

  return {
    success: true,
    assignment: updated,
    message: `Categoria "${assignment.category.name}" removida com sucesso`,
  };
}

/**
 * Remove completamente uma atribuição de categoria (hard delete)
 */
export async function deleteCategoryAssignment(citizenId: string, categoryId: string): Promise<{ success: boolean; message: string }> {
  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: {
      citizenId_categoryId: {
        citizenId,
        categoryId,
      },
    },
  });

  if (!assignment) {
    return {
      success: false,
      message: 'Atribuição não encontrada',
    };
  }

  await prisma.citizenCategoryAssignment.delete({
    where: { id: assignment.id },
  });

  return {
    success: true,
    message: 'Atribuição removida permanentemente',
  };
}

// ============================================================================
// FUNÇÕES DE CONSULTA
// ============================================================================

/**
 * Busca todas as categorias de um cidadão
 */
export async function getCitizenCategories(citizenId: string, activeOnly: boolean = true): Promise<Array<CitizenCategoryAssignment & { category: CitizenCategory }>> {
  return prisma.citizenCategoryAssignment.findMany({
    where: {
      citizenId,
      active: activeOnly ? true : undefined,
    },
    include: {
      category: true,
    },
    orderBy: {
      assignedAt: 'desc',
    },
  });
}

/**
 * Busca todos os cidadãos de uma categoria
 */
export async function getCitizensByCategory(
  categoryId: string,
  activeOnly: boolean = true,
  page: number = 1,
  limit: number = 50
): Promise<{ citizens: CitizenWithCategories[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;

  const [assignments, total] = await Promise.all([
    prisma.citizenCategoryAssignment.findMany({
      where: {
        categoryId,
        active: activeOnly ? true : undefined,
      },
      include: {
        citizen: {
          include: {
            categories: {
              where: { active: true },
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.citizenCategoryAssignment.count({
      where: {
        categoryId,
        active: activeOnly ? true : undefined,
      },
    }),
  ]);

  const citizens = assignments.map((a) => a.citizen);

  return {
    citizens,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Verifica se um cidadão possui uma categoria específica
 */
export async function citizenHasCategory(citizenId: string, categoryCode: string): Promise<boolean> {
  const category = await getCategoryByCode(categoryCode);
  if (!category) return false;

  const assignment = await prisma.citizenCategoryAssignment.findUnique({
    where: {
      citizenId_categoryId: {
        citizenId,
        categoryId: category.id,
      },
    },
  });

  return assignment !== null && assignment.active;
}

/**
 * Busca cidadãos por múltiplas categorias
 */
export async function getCitizensByMultipleCategories(
  categoryCodes: string[],
  matchAll: boolean = false // true = AND, false = OR
): Promise<CitizenWithCategories[]> {
  const categories = await prisma.citizenCategory.findMany({
    where: {
      code: { in: categoryCodes },
      active: true,
    },
  });

  const categoryIds = categories.map((c) => c.id);

  if (matchAll) {
    // Cidadãos que possuem TODAS as categorias (AND)
    const citizenIds = await prisma.$queryRaw<Array<{ citizenId: string }>>`
      SELECT "citizenId"
      FROM "citizen_category_assignments"
      WHERE "categoryId" IN (${categoryIds.join(',')})
        AND "active" = true
      GROUP BY "citizenId"
      HAVING COUNT(DISTINCT "categoryId") = ${categoryIds.length}
    `;

    return prisma.citizen.findMany({
      where: {
        id: { in: citizenIds.map((c) => c.citizenId) },
      },
      include: {
        categories: {
          where: { active: true },
          include: {
            category: true,
          },
        },
      },
    });
  } else {
    // Cidadãos que possuem PELO MENOS UMA categoria (OR)
    return prisma.citizen.findMany({
      where: {
        categories: {
          some: {
            categoryId: { in: categoryIds },
            active: true,
          },
        },
      },
      include: {
        categories: {
          where: { active: true },
          include: {
            category: true,
          },
        },
      },
    });
  }
}

/**
 * Estatísticas de categorias
 */
export async function getCategoryStats(): Promise<
  Array<{
    category: CitizenCategory;
    totalCitizens: number;
    activeCitizens: number;
    deactivatedCitizens: number;
  }>
> {
  const categories = await prisma.citizenCategory.findMany({
    where: { active: true },
  });

  const stats = await Promise.all(
    categories.map(async (category) => {
      const [totalActive, totalDeactivated] = await Promise.all([
        prisma.citizenCategoryAssignment.count({
          where: {
            categoryId: category.id,
            active: true,
          },
        }),
        prisma.citizenCategoryAssignment.count({
          where: {
            categoryId: category.id,
            active: false,
          },
        }),
      ]);

      return {
        category,
        totalCitizens: totalActive + totalDeactivated,
        activeCitizens: totalActive,
        deactivatedCitizens: totalDeactivated,
      };
    })
  );

  return stats.sort((a, b) => b.activeCitizens - a.activeCitizens);
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default {
  // Categorias
  listCategories,
  getCategoryByCode,
  getCategoryById,
  createCategory,
  updateCategory,
  getCategoriesByModuleType,

  // Atribuições
  assignCategoryToCitizen,
  autoAssignCategoriesByProtocol,
  deactivateCategoryFromCitizen,
  deleteCategoryAssignment,

  // Consultas
  getCitizenCategories,
  getCitizensByCategory,
  citizenHasCategory,
  getCitizensByMultipleCategories,
  getCategoryStats,

  // Funcionalidades expandidas (re-exportadas)
  ...expandedService,
  ...relationshipsService,
};
