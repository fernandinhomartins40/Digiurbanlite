import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';
import {
  autoMapDomainUnits,
  listDomainUnits,
} from '../services/organizational-unit-mapping.service';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticateAdmin);

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

router.get('/social-units', async (_req: Request, res: Response) => {
  try {
    const units = await listDomainUnits({ model: 'unidadeCRAS' });
    return res.json(units);
  } catch (error: any) {
    console.error('Erro ao listar unidades de assistência social:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/social-units/auto-map', async (_req: Request, res: Response) => {
  try {
    const result = await autoMapDomainUnits({
      model: 'unidadeCRAS',
      departmentName: 'Secretaria de Assistência Social',
    });
    return res.json(result);
  } catch (error: any) {
    console.error('Erro ao auto-mapear unidades de assistência social:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
