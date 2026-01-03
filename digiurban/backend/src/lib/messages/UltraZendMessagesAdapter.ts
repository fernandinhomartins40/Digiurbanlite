import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';

// Logger simples para adapter
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || ''),
};

export interface MessageOptions {
  conversationId?: string;
  participant2Id: string;
  participant2Type: 'CITIZEN' | 'SERVER';
  content: string;
  attachments?: any[];
  protocolId?: string;
  departmentId?: string;
}

export interface BroadcastOptions {
  channelId: string;
  title?: string;
  content: string;
  attachments?: any[];
  scheduledFor?: Date;
  priority?: number;
}

export interface ChannelOptions {
  name: string;
  slug: string;
  description?: string;
  departmentId?: string;
  managedBy: string[];
  iconUrl?: string;
  isPublic?: boolean;
}

export class UltraZendMessagesAdapter {
  private httpClient: AxiosInstance;
  private wsClient: Socket | null = null;
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.MESSAGES_SERVER_URL || 'http://ultrazend-messages:9001';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.httpClient.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  /**
   * Conectar ao WebSocket
   */
  public connectWebSocket(token: string): Socket {
    if (this.wsClient?.connected) {
      return this.wsClient;
    }

    this.token = token;

    this.wsClient = io(this.baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.wsClient.on('connect', () => {
      logger.info('Connected to UltraZend Messages WebSocket');
    });

    this.wsClient.on('disconnect', (reason: string) => {
      logger.warn('Disconnected from UltraZend Messages WebSocket', { reason });
    });

    this.wsClient.on('error', (error: Error) => {
      logger.error('UltraZend Messages WebSocket error', { error });
    });

    return this.wsClient;
  }

  /**
   * Desconectar WebSocket
   */
  public disconnectWebSocket() {
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }

  /**
   * Enviar mensagem direta
   */
  public async sendMessage(userId: string, userType: 'CITIZEN' | 'SERVER', options: MessageOptions) {
    try {
      // Buscar ou criar conversa
      const conversation = await this.httpClient.post('/api/conversations/find-or-create', {
        participant2Id: options.participant2Id,
        participant2Type: options.participant2Type,
        protocolId: options.protocolId,
        departmentId: options.departmentId,
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      // Enviar mensagem
      const response = await this.httpClient.post('/api/messages/send', {
        conversationId: conversation.data.id,
        content: options.content,
        attachments: options.attachments || [],
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      logger.info('Message sent via UltraZend Messages', {
        conversationId: conversation.data.id,
        messageId: response.data.id,
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending message via UltraZend Messages', { error, options });
      throw error;
    }
  }

  /**
   * Criar canal oficial
   */
  public async createChannel(options: ChannelOptions) {
    try {
      const response = await this.httpClient.post('/api/admin/channels', options, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      logger.info('Channel created', { channelId: response.data.id, name: options.name });
      return response.data;
    } catch (error) {
      logger.error('Error creating channel', { error, options });
      throw error;
    }
  }

  /**
   * Enviar broadcast para canal
   */
  public async broadcastToChannel(options: BroadcastOptions) {
    try {
      const response = await this.httpClient.post(
        `/api/channels/${options.channelId}/broadcast`,
        {
          title: options.title,
          content: options.content,
          attachments: options.attachments || [],
          scheduledFor: options.scheduledFor,
          priority: options.priority || 3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      logger.info('Broadcast sent to channel', {
        channelId: options.channelId,
        messageId: response.data.id,
      });

      return response.data;
    } catch (error) {
      logger.error('Error broadcasting to channel', { error, options });
      throw error;
    }
  }

  /**
   * Listar conversas de um usuário
   */
  public async getUserConversations() {
    try {
      const response = await this.httpClient.get('/api/conversations', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting user conversations', { error });
      throw error;
    }
  }

  /**
   * Listar mensagens de uma conversa
   */
  public async getConversationMessages(conversationId: string, limit = 50, offset = 0) {
    try {
      const response = await this.httpClient.get(
        `/api/conversations/${conversationId}/messages`,
        {
          params: { limit, offset },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting conversation messages', { error, conversationId });
      throw error;
    }
  }

  /**
   * Contador de mensagens não lidas
   */
  public async getUnreadCount() {
    try {
      const response = await this.httpClient.get('/api/conversations/unread-count', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.data.count;
    } catch (error) {
      logger.error('Error getting unread count', { error });
      throw error;
    }
  }

  /**
   * Upload de arquivo
   */
  public async uploadFile(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([file.buffer]), file.originalname);

      const response = await this.httpClient.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error uploading file', { error });
      throw error;
    }
  }

  /**
   * Listar canais públicos
   */
  public async getChannels() {
    try {
      const response = await this.httpClient.get('/api/channels', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting channels', { error });
      throw error;
    }
  }

  /**
   * Inscrever cidadão em canal
   */
  public async subscribeToChannel(channelId: string) {
    try {
      const response = await this.httpClient.post(
        `/api/channels/${channelId}/subscribe`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error subscribing to channel', { error, channelId });
      throw error;
    }
  }

  /**
   * Cancelar inscrição de canal
   */
  public async unsubscribeFromChannel(channelId: string) {
    try {
      await this.httpClient.post(
        `/api/channels/${channelId}/unsubscribe`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      logger.info('Unsubscribed from channel', { channelId });
    } catch (error) {
      logger.error('Error unsubscribing from channel', { error, channelId });
      throw error;
    }
  }

  /**
   * Denunciar mensagem
   */
  public async reportMessage(messageId: string, reason: string, description?: string) {
    try {
      const response = await this.httpClient.post(
        '/api/reports',
        {
          messageId,
          reason,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      logger.info('Message reported', { messageId, reason });
      return response.data;
    } catch (error) {
      logger.error('Error reporting message', { error, messageId });
      throw error;
    }
  }

  /**
   * Obter estatísticas (admin)
   */
  public async getStats() {
    try {
      const response = await this.httpClient.get('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting stats', { error });
      throw error;
    }
  }

  /**
   * Verificar saúde do servidor
   */
  public async healthCheck() {
    try {
      const response = await this.httpClient.get('/health');
      return response.data;
    } catch (error) {
      logger.error('UltraZend Messages health check failed', { error });
      return { status: 'unhealthy', error };
    }
  }

  /**
   * Definir token de autenticação
   */
  public setToken(token: string) {
    this.token = token;
  }

  /**
   * Obter instância do WebSocket
   */
  public getWebSocket(): Socket | null {
    return this.wsClient;
  }
}

// Singleton
export default new UltraZendMessagesAdapter();
