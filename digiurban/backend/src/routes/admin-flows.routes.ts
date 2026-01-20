/**
 * Rotas de Administração para Gerenciar Fluxos
 * Permite CRUD de FlowDefinitions
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Todas as rotas exigem autenticação de admin
router.use(authenticateToken);

/**
 * GET /api/admin/flows
 * Lista todos os fluxos
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isActive, municipioId } = req.query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (municipioId) {
      where.OR = [{ municipioId: municipioId as string }, { municipioId: null }];
    }

    const flows = await prisma.flowDefinition.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        isActive: true,
        isDefault: true,
        municipioId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    res.json({
      success: true,
      flows: flows.map((f) => ({
        ...f,
        executionCount: f._count.executions,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao listar fluxos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar fluxos',
    });
  }
});

/**
 * GET /api/admin/flows/:id
 * Obtém detalhes completos de um fluxo
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const flow = await prisma.flowDefinition.findUnique({
      where: { id },
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Fluxo não encontrado',
      });
    }

    res.json({
      success: true,
      flow,
    });
  } catch (error: any) {
    console.error('Erro ao buscar fluxo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar fluxo',
    });
  }
});

/**
 * POST /api/admin/flows
 * Cria novo fluxo
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, version, nodes, metadata, municipioId, isActive, isDefault } =
      req.body;

    if (!name || !nodes) {
      return res.status(400).json({
        success: false,
        error: 'Nome e nodes são obrigatórios',
      });
    }

    // Valida que o nome não existe
    const existing = await prisma.flowDefinition.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um fluxo com este nome',
      });
    }

    const flow = await prisma.flowDefinition.create({
      data: {
        name,
        description,
        version: version || '1.0.0',
        nodes,
        metadata: metadata || {},
        municipioId,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        createdBy: (req as any).userId,
      },
    });

    res.status(201).json({
      success: true,
      flow,
    });
  } catch (error: any) {
    console.error('Erro ao criar fluxo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar fluxo',
    });
  }
});

/**
 * PUT /api/admin/flows/:id
 * Atualiza fluxo existente
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, version, nodes, metadata, isActive, isDefault } = req.body;

    const flow = await prisma.flowDefinition.findUnique({
      where: { id },
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Fluxo não encontrado',
      });
    }

    const updateData: any = {};

    if (description !== undefined) updateData.description = description;
    if (version !== undefined) updateData.version = version;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updated = await prisma.flowDefinition.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      flow: updated,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar fluxo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar fluxo',
    });
  }
});

/**
 * DELETE /api/admin/flows/:id
 * Remove fluxo (só se não tiver execuções ativas)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const flow = await prisma.flowDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Fluxo não encontrado',
      });
    }

    // Verifica se tem execuções ativas
    const activeExecutions = await prisma.flowExecution.count({
      where: {
        flowId: id,
        status: 'ACTIVE',
      },
    });

    if (activeExecutions > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível remover fluxo com execuções ativas',
      });
    }

    await prisma.flowDefinition.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Fluxo removido com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao remover fluxo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover fluxo',
    });
  }
});

/**
 * POST /api/admin/flows/:id/duplicate
 * Duplica fluxo existente
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({
        success: false,
        error: 'Novo nome é obrigatório',
      });
    }

    const original = await prisma.flowDefinition.findUnique({
      where: { id },
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        error: 'Fluxo não encontrado',
      });
    }

    // Verifica se novo nome já existe
    const existing = await prisma.flowDefinition.findUnique({
      where: { name: newName },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um fluxo com este nome',
      });
    }

    const duplicate = await prisma.flowDefinition.create({
      data: {
        name: newName,
        description: `${original.description} (Cópia)`,
        version: '1.0.0',
        nodes: original.nodes as any,
        metadata: original.metadata as any,
        municipioId: original.municipioId,
        isActive: false, // Inicia inativo
        isDefault: false,
        createdBy: (req as any).userId,
      },
    });

    res.status(201).json({
      success: true,
      flow: duplicate,
    });
  } catch (error: any) {
    console.error('Erro ao duplicar fluxo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao duplicar fluxo',
    });
  }
});

/**
 * GET /api/admin/flows/:id/executions
 * Lista execuções de um fluxo
 */
router.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, limit = 50 } = req.query;

    const where: any = {
      flowId: id,
    };

    if (status) {
      where.status = status;
    }

    const executions = await prisma.flowExecution.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { startedAt: 'desc' },
      include: {
        citizen: {
          select: {
            name: true,
            cpf: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      executions,
    });
  } catch (error: any) {
    console.error('Erro ao listar execuções:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar execuções',
    });
  }
});

/**
 * GET /api/admin/flows/stats/overview
 * Estatísticas gerais dos fluxos
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const totalFlows = await prisma.flowDefinition.count();
    const activeFlows = await prisma.flowDefinition.count({
      where: { isActive: true },
    });

    const totalExecutions = await prisma.flowExecution.count();
    const activeExecutions = await prisma.flowExecution.count({
      where: { status: 'ACTIVE' },
    });
    const completedExecutions = await prisma.flowExecution.count({
      where: { status: 'COMPLETED' },
    });

    // Top 5 fluxos mais usados
    const topFlows = await prisma.flowExecution.groupBy({
      by: ['flowId'],
      _count: {
        flowId: true,
      },
      orderBy: {
        _count: {
          flowId: 'desc',
        },
      },
      take: 5,
    });

    const topFlowsWithNames = await Promise.all(
      topFlows.map(async (item) => {
        const flow = await prisma.flowDefinition.findUnique({
          where: { id: item.flowId },
          select: { name: true },
        });
        return {
          flowId: item.flowId,
          flowName: flow?.name,
          executionCount: item._count.flowId,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        flows: {
          total: totalFlows,
          active: activeFlows,
          inactive: totalFlows - activeFlows,
        },
        executions: {
          total: totalExecutions,
          active: activeExecutions,
          completed: completedExecutions,
        },
        topFlows: topFlowsWithNames,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas',
    });
  }
});

export default router;
