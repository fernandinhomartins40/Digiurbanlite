import axios, { AxiosInstance } from 'axios';
import { outgoingServiceToken } from '../utils/secrets';

export interface InternalNotificationPayload {
  recipientType: 'user' | 'citizen';
  recipientId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: Array<'web' | 'push' | 'email' | 'sms' | 'chat'>;
  priority?: 'high' | 'normal' | 'low';
}

export class DigiUrbanIntegration {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.DIGIURBAN_API_URL || 'http://localhost:3001/api',
      headers: { 'Content-Type': 'application/json' },
      timeout: Number(process.env.DIGIURBAN_TIMEOUT_MS || 15000),
    });
    // token atual do painel em toda chamada (troca sem reiniciar)
    this.api.interceptors.request.use(async (config) => {
      const token = await outgoingServiceToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /** Aviso ao responsável — SEMPRE no município do aluno (antes ia sem município) */
  async dispatchNotification(tenantId: string, payload: InternalNotificationPayload) {
    const response = await this.api.post('/internal/notifications/dispatch', payload, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response.data;
  }
}

export default new DigiUrbanIntegration();
