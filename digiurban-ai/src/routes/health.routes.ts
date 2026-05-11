import { Router } from 'express';
import { config } from '../config/config';
import { knowledgeService } from '../services/knowledge.service';
import { aiObservabilityService } from '../services/ai-observability.service';
import { llamaCppService } from '../services/llamacpp.service';
import { aiProviderService } from '../services/ai-provider.service';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'digiurban-ai',
    model: config.llamaCppModel,
    warmupEnabled: config.llamaCppWarmupEnabled,
    webSearchEnabled: config.webSearchEnabled,
    webSearchProvider: config.webSearchProvider,
    embeddingsEnabled: config.embeddingsEnabled,
    embeddingsModel: config.embeddingsModel,
    llamacpp: llamaCppService.getRuntimeStatus(),
    providers: aiProviderService.getRuntimeStatus(),
    knowledge: knowledgeService.getRuntimeStats(),
    observability: aiObservabilityService.getSnapshot(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
