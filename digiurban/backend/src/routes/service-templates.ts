/**
 * ============================================================================
 * SERVICE TEMPLATES API - Gerenciamento de Templates de Serviços
 * ============================================================================
 *
 * Endpoints para admins gerenciarem templates e ativarem serviços padrões.
 *
 * @author DigiUrban Team
 * @version 1.0
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

// =============================================================================
// GET /api/admin/templates - Listar todos os templates disponíveis
// =============================================================================
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Filtros
    const where: any = {
      isActive: true
        };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    // NOTA: Model serviceTemplate não existe no schema
    // Retornar lista vazia por enquanto
    const templates: any[] = [];
    const total = 0;

    // Para cada template, verificar se já foi ativado no tenant
    const templatesWithStatus = templates;

    return res.json({
      templates: templatesWithStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
        }
        });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =============================================================================
// GET /api/admin/templates/categories - Listar categorias de templates
// =============================================================================
router.get('/categories', async (req, res) => {
  try {
    // NOTA: Model serviceTemplate não existe no schema
    const result: any[] = [];

    return res.json({ categories: result });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =============================================================================
// GET /api/admin/templates/:id - Detalhes de um template específico
// =============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // NOTA: Model serviceTemplate não existe no schema
    return res.status(404).json({ error: 'Template não encontrado' });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =============================================================================
// POST /api/admin/templates/:id/activate - Ativar template (criar serviço)
// =============================================================================
router.post('/:id/activate', async (req, res) => {
  try {
    const { id: templateId } = req.params;
    const {
      departmentId,
      customizations = {},
      priority = 1
        } = req.body;

    // Validações
    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId é obrigatório' });
    }

    // NOTA: Model serviceTemplate não existe no schema
    return res.status(404).json({ error: 'Template não encontrado' });
  } catch (error) {
    console.error('Erro ao ativar template:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

// =============================================================================
// DELETE /api/admin/templates/:id/deactivate - Desativar serviço baseado em template
// =============================================================================
router.delete('/:id/deactivate', async (req, res) => {
  try {
    const { id: templateId } = req.params;

    // NOTA: Model serviceTemplate não existe no schema, campo templateId não existe
    return res.status(404).json({ error: 'Template não encontrado' });
  } catch (error) {
    console.error('Erro ao desativar template:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =============================================================================
// GET /api/admin/templates/stats/summary - Estatísticas de uso dos templates
// =============================================================================
router.get('/stats/summary', async (req, res) => {
  try {

    // NOTA: Model serviceTemplate não existe no schema, campo templateId não existe
    return res.json({
      summary: {
        totalTemplates: 0,
        activatedTemplates: 0,
        activationRate: '0%'
        },
      byCategory: [],
      mostActivated: []
        });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
