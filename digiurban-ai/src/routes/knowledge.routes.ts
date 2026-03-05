import { AiKnowledgeSourceType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { knowledgeService } from '../services/knowledge.service';
import { AuthenticatedProxyRequest } from '../types';

const router = Router();

const createSourceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.nativeEnum(AiKnowledgeSourceType),
  config: z.record(z.any()).default({}),
});

const updateSourceSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

router.get('/knowledge/sources', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await knowledgeService.listSources(auth.tenantId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list sources' });
  }
});

router.post('/knowledge/sources', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = createSourceSchema.parse(req.body ?? {});

    const data = await knowledgeService.createSource({
      tenantId: auth.tenantId,
      name: payload.name,
      type: payload.type,
      config: payload.config,
      createdBy: auth.userId,
    });

    res.status(201).json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.issues });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create source' });
  }
});

router.put('/knowledge/sources/:id', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const payload = updateSourceSchema.parse(req.body ?? {});

    const data = await knowledgeService.updateSource({
      tenantId: auth.tenantId,
      sourceId: req.params.id,
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
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update source' });
  }
});

router.post('/knowledge/sources/:id/ingest', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await knowledgeService.ingestSource(auth.tenantId, req.params.id);
    res.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to ingest source' });
  }
});

router.post('/knowledge/bootstrap/system', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const data = await knowledgeService.bootstrapSystemSources(auth.tenantId, auth.userId);
    res.json({ data });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to bootstrap system knowledge',
    });
  }
});

router.get('/knowledge/search', async (req, res) => {
  try {
    const auth = (req as unknown as AuthenticatedProxyRequest).auth;
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    if (!q.trim()) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const data = await knowledgeService.searchRelevantChunks({
      tenantId: auth.tenantId,
      query: q,
      limit,
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to search knowledge' });
  }
});

export default router;
