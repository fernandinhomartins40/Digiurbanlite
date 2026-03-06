import { Router } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service';
import { apiKeyService } from '../services/api-key.service';
import { OllamaServiceError } from '../services/ollama.service';
import { AuthenticatedProxyRequest } from '../types';

const router = Router();

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(15000),
  model: z.string().trim().min(1).max(128).optional(),
  extraInstruction: z.string().trim().max(2000).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(180),
        mimeType: z.string().trim().max(120).optional(),
        size: z.number().int().nonnegative().max(20 * 1024 * 1024).optional(),
        contentText: z.string().trim().max(4000).optional(),
      }),
    )
    .max(6)
    .optional(),
});

const completionSchema = z.object({
  prompt: z.string().trim().min(1).max(15000),
  model: z.string().trim().min(1).max(128).optional(),
  extraInstruction: z.string().trim().max(2000).optional(),
});

router.get('/conversations', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await chatService.listConversations({
      tenantId: auth.tenantId,
      userId: auth.userId,
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list conversations' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = createConversationSchema.parse(req.body ?? {});

    const data = await chatService.createConversation({
      tenantId: auth.tenantId,
      userId: auth.userId,
      departmentId: auth.departmentId,
      title: payload.title,
    });

    res.status(201).json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create conversation' });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await chatService.getConversationWithMessages({
      tenantId: auth.tenantId,
      userId: auth.userId,
      conversationId: req.params.id,
    });

    res.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load conversation' });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = sendMessageSchema.parse(req.body ?? {});

    const result = await chatService.sendMessage({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.userName,
      departmentId: auth.departmentId,
      conversationId: req.params.id,
      content: payload.content,
      model: payload.model,
      extraInstruction: payload.extraInstruction,
      attachments: payload.attachments,
    });

    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof OllamaServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate message' });
  }
});

router.post('/chat/completions', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = completionSchema.parse(req.body ?? {});

    const result = await chatService.completeStateless({
      tenantId: auth.tenantId,
      userId: auth.userId,
      userName: auth.userName,
      departmentId: auth.departmentId,
      prompt: payload.prompt,
      model: payload.model,
      extraInstruction: payload.extraInstruction,
      source: 'ADMIN_CHAT',
    });

    res.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    if (error instanceof OllamaServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate completion' });
  }
});

router.get('/usage/summary', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const fromQuery = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const toQuery = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;

    const data = await apiKeyService.getUsageSummary({
      tenantId: auth.tenantId,
      from: fromQuery,
      to: toQuery,
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load usage summary' });
  }
});

export default router;
