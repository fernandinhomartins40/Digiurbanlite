/**
 * Internal process routes.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as processService from '../services/process.service';

const router = Router();
router.use(authMiddleware);

const createProcessSchema = z.object({
  typeId: z.string().min(1),
  subject: z.string().min(3, 'Assunto deve ter no minimo 3 caracteres'),
  description: z.string().optional(),
  sigilo: z.enum(['PUBLICO', 'RESTRITO', 'CONFIDENCIAL']).optional(),
  priority: z.number().int().min(0).max(2).optional(),
  originDepartmentId: z.string().optional(),
  originOrganizationalUnitId: z.string().min(1),
  originOrganizationalUnitName: z.string().min(1),
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
  currentDepartmentId: z.string().optional(),
  currentOrganizationalUnitId: z.string().optional(),
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

router.post('/', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);
    const body = createProcessSchema.parse(req.body);

    const process = await processService.createProcess({
      ...body,
      createdById: auth.userId,
      createdByName: auth.userName,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    });

    res.status(201).json(process);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const query = listProcessesSchema.parse(req.query);

    const result = await processService.listProcesses(
      {
        status: query.status as processService.ListProcessesFilter['status'],
        typeId: query.typeId,
        currentDepartmentId: query.currentDepartmentId,
        currentOrganizationalUnitId: query.currentOrganizationalUnitId,
        currentUserId: query.currentUserId,
        createdById: query.createdById,
        citizenProtocolId: query.citizenProtocolId,
        sigilo: query.sigilo as processService.ListProcessesFilter['sigilo'],
        priority: query.priority ? parseInt(query.priority, 10) : undefined,
        search: query.search,
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        orderBy: query.orderBy,
        orderDir: query.orderDir,
      },
      auth,
    );

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const process = await processService.getProcessById(req.params.id as string, auth);
    res.json(process);
  } catch (error: unknown) {
    res.status(404).json({ error: (error as Error).message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const body = updateProcessSchema.parse(req.body);

    const process = await processService.updateProcess(
      req.params.id as string,
      {
        ...body,
        currentUserId: body.currentUserId ?? undefined,
        currentUserName: body.currentUserName ?? undefined,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
      auth,
    );

    res.json(process);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const { reason } = req.body || {};

    const process = await processService.cancelProcess(
      req.params.id as string,
      auth,
      reason || 'Cancelado pelo usuario',
    );

    res.json(process);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
