import { prisma } from '../prisma';
import { SMTPServer, SMTPServerAuthentication, SMTPServerSession, SMTPServerDataStream, SMTPServerAuthenticationResponse } from 'smtp-server';
import { EmailServiceConfig, EmailData as EmailMsg } from '../../types';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import { Readable } from 'stream';
import { resolveMx as dnsResolveMx } from 'dns/promises';

// FASE 2 - Tipos SMTP da biblioteca smtp-server

// Usando SMTPServerDataStream da biblioteca smtp-server

/**
 * Interface para dados de domínio DKIM
 * Para assinatura de emails
 */
interface DKIMDomain {
  id: string;
  domainName: string;
  dkimEnabled: boolean;
  dkimPrivateKey: string | null;
  dkimPublicKey?: string | null;
  dkimSelector?: string | null;
  isVerified: boolean;
  emailServerId: string;
}

/**
 * Interface para email preparado para delivery
 * Usado no processo de entrega MX
 */
interface EmailForDelivery {
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  rawData: string;
  headers: Record<string, string>;
  dkimSignature?: string;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Interface para dados de log estruturados
 * Usado no sistema de logging de eventos
 */
interface EmailLogData {
  remoteAddress?: string;
  id?: string;
  from?: string;
  domain?: string;
  error?: string;
  username?: string;
  result?: string;
  messageId?: string;
  deliveryStatus?: string;
  [key: string]: unknown;
}

// Definições locais específicas do SMTP Server
interface DigiUrbanSMTPConfig {
  emailServerId: string; // DIA 3: Changed from tenantId to emailServerId
  hostname: string;
  mxPort?: number;
  submissionPort?: number;
  enableTLS?: boolean;
  enableDKIM?: boolean;
  maxConnections?: number;
}

interface EmailMessage {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  text?: string;
  headers: Record<string, string>;
  rawData?: string;
  dkimSignature?: string;
}
const resolveMx = dnsResolveMx;

// Using centralized types from ../../types

export class DigiUrbanSMTPServer {
  private smtpServer?: SMTPServer;
  private config: DigiUrbanSMTPConfig;
  private isRunning = false;

  constructor(config: DigiUrbanSMTPConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    try {
      // DIA 3: Removed tenant check, using emailServerId directly
      const emailServer = await prisma.emailServer.findUnique({
        where: { id: this.config.emailServerId }
        });

      if (!emailServer?.isActive) {
        throw new Error('Email service not enabled');
      }

      // Configurar servidor SMTP
      this.smtpServer = new SMTPServer({
        secure: false,
        authMethods: ['PLAIN', 'LOGIN'],
        maxClients: this.config.maxConnections || 100,

        // Autenticação
        onAuth: this.handleAuth.bind(this),

        // Processar emails
        onData: this.handleData.bind(this),

        // Logs de conexão
        onConnect: this.handleConnect.bind(this),
        onClose: this.handleClose.bind(this)
        });

      // Iniciar nas portas configuradas
      this.smtpServer.listen(this.config.submissionPort || 587, () => {
        console.log(
          `📧 DigiUrban SMTP Server running on port ${this.config.submissionPort || 587}`
        );
        this.isRunning = true;
      });

      // Log de inicialização
      await this.logEvent('INFO', 'SMTP Server started', {
        hostname: this.config.hostname,
        ports: { mx: this.config.mxPort, submission: this.config.submissionPort }
        });
    } catch (error) {
      await this.logEvent('ERROR', 'Failed to start SMTP server', {
        error: (error as Error).message
        });
      throw error;
    }
  }

