/**
 * Process dispatch routes.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as dispatchService from '../services/dispatch.service';

const router = Router();
router.use(authMiddleware);

const dispatchSchema = z.object({
  toDepartmentId: z.string().optional(),
  toOrganizationalUnitId: z.string().min(1),
  toOrganizationalUnitName: z.string().min(1),
  toUserId: z.string().optional(),
  toUserName: z.string().optional(),
  note: z.string().optional(),
  action: z
    .enum([
      'ENCAMINHADO',
      'DEVOLVIDO',
      'REDISTRIBUIDO',
      'PARECER',
      'DESPACHO',
      'ASSINATURA',
      'ARQUIVAMENTO',
      'CONCLUSAO',
      'CANCELAMENTO',
    ])
    .default('ENCAMINHADO'),
});

const returnSchema = z.object({
  note: z.string().min(1, 'Motivo da devolucao e obrigatorio'),
});

const reassignSchema = z.object({
  toUserId: z.string().min(1),
  toUserName: z.string().min(1),
  note: z.string().optional(),
});

const concludeSchema = z.object({
  note: z.string().optional(),
});

router.post('/:id/dispatch', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);
    const body = dispatchSchema.parse(req.body);

    const dispatch = await dispatchService.dispatchProcess(
      {
        processId: req.params.id as string,
        action: body.action,
        toDepartmentId: body.toDepartmentId,
        toOrganizationalUnitId: body.toOrganizationalUnitId,
        toOrganizationalUnitName: body.toOrganizationalUnitName,
        toUserId: body.toUserId,
        toUserName: body.toUserName,
        note: body.note,
        fromUserId: auth.userId,
        fromUserName: auth.userName,
      },
      auth,
    );

    res.status(201).json(dispatch);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/return', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);
    const body = returnSchema.parse(req.body);

    const dispatch = await dispatchService.returnProcess(
      {
        processId: req.params.id as string,
        note: body.note,
        fromUserId: auth.userId,
        fromUserName: auth.userName,
      },
      auth,
    );

    res.status(201).json(dispatch);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/reassign', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);
    const body = reassignSchema.parse(req.body);

    const result = await dispatchService.reassignProcess(
      {
        processId: req.params.id as string,
        toUserId: body.toUserId,
        toUserName: body.toUserName,
        fromUserId: auth.userId,
        fromUserName: auth.userName,
        note: body.note,
      },
      auth,
    );

    res.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/conclude', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);
    const body = concludeSchema.parse(req.body);

    const result = await dispatchService.concludeProcess(
      {
        processId: req.params.id as string,
        note: body.note,
        userId: auth.userId,
        userName: auth.userName,
      },
      auth,
    );

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);

    const result = await dispatchService.archiveProcess(
      req.params.id as string,
      auth.userId,
      auth.userName,
      auth,
    );

    res.json(result);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
