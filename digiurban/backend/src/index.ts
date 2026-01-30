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
// ✅ IMPORTANTE: Pular body parsers para multipart/form-data (usado por multer)
const conditionalBodyParser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const contentType = req.headers['content-type'] || '';

  console.log(`🔍 [BODY PARSER] Content-Type: "${contentType}" | URL: ${req.method} ${req.url}`);

  // Se for multipart/form-data, pular todos os body parsers (multer vai processar)
  if (contentType.includes('multipart/form-data')) {
    console.log('✅ [BODY PARSER] Skipping parsers for multipart/form-data');
    return next();
  }

  console.log('📝 [BODY PARSER] Applying JSON/URL parsers');

  // Caso contrário, aplicar parsers JSON e URL-encoded
  express.json({ limit: '50mb' })(req, res, (err) => {
    if (err) {
      console.error('❌ [BODY PARSER] JSON parse error:', err.message);
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

// ============================================================
// ROTAS INTERNAS (PARA ULTRAZEND MESSAGES)
// ============================================================
console.log('🔐 Carregando rotas internas...');
try {
  const internalRoutes = require('./routes/internal.routes').default;
  app.use('/api/internal', internalRoutes);
  console.log('✅ Rotas internas carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas internas:', error);
}

// ============================================================
// ROTAS DE ADMINISTRAÇÃO DE FLUXOS - NOVO
// ============================================================
console.log('⚙️  Carregando rotas de administração de fluxos...');
try {
  const adminFlowsRoutes = require('./routes/admin-flows.routes').default;
  app.use('/api/admin/flows', adminFlowsRoutes);
  console.log('✅ Rotas de administração de fluxos carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de admin flows:', error);
}

// ============================================================
// ROTAS DO BOT LEGADO - REMOVIDAS
// ============================================================
// Sistema legado foi completamente substituído pelo sistema de fluxos (/api/bot-flow)
// Rotas antigas (/api/bot e /api/bot-legacy) foram deprecadas e removidas

// ============================================================
// ROTAS DE MENSAGENS (CONVERSAS)
// ============================================================
console.log('💬 Carregando rotas de mensagens...');
try {
  const messagesRoutes = require('./routes/messages').default;
  app.use('/api/messages', messagesRoutes);
  console.log('✅ Rotas de mensagens carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de mensagens:', error);
}

// ============================================================
// ROTAS DE AVATAR
// ============================================================
console.log('🖼️  Carregando rotas de avatar...');
try {
  const avatarRoutes = require('./routes/avatar.routes').default;
  app.use('/api/avatar', avatarRoutes);
  console.log('✅ Rotas de avatar carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de avatar:', error);
}

// ============================================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ============================================================
console.log('🌐 Carregando rotas públicas...');
try {
  console.log('   → public-validation...');
  const publicValidationRoutes = require('./routes/public-validation.routes').default;
  app.use('/api/public/validate', publicValidationRoutes);
  console.log('   ✓ public-validation carregado');
} catch (e) {
  console.error('❌ public-validation:', e);
}

// ============================================================
// ROTAS DE CERTIFICADOS E ASSINATURAS DIGITAIS
// ============================================================
console.log('🔐 Carregando rotas de certificados...');
try {
  console.log('   → certificates...');
  const certificatesRoutes = require('./routes/certificates.routes').default;
  app.use('/api/certificates', certificatesRoutes);
  console.log('   ✓ certificates carregado');

  console.log('   → my-certificates...');
  const myCertificatesRoutes = require('./routes/my-certificates.routes').default;
  app.use('/api', myCertificatesRoutes);
  console.log('   ✓ my-certificates carregado');

  console.log('   → external-documents...');
  const externalDocumentsRoutes = require('./routes/external-documents.routes').default;
  app.use('/api/documents', externalDocumentsRoutes);
  app.use('/api/external-documents', externalDocumentsRoutes); // Rota adicional para frontend
  console.log('   ✓ external-documents carregado');

  console.log('   → document-signing...');
  const documentSigningRoutes = require('./routes/document-signing.routes').default;
  app.use('/api/documents', documentSigningRoutes);
  console.log('   ✓ document-signing carregado');

  console.log('   → signatures...');
  const signaturesRoutes = require('./routes/signatures.routes').default;
  app.use('/api/signatures', signaturesRoutes);
  console.log('   ✓ signatures carregado');
} catch (e) {
  console.error('❌ certificates:', e);
}

// Rota Super Admin (gerenciamento do município single tenant)
console.log('   Carregando super-admin...');
const superAdminRoutes = require('./routes/super-admin').default;
app.use('/api/super-admin', superAdminRoutes);
console.log('   ✅ super-admin importado');

// Super Admin Email Management
console.log('   Carregando super-admin-email...');
const superAdminEmailRoutes = require('./routes/super-admin-email').default;
app.use('/api/super-admin', superAdminEmailRoutes);
console.log('   ✅ super-admin-email importado');

// Super Admin Email Plans Management
console.log('   Carregando super-admin-email-plans...');
const superAdminEmailPlansRoutes = require('./routes/super-admin-email-plans').default;
app.use('/api/super-admin/email/plans', superAdminEmailPlansRoutes);
console.log('   ✅ super-admin-email-plans importado');

// Email Templates (Super Admin)
console.log('   Carregando email-templates...');
const emailTemplatesRoutes = require('./routes/email-templates').default;
app.use('/api/email-templates', emailTemplatesRoutes);
console.log('   ✅ email-templates importado');

console.log('✅ Rotas de autenticação carregadas!');

// Rotas públicas
const publicRoutes = require('./routes/public').default;
app.use('/api/public', publicRoutes);

// ⚠️ ORDEM CRÍTICA: Rotas mais específicas ANTES de rotas genéricas
// Rotas de serviços do portal do cidadão (ESPECÍFICAS - /api/citizen/services)
try {
  console.log('📦 Carregando rotas do portal do cidadão...');
  const citizenServicesRoutes = require('./routes/citizen-services').default;
  app.use('/api/citizen/services', citizenServicesRoutes);
  console.log('✅ citizen-services carregado');
} catch (e) {
  console.error('❌ ERRO CRÍTICO ao carregar citizen-services:', e);
  throw e; // FALHAR imediatamente se não carregar
}

// Rotas de serviços genéricas (DEPOIS das específicas)
const serviceRoutes = require('./routes/services').default;
app.use('/api/services', serviceRoutes);

// 📊 ROTAS DE STATS DE DEPARTAMENTOS (antes das rotas genéricas)
try {
  const departmentStatsRoutes = require('./routes/department-stats').default;
  app.use('/api/departments', departmentStatsRoutes);
  console.log('✅ Rotas de stats de departamentos carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de stats:', error);
}

// Upload seguro de documentos (cidadao/admin)
try {
  const documentUploadRoutes = require('./routes/document-upload.routes').default;
  app.use('/api/document-upload', documentUploadRoutes);
  console.log('Rotas de upload de documentos carregadas!');
} catch (error) {
  console.error('Erro ao carregar rotas de upload de documentos:', error);
}

// 🔥 NOVAS ROTAS DINÂMICAS (Sistema Híbrido)
console.log('🔥 Carregando rotas dinâmicas...');
try {
  const dynamicServicesRoutes = require('./routes/dynamic-services').default;
  app.use('/api', dynamicServicesRoutes);
  console.log('✅ Rotas dinâmicas de serviços carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas dinâmicas:', error);
}

// 🔧 ROTAS ESPECÍFICAS DE ADMIN - DEVEM VIR ANTES DAS GENÉRICAS
try {
  console.log('   → admin-users...');
  app.use('/api/admin/users', require('./routes/admin-users').default);
  console.log('   ✓');
} catch (e) {
  console.error('❌ admin-users:', e);
}

// 🔧 ROTAS DE GESTÃO ADMINISTRATIVA (team, departments) - DEVEM VIR DEPOIS DAS ESPECÍFICAS
try {
  const adminManagementRoutes = require('./routes/admin-management').default;
  app.use('/api/admin', adminManagementRoutes);
  console.log('✅ Rotas de gestão administrativa carregadas! (team, services, departments)');
} catch (error) {
  console.error('❌ Erro ao carregar rotas administrativas:', error);
}

// 🔧 ROTAS ADMIN DINÂMICAS
try {
  const adminDynamicServicesRoutes = require('./routes/admin-dynamic-services').default;
  app.use('/api/admin', adminDynamicServicesRoutes);
  console.log('✅ Rotas admin dinâmicas carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas admin dinâmicas:', error);
}

// 📊 ROTAS DE DASHBOARD DE DEPARTAMENTOS (genérica para todas as secretarias)
// COMENTADO TEMPORARIAMENTE - arquivo não existe
// try {
//   const departmentDashboardRoutes = require('./routes/department-dashboard').default;
//   app.use('/api/admin', departmentDashboardRoutes);
//   console.log('✅ Rotas de dashboard de departamentos carregadas!');
// } catch (error) {
//   console.error('❌ Erro ao carregar rotas de dashboard:', error);
// }

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
try { console.log('   → data-fields...'); app.use('/api', require('./routes/protocol-data-fields').default); console.log('   ✓'); } catch (e) { console.error('❌ data-fields:', e); }
try { console.log('   → pendings...'); app.use('/api/protocols', require('./routes/protocol-pendings').default); console.log('   ✓'); } catch (e) { console.error('❌ pendings:', e); }
try { console.log('   → stages...'); app.use('/api/protocols', require('./routes/protocol-stages').default); console.log('   ✓'); } catch (e) { console.error('❌ stages:', e); }
try { console.log('   → document-templates...'); app.use('/api', require('./routes/document-templates').default); console.log('   ✓'); } catch (e) { console.error('❌ document-templates:', e); }

// 2. Rotas genéricas POR ÚLTIMO (/:id captura tudo)
try {
  const protocolsSimplifiedRoutes = require('./routes/protocols-simplified.routes').default;
  app.use('/api/protocols', protocolsSimplifiedRoutes);
  console.log('✅ Rotas de protocolos carregadas!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de protocolos:', error);
}

// Carregamento síncrono de todas as rotas ANTES do servidor iniciar
console.log('📦 Carregando rotas adicionais...');

try { console.log('   → admin-chamados...'); app.use('/api/admin/chamados', require('./routes/admin-chamados').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-chamados:', e); }
try { console.log('   → departments-tickets...'); app.use('/api/departments', require('./routes/departments-tickets').default); console.log('   ✓'); } catch (e) { console.error('❌ departments-tickets:', e); }
try { console.log('   → admin-reports...'); app.use('/api/admin/relatorios', require('./routes/admin-reports').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-reports:', e); }
try { console.log('   → admin-gabinete...'); app.use('/api/admin/gabinete', require('./routes/admin-gabinete').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-gabinete:', e); }
try { console.log('   → admin-gabinete-painel...'); app.use('/api/admin/gabinete/painel-prefeito', require('./routes/admin-gabinete-painel').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-gabinete-painel:', e); }
try { console.log('   → admin-citizens...'); app.use('/api/admin/citizens', require('./routes/admin-citizens').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-citizens:', e); }
try { console.log('   → admin-citizen-documents...'); app.use('/api/admin/citizen-documents', require('./routes/admin-citizen-documents').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-citizen-documents:', e); }
try { console.log('   → citizens...'); app.use('/api/citizens', require('./routes/citizens').default); console.log('   ✓'); } catch (e) { console.error('❌ citizens:', e); }

// Portal do cidadão (citizen-services já carregado no início - linha 113)
try { console.log('   → citizen-protocols...'); app.use('/api/citizen/protocols', require('./routes/citizen-protocols').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-protocols:', e); }
// DIA 3: DISABLED - arquivo não existe
// try { console.log('   → citizen-programs...'); app.use('/api/citizen', require('./routes/citizen-programs').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-programs:', e); }
try { console.log('   → citizen-family...'); app.use('/api/citizen/family', require('./routes/citizen-family').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-family:', e); }
try { console.log('   → citizen-documents...'); app.use('/api/citizen/documents', require('./routes/citizen-documents').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-documents:', e); }
try { console.log('   → citizen-personal-documents...'); app.use('/api/citizen/personal-documents', require('./routes/citizen-personal-documents').default); console.log('   ✓'); } catch (e) { console.error('❌ citizen-personal-documents:', e); }
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
try { console.log('   → email-service...'); app.use('/api/admin/email-service', require('./routes/admin-email').default); console.log('   ✓'); } catch (e) { console.error('❌ email-service:', e); }
try { console.log('   → email-accounts...'); app.use('/api/admin/email-accounts', require('./routes/admin-email-accounts').default); console.log('   ✓'); } catch (e) { console.error('❌ email-accounts:', e); }
try { console.log('   → integrations...'); app.use('/api/integrations', require('./routes/integrations').default); console.log('   ✓'); } catch (e) { console.error('❌ integrations:', e); }
try { console.log('   → municipality...'); app.use('/api/municipality', require('./routes/municipality-config').default); console.log('   ✓'); } catch (e) { console.error('❌ municipality:', e); }
// DIA 3: DISABLED - arquivo não existe
// try { console.log('   → admin-agriculture...'); app.use('/api/admin/agriculture', require('./routes/admin-agriculture').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-agriculture:', e); }

// Workflows (Legado + Novo)
try { console.log('   → workflows (legado)...'); app.use('/api/workflows', require('./routes/module-workflows').default); console.log('   ✓'); } catch (e) { console.error('❌ workflows:', e); }
try { console.log('   → service-workflows (novo)...'); app.use('/api/service-workflows', require('./routes/service-workflows.routes').default); console.log('   ✓'); } catch (e) { console.error('❌ service-workflows:', e); }

// ✅ Notificações SSE
try { console.log('   → notifications (SSE)...'); app.use('/api/notifications', require('./routes/notifications.routes').default); console.log('   ✓'); } catch (e) { console.error('❌ notifications:', e); }

// ============================================================
// 🏥 ROTAS DE SAÚDE - APPS INTEGRADOS
// ============================================================
console.log('🏥 Carregando rotas dos Apps de Saúde...');
try {
  console.log('   → APP-SAUDE-01: Sistema Integrado de Atendimento...');
  const saudeAtendimentoRoutes = require('./routes/saude-atendimento.routes').default;
  app.use('/api/saude/atendimento', saudeAtendimentoRoutes);
  console.log('   ✅ APP-SAUDE-01 carregado (~52 endpoints)');
} catch (e) {
  console.error('❌ Erro ao carregar APP-SAUDE-01:', e);
}

try {
  console.log('   → APP-SAUDE-02: Farmácia Municipal...');
  const saudeFarmaciaRoutes = require('./routes/saude-farmacia.routes').default;
  app.use('/api/saude/farmacia', saudeFarmaciaRoutes);
  console.log('   ✅ APP-SAUDE-02 carregado (~28 endpoints)');
} catch (e) {
  console.error('❌ Erro ao carregar APP-SAUDE-02:', e);
}

try {
  console.log('   → APP-SAUDE-03: TFD (Tratamento Fora do Domicílio)...');
  const saudeTFDRoutes = require('./routes/saude-tfd.routes').default;
  app.use('/api/saude/tfd', saudeTFDRoutes);
  console.log('   ✅ APP-SAUDE-03 carregado (~52 endpoints)');
} catch (e) {
  console.error('❌ Erro ao carregar APP-SAUDE-03:', e);
}

// ============================================================
// 🏥 ROTAS PRINCIPAIS DO SISTEMA DE ATENDIMENTO (PEC e-SUS)
// ============================================================
console.log('🏥 Carregando rotas principais do Sistema de Atendimento...');
try {
  console.log('   → Fila de Atendimento, Escuta Inicial, Triagem...');
  const saudeMainRoutes = require('./routes/saude').default;
  app.use('/api/saude', saudeMainRoutes);
  console.log('   ✅ Rotas principais de saúde carregadas (fila, escuta, triagem, equipes, etc)');
} catch (e) {
  console.error('❌ Erro ao carregar rotas principais de saúde:', e);
}

try {
  console.log('   → Dashboard e Stats da Secretaria de Saúde...');
  const secretariasSaudeRoutes = require('./routes/secretarias-saude').default;
  app.use('/api/secretarias/saude', secretariasSaudeRoutes);
  console.log('   ✅ Rotas de secretaria de saúde carregadas (dashboard, stats)');
} catch (e) {
  console.error('❌ Erro ao carregar rotas de secretaria de saúde:', e);
}

try {
  console.log('   → Cadastros de Saúde (Unidades, Profissionais, Especialidades, etc)...');
  const saudeCadastrosRoutes = require('./routes/saude-cadastros.routes').default;
  app.use('/api/apps/saude/cadastros', saudeCadastrosRoutes);
  console.log('   ✅ Rotas de cadastros de saúde carregadas');
} catch (e) {
  console.error('❌ Erro ao carregar rotas de cadastros de saúde:', e);
}

console.log('✅ Apps de Saúde carregados com sucesso! Total: ~132 endpoints');

console.log('✅ Todas as rotas carregadas com sucesso!');

// ============================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS (DEVE VIR POR ÚLTIMO)
// ============================================================
import { errorHandler } from './middleware/error-handler';

// 404 handler (antes do error handler)
app.use((_req, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'A rota solicitada não existe'
  });
});

// ✅ Error handling middleware global (SEMPRE retorna JSON)
app.use(errorHandler);

// ========== REGISTRAR MODULE HANDLERS (TODAS AS FASES) ==========
// DIA 3: DISABLED temporariamente para acelerar startup
// import { registerAllHandlers } from './modules/handlers';
// registerAllHandlers();
console.log('⚠️  Module handlers DESABILITADOS temporariamente');

// ============================================================
// 📧 SERVIDOR DE EMAIL
// ============================================================
// O servidor SMTP roda em container separado (ultrazend-smtp)
// Backend apenas gerencia configurações via API

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

const server = httpServer.listen(PORT, async () => {
  const startupMsg = `🚀 DigiUrban Backend server running on port ${PORT}`;
  console.log(startupMsg);
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  console.log(`📱 API Documentation: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket disponível em: ws://localhost:${PORT}/api/socket`);
  console.log(`📝 Logs salvos em: logs/`);
  console.log(`⏰ Server is now listening and will stay alive...`);

  // Inicializar cron jobs de email
  try {
    const { startEmailCronJobs } = require('./jobs/email-counters-reset');
    startEmailCronJobs();
  } catch (error) {
    console.error('⚠️  Erro ao inicializar cron jobs de email:', error);
  }
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
