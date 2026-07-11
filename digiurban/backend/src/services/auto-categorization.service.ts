/**
 * ============================================================================
 * AUTO-CATEGORIZATION SERVICE - Sistema Simples e Funcional
 * ============================================================================
 *
 * Atribui categorias automaticamente baseado em triggerServices.
 *
 * ANTES: Sistema complexo com IA, background jobs, views SQL, confidence scores
 * DEPOIS: Busca direta por triggerServices array_contains moduleType
 *
 * ============================================================================
 */

// Fase E Multi-Tenant: client COMPARTILHADO (com a tenant extension) no lugar
// do PrismaClient cru — todas as operações deste serviço passam a ser
// escopadas pelo contexto ALS; o $queryRaw é coberto pelo RLS via
// withTenantTransaction.
import { prisma } from '../lib/prisma';
import { withTenantTransaction } from '../lib/tenant-context';

export interface AutoCategorizationResult {
  success: boolean;
  categoriesAssigned: number;
  categories: Array<{
    code: string;
    name: string;
    categoryId: string;
  }>;
  errors?: string[];
}

/**
 * Auto-atribui categorias ao cidadão baseado no moduleType do protocolo aprovado
 *
 * @param citizenId - ID do cidadão
 * @param protocolId - ID do protocolo aprovado
 * @param moduleType - Tipo do módulo (ex: CADASTRO_PRODUTOR)
 * @returns Resultado da categorização
 *
 * @example
 * ```ts
 * // Quando protocolo "Cadastro de Produtor Rural" é aprovado
 * await assignCategoriesOnProtocolApproval(
 *   'citizen123',
 *   'protocol456',
 *   'CADASTRO_PRODUTOR'
 * );
 * // → Atribui automaticamente categoria "PRODUTOR_RURAL"
 * ```
 */
