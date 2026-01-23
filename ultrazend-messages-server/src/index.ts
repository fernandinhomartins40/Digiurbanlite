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
    // Processar mensagens agendadas a cada minuto
    setInterval(async () => {
      try {
        const now = new Date();

        // Buscar mensagens agendadas para enviar
        const scheduledMessages = await prisma.channelMessage.findMany({
          where: {
            status: 'SCHEDULED',
            scheduledFor: {
              lte: now,
            },
          },
        });

        for (const message of scheduledMessages) {
          logger.info('Processing scheduled message', { messageId: message.id });

          // Atualizar status para SENDING
          await prisma.channelMessage.update({
            where: { id: message.id },
            data: { status: 'SENDING' },
          });

          // Importar dynamicamente para evitar circular dependency
          const { default: channelService } = await import('./delivery/ChannelService');
          await channelService.deliverBroadcast(message.id);
        }
      } catch (error) {
        logger.error('Error processing scheduled messages', { error });
      }
    }, 60000); // 1 minuto

    // Coletar estatísticas a cada hora
    setInterval(async () => {
      await this.collectHourlyStats();
    }, 3600000); // 1 hora

    // Limpar sessões WebSocket antigas
    setInterval(async () => {
      await this.cleanupOldSessions();
    }, 300000); // 5 minutos

    logger.info('✅ Scheduled jobs configured');
  }

  private async collectHourlyStats() {
    try {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hour = now.getHours();

      const messageServer = await prisma.messageServer.findFirst({
        where: { isActive: true },
      });

      if (!messageServer) return;

      // Contar mensagens da última hora
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const [
        totalMessages,
        textMessages,
        mediaMessages,
        deletedMessages,
        totalConversations,
        newConversations,
        closedConversations,
        activeUsers,
        activeCitizens,
        onlineUsers,
        channelMessages,
        reportsCreated,
      ] = await Promise.all([
        prisma.message.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
        prisma.message.count({
          where: { createdAt: { gte: oneHourAgo }, contentType: 'TEXT' },
        }),
        prisma.message.count({
          where: { createdAt: { gte: oneHourAgo }, contentType: { not: 'TEXT' } },
        }),
        prisma.message.count({
          where: { deletedAt: { gte: oneHourAgo } },
        }),
        prisma.conversation.count({
          where: { updatedAt: { gte: oneHourAgo } },
        }),
        prisma.conversation.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
        prisma.conversation.count({
          where: { closedAt: { gte: oneHourAgo } },
        }),
        prisma.message.groupBy({
          by: ['senderId'],
          where: {
            createdAt: { gte: oneHourAgo },
            senderType: 'SERVER',
          },
        }).then((result: unknown[]) => result.length),
        prisma.message.groupBy({
          by: ['senderId'],
          where: {
            createdAt: { gte: oneHourAgo },
            senderType: 'CITIZEN',
          },
        }).then((result: unknown[]) => result.length),
        prisma.webSocketSession.count({
          where: { isOnline: true },
        }),
        prisma.channelMessage.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
        prisma.messageReport.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
      ]);

      // Salvar estatísticas
      await prisma.messageStats.upsert({
        where: {
          messageServerId_date_hour: {
            messageServerId: messageServer.id,
            date,
            hour,
          },
        },
        create: {
          messageServerId: messageServer.id,
          date,
          hour,
          totalMessages,
          textMessages,
          mediaMessages,
          deletedMessages,
          totalConversations,
          newConversations,
          closedConversations,
          activeUsers,
          activeCitizens,
          onlineUsers,
          channelMessages,
          reportsCreated,
        },
        update: {
          totalMessages,
          textMessages,
          mediaMessages,
          deletedMessages,
          totalConversations,
          newConversations,
          closedConversations,
          activeUsers,
          activeCitizens,
          onlineUsers,
          channelMessages,
          reportsCreated,
        },
      });

      logger.info('Hourly stats collected', { date, hour, totalMessages });
    } catch (error) {
      logger.error('Error collecting stats', { error });
    }
  }

  private async cleanupOldSessions() {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const result = await prisma.webSocketSession.updateMany({
        where: {
          isOnline: true,
          lastPingAt: {
            lt: fifteenMinutesAgo,
          },
        },
        data: {
          isOnline: false,
          disconnectedAt: new Date(),
        },
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} stale WebSocket sessions`);
      }
    } catch (error) {
      logger.error('Error cleaning up sessions', { error });
    }
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
