/**
 * DigiUrbanIntegration
 * Service para chamar APIs do DigiUrban Backend
 * Substitui as chamadas diretas ao Prisma no ActionHandlers
 */

import axios, { AxiosInstance } from 'axios';

export class DigiUrbanIntegration {
  private api: AxiosInstance;
  private apiUrl: string;
  private serviceToken: string;

  constructor() {
    this.apiUrl = process.env.DIGIURBAN_API_URL || 'http://localhost:3001/api';
    this.serviceToken = process.env.DIGIURBAN_SERVICE_TOKEN || '';

    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${this.serviceToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Buscar cidadão por ID
   */
  async getCitizen(citizenId: string) {
    const response = await this.api.get(`/internal/citizens/${citizenId}`);
    return response.data;
  }

  /**
   * Atualizar perfil do cidadão
   */
  async updateCitizenProfile(citizenId: string, data: any) {
    const response = await this.api.put(`/internal/citizens/${citizenId}`, data);
    return response.data;
  }

  /**
   * Buscar serviços (por query, categoria ou populares)
   */
  async searchServices(query?: string, category?: string, limit: number = 10) {
    const response = await this.api.get('/internal/services/search', {
      params: { query, category, limit },
    });
    return response.data;
  }

  /**
   * Listar todos os serviços ativos
   */
  async listServices(limit: number = 50) {
    const response = await this.api.get('/internal/services', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Listar categorias de serviços
   */
  async listServiceCategories() {
    const response = await this.api.get('/internal/services/categories');
    return response.data;
  }

  /**
   * Obter detalhes de um serviço
   */
  async getService(serviceId: string) {
    const response = await this.api.get(`/internal/services/${serviceId}`);
    return response.data;
  }

  /**
   * Criar protocolo
   */
  async createProtocol(data: {
    citizenId: string;
    serviceId: string;
    description: string;
    customData?: any;
    documents?: any[];
  }) {
    const response = await this.api.post('/internal/protocols', data);
    return response.data;
  }

  /**
   * Listar protocolos do cidadão
   */
  async getProtocols(citizenId: string, limit: number = 10) {
    const response = await this.api.get('/internal/protocols', {
      params: { citizenId, limit },
    });
    return response.data;
  }

  /**
   * Buscar protocolo por número
   */
  async getProtocolByNumber(protocolNumber: string, citizenId: string) {
    const response = await this.api.get(`/internal/protocols/number/${protocolNumber}`, {
      params: { citizenId },
    });
    return response.data;
  }

  /**
   * Adicionar comentário ao protocolo
   */
  async addProtocolComment(protocolId: string, citizenId: string, comment: string) {
    const response = await this.api.post(`/internal/protocols/${protocolId}/comments`, {
      citizenId,
      comment,
    });
    return response.data;
  }

  /**
   * Obter composição familiar do cidadão
   */
  async getFamilyMembers(citizenId: string) {
    const response = await this.api.get(`/internal/citizens/${citizenId}/family`);
    return response.data;
  }

  /**
   * Listar notificações do cidadão
   */
  async getNotifications(citizenId: string, unreadOnly: boolean = false, limit: number = 20) {
    const response = await this.api.get('/internal/notifications', {
      params: { citizenId, unreadOnly, limit },
    });
    return response.data;
  }

  /**
   * Marcar notificações como lidas
   */
  async markNotificationsAsRead(citizenId: string, notificationIds?: string[]) {
    const response = await this.api.put('/internal/notifications/read', {
      citizenId,
      notificationIds,
    });
    return response.data;
  }

  /**
   * Listar departamentos
   */
  async getDepartments() {
    const response = await this.api.get('/internal/departments');
    return response.data;
  }

  /**
   * Formatar dados do protocolo para revisão
   */
  formatProtocolReview(state: any): string {
    const service = state.selectedService?.service;
    const formData = state.formData || {};
    const description = state.description;
    const documents = state.uploadedDocuments || [];

    let review = `**📝 Revisão da Solicitação**\n\n`;
    review += `**Serviço:** ${service?.name || 'N/A'}\n\n`;

    if (description) {
      review += `**Descrição:**\n${description}\n\n`;
    }

    if (Object.keys(formData).length > 0) {
      review += `**Dados do Formulário:**\n`;
      for (const [key, value] of Object.entries(formData)) {
        review += `• ${key}: ${value}\n`;
      }
      review += `\n`;
    }

    if (documents.length > 0) {
      review += `**Documentos Anexados:** ${documents.length} arquivo(s)\n`;
      documents.forEach((doc: any, index: number) => {
        review += `  ${index + 1}. ${doc.fileName || 'Documento'}\n`;
      });
    }

    return review;
  }
}

// Singleton
let instance: DigiUrbanIntegration | null = null;

export function getDigiUrbanIntegration(): DigiUrbanIntegration {
  if (!instance) {
    instance = new DigiUrbanIntegration();
  }
  return instance;
}

export default DigiUrbanIntegration;
