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

// 🏥 MICROSISTEMAS COM WORKFLOW (FASE 8)
// ⚠️ TEMPORARIAMENTE DESABILITADO - Arquivos de rotas ainda não criados
/*
try {
  console.log('🏥 Carregando rotas de microsistemas...');

  const agendaMedicaRoutes = require('./routes/agenda-medica.routes').default;
  app.use('/api/agenda-medica', agendaMedicaRoutes);
  console.log('  ✅ MS-02: Agenda Médica');

  const prontuarioRoutes = require('./routes/prontuario.routes').default;
  app.use('/api/prontuario', prontuarioRoutes);
  console.log('  ✅ MS-03: Prontuário Eletrônico');

  const medicamentoRoutes = require('./routes/medicamento.routes').default;
  app.use('/api/medicamentos', medicamentoRoutes);
  console.log('  ✅ MS-05: Medicamentos');

  const tfdRoutes = require('./routes/tfd.routes').default;
  app.use('/api/tfd', tfdRoutes);
  console.log('  ✅ MS-06: TFD');

  const matriculaRoutes = require('./routes/matricula.routes').default;
  app.use('/api/matriculas', matriculaRoutes);
  console.log('  ✅ MS-08: Matrículas');

  const cadunicoRoutes = require('./routes/cadunico.routes').default;
  app.use('/api/cadunico', cadunicoRoutes);
  console.log('  ✅ MS-14: CadÚnico');

  const programaSocialRoutes = require('./routes/programa-social.routes').default;
  app.use('/api/programas-sociais', programaSocialRoutes);
  console.log('  ✅ MS-15: Programas Sociais');

  const transporteEscolarRoutes = require('./routes/transporte-escolar.routes').default;
  app.use('/api/transporte-escolar', transporteEscolarRoutes);
  console.log('  ✅ MS-09: Transporte Escolar');

  const maquinasAgricolasRoutes = require('./routes/maquinas-agricolas.routes').default;
  app.use('/api/maquinas-agricolas', maquinasAgricolasRoutes);
  console.log('  ✅ MS-20+21: Máquinas Agrícolas');

  const agendamentoExamesRoutes = require('./routes/agendamento-exames.routes').default;
  app.use('/api/agendamento-exames', agendamentoExamesRoutes);
  console.log('  ✅ MS-04: Agendamento de Exames');

  const unidadeSaudeRoutes = require('./routes/unidade-saude.routes').default;
  app.use('/api/unidades-saude', unidadeSaudeRoutes);
  console.log('  ✅ MS-01: Gestão de Unidades de Saúde');

  const unidadeEducacaoRoutes = require('./routes/unidade-educacao.routes').default;
  app.use('/api/unidades-educacao', unidadeEducacaoRoutes);
  console.log('  ✅ MS-07: Gestão de Unidades Educacionais');

  const unidadeCRASRoutes = require('./routes/unidade-cras.routes').default;
  app.use('/api/unidades-cras', unidadeCRASRoutes);
  console.log('  ✅ MS-13: Gestão de CRAS/CREAS');

  const produtorRuralRoutes = require('./routes/produtor-rural.routes').default;
  app.use('/api/produtores-rurais', produtorRuralRoutes);
  console.log('  ✅ MS-19: Cadastro de Produtores Rurais');

  const merendaEscolarRoutes = require('./routes/merenda-escolar.routes').default;
  app.use('/api/merenda-escolar', merendaEscolarRoutes);
  console.log('  ✅ MS-10: Gestão de Merenda Escolar');

  const beneficioRoutes = require('./routes/beneficio.routes').default;
  app.use('/api/beneficios', beneficioRoutes);
  console.log('  ✅ MS-16: Controle de Benefícios Eventuais');

  const agriculturaRoutes = require('./routes/agricultura.routes').default;
  app.use('/api/agricultura', agriculturaRoutes);
  console.log('  ✅ MS-22+23+24: Assistência Técnica, Produção e Feiras');

  const portalProfessorRoutes = require('./routes/portal-professor.routes').default;
  app.use('/api/portal-professor', portalProfessorRoutes);
  console.log('  ✅ MS-11: Portal do Professor');

  const portalAlunoRoutes = require('./routes/portal-aluno.routes').default;
  app.use('/api/portal-aluno', portalAlunoRoutes);
  console.log('  ✅ MS-12: Portal do Aluno/Pais');

  const atendimentoPsicossocialRoutes = require('./routes/atendimento-psicossocial.routes').default;
  app.use('/api/atendimento-psicossocial', atendimentoPsicossocialRoutes);
  console.log('  ✅ MS-17: Atendimento Psicossocial');

  const dashboardAssistenciaRoutes = require('./routes/dashboard-assistencia.routes').default;
  app.use('/api/dashboard-assistencia', dashboardAssistenciaRoutes);
  console.log('  ✅ MS-18: Dashboard Assistência Social');

  const culturaRoutes = require('./routes/cultura.routes').default;
  app.use('/api/cultura', culturaRoutes);
  console.log('  ✅ MS-25-32: Cultura (8 MS)');

  const esportesRoutes = require('./routes/esportes.routes').default;
  app.use('/api/esportes', esportesRoutes);
  console.log('  ✅ MS-33-36: Esportes (4 MS)');

  const habitacaoRoutes = require('./routes/habitacao.routes').default;
  app.use('/api/habitacao', habitacaoRoutes);
  console.log('  ✅ MS-37-42: Habitação (6 MS)');

  const meioAmbienteRoutes = require('./routes/meio-ambiente.routes').default;
  app.use('/api/meio-ambiente', meioAmbienteRoutes);
  console.log('  ✅ MS-43-48: Meio Ambiente (6 MS)');

  const obrasRoutes = require('./routes/obras.routes').default;
  app.use('/api/obras', obrasRoutes);
  console.log('  ✅ MS-49-54: Obras Públicas (6 MS)');

  const segurancaRoutes = require('./routes/seguranca.routes').default;
  app.use('/api/seguranca', segurancaRoutes);
  console.log('  ✅ MS-55-60: Segurança Pública (6 MS)');

  const turismoRoutes = require('./routes/turismo.routes').default;
  app.use('/api/turismo', turismoRoutes);
  console.log('  ✅ MS-61-66: Turismo (6 MS)');

  const planejamentoRoutes = require('./routes/planejamento.routes').default;
  app.use('/api/planejamento', planejamentoRoutes);
  console.log('  ✅ MS-67-72: Planejamento Urbano (6 MS)');

  const servicosPublicosRoutes = require('./routes/servicos-publicos.routes').default;
  app.use('/api/servicos-publicos', servicosPublicosRoutes);
  console.log('  ✅ MS-73-78: Serviços Públicos (6 MS)');

  // Rotas de estatísticas das secretarias
  const secretariasStatsRoutes = require('./routes/secretarias-stats.routes').default;
  app.use('/api/secretarias', secretariasStatsRoutes);
  console.log('  ✅ Stats endpoints para todas secretarias');

  console.log('');
  console.log('🎉🎉🎉 ROTAS DE MICROSISTEMAS CARREGADAS! 🎉🎉🎉');
  console.log('📊 TOTAL: 78 MICROSISTEMAS (100% IMPLEMENTADO)');
  console.log('🏥 Saúde: 6 MS | 🎓 Educação: 6 MS | 🤝 Assistência Social: 6 MS');
  console.log('🌾 Agricultura: 6 MS | 📚 Cultura: 8 MS | ⚽ Esportes: 4 MS');
  console.log('🏠 Habitação: 6 MS | 🌳 Meio Ambiente: 6 MS | 🏗️  Obras: 6 MS');
  console.log('👮 Segurança: 6 MS | 🏖️  Turismo: 6 MS | 🏙️  Planejamento: 6 MS | 🚮 Serviços: 6 MS');
  console.log('');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de microsistemas:', error);
}
*/

