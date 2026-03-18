import ultraZendMessages from './UltraZendMessagesAdapter';
import { prisma } from '../prisma';
import { generateToken } from '../../utils/jwt';
import axios from 'axios';

// Logger simples para notification service
const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data || ''),
};

/**
 * Serviço para enviar notificações via UltraZend Messages
 * Integrado com o sistema de protocolos do DigiUrban
 */
export class MessageNotificationService {
  /**
   * Notificar cidadão sobre criação de protocolo
   */
  async notifyProtocolCreated(protocolId: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: {
          citizen: true,
          service: true,
          assignedUser: true,
        },
      });

      if (!protocol || !protocol.citizen) {
        logger.warn('Protocol or citizen not found', { protocolId });
        return;
      }

      // Gerar token para o servidor
      const serverToken = generateToken({
        userId: protocol.assignedUserId || 'system',
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(serverToken);

      // Enviar mensagem para o cidadão
      await ultraZendMessages.sendMessage(
        protocol.assignedUserId || 'system',
        'SERVER',
        {
          participant2Id: protocol.citizenId,
          participant2Type: 'CITIZEN',
          content: `Olá ${protocol.citizen.name}! Seu protocolo #${protocol.number} foi criado com sucesso para o serviço "${protocol.service?.name}". Acompanhe o andamento pelo painel ou por aqui.`,
          protocolId: protocol.id,
          departmentId: protocol.departmentId || undefined,
        }
      );

      logger.info('Protocol creation notification sent', { protocolId });
    } catch (error) {
      logger.error('Error notifying protocol created', { error, protocolId });
    }
  }

  /**
   * Notificar cidadão sobre atualização de status do protocolo
   */
  async notifyProtocolStatusChanged(protocolId: string, oldStatus: string, newStatus: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: {
          citizen: true,
          service: true,
          assignedUser: true,
        },
      });

      if (!protocol || !protocol.citizen) return;

      const serverToken = generateToken({
        userId: protocol.assignedUserId || 'system',
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(serverToken);

      const statusMessages: Record<string, string> = {
        PROGRESSO: 'está em andamento',
        CONCLUIDO: 'foi concluído',
        PENDENCIA: 'possui pendências que precisam de sua atenção',
        CANCELADO: 'foi cancelado',
        ATUALIZACAO: 'precisa de atualização',
      };

      const statusMessage = statusMessages[newStatus] || `mudou de ${oldStatus} para ${newStatus}`;

      await ultraZendMessages.sendMessage(
        protocol.assignedUserId || 'system',
        'SERVER',
        {
          participant2Id: protocol.citizenId,
          participant2Type: 'CITIZEN',
          content: `Seu protocolo #${protocol.number} ${statusMessage}. ${protocol.assignedUser ? `Responsável: ${protocol.assignedUser.name}` : ''}`,
          protocolId: protocol.id,
        }
      );

      logger.info('Protocol status change notification sent', { protocolId, newStatus });
    } catch (error) {
      logger.error('Error notifying protocol status change', { error, protocolId });
    }
  }

  /**
   * Notificar cidadão sobre novo comentário no protocolo
   */
  async notifyNewComment(protocolId: string, commentText: string, authorName: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: {
          citizen: true,
        },
      });

      if (!protocol || !protocol.citizen) return;

      const serverToken = generateToken({
        userId: protocol.assignedUserId || 'system',
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(serverToken);

      await ultraZendMessages.sendMessage(
        protocol.assignedUserId || 'system',
        'SERVER',
        {
          participant2Id: protocol.citizenId,
          participant2Type: 'CITIZEN',
          content: `${authorName} comentou no protocolo #${protocol.number}:\n\n"${commentText}"`,
          protocolId: protocol.id,
        }
      );

      logger.info('New comment notification sent', { protocolId });
    } catch (error) {
      logger.error('Error notifying new comment', { error, protocolId });
    }
  }

  /**
   * Notificar cidadão sobre documento enviado
   */
  async notifyDocumentUploaded(protocolId: string, documentName: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: {
          citizen: true,
        },
      });

      if (!protocol || !protocol.citizen) return;

      const serverToken = generateToken({
        userId: protocol.assignedUserId || 'system',
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(serverToken);

      await ultraZendMessages.sendMessage(
        protocol.assignedUserId || 'system',
        'SERVER',
        {
          participant2Id: protocol.citizenId,
          participant2Type: 'CITIZEN',
          content: `Um novo documento foi enviado para o protocolo #${protocol.number}: ${documentName}`,
          protocolId: protocol.id,
        }
      );

      logger.info('Document upload notification sent', { protocolId });
    } catch (error) {
      logger.error('Error notifying document upload', { error, protocolId });
    }
  }

  /**
   * Notificar cidadão sobre uma pendência do protocolo
   */
  async notifyProtocolPendingCreated(protocolId: string, pendingId: string) {
    try {
      const pending = await prisma.protocolPending.findUnique({
        where: { id: pendingId },
        include: {
          protocol: {
            include: {
              citizen: true,
              assignedUser: true,
            },
          },
        },
      });

      if (!pending?.protocol?.citizen) return;

      const serverToken = generateToken({
        userId: pending.protocol.assignedUserId || 'system',
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(serverToken);

      const metadata = pending.metadata && typeof pending.metadata === 'object'
        ? pending.metadata as Record<string, any>
        : {};
      const dueDate = pending.dueDate
        ? ` Prazo: ${new Date(pending.dueDate).toLocaleDateString('pt-BR')}.`
        : '';
      const extraContext =
        metadata.documentType
          ? ` Documento solicitado: ${metadata.documentType}.`
          : metadata.fieldLabel
          ? ` Informacao solicitada: ${metadata.fieldLabel}.`
          : '';

      await ultraZendMessages.sendMessage(
        pending.protocol.assignedUserId || 'system',
        'SERVER',
        {
          participant2Id: pending.protocol.citizenId,
          participant2Type: 'CITIZEN',
          content: `Seu protocolo #${pending.protocol.number} possui uma pendencia: ${pending.title}.${extraContext}${dueDate} Voce pode resolver isso pelo DigiBot ou pela area de protocolos no portal do cidadao.`,
          protocolId: pending.protocol.id,
          departmentId: pending.protocol.departmentId || undefined,
        }
      );

      logger.info('Protocol pending notification sent', { protocolId, pendingId });
    } catch (error) {
      logger.error('Error notifying protocol pending', { error, protocolId, pendingId });
    }
  }

  /**
   * Criar canal oficial para departamento
   */
  async createDepartmentChannel(departmentId: string, adminUserIds: string[]) {
    try {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        throw new Error('Department not found');
      }

      const adminToken = generateToken({
        userId: adminUserIds[0],
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(adminToken);

      const channel = await ultraZendMessages.createChannel({
        name: `Canal Oficial - ${department.name}`,
        slug: `${department.code || department.name.toLowerCase().replace(/\s+/g, '-')}-oficial`,
        description: `Canal oficial de comunicação do ${department.name}. Receba atualizações e informações importantes.`,
        departmentId,
        managedBy: adminUserIds,
        isPublic: true,
      });

      logger.info('Department channel created', {
        departmentId,
        channelId: channel.id,
      });

      return channel;
    } catch (error) {
      logger.error('Error creating department channel', { error, departmentId });
      throw error;
    }
  }

  /**
   * Broadcast para todos os cidadãos (canal geral)
   */
  async broadcastToAllCitizens(title: string, content: string, authorId: string) {
    try {
      const adminToken = generateToken({
        userId: authorId,
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(adminToken);

      // Buscar canal "geral" ou criar se não existir
      let channels = await ultraZendMessages.getChannels();
      let generalChannel = channels.find((c: any) => c.slug === 'geral');

      if (!generalChannel) {
        generalChannel = await ultraZendMessages.createChannel({
          name: 'Canal Geral do Município',
          slug: 'geral',
          description: 'Canal oficial para comunicados gerais da prefeitura',
          managedBy: [authorId],
          isPublic: true,
        });
      }

      await ultraZendMessages.broadcastToChannel({
        channelId: generalChannel.id,
        title,
        content,
      });

      logger.info('Broadcast sent to all citizens', { channelId: generalChannel.id });
    } catch (error) {
      logger.error('Error broadcasting to all citizens', { error });
      throw error;
    }
  }

  /**
   * Enviar lembrete de protocolo pendente
   */
  async sendProtocolReminder(protocolId: string) {
    try {
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: {
          citizen: true,
        },
      });

      if (!protocol || !protocol.citizen) return;

      const serverToken = generateToken({
        userId: 'system',
        userType: 'SERVER',
        role: 'ADMIN',
      });

      ultraZendMessages.setToken(serverToken);

      await ultraZendMessages.sendMessage(
        'system',
        'SERVER',
        {
          participant2Id: protocol.citizenId,
          participant2Type: 'CITIZEN',
          content: `⏰ Lembrete: Seu protocolo #${protocol.number} possui pendências. Por favor, verifique e tome as ações necessárias.`,
          protocolId: protocol.id,
        }
      );

      logger.info('Protocol reminder sent', { protocolId });
    } catch (error) {
      logger.error('Error sending protocol reminder', { error, protocolId });
    }
  }

  /**
   * Notificar boas-vindas para novo cidadão
   */
  async sendWelcomeMessage(citizenId: string) {
    try {
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
      });

      if (!citizen) return;

      // Inicia o fluxo do bot como o próprio cidadão para garantir
      // que a conversa "fixada" seja a conversa do DigiBot (e não um chat SERVER->CITIZEN separado).
      const citizenToken = generateToken({
        userId: citizenId,
        userType: 'CITIZEN',
        role: 'CITIZEN',
        email: citizen.email || undefined,
        name: citizen.name || undefined,
      });

      const baseUrl = process.env.MESSAGES_SERVER_URL || 'http://ultrazend-messages:9001';

      await axios.post(
        `${baseUrl}/api/bot-flow/start`,
        { flowName: 'menu_principal' },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${citizenToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Welcome message sent', { citizenId });
    } catch (error) {
      logger.error('Error sending welcome message', { error, citizenId });
    }
  }
}

export default new MessageNotificationService();
