/**
 * Rotas CRUD de tipos de processo
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();
router.use(authMiddleware);

const createTypeSchema = z.object({
  name: z.string().min(2),
  prefix: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  defaultSlaHours: z.number().int().positive().default(168),
  sigiloDefault: z.enum(['PUBLICO', 'RESTRITO', 'CONFIDENCIAL']).default('PUBLICO'),
  defaultDocumentTemplate: z.string().optional(),
  defaultWorkflowTemplateId: z.string().optional(),
});

const updateTypeSchema = createTypeSchema.partial();

// POST /process-types
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createTypeSchema.parse(req.body);
    const type = await prisma.internalProcessType.create({ data: body });
    res.status(201).json(type);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /process-types
router.get('/', async (_req: Request, res: Response) => {
  try {
    const types = await prisma.internalProcessType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        defaultWorkflowTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: { select: { processes: true } },
      },
    });
    res.json(types);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /process-types/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const type = await prisma.internalProcessType.findUnique({
      where: { id: req.params.id as string },
      include: {
        defaultWorkflowTemplate: true,
        _count: { select: { processes: true } },
      },
    });
    if (!type) {
      res.status(404).json({ error: 'Tipo de processo não encontrado' });
      return;
    }
    res.json(type);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /process-types/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const body = updateTypeSchema.parse(req.body);
    const type = await prisma.internalProcessType.update({
      where: { id: req.params.id as string },
      data: body,
    });
    res.json(type);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
