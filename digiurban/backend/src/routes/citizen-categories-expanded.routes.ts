/**
 * ============================================================================
 * ROTAS: CITIZEN CATEGORIES EXPANDED
 * ============================================================================
 * Rotas para gerenciar o sistema expandido de categorização
 * ============================================================================
 */

import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import * as categoryService from '../services/citizen-category.service';
import * as expandedService from '../services/citizen-category-expanded.service';
import * as relationshipsService from '../services/citizen-category-relationships.service';

const router = Router();

// ============================================================================
// ROTAS PÚBLICAS/CIDADÃO
// ============================================================================

/**
 * GET /api/citizen-categories-expanded/my-categories
 * Busca categorias do cidadão autenticado com informações expandidas
 */
router.get('/my-categories', citizenAuthMiddleware, async (req: any, res) => {
  try {
    const citizenId = req.citizen.id;

    const assignments = await categoryService.getCitizenCategories(citizenId, true);

    // Enriquecer com informações expandidas
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const [history, auditLog, progression] = await Promise.all([
          expandedService.getProtocolHistory(assignment.id),
          expandedService.getAuditLog(assignment.id),
          expandedService.checkProgression(assignment.id),
        ]);

        return {
          ...assignment,
          protocolHistory: history.slice(0, 5), // Últimos 5
          auditLog: auditLog.slice(0, 5), // Últimos 5
          canProgress: progression.canProgress,
          nextCategory: progression.nextCategory,
          progressionBlockers: progression.blockers || [],
        };
      })
    );

    res.json({
      success: true,
      categories: enriched,
    });
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias',
      error: error.message,
    });
  }
});

/**
 * GET /api/citizen-categories-expanded/suggestions
 * Sugere categorias baseadas no perfil do cidadão
 */
router.get('/suggestions', citizenAuthMiddleware, async (req: any, res) => {
  try {
    const citizenId = req.citizen.id;

    const suggestions = await relationshipsService.suggestCategories(citizenId);

    res.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Erro ao buscar sugestões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões',
      error: error.message,
    });
  }
});

/**
 * GET /api/citizen-categories-expanded/category/:categoryId/history
 * Histórico completo de protocolos de uma categoria
 */
router.get('/category/:assignmentId/history', citizenAuthMiddleware, async (req: any, res) => {
  try {
    const { assignmentId } = req.params;
    const citizenId = req.citizen.id;

    // Verificar se assignment pertence ao cidadão
    const assignment = await categoryService.prisma.citizenCategoryAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.citizenId !== citizenId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado',
      });
    }

    const history = await expandedService.getProtocolHistory(assignmentId);

    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message,
    });
  }
});

/**
 * POST /api/citizen-categories-expanded/category/:assignmentId/renew
 * Solicita renovação de uma categoria
 */
router.post('/category/:assignmentId/renew', citizenAuthMiddleware, async (req: any, res) => {
  try {
    const { assignmentId } = req.params;
    const citizenId = req.citizen.id;

    // Verificar se assignment pertence ao cidadão
    const assignment = await categoryService.prisma.citizenCategoryAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.citizenId !== citizenId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado',
      });
    }

    const renewed = await expandedService.renewCategory(assignmentId, citizenId);

    res.json({
      success: true,
      message: 'Categoria renovada com sucesso',
      category: renewed,
    });
  } catch (error: any) {
    console.error('Erro ao renovar categoria:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao renovar categoria',
    });
  }
});

// ============================================================================
// ROTAS ADMINISTRATIVAS
// ============================================================================

/**
 * GET /api/citizen-categories-expanded/admin/expiring
 * Lista categorias que estão expirando
 */
router.get('/admin/expiring', adminAuthMiddleware, async (req: any, res) => {
  try {
    const daysAhead = parseInt(req.query.days as string) || 30;

    const expiring = await expandedService.getCategoriesNeedingRenewal(daysAhead);

    res.json({
      success: true,
      total: expiring.length,
      categories: expiring,
    });
  } catch (error: any) {
    console.error('Erro ao buscar categorias expirando:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias expirando',
      error: error.message,
    });
  }
});

/**
 * POST /api/citizen-categories-expanded/admin/check-expired
 * Executa verificação manual de categorias expiradas
 */
router.post('/admin/check-expired', adminAuthMiddleware, async (req: any, res) => {
  try {
    const result = await expandedService.checkAndMarkExpiredCategories();

    res.json({
      success: true,
      message: `${result.total} categoria(s) expirada(s) processada(s)`,
      ...result,
    });
  } catch (error: any) {
    console.error('Erro ao verificar categorias expiradas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar categorias expiradas',
      error: error.message,
    });
  }
});

