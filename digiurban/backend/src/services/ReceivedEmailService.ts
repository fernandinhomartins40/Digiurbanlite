import { PrismaClient, Prisma } from '@prisma/client';
import { ParsedMail, AddressObject } from 'mailparser';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

interface ProcessedEmail {
  messageId: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  headers?: Record<string, any>;
  attachments?: any[];
  size: number;
  receivedAt: Date;
}

export class ReceivedEmailService {
  /**
   * Extrai email do objeto AddressObject do mailparser
   */
  private extractEmail(address: AddressObject | AddressObject[] | undefined): string {
    if (!address) return '';

    if (Array.isArray(address)) {
      return address[0]?.value?.[0]?.address || '';
    }

    return address.value?.[0]?.address || '';
  }

  /**
   * Extrai nome do objeto AddressObject do mailparser
   */
  private extractName(address: AddressObject | AddressObject[] | undefined): string | undefined {
    if (!address) return undefined;

    if (Array.isArray(address)) {
      return address[0]?.value?.[0]?.name || undefined;
    }

    return address.value?.[0]?.name || undefined;
  }

  /**
   * Gera um message-id único se não existir
   */
  private generateMessageId(hostname: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `<${timestamp}.${random}@${hostname}>`;
  }

  /**
   * Calcula tamanho aproximado do email em bytes
   */
  private calculateSize(parsed: ParsedMail): number {
    let size = 0;

    if (parsed.text) size += Buffer.byteLength(parsed.text, 'utf8');
    if (parsed.html) size += Buffer.byteLength(parsed.html.toString(), 'utf8');
    if (parsed.attachments) {
      parsed.attachments.forEach(att => {
        size += att.size || 0;
      });
    }

    return size;
  }

  /**
   * Processa email recebido e salva no banco Prisma
   */
  async processIncomingEmail(
    parsedEmail: ParsedMail,
    hostname: string = 'mail.digiurban.com.br'
  ): Promise<string> {
    try {
      const messageId = parsedEmail.messageId || this.generateMessageId(hostname);
      const fromEmail = this.extractEmail(parsedEmail.from);
      const toEmail = this.extractEmail(parsedEmail.to);

      // Buscar servidor de email
      const emailServer = await prisma.emailServer.findFirst({
        where: {
          hostname,
          isActive: true
        }
      });

      if (!emailServer) {
        console.error('Email server not found:', hostname);
        throw new Error(`Email server ${hostname} not found or inactive`);
      }

      // Tentar encontrar usuário destinatário
      const emailUser = await prisma.emailUser.findFirst({
        where: {
          emailServerId: emailServer.id,
          email: toEmail,
          isActive: true
        }
      });

      // Processar anexos
      const attachments = parsedEmail.attachments?.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        cid: att.cid,
        contentDisposition: att.contentDisposition
        // Nota: O conteúdo do anexo não é salvo aqui por enquanto
        // Em produção, deveria fazer upload para S3/storage
      }));

      // Processar headers
      const headers: Record<string, any> = {};
      if (parsedEmail.headers) {
        parsedEmail.headers.forEach((value, key) => {
          headers[key] = value;
        });
      }

      // Extrair CC e BCC
      const ccEmails = parsedEmail.cc ?
        (Array.isArray(parsedEmail.cc) ? parsedEmail.cc : [parsedEmail.cc])
          .map(addr => this.extractEmail(addr))
          .filter(Boolean)
        : null;

      const bccEmails = parsedEmail.bcc ?
        (Array.isArray(parsedEmail.bcc) ? parsedEmail.bcc : [parsedEmail.bcc])
          .map(addr => this.extractEmail(addr))
          .filter(Boolean)
        : null;

      // Salvar email recebido
      const receivedEmail = await prisma.receivedEmail.upsert({
        where: { messageId },
        update: {
          // Não atualizar se já existe (evitar duplicatas)
        },
        create: {
          messageId,
          fromEmail,
          fromName: this.extractName(parsedEmail.from),
          toEmail,
          ccEmails: ccEmails && ccEmails.length > 0 ? ccEmails : Prisma.JsonNull,
          bccEmails: bccEmails && bccEmails.length > 0 ? bccEmails : Prisma.JsonNull,
          replyTo: parsedEmail.replyTo ? this.extractEmail(parsedEmail.replyTo) : null,
          subject: parsedEmail.subject || '(Sem assunto)',
          textContent: parsedEmail.text || null,
          htmlContent: parsedEmail.html ? parsedEmail.html.toString() : null,
          headers,
          attachments: attachments && attachments.length > 0 ? attachments : Prisma.JsonNull,
          size: this.calculateSize(parsedEmail),
          receivedAt: parsedEmail.date || new Date(),
          emailServerId: emailServer.id,
          emailUserId: emailUser?.id || null,
          isRead: false,
          isStarred: false,
          isArchived: false,
          isTrash: false,
          isSpam: false,
          folder: 'inbox'
        }
      });

      console.log('✅ Email recebido e salvo:', {
        id: receivedEmail.id,
        messageId,
        from: fromEmail,
        to: toEmail,
        subject: parsedEmail.subject
      });

      return receivedEmail.id;
    } catch (error) {
      console.error('❌ Erro ao processar email recebido:', error);
      throw error;
    }
  }

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
