import { Server as SocketIOServer, Socket } from 'socket.io';
import { canReadConversation, canWriteConversation } from './accessControl';
import { ChatError, deliverChatMessage, setChatIO } from '../delivery/chatDelivery';
import { normalizeChatPayload, parseCookieHeader, pickSessionToken, portalFrom } from '../utils/authToken';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import { Server as HTTPServer } from 'http';
import logger from '../utils/logger';
import { verifyToken, JwtPayload } from '../utils/jwt';
import prisma from '../utils/prisma';
import type { ParticipantType } from '@prisma/client';
import {
  registerRemoteAssistHandlers,
  endSessionsOnDisconnect,
} from './RemoteAssistHandler';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userType: ParticipantType;
  tenantId?: string; // Fase 6 Multi-Tenant
  userData: JwtPayload;
  /** Equipe da plataforma (console /super-admin): pode iniciar assistência remota */
  isPlatformOperator?: boolean;
}

export class WebSocketServer {
  public io: SocketIOServer;
  private pubClient!: RedisClientType;
  private subClient!: RedisClientType;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    setChatIO(this.io);
    this.setupRedisAdapter();
    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private async setupRedisAdapter() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.pubClient = createClient({ url: redisUrl });
      this.subClient = this.pubClient.duplicate();

      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      this.io.adapter(createAdapter(this.pubClient, this.subClient));
      logger.info('Redis adapter configured for Socket.io');
    } catch (error) {
      logger.warn('Failed to setup Redis adapter, using in-memory adapter', { error });
    }
  }

  private setupAuthentication() {
    this.io.use(async (socket: Socket, next) => {
      try {
        // Sessão do portal em que a pessoa está (ver utils/authToken.ts)
        const portal = portalFrom(socket.handshake.auth?.portal, socket.handshake.headers.referer);
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '') ||
          pickSessionToken(parseCookieHeader(socket.handshake.headers.cookie), portal);

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // O backend emite `type`; o chat usa `userType` (ver normalizeChatPayload)
        const payload = normalizeChatPayload(verifyToken(token) as any) as JwtPayload & { isPlatformOperator?: boolean };
        const platformUserId = payload.isPlatformOperator ? payload.userId : null;

        // Validar tipo de participante
        if (!payload.userId || !payload.userType) {
          // Log explícito: esta rejeição era SILENCIOSA e custou horas de
          // diagnóstico. Sem os valores, "zero conexões" não diz o porquê.
          logger.warn('WebSocket rejeitado: payload sem userId/userType', {
            temUserId: Boolean(payload.userId),
            temUserType: Boolean(payload.userType),
            type: (payload as any).type ?? null,
          });
          return next(new Error('Invalid token payload'));
        }

        // Adicionar dados do usuário ao socket
        (socket as AuthenticatedSocket).userId = payload.userId;
        (socket as AuthenticatedSocket).userType = payload.userType;
        (socket as AuthenticatedSocket).tenantId = (payload as { tenantId?: string }).tenantId;
        (socket as AuthenticatedSocket).userData = payload;
        (socket as AuthenticatedSocket).isPlatformOperator = Boolean(platformUserId) || payload.role === 'SUPER_ADMIN';

        logger.info('User authenticated via WebSocket', {
          socketId: socket.id,
          userId: payload.userId,
          userType: payload.userType,
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', { error });
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;

      logger.info('Client connected', {
        socketId: socket.id,
        userId: authSocket.userId,
        userType: authSocket.userType,
      });

      // Entrar nas salas (rooms) do usuário
      await this.joinUserRooms(authSocket);

      // Event: enviar mensagem
      socket.on('message:send', async (data, callback) => {
        await this.handleSendMessage(authSocket, data, callback);
      });

      // Event: marcar mensagem como lida
      socket.on('message:read', async (data, callback) => {
        await this.handleMarkAsRead(authSocket, data, callback);
      });

      // Event: digitar (typing indicator)
      socket.on('typing:start', async (data) => {
        await this.handleTypingStart(authSocket, data);
      });

      socket.on('typing:stop', async (data) => {
        await this.handleTypingStop(authSocket, data);
      });

      // Event: entrar em conversa
      socket.on('conversation:join', async (data, callback) => {
        await this.handleJoinConversation(authSocket, data, callback);
      });

      // Event: sair de conversa
      socket.on('conversation:leave', async (data, callback) => {
        await this.handleLeaveConversation(authSocket, data, callback);
      });

      // Assistência remota (co-browsing somente-visualização, 2026-09-15).
      // Handlers em módulo próprio para não inchar esta classe — ver
      // RemoteAssistHandler.ts para as regras de consentimento e privacidade.
      registerRemoteAssistHandlers(this.io, authSocket);

      // Event: ping (manter conexão viva)
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnect
      socket.on('disconnect', async (reason) => {
        logger.info('Client disconnected', {
          socketId: socket.id,
          userId: authSocket.userId,
          reason,
        });

        // Encerra sessões de assistência remota deste usuário. Sem isto, fechar
        // a aba deixaria a sessão ATIVA para sempre e bloquearia novos convites
        // (há no máximo uma sessão viva por assistido).
        await endSessionsOnDisconnect(this.io, authSocket.userId);
      });

      // Error
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error });
      });
    });
  }

  private async joinUserRooms(socket: AuthenticatedSocket) {
    try {
      // Sala pessoal do usuário (específica por tipo)
      const userRoom = `user:${socket.userId}:${socket.userType}`;
      socket.join(userRoom);

      // Também entrar na sala genérica (backward compatibility)
      socket.join(`user:${socket.userId}`);

      // Fase 6 Multi-Tenant: sala com prefixo de tenant (defesa em profundidade).
      // Os ids sao cuid globais, entao userId ja isola — o prefixo garante que
      // broadcasts direcionados por tenant nunca cruzem municipios.
      if (socket.tenantId) {
        socket.join(`t:${socket.tenantId}:user:${socket.userId}`);
        // servidores do município: fila de atendimento humano (chegada e quem assumiu)
        if (socket.userType === 'SERVER' && !String(socket.userId).startsWith('platform:')) {
          socket.join(`t:${socket.tenantId}:servers`);
        }
      }

      // Buscar conversas do usuário
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: socket.userId, participant1Type: socket.userType },
            { participant2Id: socket.userId, participant2Type: socket.userType },
          ],
          status: 'ACTIVE',
        },
        select: { id: true },
      });

      // Entrar nas salas de cada conversa
      for (const conv of conversations) {
        socket.join(`conversation:${conv.id}`);
      }

      logger.debug('User joined rooms', {
        userId: socket.userId,
        conversations: conversations.length,
      });
    } catch (error) {
      logger.error('Error joining rooms', { userId: socket.userId, error });
    }
  }

  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      const conversationId = typeof data?.conversationId === 'string' ? data.conversationId : '';
      const conversation = conversationId ? await prisma.conversation.findUnique({ where: { id: conversationId } }) : null;
      const user = { userId: socket.userId, userType: socket.userType, tenantId: socket.tenantId };
      if (!conversation || !canReadConversation(conversation as any, user)) {
        callback?.({ error: 'Conversa não encontrada' });
        return;
      }
      if (!canWriteConversation(conversation as any, user)) {
        callback?.({
          error: conversation.isBotConversation
            ? 'Assuma o atendimento para responder esta conversa'
            : 'Esta conversa não aceita respostas',
        });
        return;
      }

      const message = await deliverChatMessage(conversation, user, data || {});
      callback?.({ success: true, message });
    } catch (error) {
      if (error instanceof ChatError) {
        callback?.({ error: error.message });
        return;
      }
      logger.error('Error sending message', { error, userId: socket.userId });
      callback?.({ error: 'Failed to send message' });
    }
  }

  private async handleMarkAsRead(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      const messageId = typeof data?.messageId === 'string' ? data.messageId : '';
      const conversationId = typeof data?.conversationId === 'string' ? data.conversationId : '';
      const conversation = conversationId ? await prisma.conversation.findUnique({ where: { id: conversationId } }) : null;
      // só quem pode ler a conversa marca como lida (antes qualquer conexão marcava qualquer mensagem)
      if (
        !conversation ||
        !canReadConversation(conversation as any, { userId: socket.userId, userType: socket.userType, tenantId: socket.tenantId })
      ) {
        callback?.({ error: 'Conversa não encontrada' });
        return;
      }

      const readAt = new Date();
      const result = await prisma.message.updateMany({
        where: {
          id: messageId,
          conversationId,
          NOT: { senderId: socket.userId, senderType: socket.userType },
        },
        data: { status: 'READ', readAt },
      });

      if (result.count > 0) {
        this.io.to(`conversation:${conversationId}`).emit('message:read', {
          messageId,
          conversationId,
          readBy: socket.userId,
          readAt,
        });
      }

      callback?.({ success: true });
    } catch (error) {
      logger.error('Error marking message as read', { error });
      callback?.({ error: 'Failed to mark as read' });
    }
  }

  private async handleTypingStart(socket: AuthenticatedSocket, data: any) {
    const { conversationId } = data || {};
    if (!socket.rooms.has(`conversation:${conversationId}`)) return; // só quem entrou na sala
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: socket.userId,
      userType: socket.userType,
    });
  }

  private async handleTypingStop(socket: AuthenticatedSocket, data: any) {
    const { conversationId } = data || {};
    if (!socket.rooms.has(`conversation:${conversationId}`)) return;
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId: socket.userId,
    });
  }

  private async handleJoinConversation(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      const { conversationId } = data || {};
      // Só entra na sala quem pode ler a conversa (antes: qualquer conexão
      // ouvia as mensagens de qualquer conversa em tempo real)
      const conversation = conversationId
        ? await prisma.conversation.findUnique({ where: { id: String(conversationId) } })
        : null;
      if (
        !conversation ||
        !canReadConversation(conversation as any, {
          userId: socket.userId,
          userType: socket.userType,
          tenantId: socket.tenantId,
        })
      ) {
        callback?.({ error: 'Conversa não encontrada' });
        return;
      }
      socket.join(`conversation:${conversation.id}`);
      callback?.({ success: true });
    } catch (error) {
      callback?.({ error: 'Failed to join conversation' });
    }
  }

  private async handleLeaveConversation(
    socket: AuthenticatedSocket,
    data: any,
    callback?: (response: any) => void
  ) {
    try {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      callback?.({ success: true });
    } catch (error) {
      callback?.({ error: 'Failed to leave conversation' });
    }
  }

  // Métodos públicos para enviar mensagens externamente
  public async sendMessageToUser(userId: string, userType: ParticipantType, event: string, data: any) {
    // Emitir para sala específica (com userType)
    this.io.to(`user:${userId}:${userType}`).emit(event, data);
    // Também emitir para sala genérica (backward compatibility)
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public async sendMessageToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * ✅ NOVO: Broadcast para todos os servidores de um departamento
   */
  public async broadcastToDepartment(departmentId: string, event: string, data: any) {
    // Buscar todos os usuários (servidores) do departamento
    const users = await prisma.user.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      select: { id: true },
    });

    // Emitir para cada servidor
    for (const user of users) {
      this.io.to(`user:${user.id}:SERVER`).emit(event, data);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public async shutdown() {
    logger.info('Shutting down WebSocket server...');

    // Desconectar todos os clientes
    this.io.disconnectSockets(true);

    // Fechar servidor
    this.io.close();

    // Fechar Redis
    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();

    logger.info('WebSocket server shut down');
  }
}

export default WebSocketServer;
