// ============================================================================
// CITIZEN-CATEGORY-RELATIONSHIPS.SERVICE.TS
// ============================================================================
// Sistema de relacionamentos entre categorias
// - Hierarquia (pai/filho)
// - Pré-requisitos
// - Complementares
// - Conflitantes
// - Upgrades/Progressão
// ============================================================================

import { prisma } from '../lib/prisma';

// ============================================================================
// TIPOS
// ============================================================================

export type RelationshipType = 'PARENT' | 'CHILD' | 'PREREQUISITE' | 'COMPLEMENTARY' | 'CONFLICTING' | 'UPGRADE';

export interface CreateRelationshipParams {
  sourceCategoryCode: string;
  targetCategoryCode: string;
  relationshipType: RelationshipType;
  isRequired?: boolean;
  autoAssign?: boolean;
  weight?: number;
  metadata?: any;
}

export interface ValidationResult {
  isValid: boolean;
  violations: Array<{
    type: string;
    message: string;
    categoryCode: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    categoryCode?: string;
  }>;
}

// ============================================================================
// CRIAÇÃO E GERENCIAMENTO DE RELACIONAMENTOS
// ============================================================================

/**
 * Cria um relacionamento entre duas categorias
 */
export async function createRelationship(params: CreateRelationshipParams) {
  const {
    sourceCategoryCode,
    targetCategoryCode,
    relationshipType,
    isRequired = false,
    autoAssign = false,
    weight = 1,
    metadata,
  } = params;

  // Buscar categorias
  const sourceCategory = await prisma.citizenCategory.findUnique({
    where: { code: sourceCategoryCode },
  });

  const targetCategory = await prisma.citizenCategory.findUnique({
    where: { code: targetCategoryCode },
  });

  if (!sourceCategory || !targetCategory) {
    throw new Error('Uma ou ambas as categorias não foram encontradas');
  }

  // Verificar se relacionamento já existe
  const existing = await prisma.citizenCategoryRelationship.findFirst({
    where: {
      sourceCategoryId: sourceCategory.id,
      targetCategoryId: targetCategory.id,
      relationshipType,
    },
  });

  if (existing) {
    // Atualizar existente
    return prisma.citizenCategoryRelationship.update({
      where: { id: existing.id },
      data: {
        isRequired,
        autoAssign,
        weight,
        metadata,
      },
    });
  }

  // Criar novo
  return prisma.citizenCategoryRelationship.create({
    data: {
      sourceCategoryId: sourceCategory.id,
      targetCategoryId: targetCategory.id,
      relationshipType,
      isRequired,
      autoAssign,
      weight,
      metadata,
    },
  });
}

/**
 * Lista todos os relacionamentos de uma categoria
 */
