/**
 * ============================================================================
 * CITIZEN CATEGORIES ROUTES
 * ============================================================================
 * Rotas para gerenciamento de categorias de cidadãos
 */

import { Router } from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole } from '@prisma/client';
import * as categoryService from '../services/citizen-category.service';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(adminAuthMiddleware);

// ============================================================================
// ROTAS DE CATEGORIAS
// ============================================================================

/**
 * GET /api/admin/categories
 * Lista todas as categorias disponíveis
 */
router.get('/', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const categories = await categoryService.listCategories(activeOnly !== 'false');

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error listing categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar categorias',
    });
  }
});

/**
 * GET /api/admin/categories/stats
 * Estatísticas de todas as categorias
 */
router.get('/stats', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const stats = await categoryService.getCategoryStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas',
    });
  }
});

/**
 * GET /api/admin/categories/:id
 * Busca categoria por ID
 */
router.get('/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar categoria',
    });
  }
});

/**
 * GET /api/admin/categories/:id/citizens
 * Lista cidadãos de uma categoria
 */
router.get('/:id/citizens', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const { activeOnly, page, limit } = req.query;

    const result = await categoryService.getCitizensByCategory(
      id,
      activeOnly !== 'false',
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching citizens by category:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar cidadãos',
    });
  }
});

/**
 * POST /api/admin/categories
 * Cria nova categoria (apenas ADMIN)
 */
router.post('/', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const categoryData = req.body;

    // Validação básica
    if (!categoryData.code || !categoryData.name || !categoryData.department) {
      return res.status(400).json({
        success: false,
        error: 'code, name e department são obrigatórios',
      });
    }

    const category = await categoryService.createCategory(categoryData);

    return res.status(201).json({
      success: true,
      data: category,
      message: 'Categoria criada com sucesso',
    });
  } catch (error: any) {
    console.error('Error creating category:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma categoria com este código',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro ao criar categoria',
    });
  }
});

/**
 * PATCH /api/admin/categories/:id
 * Atualiza categoria existente (apenas ADMIN)
 */
router.patch('/:id', requireMinRole(UserRole.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await categoryService.updateCategory(id, updateData);

    return res.json({
      success: true,
      data: category,
      message: 'Categoria atualizada com sucesso',
    });
  } catch (error: any) {
    console.error('Error updating category:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar categoria',
    });
  }
});

// ============================================================================
// ROTAS DE ATRIBUIÇÃO DE CATEGORIAS
// ============================================================================

/**
 * GET /api/admin/citizens/:citizenId/categories
 * Lista categorias de um cidadão
 */
router.get('/citizens/:citizenId/all', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { activeOnly } = req.query;

    const categories = await categoryService.getCitizenCategories(
      citizenId,
      activeOnly !== 'false'
    );

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching citizen categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar categorias do cidadão',
    });
  }
});

/**
 * POST /api/admin/citizens/:citizenId/categories
 * Atribui categoria a um cidadão
 */
router.post('/citizens/:citizenId/assign', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { citizenId } = req.params;
    const { categoryId, metadata } = req.body;
    const userId = (req as any).user?.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'categoryId é obrigatório',
      });
    }

    const result = await categoryService.assignCategoryToCitizen({
      citizenId,
      categoryId,
      assignedBy: userId,
      metadata,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(result.isNew ? 201 : 200).json(result);
  } catch (error) {
    console.error('Error assigning category:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atribuir categoria',
    });
  }
});

/**
 * DELETE /api/admin/citizens/:citizenId/categories/:categoryId
 * Remove (desativa) categoria de um cidadão
 */
router.delete('/citizens/:citizenId/:categoryId', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { citizenId, categoryId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    const result = await categoryService.deactivateCategoryFromCitizen({
      citizenId,
      categoryId,
      deactivatedBy: userId,
      deactivationReason: reason,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Error deactivating category:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao remover categoria',
    });
  }
});

/**
 * POST /api/admin/categories/search
 * Busca cidadãos por múltiplas categorias
 */
router.post('/search', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { categoryCodes, matchAll } = req.body;

    if (!categoryCodes || !Array.isArray(categoryCodes)) {
      return res.status(400).json({
        success: false,
        error: 'categoryCodes (array) é obrigatório',
      });
    }

    const citizens = await categoryService.getCitizensByMultipleCategories(
      categoryCodes,
      matchAll === true
    );

    return res.json({
      success: true,
      data: citizens,
    });
  } catch (error) {
    console.error('Error searching citizens by categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar cidadãos',
    });
  }
});

export default router;
