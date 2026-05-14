import { Router } from 'express';
import { config } from '../config/config';
import { knowledgeService } from '../services/knowledge.service';
import { aiObservabilityService } from '../services/ai-observability.service';
import { llamaCppService } from '../services/llamacpp.service';
import { aiProviderService } from '../services/ai-provider.service';
import { semanticCacheService } from '../services/semantic-cache.service';

const router = Router();

router.get('/health', async (_req, res) => {
  const persistedObservability = await aiObservabilityService
    .getPersistentSnapshot(config.defaultTenantId)
    .catch((error) => ({
      error: error instanceof Error ? error.message : 'failed_to_load_persistent_observability',
    }));

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
    semanticCache: semanticCacheService.getRuntimeStats(),
    observability: {
      memory: aiObservabilityService.getSnapshot(),
      persisted: persistedObservability,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