  private async handleAuth(
    auth: SMTPServerAuthentication,
    session: SMTPServerSession,
    callback: (err: Error | null | undefined, response?: SMTPServerAuthenticationResponse | undefined) => void
  ) {
    try {
      const emailServer = await this.getEmailServer();

      if (!auth.username) {
        await this.logAuthAttempt(
          'unknown',
          session.remoteAddress,
          false,
          'Username não fornecido'
        );
        return callback(new Error('Username é obrigatório'));
      }

      const emailUser = await prisma.emailUser.findUnique({
        where: {
          emailServerId_email: {
            emailServerId: emailServer.id,
            email: auth.username
        }
        }
        });

      if (!emailUser || !emailUser.isActive) {
        await this.logAuthAttempt(
          auth.username,
          session.remoteAddress,
          false,
          'User not found or inactive'
        );
        return callback(new Error('Authentication failed'));
      }

      if (!auth.password) {
        await this.logAuthAttempt(auth.username, session.remoteAddress, false, 'Password não fornecida');
        return callback(new Error('Password é obrigatória'));
      }

      const isValidPassword = await bcrypt.compare(auth.password, emailUser.passwordHash);
      if (!isValidPassword) {
        await this.logAuthAttempt(auth.username, session.remoteAddress, false, 'Invalid password');
        return callback(new Error('Authentication failed'));
      }

      // Verificar limites diários/mensais
      const canSend = await this.checkSendingLimits(emailUser.id);
      if (!canSend) {
        await this.logAuthAttempt(
          auth.username,
          session.remoteAddress,
          false,
          'Sending limit exceeded'
        );
        return callback(new Error('Sending limit exceeded'));
      }

      // Atualizar último login
      await prisma.emailUser.update({
        where: { id: emailUser.id },
        data: { lastLoginAt: new Date() }
        });

      await this.logAuthAttempt(auth.username, session.remoteAddress, true);
      (session as any).user = emailUser;
      callback(null, { user: auth.username });
    } catch (error) {
      await this.logEvent('ERROR', 'Authentication error', { error: (error as Error).message });
      callback(error as Error);
    }
  }

  private async handleData(
    stream: SMTPServerDataStream,
    session: SMTPServerSession,
    callback: (err?: Error | null | undefined) => void
  ) {
    try {
      // Parse email content
      const emailData = await this.parseEmailStream(stream);

      // Validar domínio do remetente
      const domain = emailData.from.split('@')[1];
      const emailServer = await this.getEmailServer();

      const emailDomain = await prisma.emailDomain.findFirst({
        where: {
          emailServerId: emailServer.id,
          domainName: domain,
          isVerified: true
        }
        });

      if (!emailDomain) {
        await this.logEvent('WARN', 'Unauthorized domain', { from: emailData.from, domain });
        return callback(new Error(`Unauthorized domain: ${domain}`));
      }

      // Aplicar assinatura DKIM se habilitada
      let signedEmail = emailData;
      if (emailDomain.dkimEnabled) {
        signedEmail = await this.applyDKIM(emailData, emailDomain);
      }

      // Salvar email no banco
      const email = await prisma.email.create({
        data: {
          emailServerId: emailServer.id,
          domainId: emailDomain.id,
          userId: (session as any).user?.id,
          messageId: signedEmail.messageId,
          fromEmail: signedEmail.from,
          toEmail: Array.isArray(signedEmail.to) ? signedEmail.to.join(',') : signedEmail.to,
          ccEmails: signedEmail.cc
            ? JSON.stringify(Array.isArray(signedEmail.cc) ? signedEmail.cc : [signedEmail.cc])
            : undefined,
          bccEmails: signedEmail.bcc
            ? JSON.stringify(Array.isArray(signedEmail.bcc) ? signedEmail.bcc : [signedEmail.bcc])
            : undefined,
          subject: signedEmail.subject,
          htmlContent: signedEmail.html,
          textContent: signedEmail.text,
          headers: signedEmail.headers,
          status: 'QUEUED',
          dkimSigned: emailDomain.dkimEnabled,
          dkimSignature: signedEmail.dkimSignature
        }
        });

      // Processar entrega em background
      this.processDelivery(email.id).catch(console.error);

      await this.logEvent('INFO', 'Email queued for delivery', {
        messageId: email.messageId,
        from: email.fromEmail,
        to: email.toEmail
        });

      callback();
    } catch (error) {
      await this.logEvent('ERROR', 'Email processing error', { error: (error as Error).message });
      callback(error as Error);
    }
  }

