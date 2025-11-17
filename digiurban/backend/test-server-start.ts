/**
 * Teste detalhado de inicialização do servidor
 * Identifica exatamente onde o servidor está travando
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

console.log('🚀 TESTE DE INICIALIZAÇÃO DO SERVIDOR\n');
console.log('═'.repeat(80));

// Carregar variáveis de ambiente
console.log('\n📋 Passo 1: Carregando variáveis de ambiente...');
dotenv.config();
console.log('✅ Variáveis de ambiente carregadas');

// Verificar JWT_SECRET
console.log('\n🔐 Passo 2: Verificando JWT_SECRET...');
if (!process.env.JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não configurado!');
  process.exit(1);
}
console.log('✅ JWT_SECRET configurado');

// Criar aplicação Express
console.log('\n🌐 Passo 3: Criando aplicação Express...');
const app = express();
const PORT = process.env.PORT || 3001;
console.log('✅ Aplicação Express criada');

// Configurar middlewares
console.log('\n⚙️  Passo 4: Configurando middlewares...');
app.use(helmet());
console.log('   ✅ Helmet configurado');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true
}));
console.log('   ✅ CORS configurado');

app.use(morgan('combined'));
console.log('   ✅ Morgan configurado');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('   ✅ Body parsers configurados');

app.use(cookieParser());
console.log('   ✅ Cookie parser configurado');

// Health check
console.log('\n💚 Passo 5: Configurando health check...');
app.get('/health', (_req, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor de teste está funcionando',
    timestamp: new Date().toISOString()
  });
});
console.log('✅ Health check configurado');

// Carregar rotas críticas uma por uma
console.log('\n📦 Passo 6: Carregando rotas críticas...');

try {
  console.log('   Carregando admin-auth...');
  const adminAuthRoutes = require('./src/routes/admin-auth').default;
  app.use('/api/admin/auth', adminAuthRoutes);
  console.log('   ✅ admin-auth carregada');
} catch (error: any) {
  console.error('   ❌ Erro ao carregar admin-auth:', error.message);
}

try {
  console.log('   Carregando citizen-auth...');
  const citizenAuthRoutes = require('./src/routes/citizen-auth').default;
  app.use('/api/auth/citizen', citizenAuthRoutes);
  console.log('   ✅ citizen-auth carregada');
} catch (error: any) {
  console.error('   ❌ Erro ao carregar citizen-auth:', error.message);
}

try {
  console.log('   Carregando public...');
  const publicRoutes = require('./src/routes/public').default;
  app.use('/api/public', publicRoutes);
  console.log('   ✅ public carregada');
} catch (error: any) {
  console.error('   ❌ Erro ao carregar public:', error.message);
}

try {
  console.log('   Carregando services...');
  const serviceRoutes = require('./src/routes/services').default;
  app.use('/api/services', serviceRoutes);
  console.log('   ✅ services carregada');
} catch (error: any) {
  console.error('   ❌ Erro ao carregar services:', error.message);
}

try {
  console.log('   Carregando protocols-simplified...');
  const protocolsRoutes = require('./src/routes/protocols-simplified.routes').default;
  app.use('/api/protocols', protocolsRoutes);
  console.log('   ✅ protocols-simplified carregada');
} catch (error: any) {
  console.error('   ❌ Erro ao carregar protocols-simplified:', error.message);
}

// Error handling
console.log('\n🛡️  Passo 7: Configurando error handlers...');
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use((_req, res: express.Response) => {
  res.status(404).json({ message: 'Route not found' });
});
console.log('✅ Error handlers configurados');

// Tentar iniciar o servidor
console.log(`\n🚀 Passo 8: Iniciando servidor na porta ${PORT}...`);
console.log('   (Aguardando 5 segundos...)');

const server = app.listen(PORT, () => {
  console.log('✅ ✅ ✅ SERVIDOR INICIADO COM SUCESSO! ✅ ✅ ✅');
  console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log('\n═'.repeat(80));
  console.log('✨ Teste concluído com sucesso! O servidor está funcionando.');
  console.log('═'.repeat(80));

  // Encerrar após 5 segundos
  setTimeout(() => {
    console.log('\n👋 Encerrando servidor de teste...');
    server.close(() => {
      console.log('✅ Servidor encerrado');
      process.exit(0);
    });
  }, 5000);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  console.error('\n❌ ERRO AO INICIAR SERVIDOR:');

  if (error.code === 'EADDRINUSE') {
    console.error(`   A porta ${PORT} já está em uso!`);
    console.error('   Solução: Encerre o processo que está usando a porta ou mude a porta no .env');
  } else {
    console.error('   Código do erro:', error.code);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
  }

  process.exit(1);
});

// Timeout de segurança
setTimeout(() => {
  console.error('\n⏰ TIMEOUT: Servidor não iniciou em 30 segundos');
  console.error('   O servidor pode estar travado durante a inicialização.');
  console.error('   Verifique se há bloqueios ou loops infinitos no código.');
  process.exit(1);
}, 30000);

console.log('⏳ Aguardando inicialização do servidor...');