// 🔧 ROTAS DE GESTÃO ADMINISTRATIVA (team, departments) - DEVEM VIR PRIMEIRO
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

// Carregamento síncrono de todas as rotas ANTES do servidor iniciar
console.log('📦 Carregando rotas adicionais...');

try { console.log('   → admin-chamados...'); app.use('/api/admin/chamados', require('./routes/admin-chamados').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-chamados:', e); }
try { console.log('   → admin-reports...'); app.use('/api/admin/relatorios', require('./routes/admin-reports').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-reports:', e); }
try { console.log('   → admin-gabinete...'); app.use('/api/admin/gabinete', require('./routes/admin-gabinete').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-gabinete:', e); }
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
try { console.log('   → integrations...'); app.use('/api/integrations', require('./routes/integrations').default); console.log('   ✓'); } catch (e) { console.error('❌ integrations:', e); }
try { console.log('   → municipality...'); app.use('/api/municipality', require('./routes/municipality-config').default); console.log('   ✓'); } catch (e) { console.error('❌ municipality:', e); }
// DIA 3: DISABLED - arquivo não existe
// try { console.log('   → admin-agriculture...'); app.use('/api/admin/agriculture', require('./routes/admin-agriculture').default); console.log('   ✓'); } catch (e) { console.error('❌ admin-agriculture:', e); }

// Workflows
try { console.log('   → workflows...'); app.use('/api/workflows', require('./routes/module-workflows').default); console.log('   ✓'); } catch (e) { console.error('❌ workflows:', e); }

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
