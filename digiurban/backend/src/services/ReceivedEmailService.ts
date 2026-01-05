import { prisma } from '../lib/prisma';

/**
 * ReceivedEmailService - Backend DigiUrban
 *
 * ⚠️ IMPORTANTE: Este serviço APENAS CONSULTA emails recebidos
 * O processamento e salvamento é feito pelo ultrazend-smtp (container separado)
 */
export class ReceivedEmailService {

  /**
   * Lista emails recebidos com filtros
   */
  async listReceivedEmails(options: {
    emailServerId: string;
    emailUserId?: string;
    folder?: string;
    isRead?: boolean;
    isStarred?: boolean;
    isTrash?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      emailServerId: options.emailServerId,
      isTrash: options.isTrash !== undefined ? options.isTrash : false
    };

    if (options.emailUserId) {
      where.emailUserId = options.emailUserId;
    }

    if (options.folder) {
      where.folder = options.folder;
    }

    if (options.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    if (options.isStarred !== undefined) {
      where.isStarred = options.isStarred;
    }

    if (options.search) {
      where.OR = [
        { subject: { contains: options.search, mode: 'insensitive' } },
        { fromEmail: { contains: options.search, mode: 'insensitive' } },
        { fromName: { contains: options.search, mode: 'insensitive' } },
        { textContent: { contains: options.search, mode: 'insensitive' } }
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.receivedEmail.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
        select: {
          id: true,
          messageId: true,
          fromEmail: true,
          fromName: true,
          toEmail: true,
          subject: true,
          textContent: true,
          receivedAt: true,
          isRead: true,
          isStarred: true,
          isArchived: true,
          size: true,
          attachments: true
        }
      }),
      prisma.receivedEmail.count({ where })
    ]);

    return {
      emails: emails.map((email: any) => ({
        ...email,
        preview: email.textContent?.substring(0, 150) || ''
      })),
      total,
      limit: options.limit || 50,
      offset: options.offset || 0
    };
  }

  /**
   * Marca email como lido/não lido
   */
  async markAsRead(id: string, isRead: boolean) {
    return prisma.receivedEmail.update({
      where: { id },
      data: { isRead }
    });
  }

  /**
   * Marca email como favorito
   */
  async toggleStar(id: string) {
    const email = await prisma.receivedEmail.findUnique({ where: { id } });
    if (!email) throw new Error('Email not found');

    return prisma.receivedEmail.update({
      where: { id },
      data: { isStarred: !email.isStarred }
    });
  }

  /**
   * Move email para lixeira
   */
  async moveToTrash(id: string) {
    return prisma.receivedEmail.update({
      where: { id },
      data: { isTrash: true, folder: 'trash' }
    });
  }

  /**
   * Restaura email da lixeira
   */
  async restoreFromTrash(id: string) {
    return prisma.receivedEmail.update({
      where: { id },
      data: { isTrash: false, folder: 'inbox' }
    });
  }

  /**
   * Deleta email permanentemente
   */
  async deletePermanently(id: string) {
    return prisma.receivedEmail.delete({
      where: { id }
    });
  }
}

export const receivedEmailService = new ReceivedEmailService();
