import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import logger from '../utils/logger';
import { verifyToken, JwtPayload } from '../utils/jwt';
import conversationService from '../delivery/ConversationService';
import channelService from '../delivery/ChannelService';
import fileStorage from '../storage/FileStorage';
import prisma from '../utils/prisma';
import { FlowEngineService } from '../delivery/FlowEngineService';
import whatsappAdapter from '../delivery/WhatsAppAdapter';
import messageAnalyticsRoutes from '../routes/message-analytics.routes';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class ExpressServer {
  private app: Application;
  private flowEngineService: FlowEngineService;
  private wsServer: any;

  constructor() {
    this.app = express();
    this.flowEngineService = new FlowEngineService();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  setWebSocketServer(wsServer: any) {
    this.wsServer = wsServer;
    this.flowEngineService.setWebSocketServer(wsServer);
  }

  private setupMiddlewares() {
    // Trust proxy (CRÍTICO: para rate limiting funcionar corretamente atrás do Nginx)
    this.app.set('trust proxy', true);

    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Cookie parsing (IMPORTANTE: deve vir ANTES das rotas)
    this.app.use(cookieParser());

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
      standardHeaders: true,
      legacyHeaders: false,
      // CRÍTICO: Configurar skip failure quando trust proxy está ativo
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      // Usar X-Forwarded-For do Nginx
      keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      },
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

    // Webhooks (sem auth)
    this.app.use('/webhooks/whatsapp', this.whatsappWebhookRoutes());

    // API routes
    this.app.use('/api/conversations', this.authMiddleware.bind(this), this.conversationRoutes());
    this.app.use('/api/messages', this.authMiddleware.bind(this), this.messageRoutes());
    this.app.use('/api/channels', this.authMiddleware.bind(this), this.channelRoutes());
    this.app.use('/api/uploads', this.authMiddleware.bind(this), this.uploadRoutes());
    this.app.use('/api/reports', this.authMiddleware.bind(this), this.reportRoutes());
    this.app.use('/api/contacts', this.authMiddleware.bind(this), this.contactRoutes());
    this.app.use('/api/users', this.authMiddleware.bind(this), this.userRoutes());

    // Bot Flow routes
    this.app.use('/api/bot-flow', this.authMiddleware.bind(this), this.botFlowRoutes());

    // ✅ NOVO: Handover routes (bot → humano)
    this.app.use('/api/handover', this.authMiddleware.bind(this), this.handoverRoutes());

    // ✅ NOVO: Message Analytics routes (ETAPA 4 - campos queryable)
    this.app.use('/api/message-analytics', this.authMiddleware.bind(this), this.messageAnalyticsRoutes());

    // Admin routes
    this.app.use('/api/admin', this.authMiddleware.bind(this), this.adminRoutes());

    // 404
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private whatsappWebhookRoutes() {
    const router = express.Router();

    // Meta WhatsApp Cloud API: verificação do webhook
    router.get('/', (req: Request, res: Response) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

      if (mode === 'subscribe' && expectedToken && token === expectedToken && typeof challenge === 'string') {
        res.status(200).send(challenge);
        return;
      }

      res.status(403).json({ error: 'Forbidden' });
    });

    // Meta WhatsApp Cloud API: recebimento de mensagens
    router.post('/', async (req: Request, res: Response) => {
      try {
        const body: any = req.body;

        const messages: Array<{ from: string; type: string; text?: string }> = [];

        const entries = Array.isArray(body?.entry) ? body.entry : [];
        for (const entry of entries) {
          const changes = Array.isArray(entry?.changes) ? entry.changes : [];
          for (const change of changes) {
            const value = change?.value;
            const incoming = Array.isArray(value?.messages) ? value.messages : [];
            for (const msg of incoming) {
              const from = String(msg?.from || '').trim();
              const type = String(msg?.type || '').trim();
              if (!from || !type) continue;

              if (type === 'text') {
                const text = String(msg?.text?.body || '').trim();
                if (!text) continue;
                messages.push({ from, type, text });
              } else {
                // Suporte inicial: apenas texto
                messages.push({ from, type });
              }
            }
          }
        }

        // Sempre responder 200 para o WhatsApp (evita retries agressivos)
        res.status(200).json({ received: true });

        if (messages.length === 0) {
          return;
        }

        if (!whatsappAdapter.isConfigured()) {
          logger.warn('WhatsApp webhook received messages, but adapter is not configured');
          return;
        }

        // Processar cada mensagem
        for (const msg of messages) {
          const citizenId = await this.findCitizenIdByPhone(msg.from);

          if (!citizenId) {
            await whatsappAdapter.sendTextMessage(
              msg.from,
              'Não encontrei um cadastro com este número. Acesse o Portal do Cidadão para criar sua conta e depois volte aqui.'
            ).catch(() => {});
            continue;
          }

          const input = msg.type === 'text'
            ? (msg.text as string)
            : 'Recebi sua mensagem. Por enquanto, o atendimento via WhatsApp suporta apenas texto.';

          const result = await this.flowEngineService.processMessage(citizenId, input);

          let replyText = result?.response?.message || '';
          const responseData = result?.response?.data as any;

          // Para menus, anexar lista de opções ao texto (WhatsApp não recebe metadata estruturada)
          if (result?.response?.messageType === 'menu' && Array.isArray(responseData?.options) && responseData.options.length > 0) {
            const optionsList = responseData.options
              .map((o: any) => `- ${o.label}`)
              .join('\n');
            replyText = `${replyText}\n\nOpções:\n${optionsList}\n\nResponda com a opção desejada.`;
          }

          if (replyText.trim().length === 0) {
            replyText = 'Ok.';
          }

          await whatsappAdapter.sendTextMessage(msg.from, replyText);
        }
      } catch (error) {
        logger.error('Error in WhatsApp webhook', { error });
        // Mesmo em erro, responder 200 para evitar retries em loop.
        if (!res.headersSent) {
          res.status(200).json({ received: true });
        }
      }
    });

    return router;
  }

  private async findCitizenIdByPhone(phone: string): Promise<string | null> {
    const digits = String(phone || '').replace(/\D/g, '');
    const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

    if (local.length < 10) return null;

    const suffix = local.slice(-4);
    const prefix = local.length === 11 ? local.slice(2, 7) : local.slice(2, 6);

    const candidates = await prisma.citizen.findMany({
      where: {
        isActive: true,
        OR: [
          ...(prefix && suffix
            ? [
                { AND: [{ phone: { contains: prefix } }, { phone: { contains: suffix } }] },
                { AND: [{ phoneSecondary: { contains: prefix } }, { phoneSecondary: { contains: suffix } }] },
              ]
            : []),
          ...(suffix
            ? [{ phone: { contains: suffix } }, { phoneSecondary: { contains: suffix } }]
            : []),
          { phone: { contains: local } },
          { phoneSecondary: { contains: local } },
          { phone: { contains: digits } },
          { phoneSecondary: { contains: digits } },
        ],
      },
      select: {
        id: true,
        phone: true,
        phoneSecondary: true,
      },
      take: 10,
    });

    const normalize = (value: any) => String(value || '').replace(/\D/g, '');

    const exact = candidates.find((c) => {
      const p1 = normalize(c.phone);
      const p2 = normalize(c.phoneSecondary);
      return p1 === local || p1 === digits || p2 === local || p2 === digits;
    });

    if (exact) return exact.id;
    if (candidates.length === 1) return candidates[0].id;

    return null;
  }

  private authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      // Tentar obter token do cookie primeiro (DigiUrban usa cookies httpOnly)
      let token = req.cookies?.digiurban_admin_token || req.cookies?.digiurban_citizen_token;

      // Se não tiver no cookie, tentar o header Authorization (fallback)
      if (!token) {
        token = req.headers.authorization?.replace('Bearer ', '');
      }

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
          offset,
          req.user!.userId,
          req.user!.userType
        );

        res.json(messages);
      } catch (error) {
        logger.error('Error in GET /conversations/:id/messages', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Limpar mensagens para mim (oculta mensagens só para o usuário atual)
    router.post('/:conversationId/clear-for-me', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.params;

        await conversationService.clearMessagesForMe(
          conversationId,
          req.user!.userId,
          req.user!.userType
        );

        res.json({ success: true });
      } catch (error: any) {
        logger.error('Error in POST /conversations/:id/clear-for-me', { error });
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    });

    // Limpar mensagens da conversa (para todos)
    router.post('/:conversationId/clear', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.params;

        await conversationService.clearMessages(
          conversationId,
          req.user!.userId,
          req.user!.userType
        );

        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /conversations/:id/clear', { error });
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

        if (!conversationId || !content) {
          res.status(400).json({ error: 'conversationId and content are required' });
          return;
        }

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          res.status(404).json({ error: 'Conversation not found' });
          return;
        }

        const isParticipant1 = conversation.participant1Id === req.user!.userId &&
          conversation.participant1Type === req.user!.userType;

        const isParticipant2 = conversation.participant2Id === req.user!.userId &&
          conversation.participant2Type === req.user!.userType;

        if (!isParticipant1 && !isParticipant2) {
          res.status(403).json({ error: 'Unauthorized' });
          return;
        }

        const now = new Date();

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: req.user!.userId,
            senderType: req.user!.userType,
            content,
            replyToId,
            attachments: attachments || [],
            status: 'SENT',
            sentAt: now,
          },
        });

        // Atualizar conversa (limpar deletedAt do destinatário para ressurgir conversa)
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: now,
            lastMessagePreview: content.substring(0, 100),
            totalMessages: { increment: 1 },
            ...(isParticipant1
              ? { unreadCount2: { increment: 1 }, deletedAt2: null }
              : { unreadCount1: { increment: 1 }, deletedAt1: null }),
          },
        });

        // Emitir para sala da conversa + sala pessoal do destinatário
        if (this.wsServer) {
          const messagePayload = { conversationId, message };
          this.wsServer.io.to(`conversation:${conversationId}`).emit('message:new', messagePayload);

          const recipientId = isParticipant1 ? conversation.participant2Id : conversation.participant1Id;
          const recipientType = isParticipant1 ? conversation.participant2Type : conversation.participant1Type;
          this.wsServer.io.to(`user:${recipientId}:${recipientType}`).emit('message:new', messagePayload);
        }

        res.json(message);
      } catch (error) {
        logger.error('Error in POST /messages/send', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // NOVO: Enviar mensagem com criação automática de conversa
    router.post('/send-auto', async (req: AuthRequest, res: Response) => {
      try {
        const { recipientId, recipientType, content, contentType = 'TEXT', attachments } = req.body;

        if (!recipientId || !recipientType || !content) {
          res.status(400).json({ error: 'recipientId, recipientType and content are required' });
          return;
        }

        // 1. Buscar ou criar conversa automaticamente
        const conversation = await conversationService.findOrCreateConversation({
          participant1Id: req.user!.userId,
          participant1Type: req.user!.userType,
          participant2Id: recipientId,
          participant2Type: recipientType,
        });

        logger.info('Conversation found or created', {
          conversationId: conversation.id,
          senderId: req.user!.userId,
          recipientId,
        });

        // 2. Criar mensagem
        const now = new Date();
        const message = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: req.user!.userId,
            senderType: req.user!.userType,
            content,
            contentType,
            attachments: attachments || [],
            status: 'SENT',
            sentAt: now,
          },
        });

        const isParticipant1 = conversation.participant1Id === req.user!.userId &&
          conversation.participant1Type === req.user!.userType;
        const actualRecipientId = isParticipant1 ? conversation.participant2Id : conversation.participant1Id;
        const actualRecipientType = isParticipant1 ? conversation.participant2Type : conversation.participant1Type;

        // 3. Atualizar conversa (limpar deletedAt do destinatário para ressurgir conversa)
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: now,
            lastMessagePreview: content.substring(0, 100),
            totalMessages: { increment: 1 },
            ...(isParticipant1
              ? { unreadCount2: { increment: 1 }, deletedAt2: null }
              : { unreadCount1: { increment: 1 }, deletedAt1: null }),
          },
        });

        // 4. Emitir via WebSocket GARANTINDO entrega
        if (this.wsServer) {
          const messagePayload = {
            conversationId: conversation.id,
            message,
          };

          // Emitir para sala da conversa + sala pessoal do destinatário
          this.wsServer.io.to(`conversation:${conversation.id}`).emit('message:new', messagePayload);
          this.wsServer.io.to(`user:${actualRecipientId}:${actualRecipientType}`).emit('message:new', messagePayload);

          // Notificar nova conversa para o destinatário (sala pessoal)
          const conversationWithDetails = await conversationService.getConversationById(conversation.id);
          this.wsServer.io.to(`user:${actualRecipientId}:${actualRecipientType}`).emit('conversation:new', {
            conversation: conversationWithDetails,
          });

          logger.info('WebSocket events emitted', {
            conversationId: conversation.id,
            messageId: message.id,
            recipientId: actualRecipientId,
          });
        }

        res.json({
          success: true,
          conversation,
          message,
        });
      } catch (error) {
        logger.error('Error in POST /messages/send-auto', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Deletar mensagem
    router.delete('/:messageId', async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const { messageId } = req.params;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message) {
          res.status(404).json({ error: 'Message not found' });
          return;
        }

        if (message.senderId !== req.user!.userId) {
          res.status(403).json({ error: 'Unauthorized' });
          return;
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
    router.get('/', async (_req: AuthRequest, res: Response) => {
      try {
        const channels = await channelService.getChannels({ isActive: true, isPublic: true });
        res.json(channels);
      } catch (error) {
        logger.error('Error in GET /channels', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Inscrever-se em canal
    router.post('/:channelId/subscribe', async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const { channelId } = req.params;

        if (req.user!.userType !== 'CITIZEN') {
          res.status(403).json({ error: 'Only citizens can subscribe to channels' });
          return;
        }

        const result = await channelService.subscribeToChannel(channelId, req.user!.userId);
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /channels/:id/subscribe', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Cancelar inscrição
    router.post('/:channelId/unsubscribe', async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const { channelId } = req.params;

        if (req.user!.userType !== 'CITIZEN') {
          res.status(403).json({ error: 'Unauthorized' });
          return;
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
    router.get('/my-subscriptions', async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        if (req.user!.userType !== 'CITIZEN') {
          res.status(403).json({ error: 'Unauthorized' });
          return;
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

    router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
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
    router.get('/stats', async (_req: AuthRequest, res: Response) => {
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

  private contactRoutes() {
    const router = express.Router();

    // Buscar todos os cidadãos (para criar conversa P2P)
    router.get('/citizens', async (req: AuthRequest, res: Response) => {
      try {
        const { search, limit = 50, offset = 0 } = req.query;

        // Buscar cidadãos do banco digiurban
        const where: any = {
          isActive: true,
        };

        if (search && typeof search === 'string') {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search } },
          ];
        }

        const citizens = await prisma.citizen.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            phone: true,
          avatar: true,
            
          },
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
          orderBy: { name: 'asc' },
        });

        res.json(citizens);
      } catch (error) {
        logger.error('Error in GET /contacts/citizens', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Buscar todos os servidores (para criar conversa com servidor)
    router.get('/servers', async (req: AuthRequest, res: Response) => {
      try {
        const { search, limit = 50, offset = 0 } = req.query;

        const where: any = {
          isActive: true,
        };

        if (search && typeof search === 'string') {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: parseInt(limit as string, 10),
          skip: parseInt(offset as string, 10),
          orderBy: { name: 'asc' },
        });

        res.json(users);
      } catch (error) {
        logger.error('Error in GET /contacts/servers', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }

  private userRoutes() {
    const router = express.Router();

    // Buscar informações de um usuário (Cidadão ou Servidor)
    router.get('/:userId/:userType', async (req: AuthRequest, res: Response) => {
      try {
        const { userId, userType } = req.params;

        if (userType === 'CITIZEN') {
          const citizen = await prisma.citizen.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
          avatar: true,
              
            },
          });

          if (!citizen) {
            res.status(404).json({ error: 'Citizen not found' });
            return;
          }

          res.json(citizen);
        } else if (userType === 'SERVER') {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
          }

          res.json(user);
        } else {
          res.status(400).json({ error: 'Invalid userType. Must be CITIZEN or SERVER' });
        }
      } catch (error) {
        logger.error('Error in GET /users/:userId/:userType', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    return router;
  }

  private botFlowRoutes() {
    const router = express.Router();

    // Configuração do multer para upload de arquivos
    const upload = multer({
      dest: 'uploads/bot-temp/',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5,
      },
    });

    // POST /api/bot-flow/start - Inicia novo fluxo
    router.post('/start', async (req: AuthRequest, res: Response) => {
      try {
        const { flowName, conversationId } = req.body;
        const citizenId = req.user!.userId;

        const result = await this.flowEngineService.startFlow(
          citizenId,
          flowName || 'menu_principal',
          conversationId
        );
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/start', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/message - Processa mensagem do usuário
    router.post('/message', async (req: AuthRequest, res: Response) => {
      try {
        const { message, conversationId } = req.body;
        const citizenId = req.user!.userId;

        const result = await this.flowEngineService.processMessage(citizenId, message, conversationId);
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/message', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/bot-flow/active-execution - Obtém execução ativa
    router.get('/active-execution', async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;
        const execution = await this.flowEngineService.getActiveExecution(citizenId);
        res.json({ execution });
      } catch (error) {
        logger.error('Error in GET /bot-flow/active-execution', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/upload - Upload de arquivos
    router.post('/upload', upload.array('files', 5), async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;
        const files = req.files as Express.Multer.File[];

        const conversationId = req.body?.conversationId as string | undefined;
        const result = await this.flowEngineService.handleUpload(citizenId, files, conversationId);
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/upload', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/cancel - Cancela fluxo ativo
    router.post('/cancel', async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;
        await this.flowEngineService.cancelActiveFlow(citizenId);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /bot-flow/cancel', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/reset - Reseta e reinicia o fluxo
    router.post('/reset', async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;

        // Cancela fluxo atual
        await this.flowEngineService.cancelActiveFlow(citizenId);

        // Inicia menu principal
        const result = await this.flowEngineService.startFlow(citizenId, 'menu_principal');
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/reset', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/pause - Pausa bot para atendimento humano
    router.post('/pause', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId, citizenId: bodyCitizenId } = req.body;
        let citizenId = req.user!.userId;

        if (req.user!.userType === 'SERVER') {
          if (bodyCitizenId) {
            citizenId = bodyCitizenId;
          } else if (conversationId) {
            const conversation = await prisma.conversation.findUnique({
              where: { id: conversationId },
              select: {
                participant1Id: true,
                participant1Type: true,
                participant2Id: true,
                participant2Type: true,
              },
            });

            if (!conversation) {
              res.status(404).json({ error: 'Conversation not found' });
              return;
            }

            if (conversation.participant1Type === 'CITIZEN') {
              citizenId = conversation.participant1Id;
            } else if (conversation.participant2Type === 'CITIZEN') {
              citizenId = conversation.participant2Id;
            }
          }
        }

        if (!citizenId) {
          res.status(400).json({ error: 'Citizen not found' });
          return;
        }

        await this.flowEngineService.pauseExecution(citizenId, conversationId);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /bot-flow/pause', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/resume - Retoma bot após atendimento humano
    router.post('/resume', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId, citizenId: bodyCitizenId } = req.body;
        let citizenId = req.user!.userId;

        if (req.user!.userType === 'SERVER') {
          if (bodyCitizenId) {
            citizenId = bodyCitizenId;
          } else if (conversationId) {
            const conversation = await prisma.conversation.findUnique({
              where: { id: conversationId },
              select: {
                participant1Id: true,
                participant1Type: true,
                participant2Id: true,
                participant2Type: true,
              },
            });

            if (!conversation) {
              res.status(404).json({ error: 'Conversation not found' });
              return;
            }

            if (conversation.participant1Type === 'CITIZEN') {
              citizenId = conversation.participant1Id;
            } else if (conversation.participant2Type === 'CITIZEN') {
              citizenId = conversation.participant2Id;
            }
          }
        }

        if (!citizenId) {
          res.status(400).json({ error: 'Citizen not found' });
          return;
        }

        await this.flowEngineService.resumeExecution(citizenId, conversationId);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /bot-flow/resume', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/bot-flow/health - Health check do bot
    router.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'bot-flow',
        timestamp: new Date().toISOString(),
      });
    });

    return router;
  }

  /**
   * ✅ NOVO: Rotas de Analytics (ETAPA 4 - campos queryable)
   */
  private messageAnalyticsRoutes() {
    return messageAnalyticsRoutes;
  }

  /**
   * ✅ NOVO: Rotas de Handover (bot → humano)
   */
  private handoverRoutes() {
    const router = express.Router();

    // GET /api/handover/queue - Fila de conversas aguardando atendimento
    router.get('/queue', async (req: AuthRequest, res: Response) => {
      try {
        // Apenas servidores podem ver a fila
        if (req.user!.userType !== 'SERVER') {
          res.status(403).json({ error: 'Acesso negado. Apenas servidores podem ver a fila.' });
          return;
        }

        const { departmentId } = req.query;
        const handoverService = this.flowEngineService.getHandoverService();
        const queue = await handoverService.getPendingHandoverQueue(departmentId as string);

        res.json({
          success: true,
          total: queue.length,
          queue,
        });
      } catch (error: any) {
        logger.error('Erro ao buscar fila de handover', { error });
        res.status(500).json({ error: error.message });
      }
    });

    // POST /api/handover/takeover - Servidor assume conversa
    router.post('/takeover', async (req: AuthRequest, res: Response) => {
      try {
        // Apenas servidores podem assumir conversas
        if (req.user!.userType !== 'SERVER') {
          res.status(403).json({ error: 'Acesso negado. Apenas servidores podem assumir conversas.' });
          return;
        }

        const { conversationId } = req.body;
        if (!conversationId) {
          res.status(400).json({ error: 'conversationId é obrigatório' });
          return;
        }

        const handoverService = this.flowEngineService.getHandoverService();
        const result = await handoverService.takeoverConversation(
          conversationId,
          req.user!.userId
        );

        res.json(result);
      } catch (error: any) {
        logger.error('Erro ao assumir conversa', { error });
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  private setupErrorHandlers() {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error', { error: err, path: _req.path });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

export default ExpressServer;
