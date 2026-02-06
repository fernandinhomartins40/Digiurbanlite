/**
 * ============================================================================
 * NOTIFICATION TRIGGERS - Gatilhos para notificações
 * ============================================================================
 * Funções que disparam notificações em eventos do sistema
 */

import { prisma } from '../lib/prisma';
import notificationService from './notification.service';
import { NotificationType } from '../types/notification.types';

export class NotificationTriggers {
  /**
   * 📨 PROTOCOLO: Criado
   */
  static async onProtocolCreated(protocolId: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: { service: true, citizen: true },
      });

      if (!protocol) return;

      // Notificar cidadão
      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: protocol.citizenId,
        type: NotificationType.PROTOCOL_CREATED,
        title: 'Solicitação recebida!',
        message: `Protocolo ${protocol.number} criado com sucesso.`,
        data: {
          protocolId: protocol.id,
          protocolNumber: protocol.number,
          serviceName: protocol.service.name,
          url: `/cidadao/protocolos/${protocol.id}`,
        },
        priority: 'normal',
      });

      console.log(`✅ [Trigger] Protocol created notification sent for ${protocol.number}`);
    } catch (error) {
      console.error('[Trigger] Error in onProtocolCreated:', error);
    }
  }

  /**
   * 📨 PROTOCOLO: Status alterado
   */
  static async onProtocolStatusChanged(
    protocolId: string,
    oldStatus: string,
    newStatus: string
  ) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: { service: true },
      });

      if (!protocol) return;

      const statusLabels: Record<string, string> = {
        VINCULADO: 'Vinculado',
        PROGRESSO: 'Em Progresso',
        PENDENCIA: 'Pendente',
        ATUALIZACAO: 'Aguardando Atualização',
        CONCLUIDO: 'Concluído',
        CANCELADO: 'Cancelado',
      };

      // Notificar cidadão
      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: protocol.citizenId,
        type: NotificationType.PROTOCOL_STATUS,
        title: `Protocolo ${protocol.number} atualizado`,
        message: `Status: ${statusLabels[newStatus] || newStatus}`,
        data: {
          protocolId: protocol.id,
          protocolNumber: protocol.number,
          oldStatus,
          newStatus,
          url: `/cidadao/protocolos/${protocol.id}`,
        },
        priority: newStatus === 'CONCLUIDO' ? 'high' : 'normal',
      });

      // Se foi concluído, notificação especial
      if (newStatus === 'CONCLUIDO') {
        await notificationService.notify({
          recipientType: 'citizen',
          recipientId: protocol.citizenId,
          type: NotificationType.PROTOCOL_COMPLETED,
          title: 'Solicitação concluída! 🎉',
          message: `Seu protocolo ${protocol.number} foi concluído.`,
          data: {
            protocolId: protocol.id,
            protocolNumber: protocol.number,
            url: `/cidadao/protocolos/${protocol.id}`,
          },
          channels: ['web', 'push', 'email'],
          priority: 'high',
        });
      }

      // Notificar servidor atribuído
      if (protocol.currentAssignedUserId) {
        await notificationService.notify({
          recipientType: 'user',
          recipientId: protocol.currentAssignedUserId,
          type: NotificationType.PROTOCOL_STATUS,
          title: `Protocolo ${protocol.number} atualizado`,
          message: `Status: ${statusLabels[newStatus] || newStatus}`,
          data: {
            protocolId: protocol.id,
            protocolNumber: protocol.number,
            url: `/admin/protocolos/${protocol.id}`,
          },
          priority: 'normal',
        });
      }

      console.log(`✅ [Trigger] Protocol status notification sent for ${protocol.number}`);
    } catch (error) {
      console.error('[Trigger] Error in onProtocolStatusChanged:', error);
    }
  }

  /**
   * 📨 PROTOCOLO: Atribuído
   */
  static async onProtocolAssigned(protocolId: string, userId: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: { service: true },
      });

      if (!protocol) return;

      await notificationService.notify({
        recipientType: 'user',
        recipientId: userId,
        type: NotificationType.PROTOCOL_ASSIGNED,
        title: 'Novo protocolo atribuído',
        message: `Protocolo ${protocol.number} foi atribuído a você.`,
        data: {
          protocolId: protocol.id,
          protocolNumber: protocol.number,
          serviceName: protocol.service.name,
          url: `/admin/protocolos/${protocol.id}`,
        },
        priority: 'high',
      });

      console.log(`✅ [Trigger] Protocol assigned notification sent for ${protocol.number}`);
    } catch (error) {
      console.error('[Trigger] Error in onProtocolAssigned:', error);
    }
  }

  /**
   * 📨 DOCUMENTO: Aprovado
   */
  static async onDocumentApproved(documentId: string) {
    try {
      const document = await prisma.citizenDocument.findUnique({
        where: { id: documentId },
        include: { citizen: true },
      });

      if (!document) return;

      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: document.citizenId,
        type: NotificationType.DOCUMENT_APPROVED,
        title: 'Documento aprovado! ✅',
        message: `Seu documento "${document.documentType}" foi aprovado.`,
        data: {
          documentId: document.id,
          documentName: document.documentType,
          url: '/cidadao/documentos',
        },
        channels: ['web', 'push'],
        priority: 'normal',
      });

      console.log(`✅ [Trigger] Document approved notification sent for ${document.documentType}`);
    } catch (error) {
      console.error('[Trigger] Error in onDocumentApproved:', error);
    }
  }

  /**
   * 📨 DOCUMENTO: Rejeitado
   */
  static async onDocumentRejected(documentId: string, reason?: string) {
    try {
      const document = await prisma.citizenDocument.findUnique({
        where: { id: documentId },
        include: { citizen: true },
      });

      if (!document) return;

      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: document.citizenId,
        type: NotificationType.DOCUMENT_REJECTED,
        title: 'Documento rejeitado',
        message: reason || `Seu documento "${document.documentType}" foi rejeitado. Por favor, envie novamente.`,
        data: {
          documentId: document.id,
          documentName: document.documentType,
          reason,
          url: '/cidadao/documentos',
        },
        channels: ['web', 'push', 'email'],
        priority: 'high',
      });

      console.log(`✅ [Trigger] Document rejected notification sent for ${document.documentType}`);
    } catch (error) {
      console.error('[Trigger] Error in onDocumentRejected:', error);
    }
  }

  /**
   * 📨 AGENDAMENTO: Criado
   */
  static async onAppointmentCreated(appointmentId: string, citizenId: string) {
    try {
      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: citizenId,
        type: NotificationType.APPOINTMENT_CREATED,
        title: 'Agendamento criado',
        message: 'Seu agendamento foi confirmado com sucesso.',
        data: {
          appointmentId,
          url: '/cidadao',
        },
        priority: 'normal',
      });

      console.log(`✅ [Trigger] Appointment created notification sent`);
    } catch (error) {
      console.error('[Trigger] Error in onAppointmentCreated:', error);
    }
  }

  /**
   * 📨 CONVITE FAMILIAR: Enviado
   */
  static async onFamilyInviteSent(inviteId: string) {
    try {
      const invite = await prisma.familyInvite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) return;

      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: invite.headId,
        type: NotificationType.FAMILY_INVITE,
        title: 'Convite familiar enviado',
        message: `Convite enviado para ${invite.email}`,
        data: {
          inviteId: invite.id,
          email: invite.email,
          url: '/cidadao/familia',
        },
        priority: 'normal',
      });

      console.log(`✅ [Trigger] Family invite notification sent`);
    } catch (error) {
      console.error('[Trigger] Error in onFamilyInviteSent:', error);
    }
  }

  /**
   * 📨 CONVITE FAMILIAR: Aceito
   */
  static async onFamilyInviteAccepted(inviteId: string) {
    try {
      const invite = await prisma.familyInvite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) return;

      await notificationService.notify({
        recipientType: 'citizen',
        recipientId: invite.headId,
        type: NotificationType.FAMILY_ACCEPTED,
        title: 'Convite aceito! 🎉',
        message: `${invite.name} aceitou seu convite familiar.`,
        data: {
          inviteId: invite.id,
          memberName: invite.name,
          url: '/cidadao/familia',
        },
        channels: ['web', 'push'],
        priority: 'normal',
      });

      console.log(`✅ [Trigger] Family invite accepted notification sent`);
    } catch (error) {
      console.error('[Trigger] Error in onFamilyInviteAccepted:', error);
    }
  }

  /**
   * 📨 NOVO CIDADÃO: Registro pendente (Admin)
   */
  static async onNewCitizenRegistration(citizenId: string) {
    try {
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
      });

      if (!citizen) return;

      // Buscar admins para notificar
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true,
        },
      });

      for (const admin of admins) {
        await notificationService.notify({
          recipientType: 'user',
          recipientId: admin.id,
          type: NotificationType.NEW_CITIZEN_REGISTRATION,
          title: 'Novo cadastro de cidadão',
          message: `${citizen.name} se cadastrou e aguarda verificação.`,
          data: {
            citizenId: citizen.id,
            citizenName: citizen.name,
            url: `/admin/cidadaos/${citizen.id}`,
          },
          priority: 'normal',
        });
      }

      console.log(`✅ [Trigger] New citizen registration notifications sent`);
    } catch (error) {
      console.error('[Trigger] Error in onNewCitizenRegistration:', error);
    }
  }

  /**
   * 🔔 SLA: Expirando em breve (executado por cron)
   */
  static async checkSLAExpiring() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiringProtocols = await prisma.protocolSimplified.findMany({
        where: {
          status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA'] },
          sla: {
            expectedEndDate: {
              gte: today,
              lte: tomorrow,
            },
            isOverdue: false,
          },
        },
        include: { citizen: true, sla: true, service: true },
      });

      for (const protocol of expiringProtocols) {
        // Notificar cidadão
        await notificationService.notify({
          recipientType: 'citizen',
          recipientId: protocol.citizenId,
          type: NotificationType.PROTOCOL_SLA_EXPIRING,
          title: 'Protocolo próximo do prazo',
          message: `Protocolo ${protocol.number} vence em breve.`,
          data: {
            protocolId: protocol.id,
            protocolNumber: protocol.number,
            expectedEndDate: protocol.sla?.expectedEndDate,
            url: `/cidadao/protocolos/${protocol.id}`,
          },
          channels: ['web', 'push', 'email'],
          priority: 'high',
        });

        // Notificar servidor atribuído
        if (protocol.currentAssignedUserId) {
          await notificationService.notify({
            recipientType: 'user',
            recipientId: protocol.currentAssignedUserId,
            type: NotificationType.PROTOCOL_SLA_EXPIRING,
            title: 'Protocolo próximo do prazo ⚠️',
            message: `Protocolo ${protocol.number} vence em breve!`,
            data: {
              protocolId: protocol.id,
              protocolNumber: protocol.number,
              expectedEndDate: protocol.sla?.expectedEndDate,
              url: `/admin/protocolos/${protocol.id}`,
            },
            channels: ['web', 'push'],
            priority: 'high',
          });
        }
      }

      console.log(`✅ [Cron] Checked SLA expiring: ${expiringProtocols.length} protocols`);
    } catch (error) {
      console.error('[Cron] Error in checkSLAExpiring:', error);
    }
  }

  /**
   * 🔔 SLA: Protocolos vencidos (executado por cron)
   */
  static async checkOverdueProtocols() {
    try {
      const now = new Date();

      const overdueProtocols = await prisma.protocolSimplified.findMany({
        where: {
          status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA'] },
          sla: {
            isOverdue: true,
          },
        },
        include: { citizen: true, sla: true },
      });

      for (const protocol of overdueProtocols) {
        // Notificar cidadão
        await notificationService.notify({
          recipientType: 'citizen',
          recipientId: protocol.citizenId,
          type: NotificationType.PROTOCOL_OVERDUE,
          title: 'Protocolo vencido',
          message: `Protocolo ${protocol.number} está vencido há ${protocol.sla?.daysOverdue} dia(s).`,
          data: {
            protocolId: protocol.id,
            protocolNumber: protocol.number,
            daysOverdue: protocol.sla?.daysOverdue,
            url: `/cidadao/protocolos/${protocol.id}`,
          },
          channels: ['web', 'push', 'email'],
          priority: 'high',
        });

        // Notificar gestor/coordenador do departamento
        if (protocol.departmentId) {
          const managers = await prisma.user.findMany({
            where: {
              departmentId: protocol.departmentId,
              role: { in: ['MANAGER', 'COORDINATOR'] },
              isActive: true,
            },
          });

          for (const manager of managers) {
            await notificationService.notify({
              recipientType: 'user',
              recipientId: manager.id,
              type: NotificationType.PROTOCOL_OVERDUE,
              title: 'Protocolo vencido! 🚨',
              message: `Protocolo ${protocol.number} vencido há ${protocol.sla?.daysOverdue} dia(s)!`,
              data: {
                protocolId: protocol.id,
                protocolNumber: protocol.number,
                daysOverdue: protocol.sla?.daysOverdue,
                url: `/admin/protocolos/${protocol.id}`,
              },
              channels: ['web', 'push', 'email'],
              priority: 'high',
            });
          }
        }
      }

      console.log(`✅ [Cron] Checked overdue protocols: ${overdueProtocols.length} protocols`);
    } catch (error) {
      console.error('[Cron] Error in checkOverdueProtocols:', error);
    }
  }
}

export default NotificationTriggers;
