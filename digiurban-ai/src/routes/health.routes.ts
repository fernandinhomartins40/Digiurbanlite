import { Router } from 'express';
import { config } from '../config/config';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'digiurban-ai',
    model: config.ollamaModel,
    fallbackModel: config.ollamaFallbackModel,
    warmupEnabled: config.ollamaWarmupEnabled,
    timestamp: new Date().toISOString(),
  });
});

export default router;