export async function assignCategoriesOnProtocolApproval(
  citizenId: string,
  protocolId: string,
  moduleType: string | null
): Promise<AutoCategorizationResult> {
  const errors: string[] = [];
  const categoriesAssigned: Array<{ code: string; name: string; categoryId: string }> = [];

  try {
    // Validação básica
    if (!moduleType) {
      return {
        success: true,
        categoriesAssigned: 0,
        categories: [],
      };
    }

    console.log(`📋 Auto-categorização iniciada:`);
    console.log(`   Cidadão: ${citizenId}`);
    console.log(`   Protocolo: ${protocolId}`);
    console.log(`   ModuleType: ${moduleType}`);

    // Buscar categorias que têm esse moduleType em triggerServices
    // PostgreSQL: WHERE 'CADASTRO_PRODUTOR' = ANY(triggerServices)
    // Fase E: $queryRaw não passa pela extension — withTenantTransaction seta
    // o GUC app.tenant_id e o RLS filtra por tenant dentro da transação.
    const matchingCategories = await withTenantTransaction(prisma, async (tx) =>
      tx.$queryRaw<Array<{
        id: string;
        code: string;
        name: string;
        department: string;
      }>>`
        SELECT id, code, name, department
        FROM citizen_categories
        WHERE active = true
          AND ${moduleType} = ANY("triggerServices")
      `
    );

    console.log(`   ✓ Encontradas ${matchingCategories.length} categorias compatíveis`);

    if (matchingCategories.length === 0) {
      return {
        success: true,
        categoriesAssigned: 0,
        categories: [],
      };
    }

    // Atribuir cada categoria ao cidadão (se ainda não tiver)
    for (const category of matchingCategories) {
      try {
        console.log(`   → Atribuindo categoria: ${category.name} (${category.code})`);

        // Verificar se já existe atribuição ativa
        const existing = await prisma.citizenCategoryAssignment.findUnique({
          where: {
            citizenId_categoryId: {
              citizenId,
              categoryId: category.id,
            },
          },
        });

        if (existing) {
          if (existing.active) {
            console.log(`      ℹ️  Categoria já ativa - pulando`);
            continue;
          } else {
            // Reativar categoria desativada
            console.log(`      ♻️  Reativando categoria desativada`);
            await prisma.citizenCategoryAssignment.update({
              where: { id: existing.id },
              data: {
                active: true,
                deactivatedAt: null,
                deactivatedBy: null,
                deactivationReason: null,
                activationCount: { increment: 1 },
              },
            });

            // Registrar no histórico
            await prisma.citizenCategoryProtocolHistory.create({
              data: {
                assignmentId: existing.id,
                protocolId,
                citizenId,
                categoryId: category.id,
                eventType: 'REACTIVATED',
                eventDate: new Date(),
                metadata: {
                  moduleType,
                  source: 'AUTO_CATEGORIZATION',
                },
              },
            });

            categoriesAssigned.push({
              code: category.code,
              name: category.name,
              categoryId: category.id,
            });
            console.log(`      ✓ Categoria reativada com sucesso`);
          }
        } else {
          // Criar nova atribuição
          const assignment = await prisma.citizenCategoryAssignment.create({
            data: {
              citizenId,
              categoryId: category.id,
              protocolId,
              assignedAt: new Date(),
              assignedBy: null, // null = automático
              active: true,
              protocolCount: 1,
              lastProtocolDate: new Date(),
              metadata: {
                moduleType,
                department: category.department,
                source: 'AUTO_CATEGORIZATION',
                firstProtocolId: protocolId,
              },
            },
          });

          // Registrar no histórico
          await prisma.citizenCategoryProtocolHistory.create({
            data: {
              assignmentId: assignment.id,
              protocolId,
              citizenId,
              categoryId: category.id,
              eventType: 'ASSIGNED',
              eventDate: new Date(),
              metadata: {
                moduleType,
                source: 'AUTO_CATEGORIZATION',
              },
            },
          });

          categoriesAssigned.push({
            code: category.code,
            name: category.name,
            categoryId: category.id,
          });
          console.log(`      ✓ Categoria atribuída com sucesso`);
        }
      } catch (error: any) {
        const errorMsg = `Erro ao atribuir categoria ${category.code}: ${error.message}`;
        console.error(`      ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const result: AutoCategorizationResult = {
      success: errors.length === 0,
      categoriesAssigned: categoriesAssigned.length,
      categories: categoriesAssigned,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`\n✅ Auto-categorização concluída:`);
    console.log(`   Categorias atribuídas: ${categoriesAssigned.length}`);
    if (categoriesAssigned.length > 0) {
      categoriesAssigned.forEach((c) => {
        console.log(`   - ${c.name} (${c.code})`);
      });
    }
    if (errors.length > 0) {
      console.log(`   ⚠️  Erros: ${errors.length}`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Erro geral na auto-categorização:', error.message);
    return {
      success: false,
      categoriesAssigned: 0,
      categories: [],
      errors: [error.message],
    };
  }
}

/**
 * Atualiza contador de protocolos de uma categoria
 * Útil para manter estatísticas sem complexidade
 */
export async function incrementCategoryProtocolCount(
  citizenId: string,
  categoryCode: string
): Promise<void> {
  try {
    const assignment = await prisma.citizenCategoryAssignment.findFirst({
      where: {
        citizenId,
        category: { code: categoryCode },
        active: true,
      },
    });

    if (assignment) {
      await prisma.citizenCategoryAssignment.update({
        where: { id: assignment.id },
        data: {
          protocolCount: { increment: 1 },
          lastProtocolDate: new Date(),
        },
      });
    }
  } catch (error: any) {
    console.error(`Erro ao incrementar contador de protocolo: ${error.message}`);
  }
}

/**
 * Lista categorias ativas de um cidadão
 */
export async function getCitizenActiveCategories(citizenId: string) {
  return await prisma.citizenCategoryAssignment.findMany({
    where: {
      citizenId,
      active: true,
    },
    include: {
      category: {
        select: {
          code: true,
          name: true,
          description: true,
          department: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  });
}
