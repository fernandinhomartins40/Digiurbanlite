/**
 * @ultrazend/smtp-server - Production Server Starter
 * Script para iniciar o servidor SMTP em produção com PostgreSQL
 */

const { SMTPServer } = require('./dist/index.prisma.js');

async function startProductionServer() {
  console.log('🚀 UltraZend SMTP Server (Production) - Starting...\n');

  // Ler configurações das variáveis de ambiente
  const hostname = process.env.SMTP_HOSTNAME || 'localhost';
  const mxPort = parseInt(process.env.MX_PORT || '25', 10);
  const submissionPort = parseInt(process.env.SUBMISSION_PORT || '587', 10);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const server = new SMTPServer({
    hostname,
    mxPort,
    submissionPort,
    maxConnections: 100,
    authRequired: false, // Autenticação desabilitada para comunicação interna Docker
    tlsEnabled: false, // TLS será gerenciado via reverse proxy
    logLevel: 'info'
  });

  try {
    // Iniciar servidor
    await server.start();

    console.log('📧 SMTP Server is running in PRODUCTION mode!');
    console.log('📋 Configuration:');
    console.log(`   • Hostname: ${hostname}`);
    console.log(`   • MX Server: ${hostname}:${mxPort}`);
    console.log(`   • Submission: ${hostname}:${submissionPort}`);
    console.log(`   • Database: PostgreSQL (Prisma)`);
    console.log(`   • Max Connections: 100`);
    console.log('\n✅ Server is ready to receive and send emails');

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, stopping SMTP server...`);
      try {
        await server.stop();
        console.log('👋 Server stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  startProductionServer().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = startProductionServer;
