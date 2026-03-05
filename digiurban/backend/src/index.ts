import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { initializeSocket } from './socket';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { logger } from './config/logger.config';
import { apiRateLimiter } from './middleware/rate-limit';

// Load environment variables
dotenv.config();

// SEGURANÇA CRÍTICA: Validar JWT_SECRET obrigatório
if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET environment variable is required. Set JWT_SECRET in .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - CRÍTICO para rate limiting funcionar corretamente atrás de Nginx
// Usar número em vez de true para compatibilidade com express-rate-limit (evita ERR_ERL_PERMISSIVE_TRUST_PROXY)
app.set('trust proxy', 1);

// Middleware de segurança — Helmet com CSP customizado
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir iframes para preview de templates
}));

// CORS - aceitar múltiplos domínios com whitelist estrita
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  'http://localhost:3000',
  'http://localhost:3060'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests sem origin: health checks (Nginx/Docker), SSR (Next.js), mobile apps, Postman
      // CORS é proteção de BROWSER — requests server-to-server nunca enviam Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS bloqueado para origin não autorizado: ${origin}`);
        callback(new Error(`Origin ${origin} não permitido pelo CORS`));
      }
    },
    credentials: true,
    maxAge: 86400 // Cache preflight por 24h
  })
);
// Rate limiting global — 100 req/min por IP (rotas de auth têm limites próprios mais restritos)
app.use('/api', apiRateLimiter);

// Logging estruturado via Winston (substituiu Morgan)
app.use(requestLoggerMiddleware);

// Body parser condicional: pula multipart/form-data (Multer processa)
const conditionalBodyParser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  express.json({ limit: '50mb' })(req, res, (err) => {
    if (err) {
      logger.error('Body parser JSON error', { error: err.message, url: req.url });
      return next(err);
    }
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  });
};

app.use(conditionalBodyParser);
app.use(cookieParser()); // Parser de cookies para httpOnly tokens

// Servir arquivos de upload de forma segura
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (_req, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'DigiUrban Backend API is running',
    timestamp: new Date().toISOString()
        });
});

// ============================================================
// HANDLER REGISTRY - REMOVIDO
// ============================================================
// Sistema de handlers legado foi substituído pelo sistema de templates
// Handlers não são mais necessários - rotas geradas consomem ServiceSimplified.formSchema dinamicamente

// ============================================================
// CARREGAMENTO DE ROTAS - Single Tenant Mode
// ============================================================
logger.info('Loading routes...');

