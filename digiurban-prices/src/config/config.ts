export const config = {
  port: parseInt(process.env.PORT ?? '9002', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  opensearch: {
    url: process.env.OPENSEARCH_URL ?? 'http://localhost:9200',
    username: process.env.OPENSEARCH_USERNAME ?? 'admin',
    password: process.env.OPENSEARCH_PASSWORD ?? 'admin',
    indexLineItems: process.env.OPENSEARCH_INDEX_LINE_ITEMS ?? 'prices_line_items',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  security: {
    apiKey: process.env.DIGIURBAN_API_KEY ?? '',
    rateLimitWindowMs: 60_000,
    rateLimitMax: 100,
  },

  pncp: {
    baseUrl: process.env.PNCP_BASE_URL ?? 'https://pncp.gov.br/api/consulta/v1',
    timeoutMs: parseInt(process.env.PNCP_TIMEOUT_MS ?? '30000', 10),
    rateLimitMs: parseInt(process.env.PNCP_RATE_LIMIT_MS ?? '500', 10),
    pageSize: 50,
    maxRetries: 3,
    retryDelayMs: 1000,
  },

  transparencia: {
    apiKey: process.env.TRANSPARENCIA_API_KEY ?? '',
    baseUrl: 'https://api.portaldatransparencia.gov.br/api-de-dados',
  },

  comprasnet: {
    baseUrl: process.env.COMPRASNET_BASE_URL ?? 'https://compras.dados.gov.br',
  },

  bps: {
    dataUrl: process.env.BPS_DATA_URL ?? 'https://opendatasus.saude.gov.br',
    maxFilesPerRun: parseInt(process.env.BPS_MAX_FILES_PER_RUN ?? '2', 10),
  },

  fnde: {
    baseUrl: process.env.FNDE_BASE_URL ?? 'https://www.fnde.gov.br/dadosabertos',
  },

  catmat: {
    syncEnabled: process.env.CATMAT_SYNC_ENABLED !== 'false',
    baseUrl: 'https://dadosabertos.compras.gov.br',
  },

  ingest: {
    sinceDays: parseInt(process.env.INGEST_SINCE_DAYS ?? '365', 10),
    historicalDays: parseInt(process.env.INGEST_HISTORICAL_DAYS ?? '1825', 10),
    cron: process.env.INGEST_CRON ?? '0 2 * * *',
    cronComprasnet: process.env.INGEST_CRON_COMPRASNET ?? '0 3 * * 0',
    cronTransparencia: process.env.INGEST_CRON_TRANSPARENCIA ?? '0 4 * * *',
    cronBps: process.env.INGEST_CRON_BPS ?? '0 5 1 * *',
    cronFnde: process.env.INGEST_CRON_FNDE ?? '0 6 1 * *',
    cronCatmat: process.env.INGEST_CRON_CATMAT ?? '0 1 1 * *',
  },

  outlier: {
    method: (process.env.OUTLIER_METHOD ?? 'IQR') as 'IQR' | 'ZSCORE',
    iqrK: parseFloat(process.env.OUTLIER_IQR_K ?? '1.5'),
    zscoreThreshold: parseFloat(process.env.OUTLIER_ZSCORE_THRESHOLD ?? '3.0'),
  },

  playwright: {
    browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
  },
};
