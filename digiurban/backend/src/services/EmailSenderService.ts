import nodemailer from 'nodemailer';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { logger } from '../config/logger.config';

interface EmailSendResult {
  sentAt: Date;
  messageId: string;
  response?: string;
}

export class EmailSenderService {
  private readonly connectionTimeoutMs = parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '10000', 10);
  private readonly socketTimeoutMs = parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '15000', 10);
  private readonly greetingTimeoutMs = parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '10000', 10);

  private createTransporter(hostname?: string | null, port?: number | null) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || hostname || 'ultrazend-smtp',
      port: parseInt(process.env.SMTP_PORT || String(port || 587), 10),
      secure: false,
      connectionTimeout: this.connectionTimeoutMs,
      greetingTimeout: this.greetingTimeoutMs,
      socketTimeout: this.socketTimeoutMs,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  private normalizeRecipients(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.normalizeRecipients(entry)).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    return [];
  }

  async verifyConnection(options?: { hostname?: string | null; port?: number | null }): Promise<void> {
    const transporter = this.createTransporter(options?.hostname, options?.port);
    await transporter.verify();
  }

  async sendEmail(emailId: string): Promise<EmailSendResult> {
    let email: any = null;

    try {
      email = await prisma.email.findUnique({
        where: { id: emailId },
        include: {
          user: true,
          emailServer: {
            include: {
              subscription: {
                include: {
                  planConfig: true
                }
              }
            }
          }
        }
      });

      if (!email) {
        throw new Error(`Email ${emailId} não encontrado`);
      }

      if (!email.user) {
        throw new Error(`EmailUser não encontrado para email ${emailId}`);
      }

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'PROCESSING',
          errorMessage: null
        }
      });

      const transporter = this.createTransporter(
        email.emailServer?.hostname,
        email.emailServer?.submissionPort
      );

      const to = this.normalizeRecipients(email.toEmail);
      const cc = this.normalizeRecipients(email.ccEmails);
      const bcc = this.normalizeRecipients(email.bccEmails);

      if (to.length === 0) {
        throw new Error('Nenhum destinatário principal foi informado');
      }

      let attachments:
        | Array<{ filename: string; content: Buffer; contentType?: string }>
        | undefined;

      if (email.attachments && Array.isArray(email.attachments)) {
        attachments = (email.attachments as Array<Record<string, unknown>>)
          .map((attachment) => {
            const filePath =
              typeof attachment.path === 'string' ? attachment.path : null;

            if (!filePath || !fs.existsSync(filePath)) {
              logger.warn('Anexo de email não encontrado no filesystem', {
                emailId,
                filePath
              });
              return null;
            }

            const content = fs.readFileSync(filePath) as Buffer;

            return {
              filename:
                typeof attachment.filename === 'string'
                  ? attachment.filename
                  : 'anexo',
              content,
              contentType:
                typeof attachment.contentType === 'string'
                  ? attachment.contentType
                  : undefined
            };
          })
          .filter(Boolean) as Array<{
            filename: string;
            content: Buffer;
            contentType?: string;
          }>;
      }

      const sentAt = new Date();
      const info = await transporter.sendMail({
        from: email.fromEmail,
        to: to.join(', '),
        cc: cc.length > 0 ? cc.join(', ') : undefined,
        bcc: bcc.length > 0 ? bcc.join(', ') : undefined,
        subject: email.subject,
        text: email.textContent || undefined,
        html: email.htmlContent || undefined,
        messageId: email.messageId,
        priority:
          email.priority === 1 ? 'high' : email.priority === 5 ? 'low' : 'normal',
        attachments
      });

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt,
          failedAt: null,
          errorMessage: null
        }
      });

      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          type: 'SENT',
          data: {
            messageId: info.messageId,
            response: info.response
          }
        }
      });

      if (email.emailServerId) {
        await prisma.emailLog
          .create({
            data: {
              emailServerId: email.emailServerId,
              from: email.fromEmail,
              to: to.join(', '),
              subject: email.subject,
              status: 'SENT',
              type: 'outbound',
              level: 'INFO',
              message: 'Email enviado com sucesso',
              metadata: {
                emailId: email.id,
                messageId: info.messageId,
                attachmentCount: attachments ? attachments.length : 0
              }
            }
          })
          .catch((error) => {
            logger.warn('Falha ao registrar log de envio de email', { error });
          });
      }

      return {
        sentAt,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error: any) {
      const failedAt = new Date();

      logger.error('Erro ao enviar email', {
        emailId,
        error: error instanceof Error ? error.message : String(error)
      });

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          failedAt,
          errorMessage:
            error instanceof Error ? error.message : 'Erro desconhecido no envio',
          retryCount: { increment: 1 }
        }
      });

      if (email) {
        await prisma.emailEvent
          .create({
            data: {
              emailId: email.id,
              type: 'FAILED',
              data: {
                error:
                  error instanceof Error
                    ? error.message
                    : 'Erro desconhecido no envio'
              }
            }
          })
          .catch((eventError) => {
            logger.warn('Falha ao registrar evento de falha de email', {
              error: eventError
            });
          });

        if (email.emailServerId) {
          await prisma.emailLog
            .create({
              data: {
                emailServerId: email.emailServerId,
                from: email.fromEmail,
                to: this.normalizeRecipients(email.toEmail).join(', '),
                subject: email.subject,
                status: 'FAILED',
                type: 'outbound',
                level: 'ERROR',
                message: 'Falha ao enviar email',
                metadata: {
                  emailId: email.id,
                  failedAt: failedAt.toISOString(),
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Erro desconhecido no envio'
                }
              }
            })
            .catch((logError) => {
              logger.warn('Falha ao registrar log de erro de email', {
                error: logError
              });
            });
        }
      }

      throw error;
    }
  }

  async sendEmailWithRetry(
    emailId: string,
    maxRetries: number = 3
  ): Promise<EmailSendResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        return await this.sendEmail(emailId);
      } catch (error: any) {
        lastError = error;
        logger.warn('Tentativa de envio de email falhou', {
          emailId,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error)
        });

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Falha ao enviar email após múltiplas tentativas');
  }
}

export const emailSenderService = new EmailSenderService();
