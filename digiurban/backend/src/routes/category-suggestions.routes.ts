/**
 * ============================================================================
 * ROTAS: CATEGORY SUGGESTIONS - Aprovação de Sugestões de Categorização
 * ============================================================================
 */

import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { prisma } from '../lib/prisma';
import * as dynamicMatcher from '../services/dynamic-category-matcher.service';
import { notifySuggestionApproved, notifyStatsUpdate } from './notifications.routes';

const router = Router();

// ============================================================================
// ROTAS DE CONSULTA
// ============================================================================

/**
 * GET /api/category-suggestions/pending
 * Lista todas sugestões pendentes
 */
router.get('/pending', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { departmentCode, serviceId, categoryId, minConfidence } = req.query;

    const where: any = {
      status: 'PENDING'
    };

    if (serviceId) where.serviceId = serviceId;
    if (categoryId) where.categoryId = categoryId;
    if (minConfidence) where.confidence = { gte: parseInt(minConfidence as string) };

    const suggestions = await prisma.citizenCategoryMatchSuggestion.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            moduleType: true,
            departmentCode: true,
            createdAt: true
          }
        },
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Filtrar por departamento se fornecido
    const filtered = departmentCode
      ? suggestions.filter(s => s.service.departmentCode === departmentCode)
      : suggestions;

    res.json({
      success: true,
      total: filtered.length,
      suggestions: filtered
    });
  } catch (error: any) {
    console.error('Erro ao buscar sugestões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões',
      error: error.message
    });
  }
});

/**
 * GET /api/category-suggestions/service/:serviceId
 * Busca sugestões de um serviço específico
 */
router.get('/service/:serviceId', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { serviceId } = req.params;

    const [service, suggestions, autoAssigned] = await Promise.all([
      prisma.serviceSimplified.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          name: true,
          moduleType: true,
          departmentCode: true
        }
      }),
      prisma.citizenCategoryMatchSuggestion.findMany({
        where: {
          serviceId,
          status: 'PENDING'
        },
        include: {
          category: true
        },
        orderBy: { confidence: 'desc' }
      }),
      prisma.serviceCategoryAssignment.findMany({
        where: {
          serviceId,
          active: true
        },
        include: {
          category: true
        }
      })
    ]);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }

    res.json({
      success: true,
      service,
      pending: suggestions,
      autoAssigned,
      stats: {
        pendingCount: suggestions.length,
        autoAssignedCount: autoAssigned.length,
        totalCategories: suggestions.length + autoAssigned.length
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar sugestões do serviço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões',
      error: error.message
    });
  }
});

/**
 * GET /api/category-suggestions/stats
 * Estatísticas gerais de sugestões
 */
router.get('/stats', adminAuthMiddleware, async (req: any, res) => {
  try {
    const [pending, approved, rejected, autoAssigned, byDepartment] = await Promise.all([
      prisma.citizenCategoryMatchSuggestion.count({
        where: { status: 'PENDING' }
      }),
      prisma.citizenCategoryMatchSuggestion.count({
        where: { status: 'APPROVED' }
      }),
      prisma.citizenCategoryMatchSuggestion.count({
        where: { status: 'REJECTED' }
      }),
      prisma.citizenCategoryMatchSuggestion.count({
        where: { status: 'AUTO_ASSIGNED' }
      }),
      // Estatísticas por departamento
      prisma.$queryRaw`
        SELECT
          s."departmentCode",
          COUNT(*) as total,
          SUM(CASE WHEN cms.status = 'PENDING' THEN 1 ELSE 0 END) as pending
        FROM citizen_category_match_suggestions cms
        JOIN services_simplified s ON s.id = cms."serviceId"
        GROUP BY s."departmentCode"
        ORDER BY total DESC
      `
    ]);

    res.json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        autoAssigned,
        total: pending + approved + rejected + autoAssigned,
        byDepartment
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

// ============================================================================
// ROTAS DE AÇÃO
// ============================================================================

/**
 * POST /api/category-suggestions/:id/approve
 * Aprova uma sugestão
 */
router.post('/:id/approve', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { notes } = req.body;

    const suggestion = await prisma.citizenCategoryMatchSuggestion.findUnique({
      where: { id },
      include: {
        service: true,
        category: true
      }
    });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Sugestão não encontrada'
      });
    }

    if (suggestion.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Sugestão já foi ${suggestion.status}`
      });
    }

    // 1. Criar ServiceCategoryAssignment
    const assignment = await prisma.serviceCategoryAssignment.create({
      data: {
        serviceId: suggestion.serviceId,
        categoryId: suggestion.categoryId,
        assignmentType: 'APPROVED_SUGGESTION',
        confidence: suggestion.confidence,
        assignedBy: adminId,
        metadata: {
          suggestionId: id,
          matchType: suggestion.matchType,
          matchDetails: suggestion.matchDetails,
          approvedAt: new Date().toISOString(),
          approvedBy: adminId
        }
      }
    });

    // 2. Atualizar sugestão
    const updated = await prisma.citizenCategoryMatchSuggestion.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes
      }
    });

    // 3. Atualizar dados de aprendizado
    await updateLearningData(suggestion.categoryId, 'APPROVED', suggestion.confidence);

    // 4. Notificar clientes SSE sobre aprovação
    notifySuggestionApproved({
      serviceId: suggestion.serviceId,
      serviceName: suggestion.service.name,
      categoryName: suggestion.category.name
    });

    // 5. Atualizar estatísticas em tempo real
    await notifyStatsUpdate();

    res.json({
      success: true,
      message: `Categoria "${suggestion.category.name}" vinculada ao serviço "${suggestion.service.name}"`,
      suggestion: updated,
      assignment
    });
  } catch (error: any) {
    console.error('Erro ao aprovar sugestão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar sugestão',
      error: error.message
    });
  }
});

/**
 * POST /api/category-suggestions/:id/reject
 * Rejeita uma sugestão
 */
router.post('/:id/reject', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;

    const suggestion = await prisma.citizenCategoryMatchSuggestion.findUnique({
      where: { id },
      include: {
        category: true,
        service: true
      }
    });

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Sugestão não encontrada'
      });
    }

    if (suggestion.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Sugestão já foi ${suggestion.status}`
      });
    }

    // Atualizar sugestão
    const updated = await prisma.citizenCategoryMatchSuggestion.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reason
      }
    });

    // Atualizar dados de aprendizado
    await updateLearningData(suggestion.categoryId, 'REJECTED', suggestion.confidence);

    res.json({
      success: true,
      message: 'Sugestão rejeitada',
      suggestion: updated
    });
  } catch (error: any) {
    console.error('Erro ao rejeitar sugestão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar sugestão',
      error: error.message
    });
  }
});

