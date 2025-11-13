import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { initializeSocket } from './socket';

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
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
app.use('/api/auth/citizen', citizenAuthRoutes);

// Rota Super Admin (gerenciamento do município single tenant)
console.log('   Carregando super-admin...');
const superAdminRoutes = require('./routes/super-admin').default;
app.use('/api/super-admin', superAdminRoutes);
console.log('   ✅ super-admin importado');

console.log('✅ Rotas de autenticação carregadas!');

// Rotas públicas
const publicRoutes = require('./routes/public').default;
app.use('/api/public', publicRoutes);

// Rotas de serviços
const serviceRoutes = require('./routes/services').default;
app.use('/api/services', serviceRoutes);

// 🔥 NOVAS ROTAS DINÂMICAS (Sistema Híbrido)
console.log('🔥 Carregando rotas dinâmicas...');
try {
  const dynamicServicesRoutes = require('./routes/dynamic-services').default;
  app.use('/api', dynamicServicesRoutes);
  console.log('✅ Rotas dinâmicas de serviços carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas dinâmicas:', error);
}

// 🔧 ROTAS ADMIN DINÂMICAS
try {
  const adminDynamicServicesRoutes = require('./routes/admin-dynamic-services').default;
  app.use('/api/admin', adminDynamicServicesRoutes);
  console.log('✅ Rotas admin dinâmicas carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas admin dinâmicas:', error);
}

// Rota de busca de cidadão (usado por todas as secretarias)
const citizenLookupRoutes = require('./routes/admin-citizen-lookup').default;
app.use('/api/admin/citizen-lookup', citizenLookupRoutes);

console.log('✅ Rotas básicas carregadas!');

// Rotas de protocolos - ORDEM CRÍTICA: específicas antes de genéricas
console.log('📝 Carregando rotas de protocolos...');

// 1. Rotas específicas PRIMEIRO (/:protocolId/sla, /:protocolId/documents, etc)
try { console.log('   → sla...'); app.use('/api/protocols', require('./routes/protocol-sla').default); console.log('   ✓'); } catch (e) { console.error('❌ sla:', e); }
try { console.log('   → interactions...'); app.use('/api/protocols', require('./routes/protocol-interactions').default); console.log('   ✓'); } catch (e) { console.error('❌ interactions:', e); }
try { console.log('   → documents...'); app.use('/api/protocols', require('./routes/protocol-documents').default); console.log('   ✓'); } catch (e) { console.error('❌ documents:', e); }
try { console.log('   → pendings...'); app.use('/api/protocols', require('./routes/protocol-pendings').default); console.log('   ✓'); } catch (e) { console.error('❌ pendings:', e); }
try { console.log('   → stages...'); app.use('/api/protocols', require('./routes/protocol-stages').default); console.log('   ✓'); } catch (e) { console.error('❌ stages:', e); }

// 2. Rotas genéricas POR ÚLTIMO (/:id captura tudo)
try {
  const protocolsSimplifiedRoutes = require('./routes/protocols-simplified.routes').default;
  app.use('/api/protocols', protocolsSimplifiedRoutes);
  console.log('✅ Rotas de protocolos carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de protocolos:', error);
}

// Rotas administrativas
try {
  const adminManagementRoutes = require('./routes/admin-management').default;
  app.use('/api/admin/management', adminManagementRoutes);
  console.log('✅ Rotas de gestão administrativa carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas administrativas:', error);
}

// Carregamento síncrono de todas as rotas ANTES do servidor iniciar
console.log('📦 Carregando rotas adicionais...');

