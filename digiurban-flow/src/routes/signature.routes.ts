/**
 * Signature and dispatch read routes.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as signatureService from '../services/signature.service';

const router = Router();
router.use(authMiddleware);

const requestSignatureSchema = z.object({
  documentId: z.string().optional(),
  signerId: z.string().optional(),
  signerName: z.string().optional(),
  signerEmail: z.string().email().optional(),
  expiresInHours: z.number().int().positive().optional(),
});

const confirmSchema = z.object({
  signatureHash: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1, 'Motivo e obrigatorio'),
});

router.get('/:id/signatures', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const signatures = await signatureService.listSignatures(req.params.id as string, auth);
    res.json(signatures);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/signatures', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const body = requestSignatureSchema.parse(req.body);

    const signature = await signatureService.requestSignature(
      {
        processId: req.params.id as string,
        ...body,
        requestedById: auth.userId,
        requestedByName: auth.userName,
      },
      auth,
    );

    res.status(201).json(signature);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/signatures/:signatureId/confirm', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const body = confirmSchema.parse(req.body);

    const signature = await signatureService.confirmSignature(
      req.params.signatureId as string,
      auth.userId,
      auth,
      body.signatureHash,
    );

    res.json(signature);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/signatures/:signatureId/reject', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const body = rejectSchema.parse(req.body);

    const signature = await signatureService.rejectSignature(
      req.params.signatureId as string,
      auth.userId,
      auth,
      body.reason,
    );

    res.json(signature);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/dispatches/:dispatchId/read', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const dispatch = await signatureService.markDispatchRead(req.params.dispatchId as string, auth);
    res.json(dispatch);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/inbox/read-all', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const organizationalUnitId =
      req.body?.organizationalUnitId ||
      (auth.organizationalUnitIds.length === 1 ? auth.organizationalUnitIds[0] : undefined);

    if (!organizationalUnitId) {
      res.status(400).json({ error: 'organizationalUnitId e obrigatorio' });
      return;
    }

    const result = await signatureService.markAllDispatchesRead(organizationalUnitId, auth);
    res.json({ updated: result.count });
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
