import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

export class EmailSenderService {
  /**
   * Envia email real via ultrazend-smtp (container separado)
   */
  async sendEmail(emailId: string): Promise<void> {
    try {
      // Buscar email do banco
      const email = await prisma.email.findUnique({
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

      // Configurar transporter para conectar no ultrazend-smtp (container separado)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'ultrazend-smtp',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // STARTTLS
        // ⚠️ SEGURANÇA: Comunicação interna sem autenticação
        // OK porque: containers na mesma rede Docker privada (172.20.0.0/16)
        // IMPORTANTE: Porta 587 NÃO deve ser exposta publicamente, apenas via proxy
        // TODO: Considerar porta 2525 exclusiva para backend (sem autenticação)
        tls: {
          rejectUnauthorized: false // Aceitar certificados self-signed em dev
        }
      });

      // Preparar destinatários
      const to = Array.isArray(email.toEmail) ? email.toEmail : [email.toEmail];
      const cc = email.ccEmails ? (Array.isArray(email.ccEmails) ? email.ccEmails : [email.ccEmails]) : undefined;
      const bcc = email.bccEmails ? (Array.isArray(email.bccEmails) ? email.bccEmails : [email.bccEmails]) : undefined;

      // Preparar anexos se existirem
      let attachments = undefined;
      if (email.attachments && Array.isArray(email.attachments)) {
        console.log('📎 [EMAIL SENDER] Processando anexos:', email.attachments.length);
        attachments = (email.attachments as any[]).map((att: any) => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType
        }));
        console.log('📎 [EMAIL SENDER] Anexos preparados:', attachments.map(a => ({ filename: a.filename, path: a.path })));
      }

      // Enviar email
      const info = await transporter.sendMail({
        from: email.fromEmail,
        to: to.join(', '),
        cc: cc ? cc.join(', ') : undefined,
        bcc: bcc ? bcc.join(', ') : undefined,
        subject: email.subject,
        text: email.textContent || undefined,
        html: email.htmlContent || undefined,
        messageId: email.messageId,
        priority: email.priority === 1 ? 'high' : email.priority === 5 ? 'low' : 'normal',
        attachments
      });

      console.log('✅ Email enviado com sucesso:', {
        emailId: email.id,
        messageId: info.messageId,
        from: email.fromEmail,
        to: to.join(', '),
        attachments: attachments ? attachments.length : 0
      });

      // Atualizar status no banco
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Registrar evento
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

    } catch (error: any) {
      console.error('❌ Erro ao enviar email:', error);

      // Atualizar status de falha
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: error.message,
          retryCount: { increment: 1 }
        }
      });

      throw error;
    }
  }

  /**
   * Envia email com retry automático
   */
  async sendEmailWithRetry(emailId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendEmail(emailId);
        return; // Sucesso!
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Tentativa ${attempt}/${maxRetries} falhou para email ${emailId}`);

        if (attempt < maxRetries) {
          // Aguardar antes de retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Falha ao enviar email após múltiplas tentativas');
  }
}

export const emailSenderService = new EmailSenderService();
