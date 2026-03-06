import { Router } from 'express';
import { z } from 'zod';
import { apiKeyService } from '../services/api-key.service';
import { chatService } from '../services/chat.service';
import { OllamaServiceError } from '../services/ollama.service';

const router = Router();

const completionSchema = z.object({
  prompt: z.string().trim().min(1).max(15000),
  model: z.string().trim().min(1).max(128).optional(),
  think: z.boolean().optional(),
  webSearch: z.boolean().optional(),
  extraInstruction: z.string().trim().max(2000).optional(),
});

router.post('/public/chat/completions', async (req, res) => {
  try {
    const rawApiKey =
      (typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'] : undefined) ||
      (typeof req.headers.authorization === 'string' &&
      req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!rawApiKey) {
      res.status(401).json({ error: 'API key is required' });
      return;
    }

    const payload = completionSchema.parse(req.body ?? {});
    const ipAddress =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : undefined) || req.ip;

    const { apiKey, plan } = await apiKeyService.authenticatePublicKey({
      rawKey: rawApiKey,
      ipAddress,
    });

    const data = await chatService.completeStateless({
      tenantId: apiKey.tenantId,
      prompt: payload.prompt,
      model: payload.model,
      think: payload.think,
      webSearch: payload.webSearch,
      extraInstruction: payload.extraInstruction,
      source: 'PUBLIC_API',
      apiKeyId: apiKey.id,
      planId: plan.id,
    });

    res.json({
      data,
      meta: {
        tenantId: apiKey.tenantId,
        keyPrefix: apiKey.keyPrefix,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }

    if (error instanceof OllamaServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    if (error instanceof Error) {
      const normalized = error.message.toLowerCase();
      if (
        normalized.includes('invalid api key') ||
        normalized.includes('expired') ||
        normalized.includes('not active')
      ) {
        res.status(401).json({ error: error.message });
        return;
      }

      if (
        normalized.includes('rate limit') ||
        normalized.includes('budget') ||
        normalized.includes('ip address')
      ) {
        res.status(429).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to process public AI completion' });
  }
});

export default router;
