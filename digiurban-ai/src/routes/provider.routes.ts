import { Router } from 'express';
import { z } from 'zod';
import { aiProviderService, AiProviderServiceError } from '../services/ai-provider.service';
import { AuthenticatedProxyRequest } from '../types';

const router = Router();

const providerSchema = z.enum(['OLLAMA', 'OPENROUTER']);

const providerSettingsSchema = z.object({
  provider: providerSchema,
  fallbackProvider: providerSchema.nullable().optional(),
  openRouterApiKey: z.string().trim().min(10).max(512).optional(),
  openRouterBaseUrl: z.string().trim().url().max(255).optional(),
  fastModel: z.string().trim().max(160).nullable().optional(),
  contextualModel: z.string().trim().max(160).nullable().optional(),
  qualityModel: z.string().trim().max(160).nullable().optional(),
  fallbackFastModel: z.string().trim().max(160).nullable().optional(),
  fallbackContextualModel: z.string().trim().max(160).nullable().optional(),
  fallbackQualityModel: z.string().trim().max(160).nullable().optional(),
  isEnabled: z.boolean().optional(),
});

const providerProbeSchema = z.object({
  provider: providerSchema,
  openRouterApiKey: z.string().trim().min(10).max(512).optional(),
  openRouterBaseUrl: z.string().trim().url().max(255).optional(),
});

function getTenantId(req: AuthenticatedProxyRequest): string {
  return req.auth.tenantId;
}

router.get('/provider/settings', async (req, res) => {
  try {
    const auth = req as AuthenticatedProxyRequest;
    const data = await aiProviderService.getSettings(getTenantId(auth));
    res.json({ data });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load AI provider settings',
    });
  }
});

router.put('/provider/settings', async (req, res) => {
  try {
    const auth = req as AuthenticatedProxyRequest;
    const payload = providerSettingsSchema.parse(req.body ?? {});
    const data = await aiProviderService.updateSettings(getTenantId(auth), payload);
    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }

    if (error instanceof AiProviderServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update AI provider settings',
    });
  }
});

router.post('/provider/test', async (req, res) => {
  try {
    const auth = req as AuthenticatedProxyRequest;
    const payload = providerProbeSchema.parse(req.body ?? {});
    const data = await aiProviderService.testConnection({
      tenantId: getTenantId(auth),
      provider: payload.provider,
      openRouterApiKey: payload.openRouterApiKey,
      openRouterBaseUrl: payload.openRouterBaseUrl,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }

    if (error instanceof AiProviderServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to test AI provider',
    });
  }
});

router.post('/provider/models', async (req, res) => {
  try {
    const auth = req as AuthenticatedProxyRequest;
    const payload = providerProbeSchema.parse(req.body ?? {});
    const data = await aiProviderService.listModels({
      tenantId: getTenantId(auth),
      provider: payload.provider,
      openRouterApiKey: payload.openRouterApiKey,
      openRouterBaseUrl: payload.openRouterBaseUrl,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }

    if (error instanceof AiProviderServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load AI provider models',
    });
  }
});

export default router;
