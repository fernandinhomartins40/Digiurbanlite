/**
 * ============================================================================
 * DIGIURBAN FLOW — Motor de Processos Internos
 * ============================================================================
 * Módulo independente para gestão de tramitação administrativa interna.
 * Segue o mesmo padrão do ultrazend-messages-server.
 * ============================================================================
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { config, validateConfig } from './config/config';
import logger from './utils/logger';
import prisma from './utils/prisma';
import { apiRateLimiter } from './middleware/rate-limit.middleware';

// Rotas
import healthRoutes from './routes/health.routes';
import processRoutes from './routes/process.routes';
import dispatchRoutes from './routes/dispatch.routes';
import inboxRoutes from './routes/inbox.routes';
import workflowRoutes from './routes/workflow.routes';
import documentRoutes from './routes/document.routes';
import analyticsRoutes from './routes/analytics.routes';
import processTypeRoutes from './routes/process-type.routes';
import commentRoutes from './routes/comment.routes';
import signatureRoutes from './routes/signature.routes';

// Workers
import { startSLAWorker } from './workers/sla-checker.worker';
import { startNotifyWorker } from './workers/notify.worker';

class DigiUrbanFlowServer {
  private httpServer!: ReturnType<typeof createServer>;
  private app!: express.Express;

  async start(): Promise<void> {
    try {
      logger.info('Starting DigiUrban Flow Server...');

      // Validar configuração
      validateConfig();

      // Testar conexão com banco de dados
      await this.testDatabaseConnection();

      // Seed dos tipos de processo padrão
      await this.seedDefaultProcessTypes();

      // Criar app Express
      this.app = this.createExpressApp();
      this.httpServer = createServer(this.app);

      // Iniciar workers BullMQ
      this.startWorkers();

      // Iniciar servidor
      this.httpServer.listen(config.port, config.host, () => {
        logger.info(`DigiUrban Flow Server running on ${config.host}:${config.port}`);
        logger.info(`API: http://${config.host}:${config.port}/api/v1`);
        logger.info(`Health: http://${config.host}:${config.port}/api/v1/health`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start DigiUrban Flow Server', { error });
      process.exit(1);
    }
  }

  private createExpressApp(): express.Express {
    const app = express();

    // Trust proxy (atrás de Nginx)
    app.set('trust proxy', true);

    // Segurança
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));
    app.use(compression());
    app.use(cookieParser());

    // Body parsers
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiter
    app.use('/api', apiRateLimiter);

    // Arquivos estáticos (uploads)
    app.use('/uploads', express.static(config.uploadDir));

    // ============================================================
    // REGISTRO DE ROTAS
    // ============================================================
    app.use('/api/v1', healthRoutes);
    app.use('/api/v1/processes', processRoutes);
    app.use('/api/v1/processes', dispatchRoutes);
    app.use('/api/v1/processes', documentRoutes);
    app.use('/api/v1/inbox', inboxRoutes);
    app.use('/api/v1/workflows', workflowRoutes);
    app.use('/api/v1/analytics', analyticsRoutes);
    app.use('/api/v1/process-types', processTypeRoutes);
    app.use('/api/v1/processes', commentRoutes);
    app.use('/api/v1', signatureRoutes);

    // Health check raiz (para Docker healthcheck)
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'digiurban-flow' });
    });

    // 404
    app.use((_req, res) => {
      res.status(404).json({ error: 'Rota não encontrada' });
    });

    // Error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error', { error: err.message, stack: err.stack });
      res.status(500).json({ error: 'Erro interno do servidor' });
    });

    return app;
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      await prisma.$connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Database connection failed', { error });
      throw error;
    }
  }

  private async seedDefaultProcessTypes(): Promise<void> {
    try {
      const count = await prisma.internalProcessType.count();
      if (count > 0) {
        logger.info(`${count} tipos de processo encontrados`);
        return;
      }

      const defaultTypes = [
        { name: 'Memorando', prefix: 'MEM', description: 'Comunicação interna entre setores', defaultSlaHours: 168 },
        { name: 'Ofício', prefix: 'OFI', description: 'Comunicação oficial externa', defaultSlaHours: 240 },
        { name: 'Processo Administrativo', prefix: 'PAD', description: 'Processo administrativo disciplinar ou de gestão', defaultSlaHours: 720 },
        { name: 'Requerimento', prefix: 'REQ', description: 'Solicitação interna de providência', defaultSlaHours: 120 },
        { name: 'Contrato', prefix: 'CTR', description: 'Processo de contratação ou renovação', defaultSlaHours: 480 },
        { name: 'Parecer', prefix: 'PAR', description: 'Solicitação de parecer técnico ou jurídico', defaultSlaHours: 168 },
      ];

      for (const type of defaultTypes) {
        await prisma.internalProcessType.create({ data: type });
      }

      logger.info(`${defaultTypes.length} tipos de processo padrão criados`);
    } catch (error) {
      logger.warn('Seed de tipos de processo falhou (pode já existir)', { error: (error as Error).message });
    }
  }

  private startWorkers(): void {
    try {
      startSLAWorker();
      startNotifyWorker();
      logger.info('BullMQ workers iniciados');
    } catch (error) {
      logger.warn('Workers BullMQ não puderam ser iniciados (Redis indisponível?)', {
        error: (error as Error).message,
      });
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down...`);
      try {
        this.httpServer.close();
        await prisma.$disconnect();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const server = new DigiUrbanFlowServer();
server.start();

export default DigiUrbanFlowServer;
