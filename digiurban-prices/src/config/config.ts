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
    pageSize: parseInt(process.env.PNCP_PAGE_SIZE ?? '50', 10),
    maxPagesContratacoes: parseInt(process.env.PNCP_MAX_PAGES_CONTRATACOES ?? '500', 10),
    maxPagesContratos: parseInt(process.env.PNCP_MAX_PAGES_CONTRATOS ?? '300', 10),
    maxPagesItensContratacao: parseInt(process.env.PNCP_MAX_PAGES_ITENS_CONTRATACAO ?? '20', 10),
    maxRetries: 3,
    retryDelayMs: 1000,
  },

  transparencia: {
    apiKey: process.env.TRANSPARENCIA_API_KEY ?? '',
    baseUrl: 'https://api.portaldatransparencia.gov.br/api-de-dados',
    maxPagesPerOrgao: parseInt(process.env.TRANSPARENCIA_MAX_PAGES_PER_ORGAO ?? '60', 10),
    orgaosPrincipais:
      process.env.TRANSPARENCIA_ORGAOS_PRINCIPAIS
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
  },

  comprasnet: {
    baseUrl: process.env.COMPRASNET_BASE_URL ?? 'https://dadosabertos.compras.gov.br',
    timeoutMs: parseInt(process.env.COMPRASNET_TIMEOUT_MS ?? '45000', 10),
    rateLimitMs: parseInt(process.env.COMPRASNET_RATE_LIMIT_MS ?? '1200', 10),
    maxPagesPregoes: parseInt(process.env.COMPRASNET_MAX_PAGES_PREGOES ?? '150', 10),
    maxPagesArp: parseInt(process.env.COMPRASNET_MAX_PAGES_ARP ?? '100', 10),
  },

  bps: {
    dataUrl: process.env.BPS_DATA_URL ?? 'https://opendatasus.saude.gov.br',
    maxFilesPerRun: parseInt(process.env.BPS_MAX_FILES_PER_RUN ?? '6', 10),
    startYear: parseInt(process.env.BPS_START_YEAR ?? '2020', 10),
  },

  fnde: {
    baseUrl: process.env.FNDE_BASE_URL ?? 'https://www.fnde.gov.br/dadosabertos',
  },

  catmat: {
    syncEnabled: process.env.CATMAT_SYNC_ENABLED !== 'false',
    baseUrl: 'https://dadosabertos.compras.gov.br',
    autoClassifyEnabled: process.env.CATMAT_AUTO_CLASSIFY_ENABLED !== 'false',
    autoClassifyMinScore: parseFloat(process.env.CATMAT_AUTO_CLASSIFY_MIN_SCORE ?? '0.55'),
    autoClassifyMaxCandidates: parseInt(process.env.CATMAT_AUTO_CLASSIFY_MAX_CANDIDATES ?? '80', 10),
  },

  ingest: {
    sinceDays: parseInt(process.env.INGEST_SINCE_DAYS ?? '1825', 10),
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
