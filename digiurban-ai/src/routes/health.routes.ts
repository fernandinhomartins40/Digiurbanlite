import { Router } from 'express';
import { config } from '../config/config';
import { knowledgeService } from '../services/knowledge.service';
import { ollamaService } from '../services/ollama.service';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'digiurban-ai',
    model: config.ollamaModel,
    fallbackModel: config.ollamaFallbackModel,
    warmupEnabled: config.ollamaWarmupEnabled,
    webSearchEnabled: config.webSearchEnabled,
    webSearchProvider: config.webSearchProvider,
    embeddingsEnabled: config.embeddingsEnabled,
    embeddingsModel: config.embeddingsModel,
    ollama: ollamaService.getRuntimeStatus(),
    knowledge: knowledgeService.getRuntimeStats(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
