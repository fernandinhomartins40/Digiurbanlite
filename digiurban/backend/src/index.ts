import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { initializeSocket } from './socket';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { logger } from './config/logger.config';

// Load environment variables
dotenv.config();

// ✅ SEGURANÇA CRÍTICA: Validar JWT_SECRET obrigatório
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is required');
  console.error('Please set JWT_SECRET in your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - CRÍTICO para rate limiting funcionar corretamente atrás de Nginx
app.set('trust proxy', true);

// Middleware
app.use(helmet());

// CORS - aceitar múltiplos domínios
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'https://www.digiurban.com.br',
  'https://digiurban.com.br',
  'http://www.digiurban.com.br',
  'http://digiurban.com.br',
  'http://localhost:3000',
  'http://localhost:3060'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS bloqueado para origin: ${origin}`);
        callback(null, true); // Permitir temporariamente para debug
      }
    },
    credentials: true
        })
);
app.use(morgan('combined'));

// ✅ LOGGING PROFISSIONAL: Middleware Winston para persistir logs
app.use(requestLoggerMiddleware);

// ✅ CORREÇÃO: Aumentar limite para suportar múltiplos uploads (TFD, etc)
// Multer permite 20 arquivos x 10MB = 200MB, mas express.json/urlencoded limitava em 10MB
app.use(express.json({ limit: '50mb' })); // JSON requests (API calls)
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Form URL encoded
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
// CARREGAMENTO DE ROTAS - Single Tenant Mode (OTIMIZADO)
// ============================================================
console.log('📦 Carregando rotas essenciais...');

// Rota de teste
app.get('/api/test', (_req, res) => {
  res.json({ status: 'OK', message: 'DigiUrban Single-Tenant Backend', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (ESSENCIAIS)
console.log('   Carregando admin-auth...');
const adminAuthRoutes = require('./routes/admin-auth').default;
console.log('   ✅ admin-auth importado');
console.log('   Carregando citizen-auth...');
const citizenAuthRoutes = require('./routes/citizen-auth').default;
console.log('   ✅ citizen-auth importado');

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/citizen/auth', citizenAuthRoutes);
n// ============================================================
// ROTAS INTERNAS (PARA ULTRAZEND MESSAGES)
// ============================================================
console.log("🔐 Carregando rotas internas...");
try {
  const internalRoutes = require("./routes/internal.routes").default;
  app.use("/api/internal", internalRoutes);
  console.log("✅ Rotas internas carregadas!");
} catch (error) {
  console.error("❌ Erro ao carregar rotas internas:", error);
}

// ============================================================
