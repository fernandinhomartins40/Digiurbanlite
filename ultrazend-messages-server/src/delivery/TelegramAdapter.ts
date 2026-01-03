import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

/**
 * Adapter para integração com Telegram Bot API
 * Permite enviar mensagens via bot do Telegram
 */
export class TelegramAdapter {
  private client!: AxiosInstance;
  private botToken: string | null = null;
  private botUsername: string | null = null;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;

    if (!this.botToken) {
      logger.warn('Telegram Bot Token not configured');
      return;
    }

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${this.botToken}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initialize();
  }

  private async initialize() {
    try {
      const response = await this.client.get('/getMe');
      this.botUsername = response.data.result.username;
      logger.info('Telegram Bot initialized', {
        username: this.botUsername,
        botId: response.data.result.id,
      });
    } catch (error) {
      logger.error('Failed to initialize Telegram Bot', { error });
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendMessage(chatId: string | number, text: string, options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
    disableNotification?: boolean;
    replyToMessageId?: number;
  }): Promise<any> {
    try {
      const response = await this.client.post('/sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode,
        disable_web_page_preview: options?.disableWebPagePreview,
        disable_notification: options?.disableNotification,
        reply_to_message_id: options?.replyToMessageId,
      });

      logger.info('Telegram message sent', {
        chatId,
        messageId: response.data.result.message_id,
      });

      return response.data.result;
    } catch (error) {
      logger.error('Error sending Telegram message', { error, chatId });
      throw error;
    }
  }

  /**
   * Enviar foto
   */
  async sendPhoto(chatId: string | number, photoUrl: string, caption?: string): Promise<any> {
    try {
      const response = await this.client.post('/sendPhoto', {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
      });

      logger.info('Telegram photo sent', { chatId, photoUrl });
      return response.data.result;
    } catch (error) {
      logger.error('Error sending Telegram photo', { error, chatId });
      throw error;
    }
  }

  /**
   * Enviar documento
   */
  async sendDocument(chatId: string | number, documentUrl: string, caption?: string): Promise<any> {
    try {
      const response = await this.client.post('/sendDocument', {
        chat_id: chatId,
        document: documentUrl,
        caption,
        parse_mode: 'HTML',
      });

      logger.info('Telegram document sent', { chatId, documentUrl });
      return response.data.result;
    } catch (error) {
      logger.error('Error sending Telegram document', { error, chatId });
      throw error;
    }
  }

  /**
   * Enviar áudio
   */
  async sendAudio(chatId: string | number, audioUrl: string, caption?: string): Promise<any> {
    try {
      const response = await this.client.post('/sendAudio', {
        chat_id: chatId,
        audio: audioUrl,
        caption,
      });

      logger.info('Telegram audio sent', { chatId, audioUrl });
      return response.data.result;
    } catch (error) {
      logger.error('Error sending Telegram audio', { error, chatId });
      throw error;
    }
  }

  /**
   * Enviar localização
   */
  async sendLocation(chatId: string | number, latitude: number, longitude: number): Promise<any> {
    try {
      const response = await this.client.post('/sendLocation', {
        chat_id: chatId,
        latitude,
        longitude,
      });

      logger.info('Telegram location sent', { chatId, latitude, longitude });
      return response.data.result;
    } catch (error) {
      logger.error('Error sending Telegram location', { error, chatId });
      throw error;
    }
  }

  /**
   * Enviar mensagem com botões inline
   */
  async sendMessageWithInlineKeyboard(
    chatId: string | number,
    text: string,
    buttons: Array<Array<{ text: string; url?: string; callbackData?: string }>>
  ): Promise<any> {
    try {
      const inlineKeyboard = buttons.map(row =>
        row.map(btn => ({
          text: btn.text,
          url: btn.url,
          callback_data: btn.callbackData,
        }))
      );

      const response = await this.client.post('/sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });

      logger.info('Telegram message with buttons sent', { chatId });
      return response.data.result;
    } catch (error) {
      logger.error('Error sending Telegram message with buttons', { error, chatId });
      throw error;
    }
  }

  /**
   * Editar mensagem
   */
  async editMessage(chatId: string | number, messageId: number, newText: string): Promise<any> {
    try {
      const response = await this.client.post('/editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: 'HTML',
      });

      logger.info('Telegram message edited', { chatId, messageId });
      return response.data.result;
    } catch (error) {
      logger.error('Error editing Telegram message', { error, chatId, messageId });
      throw error;
    }
  }

  /**
   * Deletar mensagem
   */
  async deleteMessage(chatId: string | number, messageId: number): Promise<any> {
    try {
      const response = await this.client.post('/deleteMessage', {
        chat_id: chatId,
        message_id: messageId,
      });

      logger.info('Telegram message deleted', { chatId, messageId });
      return response.data.result;
    } catch (error) {
      logger.error('Error deleting Telegram message', { error, chatId, messageId });
      throw error;
    }
  }

  /**
   * Obter informações do chat
   */
  async getChat(chatId: string | number): Promise<any> {
    try {
      const response = await this.client.post('/getChat', {
        chat_id: chatId,
      });

      return response.data.result;
    } catch (error) {
      logger.error('Error getting Telegram chat info', { error, chatId });
      throw error;
    }
  }

  /**
   * Configurar webhook para receber mensagens
   */
  async setWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await this.client.post('/setWebhook', {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      });

      logger.info('Telegram webhook set', { webhookUrl });
      return response.data;
    } catch (error) {
      logger.error('Error setting Telegram webhook', { error, webhookUrl });
      throw error;
    }
  }

  /**
   * Remover webhook
   */
  async deleteWebhook(): Promise<any> {
    try {
      const response = await this.client.post('/deleteWebhook');
      logger.info('Telegram webhook deleted');
      return response.data;
    } catch (error) {
      logger.error('Error deleting Telegram webhook', { error });
      throw error;
    }
  }

  /**
   * Obter atualizações (polling mode)
   */
  async getUpdates(offset?: number): Promise<any> {
    try {
      const response = await this.client.post('/getUpdates', {
        offset,
        timeout: 30,
      });

      return response.data.result;
    } catch (error) {
      logger.error('Error getting Telegram updates', { error });
      throw error;
    }
  }

  /**
   * Formatar mensagem de protocolo para Telegram
   */
  formatProtocolMessage(protocolNumber: string, serviceName: string, status: string): string {
    const statusEmoji: Record<string, string> = {
      VINCULADO: '🔗',
      PROGRESSO: '⏳',
      CONCLUIDO: '✅',
      PENDENCIA: '⚠️',
      CANCELADO: '❌',
    };

    return `
${statusEmoji[status] || '📋'} <b>Protocolo #${protocolNumber}</b>

<b>Serviço:</b> ${serviceName}
<b>Status:</b> ${status}

Acesse o DigiUrban para mais detalhes.
    `.trim();
  }

  /**
   * Verificar se Telegram está configurado
   */
  isConfigured(): boolean {
    return !!this.botToken;
  }

  /**
   * Obter username do bot
   */
  getBotUsername(): string | null {
    return this.botUsername;
  }
}

export default new TelegramAdapter();
