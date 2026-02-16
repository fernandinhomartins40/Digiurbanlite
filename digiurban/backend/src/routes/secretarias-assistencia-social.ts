import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  let totalUnidades = 0;
  let totalFamilias = 0;
  let totalProgramas = 0;
  let totalProfissionais = 0;
  let unidadesPorTipo: any[] = [];
  let mapeadas = 0;

  try {
    totalUnidades = await (prisma as any).unidadeCRAS.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    totalFamilias = await (prisma as any).cadUnicoFamilia.count();
  } catch {}

  try {
    totalProgramas = await (prisma as any).programaSocial.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    totalProfissionais = await (prisma as any).socialAssistanceProfessionalData.count();
  } catch {}

  try {
    unidadesPorTipo = await (prisma as any).unidadeCRAS.groupBy({
      by: ['tipo'],
      where: { isActive: true },
      _count: { tipo: true },
    });
  } catch {}

  try {
    mapeadas = await (prisma as any).unidadeCRAS.count({
      where: {
        isActive: true,
        organizationalUnitId: { not: null },
      },
    });
  } catch {}

  const naoMapeadas = totalUnidades - mapeadas;

  return res.json({
    totalUnidades,
    totalFamilias,
    totalProgramas,
    totalProfissionais,
    unidadesPorTipo,
    mapeadas,
    naoMapeadas,
  });
});

// GET /stats
router.get('/stats', async (req: Request, res: Response) => {
  let totalUnidades = 0;
  let totalFamilias = 0;
  let totalProgramas = 0;
  let totalProfissionais = 0;

  try {
    totalUnidades = await (prisma as any).unidadeCRAS.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    totalFamilias = await (prisma as any).cadUnicoFamilia.count();
  } catch {}

  try {
    totalProgramas = await (prisma as any).programaSocial.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    totalProfissionais = await (prisma as any).socialAssistanceProfessionalData.count();
  } catch {}

  return res.json({
    totalUnidades,
    totalFamilias,
    totalProgramas,
    totalProfissionais,
  });
});

// GET /social-units/stats
router.get('/social-units/stats', async (req: Request, res: Response) => {
  let total = 0;
  let ativas = 0;
  let tipos: any[] = [];
  let mapeadas = 0;

  try {
    total = await (prisma as any).unidadeCRAS.count();
  } catch {}

  try {
    ativas = await (prisma as any).unidadeCRAS.count({
      where: { isActive: true },
    });
  } catch {}

  try {
    tipos = await (prisma as any).unidadeCRAS.groupBy({
      by: ['tipo'],
      where: { isActive: true },
      _count: { tipo: true },
    });
  } catch {}

  try {
    mapeadas = await (prisma as any).unidadeCRAS.count({
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