  private async parseEmailStream(stream: SMTPServerDataStream): Promise<EmailMessage> {
    return new Promise((resolve, reject) => {
      let data = '';

      stream.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });

      stream.on('end', () => {
        try {
          // Parse básico do email - em produção usar biblioteca como mailparser
          const lines = data.split('\r\n');
          const headers: Record<string, string> = {};
          let bodyStart = -1;

          for (let i = 0; i < lines.length; i++) {
            if (lines[i] === '') {
              bodyStart = i + 1;
              break;
            }

            const [key, ...values] = lines[i].split(':');
            if (key && values.length) {
              headers[key.toLowerCase().trim()] = values.join(':').trim();
            }
          }

          const body = bodyStart >= 0 ? lines.slice(bodyStart).join('\r\n') : '';

          const email: EmailMessage = {
            messageId:
              headers['message-id'] || `${Date.now()}-${Math.random()}@${this.config.hostname}`,
            from: headers['from'] || '',
            to: headers['to'] ? headers['to'].split(',').map(s => s.trim()) : [],
            cc: headers['cc'] ? headers['cc'].split(',').map(s => s.trim()) : undefined,
            bcc: headers['bcc'] ? headers['bcc'].split(',').map(s => s.trim()) : undefined,
            subject: headers['subject'] || '',
            body: body,
            text: body,
            headers
        };

          resolve(email);
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  private async applyDKIM(email: EmailMessage, domain: DKIMDomain): Promise<EmailMessage> {
    try {
      if (!domain.dkimPrivateKey) {
        return email;
      }

      // Em produção, usar biblioteca como node-dkim para assinatura
      // Por agora, simular assinatura DKIM
      const dkimSignature = `v=1; a=rsa-sha256; d=${domain.domainName}; s=${domain.dkimSelector}; c=relaxed/relaxed;`;

      return {
        ...email,
        dkimSignature,
        headers: {
          ...email.headers,
          'DKIM-Signature': dkimSignature
        }
        };
    } catch (error) {
      await this.logEvent('ERROR', 'DKIM signing failed', {
        domain: domain.domainName,
        error: (error as Error).message
        });
      return email;
    }
  }

  private async processDelivery(emailId: string) {
    try {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: {}
      });

      if (!email) return;

      // Atualizar status para PROCESSING
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'PROCESSING' }
        });

      // Criar objeto compatível com EmailForDelivery
      const emailForDelivery: EmailForDelivery = {
        messageId: email.messageId,
        from: email.fromEmail,
        to: [email.toEmail],
        subject: email.subject,
        rawData: email.htmlContent || email.textContent || '',
        headers: email.headers ? (typeof email.headers === 'string' ? JSON.parse(email.headers) : email.headers as Record<string, string>) : {},
        dkimSignature: email.dkimSignature || undefined,
        priority: 'normal'
      };

      // Tentar entrega via MX records
      const delivered = await this.deliverViaMX(emailForDelivery);

      if (delivered) {
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date()
        }
        });

        // Registrar evento
        await prisma.emailEvent.create({
          data: {
            emailId,
            type: 'DELIVERED',
            timestamp: new Date()
        }
        });