/**
 * POST /api/citizen-categories-expanded/admin/category/:assignmentId/award-badge
 * Atribui badge manualmente a um cidadão
 */
router.post('/admin/category/:assignmentId/award-badge', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { assignmentId } = req.params;
    const { badgeCode, reason } = req.body;

    if (!badgeCode) {
      return res.status(400).json({
        success: false,
        message: 'badgeCode é obrigatório',
      });
    }

    const result = await expandedService.awardBadge(assignmentId, badgeCode, reason);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Erro ao atribuir badge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atribuir badge',
    });
  }
});

/**
 * POST /api/citizen-categories-expanded/admin/category/:assignmentId/apply-progression
 * Aplica progressão manualmente
 */
router.post('/admin/category/:assignmentId/apply-progression', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { assignmentId } = req.params;
    const performedBy = req.user.id;

    const result = await expandedService.applyProgression(assignmentId, performedBy);

    res.json({
      success: true,
      message: 'Progressão aplicada com sucesso',
      ...result,
    });
  } catch (error: any) {
    console.error('Erro ao aplicar progressão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao aplicar progressão',
    });
  }
});

/**
 * GET /api/citizen-categories-expanded/admin/citizen/:citizenId/full-profile
 * Perfil completo do cidadão com todas as categorias e estatísticas
 */
router.get('/admin/citizen/:citizenId/full-profile', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { citizenId } = req.params;

    const [citizen, assignments, suggestions] = await Promise.all([
      categoryService.prisma.citizen.findUnique({
        where: { id: citizenId },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          createdAt: true,
        },
      }),
      categoryService.getCitizenCategories(citizenId, false), // Incluir inativas
      relationshipsService.suggestCategories(citizenId),
    ]);

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'Cidadão não encontrado',
      });
    }

    // Enriquecer assignments
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const [history, auditLog, progression] = await Promise.all([
          expandedService.getProtocolHistory(assignment.id),
          expandedService.getAuditLog(assignment.id),
          expandedService.checkProgression(assignment.id),
        ]);

        return {
          ...assignment,
          protocolHistory: history,
          auditLog,
          canProgress: progression.canProgress,
          nextCategory: progression.nextCategory,
          progressionBlockers: progression.blockers || [],
        };
      })
    );

    res.json({
      success: true,
      citizen,
      categories: enrichedAssignments,
      suggestions,
      statistics: {
        totalCategories: assignments.length,
        activeCategories: assignments.filter((a) => a.active).length,
        expiredCategories: assignments.filter((a) => a.isExpired).length,
        totalProtocols: assignments.reduce((sum, a) => sum + a.protocolCount, 0),
        totalExperiencePoints: assignments.reduce((sum, a) => sum + a.experiencePoints, 0),
        totalBadges: assignments.reduce((sum, a) => sum + ((a.badges as any[]) || []).length, 0),
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar perfil completo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil completo',
      error: error.message,
    });
  }
});

/**
 * POST /api/citizen-categories-expanded/admin/relationships
 * Cria relacionamento entre categorias
 */
router.post('/admin/relationships', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { sourceCategoryCode, targetCategoryCode, relationshipType, isRequired, autoAssign, weight, metadata } =
      req.body;

    if (!sourceCategoryCode || !targetCategoryCode || !relationshipType) {
      return res.status(400).json({
        success: false,
        message: 'sourceCategoryCode, targetCategoryCode e relationshipType são obrigatórios',
      });
    }

    const relationship = await relationshipsService.createRelationship({
      sourceCategoryCode,
      targetCategoryCode,
      relationshipType,
      isRequired,
      autoAssign,
      weight,
      metadata,
    });

    res.json({
      success: true,
      message: 'Relacionamento criado com sucesso',
      relationship,
    });
  } catch (error: any) {
    console.error('Erro ao criar relacionamento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar relacionamento',
    });
  }
});

/**
 * GET /api/citizen-categories-expanded/admin/category/:categoryCode/relationships
 * Lista relacionamentos de uma categoria
 */
router.get('/admin/category/:categoryCode/relationships', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { categoryCode } = req.params;

    const relationships = await relationshipsService.getCategoryRelationships(categoryCode);

    res.json({
      success: true,
      relationships,
    });
  } catch (error: any) {
    console.error('Erro ao buscar relacionamentos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar relacionamentos',
    });
  }
});

export default router;
