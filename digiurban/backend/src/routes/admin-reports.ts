// ============================================================================
// ADMIN-REPORTS.TS - ROTAS DE RELATÓRIOS ADMINISTRATIVOS
// ============================================================================

import { Router, Response, Request } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import type { AuthenticatedRequest } from '../types';

// ====================== TIPOS DE RESPOSTA ======================

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

// ====================== SCHEMAS DE VALIDAÇÃO ======================

const createReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM']),
  category: z.string(),
  config: z.record(z.string(), z.unknown()),
  template: z.string().optional(),
  schedule: z.record(z.string(), z.unknown()).optional(),
  accessLevel: z.number().int().min(0),
  departments: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

const executeReportSchema = z.object({
  parameters: z.record(z.string(), z.unknown()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('JSON')
});

const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM']).optional(),
  category: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  template: z.string().optional(),
  schedule: z.record(z.string(), z.unknown()).optional(),
  accessLevel: z.number().int().min(0).optional(),
  departments: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional()
});

// ====================== ROUTER ======================

const router = Router();

// Aplicar middlewares em todas as rotas
router.use(adminAuthMiddleware);

// ====================== ROTAS DE RELATÓRIOS ======================

// GET /api/admin/relatorios - Listar todos os relatórios
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, category, isActive } = req.query;

    const where: Prisma.ReportWhereInput = {};

    if (type && typeof type === 'string') {
      where.type = type as Prisma.EnumReportTypeFilter;
    }

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        _count: {
          select: { executions: true }
      }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: reports
    } as SuccessResponse<typeof reports>);

  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao listar relatórios'
    } as ErrorResponse);
  }
});

// GET /api/admin/relatorios/:id - Buscar relatório específico
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id },
      include: {
        executions: {
          take: 10,
          orderBy: { updatedAt: 'desc' }
      }
      }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    res.json({
      success: true,
      data: report
    } as SuccessResponse<typeof report>);

  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao buscar relatório'
    } as ErrorResponse);
  }
});

// POST /api/admin/relatorios - Criar novo relatório
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { user } = authReq;

    const validatedData = createReportSchema.parse(req.body);

    const report = await prisma.report.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        category: validatedData.category,
        config: validatedData.config as Prisma.InputJsonValue,
        template: validatedData.template,
        schedule: validatedData.schedule as Prisma.InputJsonValue | undefined,
        accessLevel: validatedData.accessLevel,
        departments: validatedData.departments || [],
        isPublic: validatedData.isPublic,
                createdBy: user.id
      }
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Relatório criado com sucesso'
    } as SuccessResponse<typeof report>);

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.issues
      } as ErrorResponse);
      return;
    }

    console.error('Erro ao criar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao criar relatório'
    } as ErrorResponse);
  }
});

// PUT /api/admin/relatorios/:id - Atualizar relatório
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const validatedData = updateReportSchema.parse(req.body);

    const report = await prisma.report.findFirst({
      where: { id }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    const updateData: Prisma.ReportUpdateInput = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.config !== undefined) updateData.config = validatedData.config as Prisma.InputJsonValue;
    if (validatedData.template !== undefined) updateData.template = validatedData.template;
    if (validatedData.schedule !== undefined) updateData.schedule = validatedData.schedule as Prisma.InputJsonValue;
    if (validatedData.accessLevel !== undefined) updateData.accessLevel = validatedData.accessLevel;
    if (validatedData.departments !== undefined) updateData.departments = validatedData.departments;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedReport,
      message: 'Relatório atualizado com sucesso'
    } as SuccessResponse<typeof updatedReport>);

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.issues
      } as ErrorResponse);
      return;
    }

    console.error('Erro ao atualizar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao atualizar relatório'
    } as ErrorResponse);
  }
});

// DELETE /api/admin/relatorios/:id - Deletar relatório
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    await prisma.report.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Relatório deletado com sucesso'
    } as SuccessResponse<undefined>);

  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao deletar relatório'
    } as ErrorResponse);
  }
});

// POST /api/admin/relatorios/:id/execute - Executar relatório
router.post('/:id/execute', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { user } = authReq;
    const { id } = req.params;

    const validatedData = executeReportSchema.parse(req.body);

    const report = await prisma.report.findFirst({
      where: { id, isActive: true }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado ou inativo'
      } as ErrorResponse);
      return;
    }

    // Criar execução do relatório
    const execution = await prisma.reportExecution.create({
      data: {
        reportId: id,
        parameters: (validatedData.parameters || {}) as Prisma.InputJsonValue,
        filters: (validatedData.filters || {}) as Prisma.InputJsonValue,
        format: validatedData.format,
        executedBy: user.id,
        status: 'GENERATING'
      }
    });

    // Atualizar lastRun do relatório
    await prisma.report.update({
      where: { id },
      data: { lastRun: new Date() }
    });

    // Aqui você implementaria a lógica de geração do relatório
    // Por enquanto, vamos apenas simular o sucesso
    const completedExecution = await prisma.reportExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        data: {
          message: 'Relatório gerado com sucesso',
          format: validatedData.format
        } as Prisma.InputJsonValue,
        completedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: completedExecution,
      message: 'Relatório executado com sucesso'
    } as SuccessResponse<typeof completedExecution>);

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.issues
      } as ErrorResponse);
      return;
    }

    console.error('Erro ao executar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao executar relatório'
    } as ErrorResponse);
  }
});

// GET /api/admin/relatorios/:id/executions - Listar execuções de um relatório
router.get('/:id/executions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    const executions = await prisma.reportExecution.findMany({
      where: { reportId: id },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: executions
    } as SuccessResponse<typeof executions>);

  } catch (error) {
    console.error('Erro ao listar execuções:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao listar execuções'
    } as ErrorResponse);
  }
});

export default router;
