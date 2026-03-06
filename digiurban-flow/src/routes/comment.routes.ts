/**
 * Process comment routes.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as commentService from '../services/comment.service';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  content: z.string().min(1, 'Conteudo nao pode ser vazio').max(5000),
  isInternal: z.boolean().optional(),
});

const editSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const comments = await commentService.listComments(req.params.id as string, auth);
    res.json(comments);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const auth = toFlowAuthContext(authReq);
    const body = createSchema.parse(req.body);

    const comment = await commentService.createComment(
      {
        processId: req.params.id as string,
        userId: auth.userId,
        userName: auth.userName,
        content: body.content,
        isInternal: body.isInternal,
      },
      auth,
    );

    res.status(201).json(comment);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.patch('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const body = editSchema.parse(req.body);

    const comment = await commentService.editComment(
      req.params.commentId as string,
      auth.userId,
      body.content,
      auth,
    );

    res.json(comment);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    await commentService.deleteComment(req.params.commentId as string, auth.userId, auth);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
