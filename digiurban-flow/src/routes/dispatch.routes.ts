/**
 * Rotas de tramitação / despacho de processos
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import * as dispatchService from '../services/dispatch.service';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// SCHEMAS
// ============================================================================

const dispatchSchema = z.object({
  toSectorId: z.string().min(1),
  toSectorName: z.string().min(1),
  toUserId: z.string().optional(),
  toUserName: z.string().optional(),
  note: z.string().optional(),
  action: z.enum([
    'ENCAMINHADO', 'DEVOLVIDO', 'REDISTRIBUIDO', 'PARECER',
    'DESPACHO', 'ASSINATURA', 'ARQUIVAMENTO', 'CONCLUSAO', 'CANCELAMENTO',
  ]).default('ENCAMINHADO'),
});

const returnSchema = z.object({
  note: z.string().min(1, 'Motivo da devolução é obrigatório'),
});

const reassignSchema = z.object({
  toUserId: z.string().min(1),
  toUserName: z.string().min(1),
  note: z.string().optional(),
});

const concludeSchema = z.object({
  note: z.string().optional(),
});

// ============================================================================
// POST /processes/:id/dispatch — Despachar
// ============================================================================

router.post('/:id/dispatch', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = dispatchSchema.parse(req.body);

    const dispatch = await dispatchService.dispatchProcess({
      processId: req.params.id as string,
      action: body.action,
      toSectorId: body.toSectorId,
      toSectorName: body.toSectorName,
      toUserId: body.toUserId,
      toUserName: body.toUserName,
      note: body.note,
      fromUserId: auth.userId!,
      fromUserName: auth.userName || 'Servidor',
    });

    res.status(201).json(dispatch);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// POST /processes/:id/return — Devolver
// ============================================================================

router.post('/:id/return', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = returnSchema.parse(req.body);

    const dispatch = await dispatchService.returnProcess({
      processId: req.params.id as string,
      note: body.note,
      fromUserId: auth.userId!,
      fromUserName: auth.userName || 'Servidor',
    });

    res.status(201).json(dispatch);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// POST /processes/:id/reassign — Redistribuir
// ============================================================================

router.post('/:id/reassign', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = reassignSchema.parse(req.body);

    const result = await dispatchService.reassignProcess({
      processId: req.params.id as string,
      toUserId: body.toUserId,
      toUserName: body.toUserName,
      fromUserId: auth.userId!,
      fromUserName: auth.userName || 'Servidor',
      note: body.note,
    });

    res.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// POST /processes/:id/conclude — Concluir
// ============================================================================

router.post('/:id/conclude', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = concludeSchema.parse(req.body);

    const result = await dispatchService.concludeProcess({
      processId: req.params.id as string,
      note: body.note,
      userId: auth.userId!,
      userName: auth.userName || 'Servidor',
    });

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// POST /processes/:id/archive — Arquivar
// ============================================================================

router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;

    const result = await dispatchService.archiveProcess(
      req.params.id as string,
      auth.userId!,
      auth.userName || 'Servidor'
    );

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