// Rota de teste
app.get('/api/test', (_req, res) => {
  res.json({ status: 'OK', message: 'DigiUrban Single-Tenant Backend', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (ESSENCIAIS)
const adminAuthRoutes = require('./routes/admin-auth').default;
const citizenAuthRoutes = require('./routes/citizen-auth').default;

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/citizen/auth', citizenAuthRoutes);

// Rotas de preferências do usuário admin
try {
  const adminPreferencesRoutes = require('./routes/admin-preferences').default;
  app.use('/api/admin/preferences', adminPreferencesRoutes);
} catch (error) {
  logger.error('Failed to load admin-preferences routes', { error });
}

// ============================================================
// REGISTRO DE ROTAS — helper para try/catch padronizado
// ============================================================
function loadRoute(prefix: string, modulePath: string) {
  try {
    const loaded = require(modulePath);
    const router = loaded?.default || loaded;

    if (typeof router !== 'function') {
      throw new Error(`Route module "${modulePath}" does not export a router function`);
    }

    app.use(prefix, router);
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { message: String(error) };

    logger.error(`Failed to load route: ${prefix} (${modulePath})`, { error: normalizedError });
  }
}

// Rotas internas (Messages Server)
loadRoute('/api/internal', './routes/internal.routes');

// Módulo de Pesquisa de Preços Públicos (proxy → digiurban-prices)
loadRoute('/api/prices', './routes/prices-proxy.routes');

// Módulo de Processos Internos (proxy → digiurban-flow)
loadRoute('/api/flow', './routes/flow-proxy.routes');

// Administração de fluxos do bot
loadRoute('/api/admin/flows', './routes/admin-flows.routes');

// Mensagens (conversas)
loadRoute('/api/messages', './routes/messages');

// Agenda centralizada
loadRoute('/api/agenda', './routes/agenda.routes');

// Avatar
loadRoute('/api/avatar', './routes/avatar.routes');

// Rotas públicas (sem autenticação)
loadRoute('/api/public/validate', './routes/public-validation.routes');

// Certificados e assinaturas digitais
try {
  app.use('/api/certificates', require('./routes/certificates.routes').default);
  app.use('/api', require('./routes/my-certificates.routes').default);
  app.use('/api/documents', require('./routes/external-documents.routes').default);
  app.use('/api/external-documents', require('./routes/external-documents.routes').default);
  app.use('/api/documents', require('./routes/document-signing.routes').default);
  app.use('/api/signatures', require('./routes/signatures.routes').default);
} catch (e) {
  logger.error('Failed to load certificates/signing routes', { error: e });
}

// Super Admin
const superAdminRoutes = require('./routes/super-admin').default;
app.use('/api/super-admin', superAdminRoutes);

const superAdminEmailRoutes = require('./routes/super-admin-email').default;
app.use('/api/super-admin', superAdminEmailRoutes);

const superAdminEmailPlansRoutes = require('./routes/super-admin-email-plans').default;
app.use('/api/super-admin/email/plans', superAdminEmailPlansRoutes);

// Email Templates
const emailTemplatesRoutes = require('./routes/email-templates').default;
app.use('/api/email-templates', emailTemplatesRoutes);

// Rotas públicas
const publicRoutes = require('./routes/public').default;
app.use('/api/public', publicRoutes);

// ORDEM CRITICA: Rotas mais especificas ANTES de rotas genericas
try {
  const citizenServicesRoutes = require('./routes/citizen-services').default;
  app.use('/api/citizen/services', citizenServicesRoutes);
} catch (e) {
  logger.error('CRITICAL: Failed to load citizen-services routes', { error: e });
  throw e;
}

const serviceRoutes = require('./routes/services').default;
app.use('/api/services', serviceRoutes);

// Stats de departamentos
loadRoute('/api/departments', './routes/department-stats');

// Upload seguro de documentos
loadRoute('/api/document-upload', './routes/document-upload.routes');

// Rotas dinâmicas
loadRoute('/api', './routes/dynamic-services');

// Admin - rotas especificas antes de genericas
loadRoute('/api/admin/users', './routes/admin-users');
loadRoute('/api/admin/departments', './routes/admin-departments');
loadRoute('/api/admin', './routes/admin-management');
loadRoute('/api/admin', './routes/admin-dynamic-services');

// Busca de cidadão
const citizenLookupRoutes = require('./routes/admin-citizen-lookup').default;
app.use('/api/admin/citizen-lookup', citizenLookupRoutes);

// Protocolos - ORDEM CRITICA: especificas antes de genericas
loadRoute('/api/protocols', './routes/protocol-sla');
loadRoute('/api/protocols', './routes/protocol-interactions');
loadRoute('/api/protocols', './routes/protocol-documents');
loadRoute('/api', './routes/protocol-data-fields');
loadRoute('/api/protocols', './routes/protocol-pendings');
loadRoute('/api/protocols', './routes/protocol-stages');
loadRoute('/api/protocols', './routes/protocol-citizen-links.routes');
loadRoute('/api', './routes/document-templates');

// Rotas genericas de protocolos POR ULTIMO (/:id captura tudo)
loadRoute('/api/protocols', './routes/protocols-simplified.routes');

// Rotas adicionais
loadRoute('/api/admin/chamados', './routes/admin-chamados');
loadRoute('/api/departments', './routes/departments-tickets');
loadRoute('/api/admin/relatorios', './routes/admin-reports');
loadRoute('/api/admin/gabinete', './routes/admin-gabinete');
loadRoute('/api/admin/gabinete/painel-prefeito', './routes/admin-gabinete-painel');
loadRoute('/api/admin/citizens', './routes/admin-citizens');
loadRoute('/api/admin/citizen-documents', './routes/admin-citizen-documents');
loadRoute('/api/citizens', './routes/citizens');

// Portal do cidadão
loadRoute('/api/citizen/protocols', './routes/citizen-protocols');
loadRoute('/api/citizen/family', './routes/citizen-family');
loadRoute('/api/citizen/family', './routes/family-invites');
loadRoute('/api/citizen/documents', './routes/citizen-documents');
loadRoute('/api/citizen/personal-documents', './routes/citizen-personal-documents');
loadRoute('/api/citizen/notifications', './routes/citizen-notifications');

// Sistema unificado de abas
loadRoute('/api/admin/secretarias', './routes/tab-modules');

// Analytics
loadRoute('/api/protocol-analytics', './routes/protocol-analytics.routes');
loadRoute('/api/analytics', './routes/analytics');

// Complementares
loadRoute('/api/admin/custom-modules', './routes/custom-modules');
loadRoute('/api/admin/email', './routes/admin-email');
loadRoute('/api/admin/email-service', './routes/admin-email');
loadRoute('/api/admin/email-accounts', './routes/admin-email-accounts');
loadRoute('/api/integrations', './routes/integrations');
loadRoute('/api/municipality', './routes/municipality-config');
loadRoute('/api/apresentacao', './routes/apresentacao-export');

// Workflows
loadRoute('/api/workflows', './routes/module-workflows');
loadRoute('/api/service-workflows', './routes/service-workflows.routes');

// Notificações
loadRoute('/api/notifications', './routes/notifications.routes');
loadRoute('/api/push', './routes/push-subscriptions.routes');
loadRoute('/api/notifications', './routes/notification-preferences.routes');

// Workers e cron jobs
try { require('./workers/notification.worker'); } catch (e) { logger.error('Failed to start notification worker', { error: e }); }
try { require('./jobs/notification.jobs'); } catch (e) { logger.error('Failed to start notification cron jobs', { error: e }); }

// Saúde - Apps integrados
loadRoute('/api/saude/atendimento', './routes/saude-atendimento.routes');
try {
  const saudeFarmaciaRoutes = require('./routes/saude-farmacia.routes').default;
  app.use('/api/saude/farmacia', saudeFarmaciaRoutes);
  app.use('/api/apps/saude/farmacia', saudeFarmaciaRoutes);
} catch (e) { logger.error('Failed to load saude-farmacia routes', { error: e }); }
loadRoute('/api/saude/tfd', './routes/saude-tfd.routes');
loadRoute('/api/saude', './routes/saude');
loadRoute('/api/secretarias/saude', './routes/secretarias-saude');
loadRoute('/api/apps/saude/cadastros', './routes/saude-cadastros.routes');

// Dashboards: Educação e Assistência Social
loadRoute('/api/secretarias/educacao', './routes/secretarias-educacao');
loadRoute('/api/secretarias/assistencia-social', './routes/secretarias-assistencia-social');

// Sistema Unificado de Vinculação de Servidores V2.0
try {
  app.use('/api/organizational-units', require('./routes/organizational-units.routes').default);
  app.use('/api/positions', require('./routes/positions.routes').default);
  app.use('/api/functions', require('./routes/functions.routes').default);
  app.use('/api/employee-assignments', require('./routes/employee-assignments.routes').default);
  app.use('/api/employee-hierarchies', require('./routes/employee-hierarchies.routes').default);
  app.use('/api/teams', require('./routes/teams.routes').default);
  app.use('/api/professional-data', require('./routes/professional-data.routes').default);
} catch (e) {
  logger.error('Failed to load organizational/employee routes', { error: e });
}

// Adaptadoras: Saúde → Sistema Unificado V2.0
loadRoute('/api/saude', './routes/saude-unified-adapter.routes');

logger.info('All routes loaded successfully');

// ============================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS (DEVE VIR POR ULTIMO)
// ============================================================
import { errorHandler } from './middleware/error-handler';

// 404 handler
app.use((_req, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'A rota solicitada não existe'
  });
});

// Error handling middleware global (SEMPRE retorna JSON)
app.use(errorHandler);

// ============================================================
// INICIALIZAR SERVIDOR COM WEBSOCKET
// ============================================================
const httpServer = http.createServer(app);

try {
  initializeSocket(httpServer);
  logger.info('WebSocket initialized');
} catch (error) {
  logger.warn('WebSocket initialization failed (non-critical)', { error });
}

const server = httpServer.listen(PORT, async () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    healthCheck: `http://localhost:${PORT}/health`,
    websocket: `ws://localhost:${PORT}/api/socket`
  });

  // Inicializar cron jobs de email
  try {
    const { startEmailCronJobs } = require('./jobs/email-counters-reset');
    startEmailCronJobs();
  } catch (error) {
    logger.error('Failed to start email cron jobs', { error });
  }
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error('Server error', { error });
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
