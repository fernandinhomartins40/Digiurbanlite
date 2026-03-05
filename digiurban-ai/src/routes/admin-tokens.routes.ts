import { AiPlanType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { apiKeyService } from '../services/api-key.service';
import { AuthenticatedProxyRequest } from '../types';

const router = Router();

const createPlanSchema = z.object({
  name: z.string().trim().min(2).max(80),
  planType: z.nativeEnum(AiPlanType).optional(),
  requestLimitPerMinute: z.number().int().positive().max(5000).optional(),
  monthlyBudgetTokens: z.number().int().positive().max(2_000_000_000).optional(),
  inputTokenLimit: z.number().int().positive().max(2_000_000_000).optional(),
  outputTokenLimit: z.number().int().positive().max(2_000_000_000).optional(),
  isActive: z.boolean().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

const createKeySchema = z.object({
  planId: z.string().trim().min(10),
  name: z.string().trim().min(2).max(120),
  expiresAt: z.string().datetime().optional(),
  allowedIps: z.array(z.string().trim().min(7).max(64)).optional(),
});

router.get('/tokens/plans', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await apiKeyService.listPlans(auth.tenantId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list plans' });
  }
});

router.post('/tokens/plans', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = createPlanSchema.parse(req.body ?? {});

    const data = await apiKeyService.createPlan({
      tenantId: auth.tenantId,
      ...payload,
    });

    res.status(201).json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create plan' });
  }
});

router.put('/tokens/plans/:id', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = updatePlanSchema.parse(req.body ?? {});

    const data = await apiKeyService.updatePlan({
      tenantId: auth.tenantId,
      planId: req.params.id,
      payload,
    });

    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update plan' });
  }
});

router.get('/tokens/keys', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await apiKeyService.listApiKeys(auth.tenantId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list API keys' });
  }
});

router.post('/tokens/keys', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = createKeySchema.parse(req.body ?? {});

    const { key, rawKey } = await apiKeyService.createApiKey({
      tenantId: auth.tenantId,
      planId: payload.planId,
      name: payload.name,
      createdBy: auth.userId,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      allowedIps: payload.allowedIps,
    });

    res.status(201).json({
      data: {
        ...key,
        rawKey,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create API key' });
  }
});

router.post('/tokens/keys/:id/revoke', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await apiKeyService.revokeApiKey({
      tenantId: auth.tenantId,
      keyId: req.params.id,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to revoke API key' });
  }
});

router.get('/tokens/usage', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined;
    const apiKeyId = typeof req.query.apiKeyId === 'string' ? req.query.apiKeyId : undefined;

    const data = await apiKeyService.getUsageSummary({
      tenantId: auth.tenantId,
      from,
      to,
      apiKeyId,
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load token usage' });
  }
});

export default router;
