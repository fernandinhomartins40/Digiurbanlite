/**
 * Configuração centralizada do módulo digiurban-flow
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '9003', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT (mesmo secret do backend principal)
  jwtSecret: process.env.JWT_SECRET || '',

  // Service Token (para comunicação backend → flow)
  flowServiceToken: process.env.FLOW_SERVICE_TOKEN || '',

  // DigiUrban Backend API
  digiurbanApiUrl: process.env.DIGIURBAN_API_URL || 'http://digiurban-vps:3001/api',
  digiurbanServiceToken: process.env.DIGIURBAN_SERVICE_TOKEN || '',

  // Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Playwright
  playwrightBrowsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || undefined,

  // SLA Worker
  slaCheckIntervalMs: parseInt(process.env.SLA_CHECK_INTERVAL_MS || '300000', 10), // 5 min

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validação de variáveis obrigatórias
export function validateConfig(): void {
  const required: Array<[string, string]> = [
    ['DATABASE_URL', config.databaseUrl],
    ['JWT_SECRET', config.jwtSecret],
    ['FLOW_SERVICE_TOKEN', config.flowServiceToken],
  ];

  for (const [name, value] of required) {
    if (!value) {
      throw new Error(`FATAL: ${name} environment variable is required`);
    }
  }
}