export async function getCategoryRelationships(categoryCode: string) {
  const category = await prisma.citizenCategory.findUnique({
    where: { code: categoryCode },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const [asSource, asTarget] = await Promise.all([
    prisma.citizenCategoryRelationship.findMany({
      where: {
        sourceCategoryId: category.id,
        active: true,
      },
      include: {
        targetCategory: true,
      },
    }),
    prisma.citizenCategoryRelationship.findMany({
      where: {
        targetCategoryId: category.id,
        active: true,
      },
      include: {
        sourceCategory: true,
      },
    }),
  ]);

  return {
    outgoing: asSource.map((r) => ({
      relationshipId: r.id,
      type: r.relationshipType,
      targetCategory: {
        code: r.targetCategory.code,
        name: r.targetCategory.name,
      },
      isRequired: r.isRequired,
      autoAssign: r.autoAssign,
    })),
    incoming: asTarget.map((r) => ({
      relationshipId: r.id,
      type: r.relationshipType,
      sourceCategory: {
        code: r.sourceCategory.code,
        name: r.sourceCategory.name,
      },
      isRequired: r.isRequired,
      autoAssign: r.autoAssign,
    })),
  };
}

// ============================================================================
// VALIDAÇÃO DE RELACIONAMENTOS
// ============================================================================

/**
 * Valida se um cidadão pode receber uma categoria baseado em relacionamentos
 */
export async function validateCategoryAssignment(citizenId: string, categoryCode: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    violations: [],
    warnings: [],
  };

  const category = await prisma.citizenCategory.findUnique({
    where: { code: categoryCode },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  // Buscar categorias atuais do cidadão
  const currentAssignments = await prisma.citizenCategoryAssignment.findMany({
    where: {
      citizenId,
      active: true,
    },
    include: {
      category: true,
    },
  });

  const currentCategoryCodes = currentAssignments.map((a) => a.category.code);

  // 1. VERIFICAR PRÉ-REQUISITOS
  const prerequisites = await prisma.citizenCategoryRelationship.findMany({
    where: {
      targetCategoryId: category.id,
      relationshipType: 'PREREQUISITE',
      active: true,
    },
    include: {
      sourceCategory: true,
    },
  });

  for (const prereq of prerequisites) {
    if (!currentCategoryCodes.includes(prereq.sourceCategory.code)) {
      if (prereq.isRequired) {
        result.isValid = false;
        result.violations.push({
          type: 'PREREQUISITE_MISSING',
          message: `Pré-requisito obrigatório: ${prereq.sourceCategory.name}`,
          categoryCode: prereq.sourceCategory.code,
        });
      } else {
        result.warnings.push({
          type: 'PREREQUISITE_RECOMMENDED',
          message: `Recomendado ter: ${prereq.sourceCategory.name}`,
          categoryCode: prereq.sourceCategory.code,
        });
      }
    }
  }

  // 2. VERIFICAR CONFLITOS
  const conflicts = await prisma.citizenCategoryRelationship.findMany({
    where: {
      sourceCategoryId: category.id,
      relationshipType: 'CONFLICTING',
      active: true,
    },
    include: {
      targetCategory: true,
    },
  });

  for (const conflict of conflicts) {
    if (currentCategoryCodes.includes(conflict.targetCategory.code)) {
      result.isValid = false;
      result.violations.push({
        type: 'CONFLICTING_CATEGORY',
        message: `Conflita com: ${conflict.targetCategory.name}`,
        categoryCode: conflict.targetCategory.code,
      });
    }
  }

  // 3. VERIFICAR PRÉ-REQUISITOS DA PRÓPRIA CATEGORIA (campo prerequisiteCategories)
  if (category.prerequisiteCategories && category.prerequisiteCategories.length > 0) {
    for (const prereqCode of category.prerequisiteCategories) {
      if (!currentCategoryCodes.includes(prereqCode)) {
        result.isValid = false;
        result.violations.push({
          type: 'PREREQUISITE_MISSING',
          message: `Pré-requisito necessário: ${prereqCode}`,
          categoryCode: prereqCode,
        });
      }
    }
  }

  // 4. VERIFICAR CONFLITOS DA PRÓPRIA CATEGORIA (campo conflictingCategories)
  if (category.conflictingCategories && category.conflictingCategories.length > 0) {
    for (const conflictCode of category.conflictingCategories) {
      if (currentCategoryCodes.includes(conflictCode)) {
        result.isValid = false;
        result.violations.push({
          type: 'CONFLICTING_CATEGORY',
          message: `Conflita com categoria existente: ${conflictCode}`,
          categoryCode: conflictCode,
        });
      }
    }
  }

  return result;
}

/**
 * Verifica se cidadão atende aos requisitos mínimos da categoria
 */
export async function checkCategoryRequirements(citizenId: string, categoryCode: string) {
  const category = await prisma.citizenCategory.findUnique({
    where: { code: categoryCode },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const validation = await validateCategoryAssignment(citizenId, categoryCode);

  return {
    meetsRequirements: validation.isValid,
    violations: validation.violations,
    warnings: validation.warnings,
    category: {
      code: category.code,
      name: category.name,
      requiresApproval: category.requiresApproval,
    },
  };
}

// ============================================================================
// PROCESSAMENTO AUTOMÁTICO DE RELACIONAMENTOS
// ============================================================================

/**
 * Processa relacionamentos automáticos ao atribuir uma categoria
 */
export async function processAutoRelationships(citizenId: string, categoryCode: string, assignedBy?: string) {
  const category = await prisma.citizenCategory.findUnique({
    where: { code: categoryCode },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const results = [];

  // 1. BUSCAR CATEGORIAS COMPLEMENTARES COM AUTO-ASSIGN
  const complementaryRelationships = await prisma.citizenCategoryRelationship.findMany({
    where: {
      sourceCategoryId: category.id,
      relationshipType: 'COMPLEMENTARY',
      autoAssign: true,
      active: true,
    },
    include: {
      targetCategory: true,
    },
  });

  for (const rel of complementaryRelationships) {
    // Verificar se cidadão já possui
    const existing = await prisma.citizenCategoryAssignment.findUnique({
      where: {
        citizenId_categoryId: {
          citizenId,
          categoryId: rel.targetCategory.id,
        },
      },
    });

    if (!existing) {
      // Validar se pode atribuir
      const validation = await validateCategoryAssignment(citizenId, rel.targetCategory.code);

      if (validation.isValid) {
        // Atribuir automaticamente
        const assignment = await prisma.citizenCategoryAssignment.create({
          data: {
            citizenId,
            categoryId: rel.targetCategory.id,
            assignedBy,
            metadata: {
              autoAssigned: true,
              triggeredBy: categoryCode,
              relationshipType: 'COMPLEMENTARY',
            },
          },
        });

        results.push({
          categoryCode: rel.targetCategory.code,
          action: 'AUTO_ASSIGNED',
          success: true,
          assignmentId: assignment.id,
        });
      } else {
        results.push({
          categoryCode: rel.targetCategory.code,
          action: 'AUTO_ASSIGN_FAILED',
          success: false,
          reason: validation.violations.map((v) => v.message).join('; '),
        });
      }
    }
  }

  // 2. PROCESSAR CATEGORIAS COMPLEMENTARES DO CAMPO
  if (category.complementaryCategories && category.complementaryCategories.length > 0) {
    for (const complementaryCode of category.complementaryCategories) {
      const complementaryCategory = await prisma.citizenCategory.findUnique({
        where: { code: complementaryCode },
      });

      if (!complementaryCategory) continue;

      // Verificar se cidadão já possui
      const existing = await prisma.citizenCategoryAssignment.findUnique({
        where: {
          citizenId_categoryId: {
            citizenId,
            categoryId: complementaryCategory.id,
          },
        },
      });

      if (!existing) {
        results.push({
          categoryCode: complementaryCode,
          action: 'SUGGESTED',
          success: true,
          message: `Categoria complementar disponível: ${complementaryCategory.name}`,
        });
      }
    }
  }

  return results;
}

/**
 * Sugere categorias baseadas no perfil do cidadão
 */
export async function suggestCategories(citizenId: string) {
  // Buscar categorias atuais
  const currentAssignments = await prisma.citizenCategoryAssignment.findMany({
    where: {
      citizenId,
      active: true,
    },
    include: {
      category: true,
    },
  });

  const suggestions = [];

  for (const assignment of currentAssignments) {
    // Buscar categorias de upgrade/progressão
    if (assignment.category.nextLevelCategory) {
      const nextCategory = await prisma.citizenCategory.findFirst({
        where: { code: assignment.category.nextLevelCategory },
      });

      if (nextCategory) {
        // Verificar se pode progredir
        const validation = await validateCategoryAssignment(citizenId, nextCategory.code);

        suggestions.push({
          type: 'UPGRADE',
          category: {
            code: nextCategory.code,
            name: nextCategory.name,
            description: nextCategory.description,
          },
          fromCategory: assignment.category.code,
          canAssign: validation.isValid,
          blockers: validation.violations,
        });
      }
    }

    // Buscar categorias complementares
    const complementary = await prisma.citizenCategoryRelationship.findMany({
      where: {
        sourceCategoryId: assignment.categoryId,
        relationshipType: 'COMPLEMENTARY',
        active: true,
      },
      include: {
        targetCategory: true,
      },
    });

    for (const rel of complementary) {
      // Verificar se já possui
      const hasCategory = currentAssignments.some((a) => a.categoryId === rel.targetCategory.id);

      if (!hasCategory) {
        const validation = await validateCategoryAssignment(citizenId, rel.targetCategory.code);

        suggestions.push({
          type: 'COMPLEMENTARY',
          category: {
            code: rel.targetCategory.code,
            name: rel.targetCategory.name,
            description: rel.targetCategory.description,
          },
          relatedTo: assignment.category.code,
          canAssign: validation.isValid,
          blockers: validation.violations,
        });
      }
    }
  }

  return suggestions;
}

// ============================================================================
// EXPORTAR
// ============================================================================

export default {
  createRelationship,
  getCategoryRelationships,
  validateCategoryAssignment,
  checkCategoryRequirements,
  processAutoRelationships,
  suggestCategories,
};
