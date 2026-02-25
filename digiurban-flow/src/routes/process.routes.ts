/**
 * Rotas CRUD de processos internos
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import * as processService from '../services/process.service';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const createProcessSchema = z.object({
  typeId: z.string().min(1),
  subject: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  sigilo: z.enum(['PUBLICO', 'RESTRITO', 'CONFIDENCIAL']).optional(),
  priority: z.number().int().min(0).max(2).optional(),
  originSectorId: z.string().min(1),
  originSectorName: z.string().min(1),
  currentUserId: z.string().optional(),
  currentUserName: z.string().optional(),
  citizenProtocolId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateProcessSchema = z.object({
  subject: z.string().min(3).optional(),
  description: z.string().optional(),
  sigilo: z.enum(['PUBLICO', 'RESTRITO', 'CONFIDENCIAL']).optional(),
  priority: z.number().int().min(0).max(2).optional(),
  currentUserId: z.string().nullable().optional(),
  currentUserName: z.string().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const listProcessesSchema = z.object({
  status: z.string().optional(),
  typeId: z.string().optional(),
  currentSectorId: z.string().optional(),
  currentUserId: z.string().optional(),
  createdById: z.string().optional(),
  citizenProtocolId: z.string().optional(),
  sigilo: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// POST /processes — Criar processo
// ============================================================================

router.post('/', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = createProcessSchema.parse(req.body);

    const process = await processService.createProcess({
      ...body,
      createdById: auth.userId!,
      createdByName: auth.userName || 'Servidor',
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    });

    res.status(201).json(process);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /processes — Listar processos
// ============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = listProcessesSchema.parse(req.query);

    const result = await processService.listProcesses({
      status: query.status as processService.ListProcessesFilter['status'],
      typeId: query.typeId,
      currentSectorId: query.currentSectorId,
      currentUserId: query.currentUserId,
      createdById: query.createdById,
      citizenProtocolId: query.citizenProtocolId,
      sigilo: query.sigilo as processService.ListProcessesFilter['sigilo'],
      priority: query.priority ? parseInt(query.priority) : undefined,
      search: query.search,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    });

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /processes/:id — Detalhes
// ============================================================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const process = await processService.getProcessById(req.params.id as string);
    res.json(process);
  } catch (error: unknown) {
    res.status(404).json({ error: (error as Error).message });
  }
});

// ============================================================================
// PATCH /processes/:id — Atualizar
// ============================================================================

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = updateProcessSchema.parse(req.body);

    const process = await processService.updateProcess(
      req.params.id as string,
      {
        ...body,
        currentUserId: body.currentUserId ?? undefined,
        currentUserName: body.currentUserName ?? undefined,
        dueAt: body.dueAt ? new Date(body.dueAt) : body.dueAt === null ? undefined : undefined,
      },
      auth.userId!,
      auth.userName || 'Servidor'
    );

    res.json(process);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// DELETE /processes/:id — Cancelar
// ============================================================================

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const { reason } = req.body || {};

    const process = await processService.cancelProcess(
      req.params.id as string,
      auth.userId!,
      auth.userName || 'Servidor',
      reason || 'Cancelado pelo usuário'
    );

    res.json(process);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
