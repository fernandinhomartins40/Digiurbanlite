import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config, validateConfig } from './config/config';
import { proxyAuthMiddleware, requireUserContext, serviceOnlyAuthMiddleware } from './middleware/auth.middleware';
import { apiRateLimiter } from './middleware/rate-limit.middleware';
import chatRoutes from './routes/chat.routes';
import healthRoutes from './routes/health.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import adminTokensRoutes from './routes/admin-tokens.routes';
import publicRoutes from './routes/public.routes';
import internalRoutes from './routes/internal.routes';
import prisma from './utils/prisma';
import logger from './utils/logger';
import { AiPlanType } from '@prisma/client';
import { ollamaService } from './services/ollama.service';

class DigiUrbanAIServer {
  private app!: express.Express;

  async start(): Promise<void> {
    try {
      validateConfig();
      await prisma.$connect();
      await this.ensureDefaultInternalPlan();
      await this.warmupOllamaIfEnabled();

      this.app = this.createApp();
      this.app.listen(config.port, config.host, () => {
        logger.info('DigiUrban AI server started', {
          host: config.host,
          port: config.port,
          model: config.ollamaModel,
          fallbackModel: config.ollamaFallbackModel,
          ollamaBaseUrl: config.ollamaBaseUrl,
          ollamaTimeoutMs: config.ollamaTimeoutMs,
          ollamaRetryTimeoutMs: config.ollamaRetryTimeoutMs,
          ollamaKeepAlive: config.ollamaKeepAlive,
          ollamaNumCtx: config.ollamaNumCtx,
          ollamaMaxTokens: config.ollamaMaxTokens,
          ollamaWarmupEnabled: config.ollamaWarmupEnabled,
          webSearchEnabled: config.webSearchEnabled,
          webSearchProvider: config.webSearchProvider,
        });
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start DigiUrban AI server', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  }

  private createApp(): express.Express {
    const app = express();

    app.set('trust proxy', 1);

    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
      }),
    );
    app.use(compression());
    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use('/api', apiRateLimiter);

    // Health público
    app.use('/', healthRoutes);
    app.use('/api/v1', healthRoutes);

    // API pública por chave
    app.use('/api/v1', publicRoutes);

    // API interna por token de serviço
    app.use('/api/v1', serviceOnlyAuthMiddleware, internalRoutes);

    // API administrativa/proxy (backend principal)
    app.use('/api/v1', proxyAuthMiddleware, requireUserContext, chatRoutes);
    app.use('/api/v1', proxyAuthMiddleware, requireUserContext, knowledgeRoutes);
    app.use('/api/v1', proxyAuthMiddleware, requireUserContext, adminTokensRoutes);

    app.use((_req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    app.use(
      (
        error: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        logger.error('Unhandled error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Internal server error' });
      },
    );

    return app;
  }

  private async ensureDefaultInternalPlan(): Promise<void> {
    const existing = await prisma.aiApiPlan.findFirst({
      where: {
        tenantId: config.defaultTenantId,
        name: 'Plano Interno Digiurban',
      },
    });

    if (existing) {
      return;
    }

    await prisma.aiApiPlan.create({
      data: {
        tenantId: config.defaultTenantId,
        name: 'Plano Interno Digiurban',
        planType: AiPlanType.INTERNAL,
        requestLimitPerMinute: 240,
        monthlyBudgetTokens: 50_000_000,
        inputTokenLimit: 30_000_000,
        outputTokenLimit: 20_000_000,
        isActive: true,
      },
    });
  }

  private async warmupOllamaIfEnabled(): Promise<void> {
    try {
      await ollamaService.warmup();
    } catch (error) {
      logger.warn('Failed during Ollama warmup sequence', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info('Shutdown signal received', { signal });
      try {
        await prisma.$disconnect();
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', {
          error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const server = new DigiUrbanAIServer();
server.start();
