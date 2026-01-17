import { prisma } from '../../lib/prisma';
import { ProactiveNotificationData, NotificationType } from './types';

/**
 * ProactiveNotificationService - Notificações proativas e inteligentes
 *
 * Envia notificações automáticas baseadas em eventos:
 * - Protocolos expirando
 * - Protocolos aprovados/rejeitados
 * - Lembretes de consulta
 * - Sugestões personalizadas
 * - Renovações necessárias
 */
export class ProactiveNotificationService {
  private static instance: ProactiveNotificationService;

  private constructor() {}

  public static getInstance(): ProactiveNotificationService {
    if (!ProactiveNotificationService.instance) {
      ProactiveNotificationService.instance = new ProactiveNotificationService();
    }
    return ProactiveNotificationService.instance;
  }

  /**
   * Cria uma notificação proativa
   */
  public async createNotification(data: ProactiveNotificationData): Promise<void> {
    await prisma.proactiveNotification.create({
      data: {
        citizenId: data.citizenId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        scheduledFor: data.scheduledFor,
      },
    });
  }

  /**
   * Processa notificações agendadas (deve ser chamado periodicamente via cron)
   */
  public async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    // Busca notificações pendentes
    const notifications = await prisma.proactiveNotification.findMany({
      where: {
        scheduledFor: { lte: now },
        sentAt: null,
      },
      include: {
        citizen: true,
      },
      take: 100, // Processa em lotes
    });

