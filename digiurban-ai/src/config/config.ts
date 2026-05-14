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

  llamaCppBaseUrl: process.env.AI_LLAMACPP_BASE_URL || 'http://llamacpp:8080',
  llamaCppModel: process.env.AI_LLAMACPP_MODEL || 'qwen3-1.7b-instruct-q4_k_m',
  llamaCppTimeoutMs: parseInt(process.env.AI_LLAMACPP_TIMEOUT_MS || '60000', 10),
  llamaCppFastTimeoutMs: parseInt(process.env.AI_LLAMACPP_FAST_TIMEOUT_MS || '30000', 10),
  llamaCppTemperature: parseFloat(process.env.AI_LLAMACPP_TEMPERATURE || '0.2'),
  llamaCppTopP: parseFloat(process.env.AI_LLAMACPP_TOP_P || '0.9'),
  llamaCppNumCtx: parseInt(process.env.AI_LLAMACPP_NUM_CTX || '3072', 10),
  llamaCppRagNumCtx: parseInt(process.env.AI_LLAMACPP_RAG_NUM_CTX || '2304', 10),
  llamaCppMaxTokens: parseInt(process.env.AI_LLAMACPP_MAX_TOKENS || '180', 10),
  llamaCppRagMaxTokens: parseInt(process.env.AI_LLAMACPP_RAG_MAX_TOKENS || '110', 10),
  llamaCppFastMaxTokens: parseInt(process.env.AI_LLAMACPP_FAST_MAX_TOKENS || '64', 10),
  llamaCppToolLoopMaxSteps: parseInt(process.env.AI_LLAMACPP_TOOL_LOOP_MAX_STEPS || '3', 10),
  llamaCppWarmupEnabled: (process.env.AI_LLAMACPP_WARMUP_ENABLED || 'true').toLowerCase() === 'true',
  llamaCppWarmupPrompt: process.env.AI_LLAMACPP_WARMUP_PROMPT || 'Responda apenas: ok',
  llamaCppThinkingDefault: (process.env.AI_LLAMACPP_THINKING_DEFAULT || 'false').toLowerCase() === 'true',
  llamaCppNoThinkPromptSwitch:
    (process.env.AI_LLAMACPP_NO_THINK_PROMPT_SWITCH || 'true').toLowerCase() === 'true',
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
  embeddingsEnabled: (process.env.AI_EMBEDDINGS_ENABLED || 'false').toLowerCase() === 'true',
  embeddingsBaseUrl: process.env.AI_EMBEDDINGS_BASE_URL || process.env.AI_LLAMACPP_BASE_URL || 'http://llamacpp:8080',
  embeddingsModel: process.env.AI_EMBEDDINGS_MODEL || 'nomic-embed-text-v1.5',
  embeddingsTimeoutMs: parseInt(process.env.AI_EMBEDDINGS_TIMEOUT_MS || '15000', 10),
  embeddingsKeepAlive: undefined,
  embeddingsBatchSize: parseInt(process.env.AI_EMBEDDINGS_BATCH_SIZE || '12', 10),
  embeddingsQueryCacheTtlMs: parseInt(
    process.env.AI_EMBEDDINGS_QUERY_CACHE_TTL_MS || '300000',
    10,
  ),
  semanticCacheEnabled: (process.env.AI_SEMANTIC_CACHE_ENABLED || 'true').toLowerCase() === 'true',
  semanticCacheSimilarityThreshold: parseFloat(process.env.AI_SEMANTIC_CACHE_SIMILARITY_THRESHOLD || '0.92'),
  semanticCacheMaxCandidates: parseInt(process.env.AI_SEMANTIC_CACHE_MAX_CANDIDATES || '240', 10),
  semanticCacheTtlDays: parseInt(process.env.AI_SEMANTIC_CACHE_TTL_DAYS || '30', 10),
  semanticCacheMaxResponseChars: parseInt(process.env.AI_SEMANTIC_CACHE_MAX_RESPONSE_CHARS || '1800', 10),
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
