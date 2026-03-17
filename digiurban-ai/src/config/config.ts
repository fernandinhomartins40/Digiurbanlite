import dotenv from 'dotenv';
dotenv.config();

function parseOptionalInt(value?: string): number | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalFloat(value?: string): number | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOllamaKeepAlive(value?: string): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  const normalized = value.trim();

  // Legacy sentinel previously used in this project. Avoid sending invalid duration to Ollama.
  if (normalized === '-1') {
    return undefined;
  }

  // Convert plain positive integer to seconds to keep backward compatibility.
  if (/^\d+$/.test(normalized)) {
    const seconds = Number.parseInt(normalized, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return `${seconds}s`;
    }
    return undefined;
  }

  return normalized;
}

function parseCsvList(value?: string): string[] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || '9004', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  databaseUrl: process.env.DATABASE_URL || '',

  aiServiceToken: process.env.AI_SERVICE_TOKEN || 'digiurban-ai-service-token',
  digiurbanApiUrl: process.env.DIGIURBAN_API_URL || 'http://digiurban-vps:3001/api',
  digiurbanServiceToken: process.env.DIGIURBAN_SERVICE_TOKEN || '',
  aiProviderEncryptionKey:
    process.env.AI_PROVIDER_ENCRYPTION_KEY ||
    process.env.AI_SETTINGS_ENCRYPTION_KEY ||
    process.env.AI_SERVICE_TOKEN ||
    process.env.DIGIURBAN_SERVICE_TOKEN ||
    process.env.DATABASE_URL ||
    'digiurban-ai-provider-key',

  ollamaBaseUrl: process.env.AI_OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://ollama:11434',
  ollamaModel:
    process.env.AI_OLLAMA_MODEL ||
    process.env.AI_OLLAMA_FAST_MODEL ||
    'qwen3.5:2b',
  ollamaQualityModel:
    process.env.AI_OLLAMA_QUALITY_MODEL ||
    process.env.AI_OLLAMA_FALLBACK_MODEL ||
    'qwen3.5:4b',
  ollamaFallbackModel:
    process.env.AI_OLLAMA_FALLBACK_MODEL ||
    process.env.AI_OLLAMA_QUALITY_MODEL ||
    'qwen3.5:4b',
  ollamaTimeoutMs: parseInt(process.env.AI_OLLAMA_TIMEOUT_MS || '60000', 10),
  ollamaFastTimeoutMs: parseInt(process.env.AI_OLLAMA_FAST_TIMEOUT_MS || '45000', 10),
  ollamaRetryTimeoutMs: parseInt(process.env.AI_OLLAMA_RETRY_TIMEOUT_MS || '18000', 10),
  ollamaFallbackFastTimeoutMs: parseInt(
    process.env.AI_OLLAMA_FALLBACK_FAST_TIMEOUT_MS || '60000',
    10,
  ),
  ollamaTemperature: parseFloat(process.env.AI_OLLAMA_TEMPERATURE || '0.2'),
  ollamaTopP: parseFloat(process.env.AI_OLLAMA_TOP_P || '0.9'),
  ollamaTopK: parseOptionalInt(process.env.AI_OLLAMA_TOP_K),
  ollamaMinP: parseOptionalFloat(process.env.AI_OLLAMA_MIN_P),
  ollamaRepeatPenalty: parseOptionalFloat(process.env.AI_OLLAMA_REPEAT_PENALTY),
  ollamaNumCtx: parseInt(process.env.AI_OLLAMA_NUM_CTX || '3072', 10),
  ollamaRagNumCtx: parseInt(process.env.AI_OLLAMA_RAG_NUM_CTX || '2304', 10),
  ollamaNumThread: parseOptionalInt(process.env.AI_OLLAMA_NUM_THREAD),
  ollamaNumBatch: parseOptionalInt(process.env.AI_OLLAMA_NUM_BATCH),
  ollamaNumGpu: parseOptionalInt(process.env.AI_OLLAMA_NUM_GPU),
  ollamaMainGpu: parseOptionalInt(process.env.AI_OLLAMA_MAIN_GPU),
  ollamaMaxTokens: parseInt(process.env.AI_OLLAMA_MAX_TOKENS || '220', 10),
  ollamaRagMaxTokens: parseInt(process.env.AI_OLLAMA_RAG_MAX_TOKENS || '140', 10),
  ollamaDraftMaxTokens: parseInt(process.env.AI_OLLAMA_DRAFT_MAX_TOKENS || '220', 10),
  ollamaFastMaxTokens: parseInt(process.env.AI_OLLAMA_FAST_MAX_TOKENS || '96', 10),
  ollamaFastNumCtx: parseInt(process.env.AI_OLLAMA_FAST_NUM_CTX || '1536', 10),
  ollamaKeepAlive: normalizeOllamaKeepAlive(
    process.env.AI_OLLAMA_KEEP_ALIVE || process.env.OLLAMA_KEEP_ALIVE,
  ),
  ollamaFallbackKeepAlive: normalizeOllamaKeepAlive(
    process.env.AI_OLLAMA_FALLBACK_KEEP_ALIVE || '10m',
  ),
  ollamaThinking: (process.env.AI_OLLAMA_THINKING || 'false').toLowerCase() === 'true',
  ollamaWarmupEnabled: (process.env.AI_OLLAMA_WARMUP_ENABLED || 'true').toLowerCase() === 'true',
  ollamaWarmupModels: parseCsvList(
    process.env.AI_OLLAMA_WARMUP_MODELS ||
      [
        process.env.AI_OLLAMA_MODEL || process.env.AI_OLLAMA_FAST_MODEL || 'qwen3.5:2b',
        process.env.AI_OLLAMA_QUALITY_MODEL ||
          process.env.AI_OLLAMA_FALLBACK_MODEL ||
          'qwen3.5:4b',
      ].join(','),
  ),
  ollamaWarmupPrompt: process.env.AI_OLLAMA_WARMUP_PROMPT || 'Responda apenas: ok',
  ollamaWarmupTimeoutMs: parseInt(process.env.AI_OLLAMA_WARMUP_TIMEOUT_MS || '90000', 10),
  ollamaWarmupThink: (process.env.AI_OLLAMA_WARMUP_THINK || 'false').toLowerCase() === 'true',
  ollamaCircuitBreakerFailures: parseInt(
    process.env.AI_OLLAMA_CIRCUIT_BREAKER_FAILURES || '2',
    10,
  ),
  ollamaCircuitBreakerCooldownMs: parseInt(
    process.env.AI_OLLAMA_CIRCUIT_BREAKER_COOLDOWN_MS || '180000',
    10,
  ),
  ollamaToolLoopMaxSteps: parseInt(process.env.AI_OLLAMA_TOOL_LOOP_MAX_STEPS || '4', 10),
  webSearchEnabled: (process.env.AI_WEB_SEARCH_ENABLED || 'false').toLowerCase() === 'true',
  webSearchDefault: (process.env.AI_WEB_SEARCH_DEFAULT || 'false').toLowerCase() === 'true',
  webSearchProvider:
    (
      process.env.AI_WEB_SEARCH_PROVIDER ||
      (process.env.AI_WEB_SEARCH_SERPER_API_KEY ? 'serper' : 'duckduckgo')
    ).toLowerCase(),
  webSearchTimeoutMs: parseInt(process.env.AI_WEB_SEARCH_TIMEOUT_MS || '12000', 10),
  webSearchMaxResults: parseInt(process.env.AI_WEB_SEARCH_MAX_RESULTS || '5', 10),
  webSearchCacheTtlMs: parseInt(process.env.AI_WEB_SEARCH_CACHE_TTL_MS || '300000', 10),
  webSearchSerperApiKey: process.env.AI_WEB_SEARCH_SERPER_API_KEY || '',
  webSearchUserAgent:
    process.env.AI_WEB_SEARCH_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',

  defaultTenantId: process.env.AI_DEFAULT_TENANT_ID || 'default',
  maxContextChunks: parseInt(process.env.AI_MAX_CONTEXT_CHUNKS || '3', 10),
  maxChunkSizeChars: parseInt(process.env.AI_MAX_CHUNK_SIZE_CHARS || '1200', 10),
  chunkOverlapChars: parseInt(process.env.AI_CHUNK_OVERLAP_CHARS || '120', 10),
  ragCandidateLimit: parseInt(process.env.AI_RAG_CANDIDATE_LIMIT || '120', 10),
  ragSemanticWeight: parseFloat(process.env.AI_RAG_SEMANTIC_WEIGHT || '0.65'),
  ragLexicalWeight: parseFloat(process.env.AI_RAG_LEXICAL_WEIGHT || '0.35'),
  ragQueryCacheTtlMs: parseInt(process.env.AI_RAG_QUERY_CACHE_TTL_MS || '120000', 10),
  maxConversationMessagesContext: parseInt(
    process.env.AI_MAX_CONVERSATION_MESSAGES_CONTEXT || '6',
    10,
  ),
  maxContextCharsInPrompt: parseInt(process.env.AI_MAX_CONTEXT_CHARS_IN_PROMPT || '1200', 10),
  maxModelMessageChars: parseInt(process.env.AI_MAX_MODEL_MESSAGE_CHARS || '900', 10),
  embeddingsEnabled: (process.env.AI_EMBEDDINGS_ENABLED || 'true').toLowerCase() === 'true',
  embeddingsModel: process.env.AI_EMBEDDINGS_MODEL || 'qwen3-embedding:0.6b',
  embeddingsTimeoutMs: parseInt(process.env.AI_EMBEDDINGS_TIMEOUT_MS || '15000', 10),
  embeddingsKeepAlive: normalizeOllamaKeepAlive(process.env.AI_EMBEDDINGS_KEEP_ALIVE),
  embeddingsBatchSize: parseInt(process.env.AI_EMBEDDINGS_BATCH_SIZE || '12', 10),
  embeddingsQueryCacheTtlMs: parseInt(
    process.env.AI_EMBEDDINGS_QUERY_CACHE_TTL_MS || '300000',
    10,
  ),
  openRouterBaseUrl: process.env.AI_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openRouterFastModel: process.env.AI_OPENROUTER_FAST_MODEL || 'qwen/qwen3-4b:free',
  openRouterContextualModel:
    process.env.AI_OPENROUTER_CONTEXTUAL_MODEL || process.env.AI_OPENROUTER_FAST_MODEL || 'qwen/qwen3-4b:free',
  openRouterQualityModel:
    process.env.AI_OPENROUTER_QUALITY_MODEL || 'qwen/qwen3-next-80b-a3b-instruct:free',
  openRouterTimeoutMs: parseInt(process.env.AI_OPENROUTER_TIMEOUT_MS || '60000', 10),
  openRouterAppName: process.env.AI_OPENROUTER_APP_NAME || 'DigiUrban AI',
  openRouterSiteUrl: process.env.AI_OPENROUTER_SITE_URL || 'https://www.digiurban.com.br',

  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '120', 10),
};

export function validateConfig(): void {
  const required: Array<[string, string]> = [['DATABASE_URL', config.databaseUrl]];

  for (const [name, value] of required) {
    if (!value) {
      throw new Error(`FATAL: ${name} environment variable is required`);
    }
  }
}
