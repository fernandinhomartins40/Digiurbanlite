import { createClient, RedisClientType } from 'redis';

export interface BotContext {
  citizenId: string;
  lastIntent?: string;
  lastMessage?: string;
  conversationHistory?: Array<{
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>;
  currentFlow?: string;
  flowData?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Gerenciador de contexto de conversas usando Redis
 * Mantém o estado da conversa entre mensagens
 */
export class ContextManager {
  private redis: RedisClientType | null = null;
  private isConnected: boolean = false;
  private fallbackStore: Map<string, BotContext> = new Map();
  private readonly TTL = 60 * 60 * 24; // 24 horas

  constructor() {
    // Inicializar Redis sem bloquear (fire and forget)
    this.initializeRedis().catch(err => {
      console.error('⚠️  Erro ao inicializar Redis:', err);
    });
  }

  /**
   * Inicializa conexão com Redis
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redis = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis: Máximo de tentativas de reconexão atingido');
              return false; // Retornar false para parar tentativas
            }
            return Math.min(retries * 100, 3000);
          },
          connectTimeout: 5000 // Timeout de 5 segundos
        }
      });

      this.redis.on('error', (err) => {
        console.error('❌ Redis Error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis conectado para bot context');
        this.isConnected = true;
      });

      this.redis.on('disconnect', () => {
        console.log('⚠️  Redis desconectado - usando fallback em memória');
        this.isConnected = false;
      });

      await this.redis.connect();
    } catch (error: any) {
      console.log('⚠️  Redis não disponível - usando fallback em memória');
      this.isConnected = false;
      this.redis = null;
    }
  }

  /**
   * Gera chave Redis para um cidadão
   */
  private getRedisKey(citizenId: string): string {
    return `bot:context:${citizenId}`;
  }

  /**
   * Obtém o contexto de um cidadão
   */
  async getContext(citizenId: string): Promise<BotContext> {
    try {
      if (this.isConnected && this.redis) {
        const data = await this.redis.get(this.getRedisKey(citizenId));

        if (data) {
          const context = JSON.parse(data);
          // Converter timestamps de string para Date
          if (context.timestamp) {
            context.timestamp = new Date(context.timestamp);
          }
          if (context.conversationHistory) {
            context.conversationHistory = context.conversationHistory.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          }
          return context;
        }
      } else {
        // Fallback: usar Map em memória
        const context = this.fallbackStore.get(citizenId);
        if (context) {
          return context;
        }
      }

      // Contexto inicial
      return {
        citizenId,
        conversationHistory: [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter contexto:', error);
      return {
        citizenId,
        conversationHistory: [],
        timestamp: new Date()
      };
    }
  }

  /**
   * Atualiza o contexto de um cidadão
   */
  async updateContext(citizenId: string, updates: Partial<BotContext>): Promise<void> {
    try {
      const currentContext = await this.getContext(citizenId);

      const updatedContext: BotContext = {
        ...currentContext,
        ...updates,
        citizenId,
        timestamp: new Date()
      };

      // Limitar histórico a últimas 50 mensagens
      if (updatedContext.conversationHistory && updatedContext.conversationHistory.length > 50) {
        updatedContext.conversationHistory = updatedContext.conversationHistory.slice(-50);
      }

      if (this.isConnected && this.redis) {
        await this.redis.setEx(
          this.getRedisKey(citizenId),
          this.TTL,
          JSON.stringify(updatedContext)
        );
      } else {
        // Fallback: salvar em Map
        this.fallbackStore.set(citizenId, updatedContext);
      }
    } catch (error) {
      console.error('Erro ao atualizar contexto:', error);
    }
  }

  /**
   * Adiciona mensagem ao histórico da conversa
   */
  async addToHistory(
    citizenId: string,
    role: 'user' | 'bot',
    content: string
  ): Promise<void> {
    try {
      const context = await this.getContext(citizenId);

      if (!context.conversationHistory) {
        context.conversationHistory = [];
      }

      context.conversationHistory.push({
        role,
        content,
        timestamp: new Date()
      });

      await this.updateContext(citizenId, context);
    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
    }
  }

  /**
   * Obtém histórico de conversa
   */
  async getHistory(
    citizenId: string,
    limit: number = 10
  ): Promise<Array<{ role: 'user' | 'bot'; content: string; timestamp: Date }>> {
    try {
      const context = await this.getContext(citizenId);
      const history = context.conversationHistory || [];

      return history.slice(-limit);
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }

  /**
   * Inicia um fluxo de conversa (ex: formulário multi-step)
   */
  async startFlow(
    citizenId: string,
    flowName: string,
    initialData?: Record<string, any>
  ): Promise<void> {
    await this.updateContext(citizenId, {
      currentFlow: flowName,
      flowData: initialData || {}
    });
  }

  /**
   * Atualiza dados do fluxo atual
   */
  async updateFlowData(
    citizenId: string,
    data: Record<string, any>
  ): Promise<void> {
    const context = await this.getContext(citizenId);

    await this.updateContext(citizenId, {
      flowData: {
        ...(context.flowData || {}),
        ...data
      }
    });
  }

  /**
   * Finaliza o fluxo atual
   */
  async endFlow(citizenId: string): Promise<Record<string, any> | null> {
    const context = await this.getContext(citizenId);
    const flowData = context.flowData || null;

    await this.updateContext(citizenId, {
      currentFlow: undefined,
      flowData: undefined
    });

    return flowData;
  }

  /**
   * Obtém o fluxo atual
   */
  async getCurrentFlow(citizenId: string): Promise<{
    flowName?: string;
    flowData?: Record<string, any>;
  }> {
    const context = await this.getContext(citizenId);

    return {
      flowName: context.currentFlow,
      flowData: context.flowData
    };
  }

  /**
   * Limpa o contexto de um cidadão
   */
  async clearContext(citizenId: string): Promise<void> {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(this.getRedisKey(citizenId));
      } else {
        this.fallbackStore.delete(citizenId);
      }
    } catch (error) {
      console.error('Erro ao limpar contexto:', error);
    }
  }

  /**
   * Define um valor temporário no contexto
   */
  async setTemp(
    citizenId: string,
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    const context = await this.getContext(citizenId);

    if (!context.metadata) {
      context.metadata = {};
    }

    context.metadata[key] = value;

    await this.updateContext(citizenId, context);

    // Se TTL específico for definido, agendar limpeza
    if (ttlSeconds) {
      setTimeout(async () => {
        const ctx = await this.getContext(citizenId);
        if (ctx.metadata && ctx.metadata[key]) {
          delete ctx.metadata[key];
          await this.updateContext(citizenId, ctx);
        }
      }, ttlSeconds * 1000);
    }
  }

  /**
   * Obtém um valor temporário do contexto
   */
  async getTemp(citizenId: string, key: string): Promise<any> {
    const context = await this.getContext(citizenId);
    return context.metadata?.[key];
  }

  /**
   * Verifica se o Redis está conectado
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Fecha conexão com Redis
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Obtém estatísticas de uso
   */
  async getStats(): Promise<{
    totalContexts: number;
    redisConnected: boolean;
    fallbackSize: number;
  }> {
    let totalContexts = 0;

    if (this.isConnected && this.redis) {
      try {
        const keys = await this.redis.keys('bot:context:*');
        totalContexts = keys.length;
      } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
      }
    }

    return {
      totalContexts,
      redisConnected: this.isConnected,
      fallbackSize: this.fallbackStore.size
    };
  }
}

export default new ContextManager();
