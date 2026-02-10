import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

/**
 * Adapter para integração com WhatsApp Business API
 * Suporta: Twilio WhatsApp API ou WhatsApp Cloud API
 */
export class WhatsAppAdapter {
  private client!: AxiosInstance;
  private provider: 'twilio' | 'meta';
  private phoneNumberId?: string;
  private accountSid?: string;
  private authToken?: string;

  constructor() {
    this.provider = (process.env.WHATSAPP_PROVIDER as 'twilio' | 'meta') || 'meta';

    if (this.provider === 'twilio') {
      this.setupTwilio();
    } else {
      this.setupMeta();
    }
  }

  private setupTwilio() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!this.accountSid || !this.authToken) {
      logger.warn('Twilio WhatsApp credentials not configured');
      return;
    }

    this.client = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`,
      auth: {
        username: this.accountSid,
        password: this.authToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    logger.info('Twilio WhatsApp adapter initialized');
  }

  private setupMeta() {
    const apiKey = process.env.WHATSAPP_API_KEY;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiKey || !this.phoneNumberId) {
      logger.warn('Meta WhatsApp Business API credentials not configured');
      return;
    }

    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    logger.info('Meta WhatsApp Business API adapter initialized');
  }

  /**
   * Enviar mensagem de texto via WhatsApp
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      if (this.provider === 'twilio') {
        return await this.sendTwilioMessage(to, message);
      } else {
        return await this.sendMetaMessage(to, message);
      }
    } catch (error) {
      logger.error('Error sending WhatsApp message', { error, to });
      throw error;
    }
  }

  /**
   * Enviar mensagem com mídia
   */
  async sendMediaMessage(to: string, mediaUrl: string, caption?: string): Promise<any> {
    try {
      if (this.provider === 'twilio') {
        return await this.sendTwilioMediaMessage(to, mediaUrl, caption);
      } else {
        return await this.sendMetaMediaMessage(to, mediaUrl, caption);
      }
    } catch (error) {
      logger.error('Error sending WhatsApp media message', { error, to, mediaUrl });
      throw error;
    }
  }

  /**
   * Enviar template message (pré-aprovado)
   */
  async sendTemplateMessage(to: string, templateName: string, params: any[]): Promise<any> {
    try {
      if (this.provider === 'meta') {
        const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: params.map(param => ({
                  type: 'text',
                  text: param,
                })),
              },
            ],
          },
        });

        logger.info('WhatsApp template message sent', { to, templateName });
        return response.data;
      } else {
        logger.warn('Template messages not supported with Twilio adapter');
        return null;
      }
    } catch (error) {
      logger.error('Error sending WhatsApp template', { error, to, templateName });
      throw error;
    }
  }

  /**
   * Twilio: Enviar mensagem de texto
   */
  private async sendTwilioMessage(to: string, message: string) {
    const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    const rawTo = to.startsWith('whatsapp:') ? to.replace(/^whatsapp:/, '') : to;
    const normalizedTo = rawTo.trim().startsWith('+') ? rawTo.trim() : `+${rawTo.trim()}`;
    const toFormatted = `whatsapp:${normalizedTo}`;

    const params = new URLSearchParams();
    params.append('From', from);
    params.append('To', toFormatted);
    params.append('Body', message);

    const response = await this.client.post('/Messages.json', params);

    logger.info('Twilio WhatsApp message sent', {
      to,
      sid: response.data.sid,
      status: response.data.status,
    });

    return response.data;
  }

  /**
   * Twilio: Enviar mensagem com mídia
   */
  private async sendTwilioMediaMessage(to: string, mediaUrl: string, caption?: string) {
    const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    const rawTo = to.startsWith('whatsapp:') ? to.replace(/^whatsapp:/, '') : to;
    const normalizedTo = rawTo.trim().startsWith('+') ? rawTo.trim() : `+${rawTo.trim()}`;
    const toFormatted = `whatsapp:${normalizedTo}`;

    const params = new URLSearchParams();
    params.append('From', from);
    params.append('To', toFormatted);
    params.append('MediaUrl', mediaUrl);
    if (caption) {
      params.append('Body', caption);
    }

    const response = await this.client.post('/Messages.json', params);

    logger.info('Twilio WhatsApp media message sent', {
      to,
      mediaUrl,
      sid: response.data.sid,
    });

    return response.data;
  }

  /**
   * Meta: Enviar mensagem de texto
   */
  private async sendMetaMessage(to: string, message: string) {
    const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    });

    logger.info('Meta WhatsApp message sent', {
      to,
      messageId: response.data.messages[0]?.id,
    });

    return response.data;
  }

  /**
   * Meta: Enviar mensagem com mídia
   */
  private async sendMetaMediaMessage(to: string, mediaUrl: string, caption?: string) {
    const mediaType = this.getMediaType(mediaUrl);

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatPhoneNumber(to),
      type: mediaType,
      [mediaType]: {
        link: mediaUrl,
      },
    };

    if (caption && (mediaType === 'image' || mediaType === 'video')) {
      payload[mediaType].caption = caption;
    }

    const response = await this.client.post(`/${this.phoneNumberId}/messages`, payload);

    logger.info('Meta WhatsApp media message sent', {
      to,
      mediaType,
      messageId: response.data.messages[0]?.id,
    });

    return response.data;
  }

  /**
   * Determinar tipo de mídia pela URL
   */
  private getMediaType(mediaUrl: string): string {
    const extension = mediaUrl.split('.').pop()?.toLowerCase();

    const imageExts = ['jpg', 'jpeg', 'png', 'webp'];
    const videoExts = ['mp4', 'avi', 'mov'];
    const audioExts = ['mp3', 'ogg', 'wav', 'aac'];
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

    if (imageExts.includes(extension || '')) return 'image';
    if (videoExts.includes(extension || '')) return 'video';
    if (audioExts.includes(extension || '')) return 'audio';
    if (documentExts.includes(extension || '')) return 'document';

    return 'document'; // Padrão
  }

  /**
   * Formatar número de telefone (remover caracteres especiais)
   */
  private formatPhoneNumber(phone: string): string {
    // Remover whatsapp: prefix se existir
    let formatted = phone.replace('whatsapp:', '');

    // Remover caracteres não numéricos
    formatted = formatted.replace(/\D/g, '');

    // Garantir que tenha código do país
    if (!formatted.startsWith('55')) {
      formatted = '55' + formatted; // Brasil
    }

    return formatted;
  }

  /**
   * Verificar se WhatsApp está configurado
   */
  isConfigured(): boolean {
    if (this.provider === 'twilio') {
      return !!(this.accountSid && this.authToken);
    } else {
      return !!(this.phoneNumberId && process.env.WHATSAPP_API_KEY);
    }
  }
}

export default new WhatsAppAdapter();
