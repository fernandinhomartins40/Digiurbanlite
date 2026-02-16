import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  let totalUnidades = 0;
  let totalTurmas = 0;
  let totalMatriculas = 0;
  let totalProfessores = 0;
  let unidadesPorTipo: any[] = [];
  let mapeadas = 0;

  try {
    totalUnidades = await (prisma as any).unidadeEducacao.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    totalTurmas = await (prisma as any).turma.count({
      where: { ativa: true },
    });
  } catch {}

  try {
    totalMatriculas = await (prisma as any).matricula.count({
      where: { status: 'ATIVA' },
    });
  } catch {}

  try {
    totalProfessores = await (prisma as any).educationProfessionalData.count();
  } catch {}

  try {
    unidadesPorTipo = await (prisma as any).unidadeEducacao.groupBy({
      by: ['tipo'],
      where: { isActive: true },
      _count: { tipo: true },
    });
  } catch {}

  try {
    mapeadas = await (prisma as any).unidadeEducacao.count({
      where: {
        isActive: true,
        organizationalUnitId: { not: null },
      },
    });
  } catch {}

  const naoMapeadas = totalUnidades - mapeadas;

  return res.json({
    totalUnidades,
    totalTurmas,
    totalMatriculas,
    totalProfessores,
    unidadesPorTipo,
    mapeadas,
    naoMapeadas,
  });
});

// GET /stats
router.get('/stats', async (req: Request, res: Response) => {
  let totalUnidades = 0;
  let totalProfessores = 0;
  let totalMatriculas = 0;
  let totalTurmas = 0;

  try {
    totalUnidades = await (prisma as any).unidadeEducacao.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    totalProfessores = await (prisma as any).educationProfessionalData.count();
  } catch {}

  try {
    totalMatriculas = await (prisma as any).matricula.count({
      where: { status: 'ATIVA' },
    });
  } catch {}

  try {
    totalTurmas = await (prisma as any).turma.count({
      where: { ativa: true },
    });
  } catch {}

  return res.json({
    totalUnidades,
    totalProfessores,
    totalMatriculas,
    totalTurmas,
  });
});

// GET /education-units/stats
router.get('/education-units/stats', async (req: Request, res: Response) => {
  let total = 0;
  let ativas = 0;
  let tipos: any[] = [];
  let mapeadas = 0;

  try {
    total = await (prisma as any).unidadeEducacao.count();
  } catch {}

  try {
    ativas = await (prisma as any).unidadeEducacao.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    tipos = await (prisma as any).unidadeEducacao.groupBy({
      by: ['tipo'],
      where: { isActive: true },
      _count: { tipo: true },
    });
  } catch {}

  try {
    mapeadas = await (prisma as any).unidadeEducacao.count({
      where: {
        isActive: true,
        organizationalUnitId: { not: null },
      },
    });
  } catch {}

  const naoMapeadas = ativas - mapeadas;

  return res.json({
    total,
    ativas,
    tipos,
    mapeadas,
    naoMapeadas,
  });
});

export default router;
