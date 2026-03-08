import { Router } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service';
import { OllamaServiceError } from '../services/ollama.service';
import { AuthenticatedProxyRequest } from '../types';

const router = Router();

const thinkSchema = z.union([z.boolean(), z.enum(['low', 'medium', 'high'])]);
const responseFormatSchema = z.union([z.literal('json'), z.record(z.any())]);

const completionSchema = z.object({
  prompt: z.string().trim().min(1).max(15000),
  model: z.string().trim().min(1).max(128).optional(),
  think: thinkSchema.optional(),
  mode: z.enum(['free', 'rag']).optional(),
  experience: z.enum(['fast', 'contextual', 'quality']).optional(),
  webSearch: z.boolean().optional(),
  userId: z.string().trim().min(1).optional(),
  userName: z.string().trim().min(1).optional(),
  departmentId: z.string().trim().min(1).optional(),
  extraInstruction: z.string().trim().max(2000).optional(),
  responseFormat: responseFormatSchema.optional(),
  useBuiltInTools: z.boolean().optional(),
  toolLoopLimit: z.number().int().min(1).max(8).optional(),
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
      think: payload.think,
      mode: payload.mode,
      experience: payload.experience,
      webSearch: payload.webSearch,
      extraInstruction: payload.extraInstruction,
      responseFormat: payload.responseFormat,
      useBuiltInTools: payload.useBuiltInTools,
      toolLoopLimit: payload.toolLoopLimit,
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