    for (const notification of notifications) {
      try {
        // Envia notificação (integrar com sistema de mensagens)
        await this.sendNotification(notification);

        // Marca como enviada
        await prisma.proactiveNotification.update({
          where: { id: notification.id },
          data: { sentAt: new Date() },
        });

        console.log(`✅ Notificação enviada: ${notification.title} para ${notification.citizen.name}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação ${notification.id}:`, error);
      }
    }
  }

  /**
   * Envia a notificação para o cidadão
   */
  private async sendNotification(notification: any): Promise<void> {
    // TODO: Integrar com UltraZend Messages ou sistema de notificações push
    // Por enquanto, apenas registra no console
    console.log('📤 Enviando notificação:', {
      citizenId: notification.citizenId,
      title: notification.title,
      message: notification.message,
    });

    // Futuramente:
    // await ultraZendMessages.sendMessage({
    //   userId: notification.citizenId,
    //   userType: 'CITIZEN',
    //   message: notification.message,
    //   metadata: { type: 'proactive_notification', ...notification.customData }
    // });
  }

  /**
   * Cria lembretes para protocolos expirando
   */
  public async createProtocolExpiringReminders(): Promise<void> {
    const daysBeforeExpiry = 7;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

    // Busca protocolos que expiram em 7 dias
    const expiringProtocols = await prisma.protocolSimplified.findMany({
      where: {
        status: 'PENDENCIA',
        createdAt: {
          lte: new Date(Date.now() - (30 - daysBeforeExpiry) * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        service: true,
        citizen: true,
      },
    });

    for (const protocol of expiringProtocols) {
      // Verifica se já existe notificação para este protocolo
      const existing = await prisma.proactiveNotification.findFirst({
        where: {
          citizenId: protocol.citizenId,
          type: 'protocol_expiring',
          metadata: {
            path: ['protocolId'],
            equals: protocol.id,
          },
        },
      });

      if (!existing) {
        await this.createNotification({
          type: 'protocol_expiring',
          citizenId: protocol.citizenId,
          title: '⏰ Protocolo próximo de expirar',
          message: `Seu protocolo #${protocol.number} (${protocol.service.name}) expira em ${daysBeforeExpiry} dias. Você precisa renová-lo?`,
          metadata: {
            protocolId: protocol.id,
            number: protocol.number,
            serviceName: protocol.service.name,
          },
          scheduledFor: new Date(), // Envia imediatamente
        });
      }
    }
  }

  /**
   * Cria lembretes de consultas
   */
  public async createAppointmentReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Busca protocolos de consulta agendados para amanhã
    const appointments = await prisma.protocolSimplified.findMany({
      where: {
        status: 'PROGRESSO',
        service: {
          name: {
            contains: 'consulta',
            mode: 'insensitive',
          },
        },
        // metadata deve conter appointmentDate de amanhã
      },
      include: {
        service: true,
        citizen: true,
      },
    });

    for (const appointment of appointments) {
      const metadata = appointment.customData as any;

      if (metadata?.appointmentDate) {
        const appointmentDate = new Date(metadata.appointmentDate);

        // Verifica se é amanhã
        if (
          appointmentDate >= tomorrow &&
          appointmentDate < dayAfterTomorrow
        ) {
          // Verifica se já existe lembrete
          const existing = await prisma.proactiveNotification.findFirst({
            where: {
              citizenId: appointment.citizenId,
              type: 'appointment_reminder',
              metadata: {
                path: ['protocolId'],
                equals: appointment.id,
              },
            },
          });

          if (!existing) {
            await this.createNotification({
              type: 'appointment_reminder',
              citizenId: appointment.citizenId,
              title: '🏥 Lembrete de Consulta',
              message: `Lembrete: Você tem uma consulta agendada para amanhã às ${metadata.appointmentTime} - ${appointment.service.name}`,
              metadata: {
                protocolId: appointment.id,
                number: appointment.number,
                appointmentDate: metadata.appointmentDate,
                appointmentTime: metadata.appointmentTime,
              },
              scheduledFor: new Date(), // Envia imediatamente
            });
          }
        }
      }
    }
  }

  /**
   * Cria sugestões personalizadas baseadas no perfil do cidadão
   */
  public async createPersonalizedSuggestions(citizenId: string): Promise<void> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      include: {
        protocolsSimplified: {
          include: { service: { include: { department: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!citizen) return;

    // Analisa padrões de uso
    const usedServices = new Set(
      citizen.protocolsSimplified.map((p: any) => p.service.id)
    );
    const usedDepartments = new Set(
      citizen.protocolsSimplified.map((p: any) => p.service.department.id)
    );

    // Busca serviços relacionados que o cidadão nunca usou
    const relatedServices = await prisma.serviceSimplified.findMany({
      where: {
        isActive: true,
        departmentId: { in: Array.from(usedDepartments) },
        id: { notIn: Array.from(usedServices) },
      },
      take: 3,
      orderBy: { priority: 'desc' },
    });

    // Cria sugestões
    for (const service of relatedServices) {
      const existing = await prisma.proactiveNotification.findFirst({
        where: {
          citizenId,
          type: 'suggestion',
          metadata: {
            path: ['serviceId'],
            equals: service.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
          },
        },
      });

      if (!existing) {
        await this.createNotification({
          type: 'suggestion',
          citizenId,
          title: '💡 Você sabia?',
          message: `Você pode solicitar: ${service.name}. Muitos cidadãos que usam os serviços que você já utilizou também acham este útil!`,
          metadata: {
            serviceId: service.id,
            serviceName: service.name,
          },
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Agenda para daqui 1 dia
        });
      }
    }
  }

  /**
   * Notifica mudanças de status de protocolo
   */
  public async notifyProtocolStatusChange(
    protocolId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      include: { service: true },
    });

    if (!protocol) return;

    const statusEmoji: Record<string, string> = {
      PENDENTE: '⏳',
      EM_ANDAMENTO: '🔄',
      APROVADO: '✅',
      CONCLUIDO: '✅',
      REJEITADO: '❌',
      CANCELADO: '🚫',
    };

    const statusMessages: Record<string, string> = {
      PENDENTE: 'está aguardando análise',
      EM_ANDAMENTO: 'está sendo processado',
      APROVADO: 'foi aprovado!',
      CONCLUIDO: 'foi concluído!',
      REJEITADO: 'foi rejeitado',
      CANCELADO: 'foi cancelado',
    };

    const emoji = statusEmoji[newStatus] || '📋';
    const message = statusMessages[newStatus] || 'teve uma atualização';

    const notificationType: NotificationType =
      newStatus === 'APROVADO' || newStatus === 'CONCLUIDO'
        ? 'protocol_approved'
        : newStatus === 'REJEITADO'
        ? 'protocol_rejected'
        : 'protocol_update';

    await this.createNotification({
      type: notificationType,
      citizenId: protocol.citizenId,
      title: `${emoji} Atualização de Protocolo`,
      message: `Seu protocolo #${protocol.number} (${protocol.service.name}) ${message}`,
      metadata: {
        protocolId: protocol.id,
        number: protocol.number,
        serviceName: protocol.service.name,
        oldStatus,
        newStatus,
      },
      scheduledFor: new Date(), // Envia imediatamente
    });
  }

  /**
   * Notifica aprovação/rejeição de documento
   */
  public async notifyDocumentReview(
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<void> {
    const document = await prisma.citizenDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) return;

    const isApproved = status === 'APPROVED';

    await this.createNotification({
      type: isApproved ? 'document_approved' : 'document_rejected',
      citizenId: document.citizenId,
      title: isApproved ? '✅ Documento Aprovado' : '❌ Documento Rejeitado',
      message: isApproved
        ? `Seu documento (${document.documentType}) foi aprovado e está disponível.`
        : `Seu documento (${document.documentType}) foi rejeitado. ${notes || 'Entre em contato para mais informações.'}`,
      metadata: {
        documentId: document.id,
        documentType: document.documentType,
        status,
        notes,
      },
      scheduledFor: new Date(),
    });
  }

  /**
   * Busca notificações não lidas de um cidadão
   */
  public async getUnreadNotifications(citizenId: string): Promise<any[]> {
    return prisma.proactiveNotification.findMany({
      where: {
        citizenId,
        isRead: false,
        sentAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marca notificação como lida
   */
  public async markAsRead(notificationId: string): Promise<void> {
    await prisma.proactiveNotification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marca todas as notificações como lidas
   */
  public async markAllAsRead(citizenId: string): Promise<void> {
    await prisma.proactiveNotification.updateMany({
      where: {
        citizenId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

export default ProactiveNotificationService;
