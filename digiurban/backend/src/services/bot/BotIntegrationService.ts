/**
 * BotIntegrationService - VERSÃO SIMPLIFICADA PARA BUILD
 *
 * NOTA IMPORTANTE:
 * Este arquivo foi simplificado temporariamente para permitir o build.
 * Os métodos retornam mocks e precisam ser implementados com os modelos
 * corretos do schema do backend (ProtocolSimplified, ServiceSimplified, etc.)
 *
 * TODO:
 * - Ajustar tipos para usar modelos do schema do backend
 * - Implementar métodos reais com Prisma Client
 * - Testar integração completa
 */

import { PrismaClient, Citizen } from '@prisma/client';
import { BotResponse } from './types';

export class BotIntegrationService {
  private static instance: BotIntegrationService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): BotIntegrationService {
    if (!BotIntegrationService.instance) {
      BotIntegrationService.instance = new BotIntegrationService();
    }
    return BotIntegrationService.instance;
  }

  /**
   * MOCK: Cria protocolo (implementar com ProtocolSimplified)
   */
  async createProtocol(citizenId: string, data: any): Promise<any> {
    console.warn('[BotIntegrationService] createProtocol() é um MOCK - implementar com ProtocolSimplified');
    return {
      id: 'mock-id',
      protocolNumber: `2026${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      citizenId,
      status: 'PENDING_REVIEW',
      service: { name: 'Serviço Mock', estimatedDays: 5 },
      department: { name: 'Departamento Mock' },
      createdAt: new Date()
    };
  }

  /**
   * MOCK: Busca protocolos por número
   */
  async getProtocolsByNumber(citizenId: string, protocolNumber: string): Promise<any[]> {
    console.warn('[BotIntegrationService] getProtocolsByNumber() é um MOCK');
    return [];
  }

  /**
   * MOCK: Busca protocolos recentes
   */
  async getRecentProtocols(citizenId: string, limit: number = 5): Promise<any[]> {
    console.warn('[BotIntegrationService] getRecentProtocols() é um MOCK');
    return [];
  }

  /**
   * MOCK: Busca protocolo específico
   */
  async getProtocol(protocolId: string, citizenId: string): Promise<any | null> {
    console.warn('[BotIntegrationService] getProtocol() é um MOCK');
    return null;
  }

  /**
   * MOCK: Lista serviços disponíveis
   */
  async getAvailableServices(
    departmentId?: string,
    category?: string,
    searchTerm?: string
  ): Promise<any[]> {
    console.warn('[BotIntegrationService] getAvailableServices() é um MOCK');
    return [];
  }

  /**
   * MOCK: Busca serviço específico
   */
  async getService(serviceId: string): Promise<any | null> {
    console.warn('[BotIntegrationService] getService() é um MOCK');
    return null;
  }

  /**
   * Busca departamentos (FUNCIONAL)
   */
  async getDepartments() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Atualiza perfil do cidadão (FUNCIONAL)
   */
  async updateCitizenProfile(
    citizenId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
    }>
  ): Promise<Citizen> {
    return this.prisma.citizen.update({
      where: { id: citizenId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone })
      }
    });
  }

  /**
   * Busca cidadão (FUNCIONAL)
   */
  async getCitizen(citizenId: string): Promise<Citizen | null> {
    return this.prisma.citizen.findUnique({
      where: { id: citizenId }
    });
  }

  /**
   * MOCK: Adiciona documento a protocolo
   */
  async addProtocolDocument(protocolId: string, citizenId: string, file: any): Promise<any> {
    console.warn('[BotIntegrationService] addProtocolDocument() é um MOCK');
    return { id: 'mock-doc-id', ...file };
  }

  /**
   * MOCK: Envia mensagem do bot
   */
  async sendBotMessage(citizenId: string, botResponse: BotResponse, conversationId?: string): Promise<void> {
    console.warn('[BotIntegrationService] sendBotMessage() é um MOCK');
    // Implementação real virá com UltraZendMessagesAdapter
  }

  /**
   * MOCK: Envia notificação proativa
   */
  async sendProactiveNotification(citizenId: string, notification: any): Promise<void> {
    console.warn('[BotIntegrationService] sendProactiveNotification() é um MOCK');
    // Implementação real virá com UltraZendMessagesAdapter
  }

  /**
   * MOCK: Estatísticas do bot
   */
  async getBotStats(period: 'day' | 'week' | 'month' = 'day') {
    console.warn('[BotIntegrationService] getBotStats() é um MOCK');
    return {
      period,
      totalBotConversations: 0,
      activeConversations: 0,
      protocolsCreatedViaBot: 0,
      documentsUploadedViaBot: 0,
      periodStart: new Date(),
      periodEnd: new Date()
    };
  }
}

export default BotIntegrationService;
