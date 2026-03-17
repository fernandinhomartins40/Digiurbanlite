import { Router } from 'express';
import { config } from '../config/config';
import { knowledgeService } from '../services/knowledge.service';
import { aiObservabilityService } from '../services/ai-observability.service';
import { ollamaService } from '../services/ollama.service';
import { aiProviderService } from '../services/ai-provider.service';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'digiurban-ai',
    model: config.ollamaModel,
    qualityModel: config.ollamaQualityModel,
    fallbackModel: config.ollamaFallbackModel,
    warmupEnabled: config.ollamaWarmupEnabled,
    webSearchEnabled: config.webSearchEnabled,
    webSearchProvider: config.webSearchProvider,
    embeddingsEnabled: config.embeddingsEnabled,
    embeddingsModel: config.embeddingsModel,
    ollama: ollamaService.getRuntimeStatus(),
    providers: aiProviderService.getRuntimeStatus(),
    knowledge: knowledgeService.getRuntimeStats(),
    observability: aiObservabilityService.getSnapshot(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
