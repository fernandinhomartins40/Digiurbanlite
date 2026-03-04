import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { prisma } from '../lib/prisma';
import {
  createDepartmentWithRootUnit,
  listDepartmentsWithRootUnits,
  syncDepartmentRootOrganizationalUnits,
  updateDepartmentWithRootUnit,
} from '../services/department-organogram.service';
import { getAccessibleDepartmentIdsForUser } from '../services/organizational-context.service';

const router = Router();

const departmentSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  code: z
    .string()
    .trim()
    .max(40, 'Código deve ter no máximo 40 caracteres')
    .optional()
    .nullable(),
  description: z.string().trim().max(500, 'Descrição deve ter no máximo 500 caracteres').optional().nullable(),
  isActive: z.boolean().optional(),
});

const departmentUpdateSchema = departmentSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'Informe ao menos um campo para atualização'
);

const syncSchema = z.object({
  departmentId: z.string().trim().optional(),
  missingOnly: z.boolean().optional(),
});

router.use(adminAuthMiddleware);

function isAdminUser(req: Request) {
  const role = (req as any).user?.role;
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function requireDepartmentManagement(req: Request, res: Response): boolean {
  if (isAdminUser(req)) {
    return true;
  }

  res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message: 'Apenas administradores podem gerenciar secretarias',
  });
  return false;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const requestedDepartmentId =
      typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
    const user = (req as any).user;

    let scopedDepartmentIds: string[] | undefined;
    if (!isAdminUser(req)) {
      scopedDepartmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId,
      });
    }

    if (requestedDepartmentId) {
      scopedDepartmentIds = scopedDepartmentIds
        ? scopedDepartmentIds.filter((departmentId) => departmentId === requestedDepartmentId)
        : [requestedDepartmentId];
    }

    const departments = await listDepartmentsWithRootUnits(prisma, {
      includeInactive,
      departmentIds: scopedDepartmentIds,
    });

    res.json({
      success: true,
      data: {
        departments,
      },
    });
  } catch (error) {
    console.error('Erro ao listar secretarias:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro ao listar secretarias',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  if (!requireDepartmentManagement(req, res)) {
    return;
  }

  try {
    const payload = departmentSchema.parse(req.body);
    const result = await createDepartmentWithRootUnit(prisma, payload, (req as any).user?.id);

    res.status(201).json({
      success: true,
      data: {
        department: result.department,
        rootOrganizationalUnit: result.rootUnit,
      },
      message: 'Secretaria criada e sincronizada com o organograma',
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.issues?.[0]?.message || 'Dados inválidos',
        details: error.issues,
      });
    }

    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'Já existe uma secretaria com este nome ou código',
      });
    }

    console.error('Erro ao criar secretaria:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error?.message || 'Erro ao criar secretaria',
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  if (!requireDepartmentManagement(req, res)) {
    return;
  }

  try {
    const payload = departmentUpdateSchema.parse(req.body);
    const result = await updateDepartmentWithRootUnit(
      prisma,
      req.params.id,
      payload,
      (req as any).user?.id
    );

    res.json({
      success: true,
      data: {
        department: result.department,
        rootOrganizationalUnit: result.rootUnit,
      },
      message: 'Secretaria atualizada e sincronizada com o organograma',
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.issues?.[0]?.message || 'Dados inválidos',
        details: error.issues,
      });
    }

    if (error?.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Secretaria não encontrada',
      });
    }

    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'Já existe uma secretaria com este nome ou código',
      });
    }

    console.error('Erro ao atualizar secretaria:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error?.message || 'Erro ao atualizar secretaria',
    });
  }
});

router.post('/sync-root-units', async (req: Request, res: Response) => {
  if (!requireDepartmentManagement(req, res)) {
    return;
  }

  try {
    const payload = syncSchema.parse(req.body || {});
    const syncedDepartments = await syncDepartmentRootOrganizationalUnits(prisma, {
      departmentId: payload.departmentId,
      missingOnly: payload.missingOnly,
      actorId: (req as any).user?.id,
    });

    res.json({
      success: true,
      data: {
        syncedDepartments,
        syncedCount: syncedDepartments.length,
      },
      message: 'Sincronização de secretarias concluída',
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.issues?.[0]?.message || 'Dados inválidos',
        details: error.issues,
      });
    }

    console.error('Erro ao sincronizar secretarias:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error?.message || 'Erro ao sincronizar secretarias',
    });
  }
});

export default router;
