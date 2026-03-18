/**
 * DigiUrbanIntegration
 * Service para chamar APIs do DigiUrban Backend
 * Substitui as chamadas diretas ao Prisma no ActionHandlers
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import path from 'path';

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
      timeout: 15000,
    });

    // Interceptor de retry para falhas de conexão
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (
          !config._retryCount &&
          (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND')
        ) {
          config._retryCount = 1;
          console.warn(`[DigiUrbanIntegration] Retry automático para ${config.url} (${error.code})`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return this.api(config);
        }
        throw error;
      }
    );
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
    const docs = Array.isArray(data.documents) ? data.documents : [];

    // Se houver documentos com filePath local, enviar como multipart para o backend
    const hasLocalFiles = docs.some((doc) => typeof doc?.filePath === 'string' && doc.filePath.trim().length > 0);

    if (!hasLocalFiles) {
      const response = await this.api.post('/internal/protocols', data);
      return response.data;
    }

    const formData = new FormData();
    formData.append('citizenId', data.citizenId);
    formData.append('serviceId', data.serviceId);
    formData.append('description', data.description || '');
    formData.append('customData', JSON.stringify(data.customData || {}));

    const documentTypes: string[] = [];
    const uploadedFilePaths: string[] = [];

    for (const doc of docs) {
      const rawPath = typeof doc?.filePath === 'string' ? doc.filePath.trim() : '';
      if (!rawPath) continue;

      const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
      const buffer = await fs.readFile(resolvedPath);

      const fileName = String(doc?.fileName || doc?.originalName || path.basename(resolvedPath) || 'documento');
      const mimeType = String(doc?.mimeType || doc?.mimetype || 'application/octet-stream');

      documentTypes.push(String(doc?.documentType || doc?.documentId || fileName));
      uploadedFilePaths.push(resolvedPath);

      const blob = new Blob([buffer], { type: mimeType });
      formData.append('documents', blob, fileName);
    }

    formData.append('documentTypes', JSON.stringify(documentTypes));

    const url = `${this.apiUrl}/internal/protocols`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceToken}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    let payload: any;
    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch {
      payload = { raw: responseText };
    }

    if (!response.ok) {
      const errorMessage = payload?.error || `HTTP ${response.status} ao criar protocolo`;
      const err = new Error(errorMessage) as any;
      err.response = { status: response.status, data: payload };
      throw err;
    }

    // Limpeza: remover arquivos locais apÃ³s encaminhar ao backend (evita bloat no servidor de mensagens)
    await Promise.all(
      uploadedFilePaths.map(async (filePath) => {
        try {
          // Apenas arquivos do bot (uploads/bot/*) devem ser removidos automaticamente
          const normalized = filePath.replace(/\\/g, '/');
          if (normalized.includes('/uploads/bot/')) {
            await fs.unlink(filePath);
          }
        } catch {
          // Ignorar falhas de limpeza
        }
      })
    );

    return payload;
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
   * Buscar pendências acionáveis de um protocolo
   */
  async getProtocolPendings(protocolId: string, citizenId: string) {
    const response = await this.api.get(`/internal/protocols/${protocolId}/pendings`, {
      params: { citizenId },
    });
    return response.data;
  }

  /**
   * Resolver pendência textual
   */
  async resolveProtocolPending(protocolId: string, pendingId: string, citizenId: string, resolution: string) {
    const response = await this.api.post(`/internal/protocols/${protocolId}/pendings/${pendingId}/resolve`, {
      citizenId,
      resolution,
    });
    return response.data;
  }

  /**
   * Resolver pendência com documento
   */
  async resolveProtocolPendingWithDocument(data: {
    protocolId: string;
    pendingId: string;
    citizenId: string;
    filePath: string;
    fileName?: string;
    mimeType?: string;
  }) {
    const resolvedPath = path.isAbsolute(data.filePath)
      ? data.filePath
      : path.resolve(process.cwd(), data.filePath);
    const buffer = await fs.readFile(resolvedPath);

    const formData = new FormData();
    formData.append('citizenId', data.citizenId);

    const blob = new Blob([buffer], { type: data.mimeType || 'application/octet-stream' });
    formData.append('documents', blob, data.fileName || path.basename(resolvedPath));

    const response = await fetch(
      `${this.apiUrl}/internal/protocols/${data.protocolId}/pendings/${data.pendingId}/resolve-document`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceToken}`,
        },
        body: formData,
      }
    );

    const responseText = await response.text();
    let payload: any;
    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch {
      payload = { raw: responseText };
    }

    if (!response.ok) {
      const errorMessage = payload?.error || `HTTP ${response.status} ao resolver pendência`;
      const err = new Error(errorMessage) as any;
      err.response = { status: response.status, data: payload };
      throw err;
    }

    try {
      const normalized = resolvedPath.replace(/\\/g, '/');
      if (normalized.includes('/uploads/bot/')) {
        await fs.unlink(resolvedPath);
      }
    } catch {
      // Ignorar falha de limpeza local
    }

    return payload;
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
   * Listar departamentos (apenas os que têm serviços ativos)
   */
  async getDepartments() {
    const response = await this.api.get('/internal/departments');
    return response.data;
  }

  /**
   * Listar serviços de um departamento agrupados por categoria
   */
  async getServicesByDepartment(departmentId: string) {
    const response = await this.api.get(`/internal/departments/${departmentId}/services`);
    return response.data;
  }

  /**
   * Buscar interações/histórico de um protocolo
   */
  async getProtocolInteractions(protocolId: string, citizenId: string) {
    const response = await this.api.get(`/internal/protocols/${protocolId}/interactions`, {
      params: { citizenId },
    });
    return response.data;
  }

  /**
   * Buscar documentos do cidadão
   */
  async getDocuments(citizenId: string, limit: number = 20) {
    const response = await this.api.get(`/internal/citizens/${citizenId}/documents`, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Buscar documentos de um protocolo específico
   */
  async getProtocolDocuments(protocolId: string, citizenId: string) {
    const response = await this.api.get(`/internal/protocols/${protocolId}/documents`, {
      params: { citizenId },
    });
    return response.data;
  }

  /**
   * Buscar protocolos concluídos sem avaliação
   */
  async getPendingEvaluations(citizenId: string) {
    const response = await this.api.get('/internal/evaluations/pending', {
      params: { citizenId },
    });
    return response.data;
  }

  /**
   * Submeter avaliação de protocolo
   */
  async submitEvaluation(protocolId: string, citizenId: string, rating: number, comment?: string) {
    const response = await this.api.post('/internal/evaluations', {
      protocolId,
      citizenId,
      rating,
      comment,
    });
    return response.data;
  }

  /**
   * Formatar dados do protocolo para revisão
   */
  formatProtocolReview(state: any): string {
    const service =
      state.selectedService?.service ||
      state.selectedServiceId_data?.metadata?.service ||
      state.selectedServiceId_data?.service ||
      state.selectedServiceData ||
      state.serviceDetails;
    const formData = state.formData || state.collectedFormData || {};
    const description = state.description || formData.description;
    const documents = state.uploadedDocuments || [];
    const department = state.selectedDept_data || service?.department;

    let review = `**📝 Revisão da Solicitação**\n\n`;
    review += `**Serviço:** ${service?.name || 'N/A'}\n`;
    if (department?.label || department?.name) {
      review += `**Secretaria:** ${department.label || department.name}\n`;
    }
    if (service?.estimatedDays) {
      review += `**Prazo estimado:** ${service.estimatedDays} dias úteis\n`;
    }
    review += `\n`;

    if (description) {
      review += `**Descrição:**\n${description}\n\n`;
    }

    if (Object.keys(formData).length > 0) {
      review += `**Dados do Formulário:**\n`;
      for (const [key, value] of Object.entries(formData)) {
        if (key === 'description' || key === 'descricao') continue;
        // Formatar label mais legível
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        review += `• ${label}: ${value}\n`;
      }
      review += `\n`;
    }

    if (documents.length > 0) {
      review += `**Documentos Anexados:** ${documents.length} arquivo(s)\n`;
      documents.forEach((doc: any, index: number) => {
        review += `  ${index + 1}. ${doc.fileName || doc.originalName || 'Documento'}\n`;
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
