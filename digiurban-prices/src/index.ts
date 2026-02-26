import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config';
import { logger } from './utils/logger';
import { prisma } from './models/prisma';
import { ensureIndexExists } from './search_index/opensearch.client';
import { startIngestWorker, triggerIngest } from './ingest/ingest.worker';
import { startIngestScheduler } from './ingest/scheduler';
import { apiKeyMiddleware } from './api/middlewares/auth.middleware';
import { defaultRateLimiter } from './api/middlewares/rate-limit.middleware';

// Routes
import healthRouter from './api/routes/health.routes';
import searchRouter from './api/routes/search.routes';
import reportsRouter from './api/routes/reports.routes';
import auditsRouter from './api/routes/audits.routes';
import ingestRouter from './api/routes/ingest.routes';
import catmatRouter from './api/routes/catmat.routes';
import suppliersRouter from './api/routes/suppliers.routes';

const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARES GLOBAIS
// ─────────────────────────────────────────────

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (servidores internos, curl, etc.)
    if (!origin) return callback(null, true);
    // Em produção, validar contra lista de origens permitidas
    if (config.nodeEnv === 'development') return callback(null, true);
    const allowed = (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim());
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

app.use(defaultRateLimiter);

// Parse body (exceto para multipart — o multer cuida disso)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] ?? '';
  if (contentType.includes('multipart/form-data')) return next();
  express.json({ limit: '1mb' })(req, res, next);
});

// ─────────────────────────────────────────────
// ROTAS DE SAÚDE (sem autenticação)
// ─────────────────────────────────────────────
app.use('/api/v1', healthRouter);

// ─────────────────────────────────────────────
// AUTENTICAÇÃO (protege todas as demais rotas)
// ─────────────────────────────────────────────
app.use('/api/v1', apiKeyMiddleware);

// ─────────────────────────────────────────────
// ROTAS PROTEGIDAS
// ─────────────────────────────────────────────
app.use('/api/v1', searchRouter);
app.use('/api/v1', reportsRouter);
app.use('/api/v1', auditsRouter);
app.use('/api/v1', ingestRouter);
app.use('/api/v1', catmatRouter);
app.use('/api/v1', suppliersRouter);

// ─────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('[API] Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────
async function start() {
  // Aguardar banco
  try {
    await prisma.$connect();
    logger.info('[Startup] PostgreSQL connected');
  } catch (err) {
    logger.error('[Startup] PostgreSQL connection failed', { error: (err as Error).message });
    process.exit(1);
  }

  // Criar índice OpenSearch (se não existir)
  try {
    await ensureIndexExists();
    logger.info('[Startup] OpenSearch index ready');
  } catch (err) {
    logger.warn('[Startup] OpenSearch not available — search may be degraded', {
      error: (err as Error).message,
    });
  }

  // Iniciar worker de ingestão
  startIngestWorker();
  logger.info('[Startup] Ingest worker started');

  // Iniciar scheduler de ingestão
  startIngestScheduler();
  logger.info('[Startup] Ingest scheduler started');

  // Disparar ingestão inicial se nunca houve dados
  try {
    const lastRun = await prisma.ingestRun.findFirst({
      where: { status: 'completed' },
    });
    if (!lastRun) {
      logger.info('[Startup] No completed ingest found — triggering initial ingest');
      await triggerIngest({ triggeredBy: 'startup', sinceDays: 365 });
    }
  } catch (err) {
    logger.warn('[Startup] Could not check/trigger initial ingest', { error: (err as Error).message });
  }

  // Iniciar servidor HTTP
  const server = app.listen(config.port, () => {
    logger.info(`[Startup] DigiUrban Prices API running on port ${config.port}`, {
      env: config.nodeEnv,
      port: config.port,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`[Shutdown] Signal ${signal} received`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('[Shutdown] Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('[Startup] Fatal error', { error: (err as Error).message });
  process.exit(1);
});
