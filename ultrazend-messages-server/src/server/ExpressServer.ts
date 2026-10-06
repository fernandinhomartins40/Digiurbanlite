import express, { Request, Response, NextFunction, Application } from 'express';
import { canReadConversation, canWriteConversation, isServer, maskCpf, tenantOf } from './accessControl';
import { uploadsAccess } from '../middleware/uploadsAccess';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import logger from '../utils/logger';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { runWithTenant } from '../bot/tenant-context';
import conversationService from '../delivery/ConversationService';
import prisma from '../utils/prisma';
import { FlowEngineService } from '../delivery/FlowEngineService';
import { acquireBotLock, releaseBotLock, type BotLock } from '../utils/botLock';
import { ChatError, deliverChatMessage } from '../delivery/chatDelivery';
import { HandoverError } from '../delivery/HandoverService';
import { normalizeChatPayload, pickSessionToken, portalFrom } from '../utils/authToken';
import internalNoticesRoutes from '../routes/internal-notices.routes';

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
    this.app.set('trust proxy', 1);

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
    // Documentos de cidadãos: só com login (antes era público — LGPD art. 46)
    this.app.use('/uploads', uploadsAccess, express.static(process.env.UPLOAD_DIR || './uploads'));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
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

    // Chamadas internas do sistema principal (avisos no chat). Fora de /api:
    // o nginx só repassa /messages-api/* → /api/*, então isto não é alcançável
    // de fora (e a porta 9001 não é mais publicada).
    this.app.use('/internal', internalNoticesRoutes);

    // API routes
    this.app.use('/api/conversations', this.authMiddleware.bind(this), this.conversationRoutes());
    this.app.use('/api/messages', this.authMiddleware.bind(this), this.messageRoutes());
    this.app.use('/api/contacts', this.authMiddleware.bind(this), this.contactRoutes());
    this.app.use('/api/users', this.authMiddleware.bind(this), this.userRoutes());

    // Bot Flow routes
    this.app.use('/api/bot-flow', this.authMiddleware.bind(this), this.botTenantMiddleware.bind(this), this.botFlowRoutes());

    // Atendimento humano (bot → atendente)
    this.app.use('/api/handover', this.authMiddleware.bind(this), this.handoverRoutes());

    // 404
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      // Sessão do portal em que a pessoa está (servidor que também usa o portal
      // do cidadão: antes a sessão de servidor sempre vencia)
      const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : undefined;
      const token = bearer || pickSessionToken(req.cookies || {}, portalFrom(req.get('x-digiurban-portal'), req.get('referer')));

      if (!token) {
        res.status(401).json({ error: 'Authentication token required' });
        return;
      }

      const payload = normalizeChatPayload(verifyToken(token) as any);
      if (!payload.userId || !payload.userType) {
        res.status(401).json({ error: 'Invalid token payload' });
        return;
      }
      req.user = payload as JwtPayload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  /** Destinatário existe, é do mesmo município e a combinação é permitida */
  private async checkRecipient(user: JwtPayload, participant2Id: unknown, participant2Type: unknown): Promise<string | null> {
    if (typeof participant2Id !== 'string' || !participant2Id || (participant2Type !== 'CITIZEN' && participant2Type !== 'SERVER')) {
      return 'Destinatário inválido';
    }
    if (user.userType === 'CITIZEN' && participant2Type === 'CITIZEN') {
      return 'Cidadãos conversam com a prefeitura, não com outros cidadãos';
    }
    if (participant2Id === user.userId && participant2Type === user.userType) {
      return 'Escolha outra pessoa para conversar';
    }
    const target =
      participant2Type === 'CITIZEN'
        ? await prisma.citizen.findUnique({ where: { id: participant2Id }, select: { tenantId: true, isActive: true } })
        : await prisma.user.findUnique({ where: { id: participant2Id }, select: { tenantId: true, isActive: true } });
    if (!target || target.isActive === false || (target.tenantId || tenantOf(undefined)) !== tenantOf(user as any)) {
      return 'Destinatário não encontrado';
    }
    return null;
  }

  // Fase 6 Multi-Tenant: estabelece o tenant (claim do JWT) para toda a request
  // do bot — o interceptor do DigiUrbanIntegration injeta X-Tenant-Id a partir
  // daqui. Deve rodar APÓS o authMiddleware.
  private botTenantMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
    const tenantId = (req.user as { tenantId?: string } | undefined)?.tenantId;
    runWithTenant(tenantId, () => next());
  }

  private conversationRoutes() {
    const router = express.Router();

    // Listar conversas do usuário
    router.get('/', async (req: AuthRequest, res: Response) => {
      try {
        const conversations = await conversationService.getConversationsByUser(
          req.user!.userId,
          req.user!.userType,
          tenantOf(req.user as any)
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
        const problem = await this.checkRecipient(req.user!, participant2Id, participant2Type);
        if (problem) {
          res.status(problem === 'Destinatário não encontrado' ? 404 : 400).json({ error: problem });
          return;
        }

        const conversation = await conversationService.findOrCreateConversation({
          participant1Id: req.user!.userId,
          participant1Type: req.user!.userType,
          participant2Id,
          participant2Type,
          protocolId: typeof protocolId === 'string' ? protocolId : undefined,
          departmentId: typeof departmentId === 'string' ? departmentId : undefined,
          tenantId: tenantOf(req.user as any),
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
        const limit = Math.min(200, parseInt(req.query.limit as string || '50', 10) || 50);
        const offset = parseInt(req.query.offset as string || '0', 10);

        // Antes não havia checagem: qualquer usuário lia qualquer conversa pelo id
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conv || !canReadConversation(conv as any, req.user as any)) {
          res.status(404).json({ error: 'Conversa não encontrada' });
          return;
        }

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

    // "Apagar para todos" foi retirado: o histórico de um atendimento público
    // não pode ser apagado por uma das partes (registro e LGPD). Fica só "apagar para mim".
    router.post('/:conversationId/clear', (_req: AuthRequest, res: Response) => {
      res.status(410).json({ error: 'O histórico do atendimento não pode ser apagado para todos. Use "apagar para mim".' });
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
          req.user!.userType,
          tenantOf(req.user as any)
        );

        res.json({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message === 'Conversation not found') {
          res.status(404).json({ error: 'Conversa não encontrada' });
          return;
        }
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

    // Enviar mensagem via HTTP (quando o tempo real cai)
    router.post('/send', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId } = req.body || {};
        const conversation =
          typeof conversationId === 'string' ? await prisma.conversation.findUnique({ where: { id: conversationId } }) : null;
        const user = { userId: req.user!.userId, userType: req.user!.userType, tenantId: tenantOf(req.user as any) };
        if (!conversation || !canReadConversation(conversation as any, user)) {
          res.status(404).json({ error: 'Conversa não encontrada' });
          return;
        }
        if (!canWriteConversation(conversation as any, user)) {
          res.status(403).json({
            error: conversation.isBotConversation
              ? 'Assuma o atendimento para responder esta conversa'
              : 'Esta conversa não aceita respostas',
          });
          return;
        }

        const message = await deliverChatMessage(conversation, user, req.body || {});
        res.json(message);
      } catch (error) {
        if (error instanceof ChatError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        logger.error('Error in POST /messages/send', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Enviar mensagem criando a conversa se preciso (mesmas regras do find-or-create)
    router.post('/send-auto', async (req: AuthRequest, res: Response) => {
      try {
        const { recipientId, recipientType } = req.body || {};
        const problem = await this.checkRecipient(req.user!, recipientId, recipientType);
        if (problem) {
          res.status(problem === 'Destinatário não encontrado' ? 404 : 400).json({ error: problem });
          return;
        }

        const enriched = await conversationService.findOrCreateConversation({
          participant1Id: req.user!.userId,
          participant1Type: req.user!.userType,
          participant2Id: recipientId,
          participant2Type: recipientType,
          tenantId: tenantOf(req.user as any),
        });
        const conversation = await prisma.conversation.findUnique({ where: { id: enriched.id } });
        if (!conversation) {
          res.status(404).json({ error: 'Conversa não encontrada' });
          return;
        }
        const user = { userId: req.user!.userId, userType: req.user!.userType, tenantId: tenantOf(req.user as any) };
        const message = await deliverChatMessage(conversation, user, req.body || {});

        // a conversa aparece na lista de quem recebe
        if (this.wsServer) {
          this.wsServer.io.to(`user:${recipientId}:${recipientType}`).emit('conversation:new', { conversation: enriched });
        }

        res.json({ success: true, conversation: enriched, message });
      } catch (error) {
        if (error instanceof ChatError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        logger.error('Error in POST /messages/send-auto', { error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Apagar a própria mensagem (o outro lado vê sumir na hora)
    router.delete('/:messageId', async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        const { messageId } = req.params;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.isDeleted) {
          res.status(404).json({ error: 'Message not found' });
          return;
        }

        if (message.senderId !== req.user!.userId || message.senderType !== req.user!.userType) {
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

        if (this.wsServer) {
          const conversation = await prisma.conversation.findUnique({
            where: { id: message.conversationId },
            select: { participant1Id: true, participant1Type: true, participant2Id: true, participant2Type: true },
          });
          const event = { conversationId: message.conversationId, messageId };
          this.wsServer.io.to(`conversation:${message.conversationId}`).emit('message:deleted', event);
          if (conversation) {
            this.wsServer.io.to(`user:${conversation.participant1Id}:${conversation.participant1Type}`).emit('message:deleted', event);
            this.wsServer.io.to(`user:${conversation.participant2Id}:${conversation.participant2Type}`).emit('message:deleted', event);
          }
        }

        res.json({ success: true });
      } catch (error) {
        logger.error('Error in DELETE /messages/:id', { error });
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
        // Lista de cidadãos é só para servidores, e só do próprio município
        if (!isServer(req.user as any)) {
          res.status(403).json({ error: 'Acesso restrito aos servidores' });
          return;
        }
        const { search, limit = 50, offset = 0 } = req.query;

        const where: any = {
          isActive: true,
          tenantId: tenantOf(req.user as any),
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

        res.json(citizens.map((c: any) => ({ ...c, cpf: maskCpf(c.cpf) })));
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
          tenantId: tenantOf(req.user as any),
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
        const me = req.user as any;
        const self = me?.userId === userId && me?.userType === userType;

        if (userType === 'CITIZEN') {
          if (!self && !isServer(me)) {
            res.status(403).json({ error: 'Acesso negado' });
            return;
          }
          const citizen = await prisma.citizen.findUnique({
            where: { id: userId },
            select: {
              id: true,
              tenantId: true,
              name: true,
              email: true,
              cpf: true,
              phone: true,
          avatar: true,
              
            },
          });

          if (!citizen || (!self && (citizen.tenantId || tenantOf(undefined)) !== tenantOf(me))) {
            res.status(404).json({ error: 'Citizen not found' });
            return;
          }

          const { tenantId: _t, ...pub } = citizen as any;
          res.json(self ? pub : { ...pub, cpf: maskCpf(pub.cpf) });
        } else if (userType === 'SERVER') {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              tenantId: true,
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

          if (!user || (!self && (user.tenantId || tenantOf(undefined)) !== tenantOf(me))) {
            res.status(404).json({ error: 'User not found' });
            return;
          }

          const { tenantId: _ut, ...publicUser } = user as any;
          // cidadão vê só o nome e a secretaria do servidor (sem e-mail de trabalho)
          res.json(isServer(me) || self ? publicUser : { id: publicUser.id, name: publicUser.name, department: publicUser.department });
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

    // conversa com o assistente é do cidadão (servidor só pausa/retoma)
    const citizenOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
      if (req.user?.userType !== 'CITIZEN') {
        res.status(403).json({ error: 'Rota do portal do cidadão' });
        return;
      }
      next();
    };
    router.use(['/start', '/message', '/active-execution', '/upload', '/cancel', '/reset'], citizenOnly);

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
      let lockKey: BotLock | null = null;
      try {
        const { flowName, conversationId } = req.body;
        const citizenId = req.user!.userId;
        lockKey = await acquireBotLock(citizenId, conversationId);

        if (!lockKey) {
          res.status(409).json({
            error: 'bot_flow_request_in_progress',
            message: 'Aguarde a resposta do DigiBot antes de tentar novamente.',
          });
          return;
        }

        const result = await this.flowEngineService.startFlow(
          citizenId,
          flowName || 'ai_assistant',
          conversationId
        );
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/start', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      } finally {
        await releaseBotLock(lockKey);
      }
    });

    // POST /api/bot-flow/message - Processa mensagem do usuário
    router.post('/message', async (req: AuthRequest, res: Response) => {
      let lockKey: BotLock | null = null;
      try {
        const { message, conversationId } = req.body;
        const citizenId = req.user!.userId;
        lockKey = await acquireBotLock(citizenId, conversationId);

        if (!lockKey) {
          res.status(409).json({
            error: 'bot_flow_request_in_progress',
            message: 'Aguarde a resposta do DigiBot antes de tentar novamente.',
          });
          return;
        }

        const result = await this.flowEngineService.processMessage(citizenId, message, conversationId);
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/message', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      } finally {
        await releaseBotLock(lockKey);
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

    // GET /api/bot-flow/status - Situação real do atendimento do cidadão:
    // com o bot, aguardando atendente (posição na fila) ou com um atendente.
    // Antes a tela mostrava "Atendente humano conectado" assim que a pessoa
    // PEDIA, mesmo sem ninguém ter assumido.
    router.get('/status', async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;
        const tenantId = tenantOf(req.user as any);
        const conv = await prisma.conversation.findFirst({
          where: { participant1Id: citizenId, participant1Type: 'CITIZEN', isBotConversation: true },
          orderBy: { updatedAt: 'desc' },
          select: { id: true, tenantId: true, metadata: true, activeFlowExecution: { select: { isPaused: true, pausedAt: true } } },
        });
        if (!conv || !conv.activeFlowExecution?.isPaused) {
          res.json({ status: 'bot' });
          return;
        }
        const meta = (conv.metadata as Record<string, any> | null) || {};
        if (meta.takenOverBy) {
          const attendant = await prisma.user.findUnique({ where: { id: String(meta.takenOverBy) }, select: { name: true } }).catch(() => null);
          res.json({ status: 'human', attendantName: attendant?.name?.split(' ')[0] || null });
          return;
        }
        // posição: conversas do mesmo município aguardando e ainda não assumidas, por ordem de pedido
        const waiting = await prisma.conversation.findMany({
          where: { tenantId: conv.tenantId || tenantId, isBotConversation: true, status: 'ACTIVE', activeFlowExecution: { isPaused: true } },
          select: { id: true, metadata: true, activeFlowExecution: { select: { pausedAt: true } } },
        });
        const queue = waiting
          .filter((c) => !((c.metadata as Record<string, any> | null) || {}).takenOverBy)
          .sort((a, b) => (a.activeFlowExecution?.pausedAt?.getTime() || 0) - (b.activeFlowExecution?.pausedAt?.getTime() || 0));
        const position = queue.findIndex((c) => c.id === conv.id) + 1;
        res.json({ status: 'waiting', position: position > 0 ? position : null });
      } catch (error) {
        logger.error('Error in GET /bot-flow/status', { error: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/upload - Upload de arquivos
    router.post('/upload', upload.array('files', 5), async (req: AuthRequest, res: Response) => {
      let lockKey: BotLock | null = null;
      try {
        const citizenId = req.user!.userId;
        const files = req.files as Express.Multer.File[];

        const conversationId = req.body?.conversationId as string | undefined;
        lockKey = await acquireBotLock(citizenId, conversationId);

        if (!lockKey) {
          res.status(409).json({
            error: 'bot_flow_request_in_progress',
            message: 'Aguarde a resposta do DigiBot antes de tentar novamente.',
          });
          return;
        }

        const uploadMetadata = req.body?.fileMetadata as string | undefined;
        const result = await this.flowEngineService.handleUpload(citizenId, files, conversationId, uploadMetadata);
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/upload', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      } finally {
        await releaseBotLock(lockKey);
      }
    });

    // POST /api/bot-flow/cancel - Cancela fluxo ativo
    router.post('/cancel', async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;
        await this.flowEngineService.cancelActiveFlow(citizenId);
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /bot-flow/cancel', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/reset - Reseta e reinicia o fluxo
    router.post('/reset', async (req: AuthRequest, res: Response) => {
      try {
        const citizenId = req.user!.userId;

        // Cancela fluxo atual
        await this.flowEngineService.cancelActiveFlow(citizenId);

        // Inicia assistente de IA
        const result = await this.flowEngineService.startFlow(citizenId, 'ai_assistant');
        res.json(result);
      } catch (error) {
        logger.error('Error in POST /bot-flow/reset', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/pause - Pausa bot para atendimento humano
    router.post('/pause', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId, citizenId: bodyCitizenId } = req.body;
        let citizenId = req.user!.userId;

        if (req.user!.userType === 'SERVER') {
          // servidor: só conversa/cidadão do próprio município
          const resolved = await this.resolveCitizenForServer(req.user!, conversationId, bodyCitizenId);
          if (!resolved) {
            res.status(404).json({ error: 'Conversa não encontrada' });
            return;
          }
          citizenId = resolved;
        } else if (typeof conversationId === 'string' && conversationId) {
          // cidadão: só a própria conversa com o assistente
          const own = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { participant1Id: true, participant1Type: true, isBotConversation: true },
          });
          if (!own || !own.isBotConversation || own.participant1Id !== citizenId || own.participant1Type !== 'CITIZEN') {
            res.status(404).json({ error: 'Conversa não encontrada' });
            return;
          }
        }

        if (!citizenId) {
          res.status(400).json({ error: 'Citizen not found' });
          return;
        }

        await this.flowEngineService.pauseExecution(
          citizenId,
          conversationId,
          req.user!.userType === 'SERVER' ? req.user!.userId : undefined,
          req.user!.userType === 'SERVER' ? 'server_takeover' : 'citizen_request'
        );
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /bot-flow/pause', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // POST /api/bot-flow/resume - Retoma bot após atendimento humano
    router.post('/resume', async (req: AuthRequest, res: Response) => {
      try {
        const { conversationId, citizenId: bodyCitizenId } = req.body;
        let citizenId = req.user!.userId;

        if (req.user!.userType === 'SERVER') {
          // servidor: só conversa/cidadão do próprio município
          const resolved = await this.resolveCitizenForServer(req.user!, conversationId, bodyCitizenId);
          if (!resolved) {
            res.status(404).json({ error: 'Conversa não encontrada' });
            return;
          }
          citizenId = resolved;
        } else if (typeof conversationId === 'string' && conversationId) {
          // cidadão: só a própria conversa com o assistente
          const own = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { participant1Id: true, participant1Type: true, isBotConversation: true },
          });
          if (!own || !own.isBotConversation || own.participant1Id !== citizenId || own.participant1Type !== 'CITIZEN') {
            res.status(404).json({ error: 'Conversa não encontrada' });
            return;
          }
        }

        if (!citizenId) {
          res.status(400).json({ error: 'Citizen not found' });
          return;
        }

        const attendant =
          req.user!.userType === 'SERVER'
            ? await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } }).catch(() => null)
            : null;
        await this.flowEngineService.resumeExecution(
          citizenId,
          conversationId,
          req.user!.userType === 'SERVER' ? req.user!.userId : 'CITIZEN',
          { attendantName: attendant?.name || null }
        );
        res.json({ success: true });
      } catch (error) {
        logger.error('Error in POST /bot-flow/resume', { error: error instanceof Error ? { message: error.message, stack: error.stack } : error });
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // GET /api/bot-flow/health - Health check do bot
    router.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'bot-flow',
        timestamp: new Date().toISOString(),
        data: this.flowEngineService.getBotHealth(),
      });
    });

    return router;
  }

  /** Cidadão da conversa do assistente, se for do município do servidor */
  private async resolveCitizenForServer(user: JwtPayload, conversationId?: unknown, bodyCitizenId?: unknown): Promise<string | null> {
    const tenant = tenantOf(user as any);
    if (typeof conversationId === 'string' && conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { tenantId: true, isBotConversation: true, participant1Id: true, participant1Type: true },
      });
      if (!conversation || !conversation.isBotConversation || (conversation.tenantId || tenantOf(undefined)) !== tenant) return null;
      return conversation.participant1Type === 'CITIZEN' ? conversation.participant1Id : null;
    }
    if (typeof bodyCitizenId === 'string' && bodyCitizenId) {
      const citizen = await prisma.citizen.findUnique({ where: { id: bodyCitizenId }, select: { tenantId: true } });
      return citizen && (citizen.tenantId || tenantOf(undefined)) === tenant ? bodyCitizenId : null;
    }
    return null;
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
        const queue = await handoverService.getPendingHandoverQueue(departmentId as string, tenantOf(req.user as any));

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
        const result = await handoverService.takeoverConversation(String(conversationId), {
          userId: req.user!.userId,
          tenantId: tenantOf(req.user as any),
          name: (req.user as any).name || null,
        });
        const conversation = await conversationService.getEnrichedConversation(String(conversationId));
        res.json({ ...result, conversation });
      } catch (error: any) {
        if (error instanceof HandoverError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        logger.error('Erro ao assumir conversa', { error });
        res.status(500).json({ error: 'Não foi possível assumir a conversa' });
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

  public getHandoverService() {
    return this.flowEngineService.getHandoverService();
  }

  public getApp(): Application {
    return this.app;
  }
}

export default ExpressServer;
