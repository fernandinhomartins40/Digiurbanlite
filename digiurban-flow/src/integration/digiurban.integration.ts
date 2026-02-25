/**
 * Integração com o backend principal do DigiUrban
 * Permite comunicação bidirecional entre o módulo Flow e o backend
 */
import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import { config } from '../config/config';

class DigiUrbanIntegration {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.digiurbanApiUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'x-digiurban-flow-token': config.flowServiceToken,
      },
    });

    // Retry automático para erros de rede
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNABORTED'
        ) {
          logger.warn('DigiUrban API não acessível, tentando novamente em 2s...', {
            url: error.config?.url,
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Buscar dados de um departamento (setor)
   */
  async getDepartment(departmentId: string) {
    try {
      const response = await this.client.get(`/internal/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar departamento', { departmentId, error });
      return null;
    }
  }

  /**
   * Buscar dados de um usuário (servidor)
   */
  async getUser(userId: string) {
    try {
      const response = await this.client.get(`/internal/users/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar usuário', { userId, error });
      return null;
    }
  }

  /**
   * Buscar protocolo do cidadão (para vinculação)
   */
  async getCitizenProtocol(protocolId: string) {
    try {
      const response = await this.client.get(`/internal/protocols/${protocolId}`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar protocolo cidadão', { protocolId, error });
      return null;
    }
  }

  /**
   * Atualizar status do protocolo cidadão vinculado
   */
  async updateCitizenProtocolStatus(protocolId: string, status: string, note: string) {
    try {
      const response = await this.client.patch(`/internal/protocols/${protocolId}/status`, {
        status,
        note,
        source: 'flow-module',
      });
      return response.data;
    } catch (error) {
      logger.error('Erro ao atualizar protocolo cidadão', { protocolId, status, error });
      return null;
    }
  }

  /**
   * Enviar notificação para o sistema de notificações do backend
   */
  async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }) {
    try {
      const response = await this.client.post('/internal/notifications', data);
      return response.data;
    } catch (error) {
      logger.error('Erro ao enviar notificação', { error });
      return null;
    }
  }
}

export default new DigiUrbanIntegration();
