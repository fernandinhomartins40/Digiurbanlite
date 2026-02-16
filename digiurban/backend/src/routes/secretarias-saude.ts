import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/secretarias/saude/dashboard
 * Dashboard real da Secretaria de Saúde
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUnidades,
      unidadesAtivas,
      totalProfissionais,
      totalEquipes,
      atendimentosHoje,
      atendimentosMes,
      unidadesPorTipo,
      equipesPorTipo,
    ] = await Promise.all([
      prisma.unidadeSaude.count(),
      prisma.unidadeSaude.count({ where: { isActive: true } }),
      prisma.healthProfessionalData.count({ where: { status: 'ATIVO' } }),
      prisma.equipeSaude.count({ where: { ativo: true } }),
      prisma.filaAtendimento.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.filaAtendimento.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.unidadeSaude.groupBy({
        by: ['tipo'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      prisma.equipeSaude.groupBy({
        by: ['tipo'],
        where: { ativo: true },
        _count: { _all: true },
      }),
    ]);

    // Profissionais por categoria
    let profissionaisPorCategoria: any[] = [];
    try {
      profissionaisPorCategoria = await (prisma.healthProfessionalData.groupBy as any)({
        by: ['categoria'],
        where: { status: 'ATIVO' },
        _count: { _all: true },
      });
    } catch {
      // Se groupBy falhar, retornar vazio
    }

    // Microáreas
    let totalMicroareas = 0;
    try {
      totalMicroareas = await prisma.microarea.count({ where: { ativo: true } });
    } catch {
      // Tabela pode não existir
    }

    res.json({
      totalUnidades,
      unidadesAtivas,
      totalProfissionais,
      totalEquipes,
      totalMicroareas,
      atendimentosHoje,
      atendimentosMes,
      unidadesPorTipo: unidadesPorTipo.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = item._count._all;
        return acc;
      }, {}),
      equipesPorTipo: equipesPorTipo.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = item._count._all;
        return acc;
      }, {}),
      profissionaisPorCategoria: profissionaisPorCategoria.reduce((acc: Record<string, number>, item: any) => {
        acc[item.categoria] = item._count._all;
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error('Erro no dashboard de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/secretarias/saude/stats
 * Estatísticas resumidas da Secretaria de Saúde
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUnidades,
      totalProfissionais,
      atendimentosHoje,
      atendimentosMes,
    ] = await Promise.all([
      prisma.unidadeSaude.count({ where: { isActive: true } }),
      prisma.healthProfessionalData.count({ where: { status: 'ATIVO' } }),
      prisma.filaAtendimento.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.filaAtendimento.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    res.json({
      totalUnidades,
      totalProfissionais,
      atendimentosHoje,
      atendimentosMes,
    });
  } catch (error: any) {
    console.error('Erro nas stats de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/secretarias/saude/health-units/stats
 * Estatísticas das unidades de saúde
 */
router.get('/health-units/stats', async (req: Request, res: Response) => {
  try {
    const [total, ativas, porTipo] = await Promise.all([
      prisma.unidadeSaude.count(),
      prisma.unidadeSaude.count({ where: { isActive: true } }),
      prisma.unidadeSaude.groupBy({
        by: ['tipo'],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);

    // Unidades mapeadas ao organograma
    let mapeadas = 0;
    try {
      mapeadas = await prisma.unidadeSaude.count({
        where: { isActive: true, organizationalUnitId: { not: null } },
      });
    } catch {
      // Campo pode não existir em schema antigo
    }

    res.json({
      total,
      ativas,
      mapeadas,
      naoMapeadas: ativas - mapeadas,
      tipos: porTipo.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = item._count._all;
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error('Erro nas stats de unidades de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