/**
 * POST /api/category-suggestions/approve-multiple
 * Aprova múltiplas sugestões de uma vez
 */
router.post('/approve-multiple', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { suggestionIds } = req.body;
    const adminId = req.user.id;

    if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs de sugestões inválidos'
      });
    }

    const results = {
      approved: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const id of suggestionIds) {
      try {
        const suggestion = await prisma.citizenCategoryMatchSuggestion.findUnique({
          where: { id }
        });

        if (!suggestion || suggestion.status !== 'PENDING') {
          results.failed++;
          results.errors.push(`Sugestão ${id} não pode ser aprovada`);
          continue;
        }

        // Criar assignment
        await prisma.serviceCategoryAssignment.create({
          data: {
            serviceId: suggestion.serviceId,
            categoryId: suggestion.categoryId,
            assignmentType: 'APPROVED_SUGGESTION',
            confidence: suggestion.confidence,
            assignedBy: adminId,
            metadata: {
              suggestionId: id,
              batchApproval: true
            }
          }
        });

        // Atualizar sugestão
        await prisma.citizenCategoryMatchSuggestion.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedBy: adminId,
            reviewedAt: new Date()
          }
        });

        await updateLearningData(suggestion.categoryId, 'APPROVED', suggestion.confidence);
        results.approved++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Erro ao aprovar ${id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `${results.approved} sugestão(ões) aprovada(s), ${results.failed} falha(s)`,
      results
    });
  } catch (error: any) {
    console.error('Erro ao aprovar múltiplas sugestões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar sugestões',
      error: error.message
    });
  }
});

/**
 * POST /api/category-suggestions/analyze-service/:serviceId
 * Re-analisa um serviço manualmente
 */
router.post('/analyze-service/:serviceId', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { serviceId } = req.params;

    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }

    // Executar análise
    const analysis = await dynamicMatcher.analyzeServiceForCategories(serviceId);
    const results = await dynamicMatcher.processMatchResults(
      serviceId,
      analysis.matches,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Análise concluída',
      analysis,
      results
    });
  } catch (error: any) {
    console.error('Erro ao analisar serviço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar serviço',
      error: error.message
    });
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Atualiza dados de aprendizado da categoria
 */
async function updateLearningData(
  categoryId: string,
  action: 'APPROVED' | 'REJECTED',
  confidence: number
) {
  try {
    const existing = await prisma.citizenCategoryLearningData.findUnique({
      where: { categoryId }
    });

    if (existing) {
      // Atualizar existente
      const newTotal = action === 'APPROVED'
        ? existing.totalManualAssignments + 1
        : existing.totalRejections + 1;

      const totalDecisions = existing.totalAutoAssignments +
        existing.totalManualAssignments +
        existing.totalRejections;

      const successfulDecisions = existing.totalAutoAssignments +
        existing.totalManualAssignments +
        (action === 'APPROVED' ? 1 : 0);

      const successRate = (successfulDecisions / totalDecisions) * 100;

      await prisma.citizenCategoryLearningData.update({
        where: { categoryId },
        data: {
          totalManualAssignments: action === 'APPROVED'
            ? existing.totalManualAssignments + 1
            : existing.totalManualAssignments,
          totalRejections: action === 'REJECTED'
            ? existing.totalRejections + 1
            : existing.totalRejections,
          successRate,
          lastUpdated: new Date()
        }
      });
    } else {
      // Criar novo
      await prisma.citizenCategoryLearningData.create({
        data: {
          categoryId,
          totalManualAssignments: action === 'APPROVED' ? 1 : 0,
          totalRejections: action === 'REJECTED' ? 1 : 0,
          successRate: action === 'APPROVED' ? 100 : 0
        }
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar learning data:', error);
  }
}

export default router;
