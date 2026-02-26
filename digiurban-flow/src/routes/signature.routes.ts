/**
 * Rotas de assinaturas digitais e leitura de despachos
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
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
  reason: z.string().min(1, 'Motivo é obrigatório'),
});

// GET /processes/:id/signatures — Listar assinaturas
router.get('/:id/signatures', async (req: Request, res: Response) => {
  try {
    const signatures = await signatureService.listSignatures(req.params.id as string);
    res.json(signatures);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /processes/:id/signatures — Solicitar assinatura
router.post('/:id/signatures', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = requestSignatureSchema.parse(req.body);

    const signature = await signatureService.requestSignature({
      processId: req.params.id as string,
      ...body,
      requestedById: auth.userId!,
      requestedByName: auth.userName || 'Servidor',
    });

    res.status(201).json(signature);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /signatures/:signatureId/confirm — Confirmar assinatura
router.post('/signatures/:signatureId/confirm', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = confirmSchema.parse(req.body);

    const signature = await signatureService.confirmSignature(
      req.params.signatureId as string,
      auth.userId!,
      body.signatureHash
    );

    res.json(signature);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /signatures/:signatureId/reject — Rejeitar assinatura
router.post('/signatures/:signatureId/reject', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = rejectSchema.parse(req.body);

    const signature = await signatureService.rejectSignature(
      req.params.signatureId as string,
      auth.userId!,
      body.reason
    );

    res.json(signature);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /dispatches/:dispatchId/read — Marcar despacho como lido
router.post('/dispatches/:dispatchId/read', async (req: Request, res: Response) => {
  try {
    const dispatch = await signatureService.markDispatchRead(req.params.dispatchId as string);
    res.json(dispatch);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /inbox/read-all — Marcar todos os despachos do setor como lidos
router.post('/inbox/read-all', async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.body;
    if (!sectorId) {
      res.status(400).json({ error: 'sectorId é obrigatório' });
      return;
    }

    const result = await signatureService.markAllDispatchesRead(sectorId);
    res.json({ updated: result.count });
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
