import { Router } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service';
import { OllamaServiceError } from '../services/ollama.service';
import { AuthenticatedProxyRequest } from '../types';

const router = Router();

const completionSchema = z.object({
  prompt: z.string().trim().min(1).max(15000),
  model: z.string().trim().min(1).max(128).optional(),
  userId: z.string().trim().min(1).optional(),
  userName: z.string().trim().min(1).optional(),
  departmentId: z.string().trim().min(1).optional(),
  extraInstruction: z.string().trim().max(2000).optional(),
});

router.post('/internal/chat/completions', async (req, res) => {
  try {
    const auth = (req as AuthenticatedProxyRequest).auth;
    const payload = completionSchema.parse(req.body ?? {});

    const data = await chatService.completeStateless({
      tenantId: auth.tenantId,
      userId: payload.userId,
      userName: payload.userName,
      departmentId: payload.departmentId,
      prompt: payload.prompt,
      model: payload.model,
      extraInstruction: payload.extraInstruction,
      source: 'INTERNAL_API',
    });

    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }

    if (error instanceof OllamaServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process internal AI completion',
    });
  }
});

export default router;
