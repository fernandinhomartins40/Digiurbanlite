import { Server as SocketIOServer, Socket } from 'socket.io';
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
        // Tentar obter token de múltiplas fontes (mesmo comportamento do Express REST API)
        let token = socket.handshake.auth.token; // 1. Auth object (cidadão)

        if (!token) {
          // 2. Authorization header (fallback)
          token = socket.handshake.headers.authorization?.replace('Bearer ', '');
        }

        if (!token) {
          // 3. Cookies (admin) - parsear manualmente do header Cookie
          const cookieHeader = socket.handshake.headers.cookie;
          if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>);

            token = cookies.digiurban_admin_token || cookies.digiurban_citizen_token;
          }
        }

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verificar token JWT
        const payload = verifyToken(token);

        // ⚠️ COMPATIBILIDADE DE PAYLOAD (corrigido 2026-09-15)
        //
        // O backend emite tokens com `type` ('admin' | 'citizen'), NÃO com
        // `userType`. Como a validação abaixo exigia `userType`, TODA conexão
        // vinda de um admin era rejeitada em silêncio — o erro ocorre antes do
        // log de "authenticated", então nem aparecia nos logs. Foi o que impedia
        // a assistência remota de funcionar (zero conexões no servidor), e afeta
        // igualmente qualquer uso do chat por administradores.
        //
        // Mapeamos aqui, sem mexer no emissor do token: 'admin' é um SERVER
        // (servidor público) na taxonomia do messages-server; 'citizen' é
        // CITIZEN. Tokens que já trazem `userType` seguem valendo.
        if (!payload.userType && (payload as any).type) {
          const tipo = (payload as any).type;
          payload.userType = (tipo === 'citizen' ? 'CITIZEN' : 'SERVER') as ParticipantType;
        }

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

        // Registrar sessão WebSocket
        await prisma.webSocketSession.create({
          data: {
            socketId: socket.id,
            userId: payload.userId,
            userType: payload.userType,
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'] || 'unknown',
            isOnline: true,
          },
        });

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
      socket.on('ping', async () => {
        await prisma.webSocketSession.updateMany({
          where: { socketId: socket.id },
          data: { lastPingAt: new Date() },
        });
        socket.emit('pong');
      });

      // Disconnect
      socket.on('disconnect', async (reason) => {
        logger.info('Client disconnected', {
          socketId: socket.id,
          userId: authSocket.userId,
          reason,
        });

        await this.handleDisconnect(authSocket, reason);

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

      // Se for cidadão, buscar canais inscritos
      if (socket.userType === 'CITIZEN') {
        const subscriptions = await prisma.channelSubscription.findMany({
          where: {
            citizenId: socket.userId,
            status: 'ACTIVE',
          },
          select: { channelId: true },
        });

        for (const sub of subscriptions) {
          socket.join(`channel:${sub.channelId}`);
        }
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
      const { conversationId, content, replyToId, attachments } = data;

      // Validar conversa
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!conversation) {
        callback?.({ error: 'Conversation not found' });
        return;
      }

      // Verificar se o usuário participa da conversa
      const isParticipant =
        (conversation.participant1Id === socket.userId && conversation.participant1Type === socket.userType) ||
        (conversation.participant2Id === socket.userId && conversation.participant2Type === socket.userType);

      if (!isParticipant) {
        callback?.({ error: 'Unauthorized' });
        return;
      }

      // Criar mensagem
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userId,
          senderType: socket.userType,
          content,
          contentType: attachments?.length > 0 ? 'IMAGE' : 'TEXT',
          attachments: attachments || [],
          replyToId,
          status: 'SENT',
        },
      });

      // Atualizar conversa
      const isP1Sender = conversation.participant1Id === socket.userId && conversation.participant1Type === socket.userType;
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 100),
          totalMessages: { increment: 1 },
          // Incrementar unread para o outro participante
          ...(isP1Sender
            ? { unreadCount2: { increment: 1 }, deletedAt2: null }
            : { unreadCount1: { increment: 1 }, deletedAt1: null }),
        },
      });

      // Emitir para a sala da conversa
      const messagePayload = { conversationId, message };
      this.io.to(`conversation:${conversationId}`).emit('message:new', messagePayload);

      // Também emitir para a sala pessoal do destinatário
      // (garante entrega quando ele ainda não entrou na sala da conversa, ex: conversa recém-criada)
      const isP1 = conversation.participant1Id === socket.userId && conversation.participant1Type === socket.userType;
      const recipientId = isP1 ? conversation.participant2Id : conversation.participant1Id;
      const recipientType = isP1 ? conversation.participant2Type : conversation.participant1Type;
      this.io.to(`user:${recipientId}:${recipientType}`).emit('message:new', messagePayload);

      // Log
      await prisma.messageLog.create({
        data: {
          level: 'INFO',
          event: 'message-sent',
          userId: socket.userType === 'SERVER' ? socket.userId : undefined,
          citizenId: socket.userType === 'CITIZEN' ? socket.userId : undefined,
          conversationId,
          messageId: message.id,
          message: 'Message sent successfully',
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
        },
      });

      callback?.({ success: true, message });
    } catch (error) {
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
      const { messageId, conversationId } = data;

      // Atualizar status da mensagem
      await prisma.message.updateMany({
        where: {
          id: messageId,
          conversationId,
          senderId: { not: socket.userId }, // Não é do próprio usuário
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      // Emitir confirmação de leitura
      this.io.to(`conversation:${conversationId}`).emit('message:read', {
        messageId,
        conversationId,
        readBy: socket.userId,
        readAt: new Date(),
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error('Error marking message as read', { error });
      callback?.({ error: 'Failed to mark as read' });
    }
  }

  private async handleTypingStart(socket: AuthenticatedSocket, data: any) {
    const { conversationId } = data;
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: socket.userId,
      userType: socket.userType,
    });
  }

  private async handleTypingStop(socket: AuthenticatedSocket, data: any) {
    const { conversationId } = data;
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
      const { conversationId } = data;
      socket.join(`conversation:${conversationId}`);
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

  private async handleDisconnect(socket: AuthenticatedSocket, reason: string) {
    try {
      // Atualizar sessão WebSocket
      await prisma.webSocketSession.updateMany({
        where: { socketId: socket.id },
        data: {
          isOnline: false,
          disconnectedAt: new Date(),
        },
      });

      // Log
      await prisma.messageLog.create({
        data: {
          level: 'INFO',
          event: 'user-disconnected',
          userId: socket.userType === 'SERVER' ? socket.userId : undefined,
          citizenId: socket.userType === 'CITIZEN' ? socket.userId : undefined,
          message: `User disconnected: ${reason}`,
          data: { reason },
        },
      });
    } catch (error) {
      logger.error('Error handling disconnect', { error });
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

  public async sendMessageToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }

  public async broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
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
