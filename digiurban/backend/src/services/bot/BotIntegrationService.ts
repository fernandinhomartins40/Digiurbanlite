/**
 * BotIntegrationService
 *
 * Serviço de integração do DigiBot com os serviços reais do portal.
 * Conecta o bot com ProtocolService, ServiceService, CitizenService, etc.
 */

import { PrismaClient, Protocol, Service, Citizen, ProtocolDocument } from '@prisma/client';
import { BotResponse, FlowType } from './types';

interface CreateProtocolData {
  serviceId: string;
  formData: any;
  files?: Array<{
    filename: string;
    url: string;
    size: number;
    mimetype: string;
  }>;
}

interface ProactiveNotification {
  type: 'protocol_approved' | 'protocol_rejected' | 'protocol_document_requested' | 'service_completed';
  title: string;
  message: string;
  metadata?: any;
}

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
   * Cria um protocolo real através do bot
   */
  async createProtocol(
    citizenId: string,
    data: CreateProtocolData
  ): Promise<Protocol> {
    try {
      // Buscar o serviço
      const service = await this.prisma.service.findUnique({
        where: { id: data.serviceId },
        include: { department: true }
      });

      if (!service) {
        throw new Error('Serviço não encontrado');
      }

      // Gerar número do protocolo
      const currentYear = new Date().getFullYear();
      const count = await this.prisma.protocol.count({
        where: {
          protocolNumber: {
            startsWith: currentYear.toString()
          }
        }
      });
      const protocolNumber = `${currentYear}${String(count + 1).padStart(6, '0')}`;

      // Criar o protocolo
      const protocol = await this.prisma.protocol.create({
        data: {
          protocolNumber,
          citizenId,
          serviceId: data.serviceId,
          departmentId: service.departmentId,
          status: 'PENDING_REVIEW',
          priority: 'MEDIUM',
          formData: data.formData,
          metadata: {
            source: 'DIGIBOT',
            createdViaBot: true,
            botFlowCompleted: true
          }
        },
        include: {
          service: true,
          citizen: true,
          department: true
        }
      });

      // Criar documentos anexados (se houver)
      if (data.files && data.files.length > 0) {
        await Promise.all(
          data.files.map(file =>
            this.prisma.protocolDocument.create({
              data: {
                protocolId: protocol.id,
                filename: file.filename,
                url: file.url,
                size: file.size,
                mimetype: file.mimetype,
                uploadedBy: citizenId,
                status: 'PENDING_REVIEW'
              }
            })
          )
        );
      }

      // Criar linha do tempo
      await this.prisma.protocolTimeline.create({
        data: {
          protocolId: protocol.id,
          action: 'CREATED',
          performedBy: citizenId,
          performedByType: 'CITIZEN',
          description: 'Protocolo criado via DigiBot',
          metadata: { source: 'DIGIBOT' }
        }
      });

      return protocol;
    } catch (error) {
      console.error('[BotIntegrationService] Erro ao criar protocolo:', error);
      throw error;
    }
  }

  /**
   * Busca protocolos do cidadão
   */
  async getProtocolsByNumber(
    citizenId: string,
    protocolNumber: string
  ): Promise<Protocol[]> {
    return this.prisma.protocol.findMany({
      where: {
        citizenId,
        protocolNumber: {
          contains: protocolNumber,
          mode: 'insensitive'
        }
      },
      include: {
        service: true,
        department: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
  }

  /**
   * Busca protocolos recentes do cidadão
   */
  async getRecentProtocols(citizenId: string, limit: number = 5): Promise<Protocol[]> {
    return this.prisma.protocol.findMany({
      where: { citizenId },
      include: {
        service: true,
        department: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  /**
   * Busca um protocolo específico
   */
  async getProtocol(protocolId: string, citizenId: string): Promise<Protocol | null> {
    return this.prisma.protocol.findFirst({
      where: {
        id: protocolId,
        citizenId
      },
      include: {
        service: true,
        department: true,
        documents: true,
        timeline: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Lista serviços disponíveis (com filtros opcionais)
   */
  async getAvailableServices(
    departmentId?: string,
    category?: string,
    searchTerm?: string
  ): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(departmentId && { departmentId }),
        ...(category && { category }),
        ...(searchTerm && {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        department: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Busca um serviço específico
   */
  async getService(serviceId: string): Promise<Service | null> {
    return this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        department: true
      }
    });
  }

  /**
   * Busca departamentos disponíveis
   */
  async getDepartments() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Atualiza dados do cidadão
   */
  async updateCitizenProfile(
    citizenId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      address: any;
    }>
  ): Promise<Citizen> {
    return this.prisma.citizen.update({
      where: { id: citizenId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.address && { address: data.address })
      }
    });
  }

  /**
   * Busca dados do cidadão
   */
  async getCitizen(citizenId: string): Promise<Citizen | null> {
    return this.prisma.citizen.findUnique({
      where: { id: citizenId }
    });
  }

  /**
   * Adiciona documento a um protocolo existente
   */
  async addProtocolDocument(
    protocolId: string,
    citizenId: string,
    file: {
      filename: string;
      url: string;
      size: number;
      mimetype: string;
    }
  ): Promise<ProtocolDocument> {
    // Verificar se o protocolo pertence ao cidadão
    const protocol = await this.prisma.protocol.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      throw new Error('Protocolo não encontrado ou não pertence ao cidadão');
    }

    // Criar o documento
    const document = await this.prisma.protocolDocument.create({
      data: {
        protocolId,
        filename: file.filename,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: citizenId,
        status: 'PENDING_REVIEW'
      }
    });

    // Adicionar à timeline
    await this.prisma.protocolTimeline.create({
      data: {
        protocolId,
        action: 'DOCUMENT_UPLOADED',
        performedBy: citizenId,
        performedByType: 'CITIZEN',
        description: `Documento "${file.filename}" enviado via DigiBot`,
        metadata: { documentId: document.id, source: 'DIGIBOT' }
      }
    });

    return document;
  }

  /**
   * Envia uma mensagem do bot para o cidadão via UltraZend
   * (Este método será chamado internamente pelos fluxos)
   */
  async sendBotMessage(
    citizenId: string,
    botResponse: BotResponse,
    conversationId?: string
  ): Promise<void> {
    try {
      // Importa dinamicamente para evitar circular dependency
      const { UltraZendMessagesAdapter } = await import('./UltraZendMessagesAdapter');
      const adapter = UltraZendMessagesAdapter.getInstance();

      // Se não tem conversationId, busca/cria uma
      let convId = conversationId;
      if (!convId) {
        const conversation = await adapter.findOrCreateBotConversation(citizenId);
        convId = conversation.id;
      }

      // Envia a mensagem
      await adapter.sendBotMessage(convId, botResponse);
    } catch (error) {
      console.error('[BotIntegrationService] Erro ao enviar mensagem do bot:', error);
      throw error;
    }
  }

  /**
   * Envia uma notificação proativa para o cidadão
   * Usado quando eventos externos precisam notificar o bot
   */
  async sendProactiveNotification(
    citizenId: string,
    notification: ProactiveNotification
  ): Promise<void> {
    try {
      const { UltraZendMessagesAdapter } = await import('./UltraZendMessagesAdapter');
      const adapter = UltraZendMessagesAdapter.getInstance();

      // Busca/cria conversa do bot
      const conversation = await adapter.findOrCreateBotConversation(citizenId);

      // Monta a resposta do bot baseada no tipo de notificação
      let botResponse: BotResponse;

      switch (notification.type) {
        case 'protocol_approved':
          botResponse = {
            response: `🎉 ${notification.title}\n\n${notification.message}`,
            messageType: 'card',
            metadata: {
              cards: [{
                id: notification.metadata?.protocolId,
                title: notification.title,
                description: notification.message,
                status: 'APPROVED',
                action: {
                  type: 'open_protocol',
                  label: 'Ver Protocolo',
                  protocolId: notification.metadata?.protocolId
                }
              }],
              quickReplies: ['📋 Meus Protocolos', '🏠 Menu Principal']
            }
          };
          break;

        case 'protocol_rejected':
          botResponse = {
            response: `❌ ${notification.title}\n\n${notification.message}`,
            messageType: 'card',
            metadata: {
              cards: [{
                id: notification.metadata?.protocolId,
                title: notification.title,
                description: notification.message,
                status: 'REJECTED',
                action: {
                  type: 'open_protocol',
                  label: 'Ver Detalhes',
                  protocolId: notification.metadata?.protocolId
                }
              }],
              quickReplies: ['📄 Novo Protocolo', '🏠 Menu Principal']
            }
          };
          break;

        case 'protocol_document_requested':
          botResponse = {
            response: `📄 ${notification.title}\n\n${notification.message}`,
            messageType: 'interactive',
            metadata: {
              stepType: 'upload',
              protocolId: notification.metadata?.protocolId,
              quickReplies: ['📎 Enviar Documentos', '🏠 Menu Principal']
            }
          };
          break;

        case 'service_completed':
          botResponse = {
            response: `✅ ${notification.title}\n\n${notification.message}`,
            messageType: 'card',
            metadata: {
              cards: [{
                id: notification.metadata?.protocolId,
                title: notification.title,
                description: notification.message,
                status: 'COMPLETED',
                action: {
                  type: 'rate_service',
                  label: 'Avaliar Atendimento',
                  protocolId: notification.metadata?.protocolId
                }
              }],
              quickReplies: ['⭐ Avaliar', '🏠 Menu Principal']
            }
          };
          break;

        default:
          botResponse = {
            response: `${notification.title}\n\n${notification.message}`,
            messageType: 'text',
            metadata: {
              quickReplies: ['🏠 Menu Principal']
            }
          };
      }

      // Envia a notificação
      await adapter.sendBotMessage(conversation.id, botResponse);

      // Log da notificação
      console.log(
        `[BotIntegrationService] Notificação proativa enviada: ${notification.type} -> Cidadão ${citizenId}`
      );
    } catch (error) {
      console.error('[BotIntegrationService] Erro ao enviar notificação proativa:', error);
      throw error;
    }
  }

  /**
   * Estatísticas do bot para analytics
   */
  async getBotStats(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
    }

    const [
      totalBotConversations,
      activeConversations,
      protocolsCreatedViaBot,
      documentsUploadedViaBot
    ] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          isBotConversation: true,
          createdAt: { gte: periodStart }
        }
      }),
      this.prisma.conversation.count({
        where: {
          isBotConversation: true,
          status: 'ACTIVE',
          botLastInteractionAt: { gte: periodStart }
        }
      }),
      this.prisma.protocol.count({
        where: {
          createdAt: { gte: periodStart },
          metadata: {
            path: ['source'],
            equals: 'DIGIBOT'
          }
        }
      }),
      this.prisma.protocolDocument.count({
        where: {
          createdAt: { gte: periodStart },
          protocol: {
            metadata: {
              path: ['source'],
              equals: 'DIGIBOT'
            }
          }
        }
      })
    ]);

    return {
      period,
      totalBotConversations,
      activeConversations,
      protocolsCreatedViaBot,
      documentsUploadedViaBot,
      periodStart,
      periodEnd: now
    };
  }
}

export default BotIntegrationService;
