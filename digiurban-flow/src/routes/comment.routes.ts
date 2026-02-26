/**
 * Rotas de comentários / anotações em processos
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import * as commentService from '../services/comment.service';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  content: z.string().min(1, 'Conteúdo não pode ser vazio').max(5000),
  isInternal: z.boolean().optional(),
});

const editSchema = z.object({
  content: z.string().min(1).max(5000),
});

// GET /processes/:id/comments
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await commentService.listComments(req.params.id as string);
    res.json(comments);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /processes/:id/comments
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = createSchema.parse(req.body);

    const comment = await commentService.createComment({
      processId: req.params.id as string,
      userId: auth.userId!,
      userName: auth.userName || 'Servidor',
      content: body.content,
      isInternal: body.isInternal,
    });

    res.status(201).json(comment);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// PATCH /comments/:commentId
router.patch('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = editSchema.parse(req.body);

    const comment = await commentService.editComment(
      req.params.commentId as string,
      auth.userId!,
      body.content
    );

    res.json(comment);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// DELETE /comments/:commentId
router.delete('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;

    await commentService.deleteComment(
      req.params.commentId as string,
      auth.userId!
    );

    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