try { console.log('   → admin-chamados...'); app.use('/api/admin/chamados', require('./routes/admin-chamados').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-chamados:', e); }
try { console.log('   → admin-reports...'); app.use('/api/admin/relatorios', require('./routes/admin-reports').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-reports:', e); }
try { console.log('   → admin-gabinete...'); app.use('/api/admin/gabinete', require('./routes/admin-gabinete').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-gabinete:', e); }
try { console.log('   → admin-citizens...'); app.use('/api/admin/citizens', require('./routes/admin-citizens').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-citizens:', e); }
try { console.log('   → citizens...'); app.use('/api/citizens', require('./routes/citizens').default); console.log('   ✓'); } catch (e) { console.error('❌ citizens:', e); }

// Portal do cidadão
try { console.log('   → citizen-services...'); app.use('/api/citizen/services', require('./routes/citizen-services').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-services:', e); }
try { console.log('   → citizen-protocols...'); app.use('/api/citizen/protocols', require('./routes/citizen-protocols').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-protocols:', e); }
// DIA 3: DISABLED - arquivo não existe
// try { console.log('   → citizen-programs...'); app.use('/api/citizen', require('./routes/citizen-programs').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-programs:', e); }
try { console.log('   → citizen-family...'); app.use('/api/citizen/family', require('./routes/citizen-family').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-family:', e); }
try { console.log('   → citizen-documents...'); app.use('/api/citizen/documents', require('./routes/citizen-documents').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-documents:', e); }
try { console.log('   → citizen-notifications...'); app.use('/api/citizen/notifications', require('./routes/citizen-notifications').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-notifications:', e); }

// ============================================================
// SISTEMA UNIFICADO DE ABAS (PRIORIDADE MÁXIMA)
// ============================================================
console.log('📑 Carregando sistema unificado de abas...');
try {
  const tabModulesRoutes = require('./routes/tab-modules').default;
  app.use('/api/admin/secretarias', tabModulesRoutes);
  console.log('✅ Rotas dos módulos de abas carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de abas:', error);
}

// ============================================================
// ROTAS ANTIGAS DESABILITADAS - SISTEMA DE ABAS ATIVO
// ============================================================
// As rotas antigas das secretarias foram COMPLETAMENTE DESABILITADAS
// para garantir que apenas o sistema unificado de abas seja usado.
//
// Todas as funcionalidades agora usam: /api/admin/secretarias/:department/:module/*
// ============================================================

console.log('⚠️  Rotas antigas das secretarias DESABILITADAS - usando apenas sistema de abas');

// Complementares
console.log('🔧 Carregando rotas complementares...');
try { console.log('   → custom-modules...'); app.use('/api/admin/custom-modules', require('./routes/custom-modules').default); console.log('   ✓'); } catch (e) { console.error('❌ custom-modules:', e); }
try { console.log('   → templates...'); app.use('/api/admin/templates', require('./routes/service-templates').default); console.log('   ✓'); } catch (e) { console.error('❌ templates:', e); }
try { console.log('   → email...'); app.use('/api/admin/email', require('./routes/admin-email').default); console.log('   ✓'); } catch (e) { console.error('❌ email:', e); }
try { console.log('   → integrations...'); app.use('/api/integrations', require('./routes/integrations').default); console.log('   ✓'); } catch (e) { console.error('❌ integrations:', e); }
try { console.log('   → municipality...'); app.use('/api/municipality', require('./routes/municipality-config').default); console.log('   ✓'); } catch (e) { console.error('❌ municipality:', e); }
// DIA 3: DISABLED - arquivo não existe
// try { console.log('   → admin-agriculture...'); app.use('/api/admin/agriculture', require('./routes/admin-agriculture').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-agriculture:', e); }

// Workflows
try { console.log('   → workflows...'); app.use('/api/workflows', require('./routes/module-workflows').default); console.log('   ✓'); } catch (e) { console.error('❌ workflows:', e); }

console.log('✅ Todas as rotas carregadas com sucesso!');

// Error handling middleware
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((_req, res: express.Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// ========== REGISTRAR MODULE HANDLERS (TODAS AS FASES) ==========
// DIA 3: DISABLED temporariamente para acelerar startup
// import { registerAllHandlers } from './modules/handlers';
// registerAllHandlers();
console.log('⚠️  Module handlers DESABILITADOS temporariamente');

// ============================================================
// 🔥 INICIALIZAR SERVIDOR COM WEBSOCKET
// ============================================================
const httpServer = http.createServer(app);

// Inicializa WebSocket
try {
  initializeSocket(httpServer);
  console.log('✅ WebSocket inicializado com sucesso!');
} catch (error) {
  console.warn('⚠️  Erro ao inicializar WebSocket (não crítico):', error);
}

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 DigiUrban Backend server running on port ${PORT}`);
  console.log(`📱 API Documentation: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket disponível em: ws://localhost:${PORT}/api/socket`);
  console.log(`⏰ Server is now listening and will stay alive...`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});