        // Incrementar contador do usuário
        if (email.userId) {
          await this.updateUserSentCount(email.userId);
        }
      } else {
        // Falha na entrega
        const retryCount = email.retryCount + 1;
        const shouldRetry = retryCount <= email.maxRetries;

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: shouldRetry ? 'QUEUED' : 'FAILED',
            failedAt: shouldRetry ? null : new Date(),
            retryCount
        }
        });

        if (shouldRetry) {
          // Reagendar para retry com backoff exponencial
          setTimeout(
            () => {
              this.processDelivery(emailId).catch(console.error);
            },
            Math.pow(2, retryCount) * 60000
          ); // 2^n minutos
        }
      }
    } catch (error) {
      await this.logEvent('ERROR', 'Delivery processing error', {
        emailId,
        error: (error as Error).message
        });
    }
  }

  private async deliverViaMX(email: EmailForDelivery): Promise<boolean> {
    try {
      const toEmail = email.to[0]; // Pega o primeiro destinatário
      const domain = toEmail.split('@')[1];

      // Resolver MX records
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new Error(`No MX records found for domain: ${domain}`);
      }

      // Ordenar por prioridade
      mxRecords.sort((a, b) => a.priority - b.priority);

      // Tentar entregar no primeiro MX disponível
      for (const mx of mxRecords) {
        try {
          const transporter = nodemailer.createTransport({
            host: mx.exchange,
            port: 25,
            secure: false,
            ignoreTLS: true,
            tls: {
              rejectUnauthorized: false
        }
        });

          const result = await transporter.sendMail({
            from: email.from,
            to: email.to,
            subject: email.subject,
            raw: email.rawData,
            headers: email.headers
        });

          await this.logEvent('INFO', 'Email delivered successfully', {
            messageId: email.messageId,
            mx: mx.exchange,
            response: result.response
        });

          return true;
        } catch (mxError) {
          await this.logEvent('WARN', 'MX delivery failed', {
            messageId: email.messageId,
            mx: mx.exchange,
            error: (mxError as Error).message
        });
          continue;
        }
      }

      throw new Error('All MX servers failed');
    } catch (error) {
      await this.logEvent('ERROR', 'Email delivery failed', {
        messageId: email.messageId,
        error: (error as Error).message
        });
      return false;
    }
  }

  private async checkSendingLimits(userId: string): Promise<boolean> {
    try {
      const user = await prisma.emailUser.findUnique({
        where: { id: userId }
        });

      if (!user) return false;

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Contar emails enviados hoje
      const sentToday = await prisma.email.count({
        where: {
          userId,
          sentAt: {
            gte: startOfDay
        }
        }
        });

      // Contar emails enviados este mês
      const sentThisMonth = await prisma.email.count({
        where: {
          userId,
          sentAt: {
            gte: startOfMonth
        }
        }
        });

      return sentToday < user.dailyLimit && sentThisMonth < user.monthlyLimit;
    } catch (error) {
      await this.logEvent('ERROR', 'Error checking sending limits', {
        userId,
        error: (error as Error).message
        });
      return false;
    }
  }

  private async updateUserSentCount(userId: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Contar emails enviados
      const [sentToday, sentThisMonth] = await Promise.all([
        prisma.email.count({
          where: { userId, sentAt: { gte: startOfDay } }
        }),
        prisma.email.count({
          where: { userId, sentAt: { gte: startOfMonth } }
        }),
      ]);

      // Atualizar contadores
      await prisma.emailUser.update({
        where: { id: userId },
        data: {
          sentToday,
          sentThisMonth
        }
        });
    } catch (error) {
      await this.logEvent('ERROR', 'Error updating user sent count', {
        userId,
        error: (error as Error).message
        });
    }
  }

  private async handleConnect(
    session: SMTPServerSession,
    callback: (err?: Error | null | undefined) => void
  ) {
    await this.logEvent('DEBUG', 'SMTP connection established', {
      remoteAddress: session.remoteAddress,
      id: session.id
        });
    callback();
  }

  private async handleClose(
    session: SMTPServerSession,
    callback: (err?: Error | null | undefined) => void
  ) {
    await this.logEvent('DEBUG', 'SMTP connection closed', {
      remoteAddress: session.remoteAddress,
      id: session.id
        });
    callback();
  }

  private async getEmailServer() {
    return await prisma.emailServer.findUniqueOrThrow({
      where: { id: this.config.emailServerId }, // DIA 3: Changed from tenantId to id
    });
  }

  private async logEvent(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, data?: EmailLogData) {
    try {
      const emailServer = await this.getEmailServer();
      await prisma.emailLog.create({
        data: {
          emailServerId: emailServer.id,
          level,
          message,
          data: data ? JSON.stringify(data) : '{}'
        }
        });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  private async logAuthAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    reason?: string
  ) {
    try {
      await prisma.emailAuthAttempt.create({
        data: {
          email,
          ipAddress,
          success,
          reason
        }
        });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.smtpServer && this.isRunning) {
      this.smtpServer.close(() => {
        console.log('📧 DigiUrban SMTP Server stopped');
        this.isRunning = false;
      });

      await this.logEvent('INFO', 'SMTP Server stopped');
    }
  }

  async getStats() {
    try {
      const emailServer = await this.getEmailServer();

      const [totalEmails, sentEmails, deliveredEmails, failedEmails, totalDomains, totalUsers] =
        await Promise.all([
          prisma.email.count({ where: { emailServerId: emailServer.id } }),
          prisma.email.count({ where: { emailServerId: emailServer.id, status: 'SENT' } }),
          prisma.email.count({ where: { emailServerId: emailServer.id, status: 'DELIVERED' } }),
          prisma.email.count({ where: { emailServerId: emailServer.id, status: 'FAILED' } }),
          prisma.emailDomain.count({ where: { emailServerId: emailServer.id } }),
          prisma.emailUser.count({ where: { emailServerId: emailServer.id } }),
        ]);

      return {
        server: {
          hostname: this.config.hostname,
          isRunning: this.isRunning,
          uptime: process.uptime()
        },
        emails: {
          total: totalEmails,
          sent: sentEmails,
          delivered: deliveredEmails,
          failed: failedEmails,
          deliveryRate:
            totalEmails > 0 ? ((deliveredEmails / totalEmails) * 100).toFixed(2) + '%' : '0%'
        },
        domains: totalDomains,
        users: totalUsers
        };
    } catch (error) {
      await this.logEvent('ERROR', 'Error getting server stats', {
        error: (error as Error).message
        });
      throw error;
    }
  }
}
