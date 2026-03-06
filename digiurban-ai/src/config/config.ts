import dotenv from 'dotenv';
dotenv.config();

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
  ollamaNumCtx: parseInt(process.env.AI_OLLAMA_NUM_CTX || '4096', 10),
  ollamaMaxTokens: parseInt(process.env.AI_OLLAMA_MAX_TOKENS || '320', 10),
  ollamaThinking: (process.env.AI_OLLAMA_THINKING || 'false').toLowerCase() === 'true',

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
