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

const isPlainObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const stampAdminManagedMetadata = (existing: unknown, incoming: unknown) => {
  const base = isPlainObject(existing) ? existing : {};
  const next = isPlainObject(incoming) ? incoming : {};

  return {
    ...base,
    ...next,
    managedBy: 'admin',
    managedByUpdatedAt: new Date().toISOString(),
  };
};

/**
 * GET /api/admin/flows/stats
 * Estatisticas resumidas
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalFlows,
      activeFlows,
      totalExecutions,
      activeExecutions,
      completedToday,
    ] = await Promise.all([
      prisma.flowDefinition.count(),
      prisma.flowDefinition.count({ where: { isActive: true } }),
      prisma.flowExecution.count(),
      prisma.flowExecution.count({ where: { status: 'ACTIVE' } }),
      prisma.flowExecution.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: todayStart },
        },
      }),
    ]);

    res.json({
      totalFlows,
      activeFlows,
      totalExecutions,
      activeExecutions,
      completedToday,
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatisticas de fluxos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatisticas de fluxos',
    });
  }
});

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
        nodes: true,
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

    // Valida que o nome não existe NO TENANT atual (unique composta
    // [tenantId, name] — onda 8; findFirst é escopado pela tenant-extension)
    const existing = await prisma.flowDefinition.findFirst({
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
        metadata: stampAdminManagedMetadata({}, metadata),
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
const updateFlowHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, version, nodes, metadata, isActive, isDefault } = req.body;

    const flow = await prisma.flowDefinition.findUnique({
      where: { id },
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Fluxo nao encontrado',
      });
    }

    const updateData: any = {};

    if (name !== undefined && name !== flow.name) {
      // unique composta [tenantId, name] — findFirst escopado (onda 8)
      const existing = await prisma.flowDefinition.findFirst({
        where: { name },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Ja existe um fluxo com este nome',
        });
      }

      updateData.name = name;
    }

    if (description !== undefined) updateData.description = description;
    if (version !== undefined) updateData.version = version;
    if (nodes !== undefined) updateData.nodes = nodes;

    // Sinalizar que este fluxo é gerenciado pelo painel (para não ser sobrescrito por seeds do filesystem).
    updateData.metadata = stampAdminManagedMetadata(flow.metadata, metadata);

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
};

router.put('/:id', updateFlowHandler);
router.patch('/:id', updateFlowHandler);

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
    const { newName, name } = req.body;
    const duplicateName = newName || name;

    if (!duplicateName) {
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
    // unique composta [tenantId, name] — findFirst escopado (onda 8)
    const existing = await prisma.flowDefinition.findFirst({
      where: { name: duplicateName },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um fluxo com este nome',
      });
    }

    const duplicate = await prisma.flowDefinition.create({
      data: {
        name: duplicateName,
        description: `${original.description} (Cópia)`,
        version: '1.0.0',
        nodes: original.nodes as any,
        metadata: stampAdminManagedMetadata(original.metadata, original.metadata),
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
/**
 * GET /api/admin/flows/:id/analytics
 * Analytics detalhado do fluxo
 */
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const flow = await prisma.flowDefinition.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nodes: true,
      },
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Fluxo nao encontrado',
      });
    }

    const executions = await prisma.flowExecution.findMany({
      where: { flowId: id },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
        history: true,
        currentNodeId: true,
      },
    });

    const totalExecutions = executions.length;
    const completedExecutions = executions.filter((e) => e.status === 'COMPLETED').length;
    const cancelledExecutions = executions.filter((e) => e.status === 'CANCELLED').length;
    const activeExecutions = executions.filter((e) => e.status === 'ACTIVE').length;

    const completionTimes = executions
      .filter((e) => e.status === 'COMPLETED' && e.completedAt)
      .map((e) => (new Date(e.completedAt as Date).getTime() - new Date(e.startedAt).getTime()) / 1000);

    const avgCompletionTime = completionTimes.length
      ? completionTimes.reduce((acc, value) => acc + value, 0) / completionTimes.length
      : 0;

    const now = new Date();
    const executionsByDay = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      return { date: key, count: 0 };
    });

    const dayIndex = new Map(executionsByDay.map((item, index) => [item.date, index]));

    executions.forEach((execution) => {
      const key = new Date(execution.startedAt).toISOString().slice(0, 10);
      const idx = dayIndex.get(key);
      if (idx !== undefined) {
        executionsByDay[idx].count += 1;
      }
    });

    const nodeMap = new Map<string, { visits: number; errors: number }>();
    const dropOffMap = new Map<string, number>();
    const exitMap = new Map<string, number>();

    const nodes = Array.isArray(flow.nodes) ? (flow.nodes as any[]) : [];
    const nodeNameMap = new Map(
      nodes.map((node) => {
        const labelSource = node?.config?.text || node?.config?.label || node?.config?.action;
        const label = typeof labelSource === 'string' && labelSource.trim().length > 0
          ? labelSource.split('\n')[0].slice(0, 60)
          : node.id;
        return [node.id, label];
      })
    );

    executions.forEach((execution) => {
      const history = Array.isArray(execution.history)
        ? (execution.history.filter((item): item is string => typeof item === 'string'))
        : [];

      history.forEach((nodeId) => {
        const stats = nodeMap.get(nodeId) || { visits: 0, errors: 0 };
        stats.visits += 1;
        nodeMap.set(nodeId, stats);
      });

      if (execution.status === 'ERROR' && execution.currentNodeId) {
        const stats = nodeMap.get(execution.currentNodeId) || { visits: 0, errors: 0 };
        stats.errors += 1;
        nodeMap.set(execution.currentNodeId, stats);
      }

      const lastNode = history.length > 0 ? history[history.length - 1] : execution.currentNodeId;
      if (lastNode && typeof lastNode === 'string') {
        const exitCount = exitMap.get(lastNode) || 0;
        exitMap.set(lastNode, exitCount + 1);
      }

      if (execution.status !== 'COMPLETED') {
        const dropNode = typeof lastNode === 'string' ? lastNode : execution.currentNodeId;
        if (dropNode) {
          const dropCount = dropOffMap.get(dropNode) || 0;
          dropOffMap.set(dropNode, dropCount + 1);
        }
      }
    });

    const nodeStatistics = nodes.map((node) => {
      const stats = nodeMap.get(node.id) || { visits: 0, errors: 0 };
      const errorRate = stats.visits > 0 ? (stats.errors / stats.visits) * 100 : 0;

      return {
        nodeId: node.id,
        nodeName: nodeNameMap.get(node.id) || node.id,
        visits: stats.visits,
        errors: stats.errors,
        avgTimeSpent: 0,
        errorRate,
      };
    });

    const dropOffPoints = Array.from(dropOffMap.entries())
      .map(([nodeId, count]) => ({
        nodeId,
        nodeName: nodeNameMap.get(nodeId) || nodeId,
        dropOffRate: totalExecutions ? (count / totalExecutions) * 100 : 0,
      }))
      .sort((a, b) => b.dropOffRate - a.dropOffRate)
      .slice(0, 10);

    let mostCommonExitPoint = '';
    if (exitMap.size > 0) {
      const sorted = Array.from(exitMap.entries()).sort((a, b) => b[1] - a[1]);
      mostCommonExitPoint = nodeNameMap.get(sorted[0][0]) || sorted[0][0];
    }

    res.json({
      flowId: flow.id,
      flowName: flow.name,
      totalExecutions,
      completedExecutions,
      cancelledExecutions,
      activeExecutions,
      completionRate: totalExecutions ? (completedExecutions / totalExecutions) * 100 : 0,
      avgCompletionTime,
      mostCommonExitPoint,
      executionsByDay,
      nodeStatistics,
      dropOffPoints,
    });
  } catch (error: any) {
    console.error('Erro ao buscar analytics do fluxo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar analytics do fluxo',
    });
  }
});
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


