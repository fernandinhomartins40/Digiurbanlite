import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import logger from '../utils/logger';
import { verifyToken, JwtPayload } from '../utils/jwt';
import conversationService from '../delivery/ConversationService';
import channelService from '../delivery/ChannelService';
import fileStorage from '../storage/FileStorage';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class ExpressServer {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  private setupMiddlewares() {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Static files (uploads)
    this.app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: 'Too many requests from this IP',
    });
    this.app.use('/api', limiter);

    // Logging
    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      logger.debug(`${_req.method} ${_req.path}`, {
        ip: _req.ip,
        userAgent: _req.get('user-agent'),
      });
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'ultrazend-messages',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use('/api/conversations', this.authMiddleware.bind(this), this.conversationRoutes());
    this.app.use('/api/messages', this.authMiddleware.bind(this), this.messageRoutes());
    this.app.use('/api/channels', this.authMiddleware.bind(this), this.channelRoutes());
    this.app.use('/api/uploads', this.authMiddleware.bind(this), this.uploadRoutes());
    this.app.use('/api/reports', this.authMiddleware.bind(this), this.reportRoutes());

    // Admin routes
    this.app.use('/api/admin', this.authMiddleware.bind(this), this.adminRoutes());

    // 404
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({ error: 'Authentication token required' });
        return;
      }

      const payload = verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  private conversationRoutes() {
    const router = express.Router();

    // Listar conversas do usuário
    router.get('/', async (req: AuthRequest, res: Response) => {
      try {
        const conversations = await conversationService.getConversationsByUser(
          req.user!.userId,
          req.user!.userType
        );
        res.json(conversations);
      } catch (error) {
        logger.error('Error in GET /conversations', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Buscar ou criar conversa
    router.post('/find-or-create', async (req: AuthRequest, res: Response) => {
      try {
        const { participant2Id, participant2Type, protocolId, departmentId } = req.body;

        const conversation = await conversationService.findOrCreateConversation({
          participant1Id: req.user!.userId,
          participant1Type: req.user!.userType,
          participant2Id,
          participant2Type,
          protocolId,
          departmentId,
        });

        res.json(conversation);
      } catch (error) {
        logger.error('Error in POST /conversations/find-or-create', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Obter mensagens de uma conversa
    router.get('/:conversationId/messages', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit as string || '50', 10);
        const offset = parseInt(req.query.offset as string || '0', 10);

        const messages = await conversationService.getConversationMessages(
          conversationId,
          limit,
          offset
        );

        res.json(messages);
      } catch (error) {
        logger.error('Error in GET /conversations/:id/messages', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Arquivar conversa
    router.post('/:conversationId/archive', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.params;

        await conversationService.archiveConversation(
          conversationId,
          req.user!.userId,
          req.user!.userType
        );

        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /conversations/:id/archive', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Deletar conversa
    router.delete('/:conversationId', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.params;

        await conversationService.deleteConversation(
          conversationId,
          req.user!.userId,
          req.user!.userType
        );

        res.json({ success: true });
      } catch (error) {
        logger.error('Error in DELETE /conversations/:id', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Marcar conversa como lida
    router.post('/:conversationId/read', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.params;

        await conversationService.markConversationAsRead(
          conversationId,
          req.user!.userId,
          req.user!.userType
        );

        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /conversations/:id/read', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Contador de não lidas
    router.get('/unread-count', async (req: AuthRequest, res: Response) => {
      try {
        const count = await conversationService.getUnreadCount(
          req.user!.userId,
          req.user!.userType
        );
        res.json({ count });
      } catch (error) {
        logger.error('Error in GET /conversations/unread-count', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }

  private messageRoutes() {
    const router = express.Router();

    // Enviar mensagem via HTTP (alternativa ao WebSocket)
    router.post('/send', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId, content, replyToId, attachments } = req.body;

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: req.user!.userId,
            senderType: req.user!.userType,
            content,
            replyToId,
            attachments: attachments || [],
            status: 'SENT',
          },
        });

        // Atualizar conversa
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: new Date(),
            lastMessagePreview: content.substring(0, 100),
            totalMessages: { increment: 1 },
          },
        });

        res.json(message);
      } catch (error) {
        logger.error('Error in POST /messages/send', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Deletar mensagem
    router.delete('/:messageId', async (req: AuthRequest, res: Response) => {
      try {
        const { messageId } = req.params;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message) {
          return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId !== req.user!.userId) {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: req.user!.userId,
          },
        });

        res.json({ success: true });
      } catch (error) {
        logger.error('Error in DELETE /messages/:id', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }

  private channelRoutes() {
    const router = express.Router();

    // Listar canais públicos
    router.get('/', async (req: AuthRequest, res: Response) => {
      try {
        const channels = await channelService.getChannels({ isActive: true, isPublic: true });
        res.json(channels);
      } catch (error) {
        logger.error('Error in GET /channels', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Inscrever-se em canal
    router.post('/:channelId/subscribe', async (req: AuthRequest, res: Response) => {
      try {
        const { channelId } = req.params;

        if (req.user!.userType !== 'CITIZEN') {
          return res.status(403).json({ error: 'Only citizens can subscribe to channels' });
        }

        const result = await channelService.subscribeToChannel(channelId, req.user!.userId);
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /channels/:id/subscribe', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Cancelar inscrição
    router.post('/:channelId/unsubscribe', async (req: AuthRequest, res: Response) => {
      try {
        const { channelId } = req.params;

        if (req.user!.userType !== 'CITIZEN') {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        await channelService.unsubscribeFromChannel(channelId, req.user!.userId);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /channels/:id/unsubscribe', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Mensagens do canal
    router.get('/:channelId/messages', async (req: AuthRequest, res: Response) => {
      try {
        const { channelId } = req.params;
        const limit = parseInt(req.query.limit as string || '50', 10);
        const offset = parseInt(req.query.offset as string || '0', 10);

        const messages = await channelService.getChannelMessages(channelId, limit, offset);
        res.json(messages);
      } catch (error) {
        logger.error('Error in GET /channels/:id/messages', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Minhas inscrições
    router.get('/my-subscriptions', async (req: AuthRequest, res: Response) => {
      try {
        if (req.user!.userType !== 'CITIZEN') {
          return res.status(403).json({ error: 'Unauthorized' });
        }

        const subscriptions = await channelService.getUserSubscriptions(req.user!.userId);
        res.json(subscriptions);
      } catch (error) {
        logger.error('Error in GET /channels/my-subscriptions', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Enviar broadcast (apenas gerentes)
    router.post('/:channelId/broadcast', async (req: AuthRequest, res: Response) => {
      try {
        const { channelId } = req.params;
        const { title, content, attachments, scheduledFor, priority } = req.body;

        const message = await channelService.broadcastMessage({
          channelId,
          authorId: req.user!.userId,
          title,
          content,
          attachments,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
          priority,
        });

        res.json(message);
      } catch (error) {
        logger.error('Error in POST /channels/:id/broadcast', { error });
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
      }
    });

    return router;
  }

  private uploadRoutes() {
    const router = express.Router();

    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
      },
    });

    router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const uploadedFile = await fileStorage.uploadFile(req.file);
        res.json(uploadedFile);
      } catch (error) {
        logger.error('Error in POST /uploads', { error });
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
      }
    });

    return router;
  }

  private reportRoutes() {
    const router = express.Router();

    // Criar denúncia
    router.post('/', async (req: AuthRequest, res: Response) => {
      try {
        const { messageId, reason, description, screenshots } = req.body;

        const report = await prisma.messageReport.create({
          data: {
            messageId,
            reportedBy: req.user!.userId,
            reporterType: req.user!.userType,
            reason,
            description,
            screenshots: screenshots || [],
            status: 'PENDING',
          },
        });

        res.json(report);
      } catch (error) {
        logger.error('Error in POST /reports', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }

  private adminRoutes() {
    const router = express.Router();

    // Estatísticas
    router.get('/stats', async (req: AuthRequest, res: Response) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = await prisma.messageStats.findFirst({
          where: {
            date: today,
            hour: null,
          },
        });

        res.json(stats || {});
      } catch (error) {
        logger.error('Error in GET /admin/stats', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Criar canal
    router.post('/channels', async (req: AuthRequest, res: Response) => {
      try {
        const channel = await channelService.createChannel(req.body);
        res.json(channel);
      } catch (error) {
        logger.error('Error in POST /admin/channels', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }

  private setupErrorHandlers() {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error', { error: err, path: req.path });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

export default ExpressServer;
