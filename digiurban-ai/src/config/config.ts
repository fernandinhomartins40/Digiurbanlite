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

export const config = {
  port: parseInt(process.env.PORT || '9004', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  databaseUrl: process.env.DATABASE_URL || '',

  aiServiceToken: process.env.AI_SERVICE_TOKEN || 'digiurban-ai-service-token',
  digiurbanApiUrl: process.env.DIGIURBAN_API_URL || 'http://digiurban-vps:3001/api',
  digiurbanServiceToken: process.env.DIGIURBAN_SERVICE_TOKEN || '',

  ollamaBaseUrl: process.env.AI_OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://ollama:11434',
  ollamaModel: process.env.AI_OLLAMA_MODEL || 'qwen3.5:9b',
  ollamaFallbackModel: process.env.AI_OLLAMA_FALLBACK_MODEL || 'digibot-qwen2.5:latest',
  ollamaTimeoutMs: parseInt(process.env.AI_OLLAMA_TIMEOUT_MS || '120000', 10),
  ollamaRetryTimeoutMs: parseInt(process.env.AI_OLLAMA_RETRY_TIMEOUT_MS || '45000', 10),
  ollamaTemperature: parseFloat(process.env.AI_OLLAMA_TEMPERATURE || '0.2'),
  ollamaTopP: parseFloat(process.env.AI_OLLAMA_TOP_P || '0.9'),
  ollamaTopK: parseOptionalInt(process.env.AI_OLLAMA_TOP_K),
  ollamaMinP: parseOptionalFloat(process.env.AI_OLLAMA_MIN_P),
  ollamaRepeatPenalty: parseOptionalFloat(process.env.AI_OLLAMA_REPEAT_PENALTY),
  ollamaNumCtx: parseInt(process.env.AI_OLLAMA_NUM_CTX || '4096', 10),
  ollamaNumThread: parseOptionalInt(process.env.AI_OLLAMA_NUM_THREAD),
  ollamaNumBatch: parseOptionalInt(process.env.AI_OLLAMA_NUM_BATCH),
  ollamaNumGpu: parseOptionalInt(process.env.AI_OLLAMA_NUM_GPU),
  ollamaMainGpu: parseOptionalInt(process.env.AI_OLLAMA_MAIN_GPU),
  ollamaMaxTokens: parseInt(process.env.AI_OLLAMA_MAX_TOKENS || '320', 10),
  ollamaKeepAlive:
    process.env.AI_OLLAMA_KEEP_ALIVE || process.env.OLLAMA_KEEP_ALIVE || '-1',
  ollamaThinking: (process.env.AI_OLLAMA_THINKING || 'false').toLowerCase() === 'true',
  ollamaWarmupEnabled: (process.env.AI_OLLAMA_WARMUP_ENABLED || 'true').toLowerCase() === 'true',
  ollamaWarmupPrompt: process.env.AI_OLLAMA_WARMUP_PROMPT || 'Responda apenas: ok',
  ollamaWarmupTimeoutMs: parseInt(process.env.AI_OLLAMA_WARMUP_TIMEOUT_MS || '90000', 10),
  ollamaWarmupThink: (process.env.AI_OLLAMA_WARMUP_THINK || 'false').toLowerCase() === 'true',

  defaultTenantId: process.env.AI_DEFAULT_TENANT_ID || 'default',
  maxContextChunks: parseInt(process.env.AI_MAX_CONTEXT_CHUNKS || '4', 10),
  maxChunkSizeChars: parseInt(process.env.AI_MAX_CHUNK_SIZE_CHARS || '1200', 10),
  chunkOverlapChars: parseInt(process.env.AI_CHUNK_OVERLAP_CHARS || '120', 10),
  maxConversationMessagesContext: parseInt(
    process.env.AI_MAX_CONVERSATION_MESSAGES_CONTEXT || '8',
    10,
  ),
  maxContextCharsInPrompt: parseInt(process.env.AI_MAX_CONTEXT_CHARS_IN_PROMPT || '2200', 10),
  maxModelMessageChars: parseInt(process.env.AI_MAX_MODEL_MESSAGE_CHARS || '1400', 10),

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
