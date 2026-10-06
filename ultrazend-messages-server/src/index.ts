import './utils/multer-keep-context'; // antes de tudo: upload de arquivos mantém o município (ver o arquivo)
import dotenv from 'dotenv';
import { createServer } from 'http';
import logger from './utils/logger';
import ExpressServer from './server/ExpressServer';
import WebSocketServer from './server/WebSocketServer';
import prisma from './utils/prisma';
import { seedFlowDefinitions } from './bot/flow/FlowDefinitionSeeder';

// Carregar variáveis de ambiente
dotenv.config();

const PORT = parseInt(process.env.PORT || '9001', 10);
const HOST = process.env.HOST || '0.0.0.0';

class UltraZendMessagesServer {
  private httpServer!: ReturnType<typeof createServer>;
  private expressServer!: ExpressServer;
  private wsServer!: WebSocketServer;

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting UltraZend Messages Server...');

      // Testar conexão com banco de dados
      await this.testDatabaseConnection();
      await seedFlowDefinitions();

      // Criar servidor HTTP
      this.expressServer = new ExpressServer();
      this.httpServer = createServer(this.expressServer.getApp());

      // Criar servidor WebSocket
      this.wsServer = new WebSocketServer(this.httpServer);
      this.expressServer.setWebSocketServer(this.wsServer);

      // Iniciar servidor
      this.httpServer.listen(PORT, HOST, () => {
        logger.info(`✅ UltraZend Messages Server running on ${HOST}:${PORT}`);
        logger.info(`📡 WebSocket available at ws://${HOST}:${PORT}`);
        logger.info(`🌐 HTTP API available at http://${HOST}:${PORT}/api`);
        logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      });

      // Processar mensagens agendadas
      this.scheduleJobs();

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  private async testDatabaseConnection() {
    try {
      await prisma.$connect();
      logger.info('✅ Database connection established');

      // Verificar se o MessageServer existe
      const messageServer = await prisma.messageServer.findFirst({
        where: { isActive: true },
      });

      if (!messageServer) {
        logger.warn('⚠️  No active MessageServer found in database. Creating default...');

        await prisma.messageServer.create({
          data: {
            name: 'DigiUrban Messages',
            hostname: process.env.HOSTNAME || 'messages.digiurban.local',
            wsPort: PORT,
            isActive: true,
            enableEncryption: false,
            enableP2P: true,
            enableBroadcast: true,
          },
        });

        logger.info('✅ Default MessageServer created');
      }
    } catch (error) {
      logger.error('Database connection failed', { error });
      throw error;
    }
  }

  private scheduleJobs() {
    // Fila de atendimento humano: quem espera além do tempo do painel volta
    // para o assistente (conferido por horário gravado, sobrevive a reinícios)
    let running = false;
    setInterval(async () => {
      if (running) return;
      running = true;
      try {
        const returned = await this.expressServer.getHandoverService().returnExpiredToBot();
        if (returned > 0) logger.info(`Atendimento humano: ${returned} conversa(s) devolvida(s) ao assistente por espera`);
      } catch (error) {
        logger.error('Error returning expired handovers', { error });
      } finally {
        running = false;
      }
    }, 60000);

    logger.info('✅ Scheduled jobs configured');
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      try {
        // Fechar servidor HTTP
        this.httpServer.close(() => {
          logger.info('HTTP server closed');
        });

        // Fechar WebSocket
        if (this.wsServer) {
          await this.wsServer.shutdown();
        }

        // Desconectar Prisma
        await prisma.$disconnect();

        logger.info('✅ Graceful shutdown completed');
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

// Iniciar servidor
const server = new UltraZendMessagesServer();
server.start();

export default UltraZendMessagesServer;
