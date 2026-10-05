import compression from 'compression';
import cors from 'cors';
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import serviceAuthMiddleware from '../middleware/service-auth';
import facePlatformRoutes from '../routes/face-platform.routes';
import logger from '../utils/logger';

export class ExpressServer {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  public getApp() {
    return this.app;
  }

  private setupMiddlewares() {
    this.app.set('trust proxy', 1);

    this.app.use(helmet());
    // Só o backend chama este serviço (rede interna): navegador nenhum entra aqui
    this.app.use(cors({ origin: false }));
    this.app.use(express.json({ limit: '12mb' }));
    this.app.use(compression());
    // As fotos da biometria NÃO são mais servidas abertas em /uploads: saem só
    // pelo backend, para quem tem permissão, e cada acesso é registrado.

    const limiter = rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
      max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300),
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  private setupRoutes() {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'ultrazend-face-server',
        timestamp: new Date().toISOString(),
      });
    });

    this.app.use('/api/face-platform', (req, res, next) => void serviceAuthMiddleware(req, res, next), facePlatformRoutes);

    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private setupErrorHandlers() {
    this.app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled express error', { error: error?.message || error });
      res.status(500).json({
        error: 'Internal server error',
      });
    });
  }
}

export default ExpressServer;
