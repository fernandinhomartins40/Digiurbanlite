/**
 * UltraZend SMTP Server Adapter para DigiUrban
 * Adapta o UltraZend para usar os modelos Prisma do DigiUrban
 */

import { SMTPServer as NodeSMTPServer } from 'smtp-server';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import bcrypt from 'bcrypt';
import { createTransport, Transporter } from 'nodemailer';
import * as dns from 'dns';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { EmailStatus } from '@prisma/client';
import { receivedEmailService } from '../../services/ReceivedEmailService';

interface SMTPServerConfig {
  emailServerId: string;
  hostname: string;
  mxPort?: number;
  submissionPort?: number;
  maxConnections?: number;
  maxMessageSize?: number;
  authRequired?: boolean;
  tlsEnabled?: boolean;
  certPath?: string;
  keyPath?: string;
}

interface SMTPSession {
  id: string;
  remoteAddress?: string;
  user?: any;
  authenticated?: boolean;
}

interface EmailData {
  messageId?: string;
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  dkimSignature?: string;
}

interface MXRecord {
  exchange: string;
  priority: number;
}

/**
 * UltraZend SMTP Server adaptado para DigiUrban
 */
export class UltraZendSMTPServer {
  private mxServer?: NodeSMTPServer;
  private submissionServer?: NodeSMTPServer;
  private config: Required<SMTPServerConfig>;
  private isRunning = false;
  private startedAt: number | null = null;
  private activeConnections = 0;
  private connectionPool: Map<string, Transporter> = new Map();

  constructor(config: SMTPServerConfig) {
    this.config = {
      emailServerId: config.emailServerId,
      hostname: config.hostname,
      mxPort: config.mxPort || 25,
      submissionPort: config.submissionPort || 587,
      maxConnections: config.maxConnections || 100,
      maxMessageSize: config.maxMessageSize || 50 * 1024 * 1024,
      authRequired: config.authRequired !== undefined ? config.authRequired : true,
      tlsEnabled: config.tlsEnabled !== undefined ? config.tlsEnabled : false,
      certPath: config.certPath || '',
      keyPath: config.keyPath || ''
    };
  }

  /**
   * Extrai texto de AddressObject (type-safe)
   */
  private extractAddressText(address: AddressObject | AddressObject[] | undefined): string {
    if (!address) return '';

    if (Array.isArray(address)) {
      return address.map(a => a.text).join(', ');
    }

    return address.text;
  }

  /**
   * Inicia o servidor SMTP
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    // Verificar se EmailServer está ativo
    const emailServer = await prisma.emailServer.findUnique({
      where: { id: this.config.emailServerId }
    });

    if (!emailServer?.isActive) {
      throw new Error('Email server not active');
    }

    // Inicializar servidores
    this.initializeServers();

    // Iniciar servidor MX (porta 25)
    await new Promise<void>((resolve, reject) => {
      this.mxServer!.listen(this.config.mxPort, (err?: Error) => {
        if (err) {
          console.error(`❌ Erro ao iniciar MX Server na porta ${this.config.mxPort}:`, err);
          reject(err);
        } else {
          console.log(`📥 UltraZend MX Server (recebimento) na porta ${this.config.mxPort}`);
          resolve();
        }
      });
    });

    // Iniciar servidor Submission (porta 587)
    await new Promise<void>((resolve, reject) => {
      this.submissionServer!.listen(this.config.submissionPort, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`📤 UltraZend Submission Server (envio) na porta ${this.config.submissionPort}`);
          this.isRunning = true;
          this.startedAt = Date.now();
          resolve();
        }
      });
    });

    // Log de inicialização
    await this.logEvent('INFO', 'UltraZend SMTP Server started', {
      hostname: this.config.hostname,
      port: this.config.submissionPort
    });
  }

  /**
   * Para o servidor SMTP
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.mxServer) {
      await new Promise<void>((resolve) => {
        this.mxServer!.close(() => {
          console.log('📥 UltraZend MX Server stopped');
          resolve();
        });
      });
    }

    if (this.submissionServer) {
      await new Promise<void>((resolve) => {
        this.submissionServer!.close(() => {
          console.log('📤 UltraZend Submission Server stopped');
          resolve();
        });
      });
    }

    // Fechar pool de conexões
    for (const [server, transporter] of this.connectionPool) {
      try {
        transporter.close();
      } catch (error) {
        console.error('Error closing MX connection:', server, error);
      }
    }
    this.connectionPool.clear();

    this.isRunning = false;
    this.startedAt = null;

    await this.logEvent('INFO', 'UltraZend SMTP Servers stopped', {});
  }

  /**
   * Inicializa servidores SMTP
   */
  private initializeServers(): void {
    // Servidor MX (porta 25) - Recebe emails de outros servidores
    this.mxServer = new NodeSMTPServer({
      name: this.config.hostname,
      banner: `${this.config.hostname} ESMTP UltraZend DigiUrban Mail Server`,
      authOptional: true, // MX não requer autenticação
      maxClients: this.config.maxConnections,
      size: this.config.maxMessageSize,
      socketTimeout: 60000,
      closeTimeout: 30000,
      logger: false,

      onConnect: (session, callback) => this.handleConnect(session as SMTPSession, callback),
      onMailFrom: (address, session, callback) => this.handleMailFrom(address, session as SMTPSession, callback),
      onRcptTo: (address, session, callback) => this.handleRcptTo(address, session as SMTPSession, callback),
      onData: (stream, session, callback) => this.handleData(stream, session as SMTPSession, callback)
    });

    // Servidor Submission (porta 587) - Envia emails autenticados
    this.submissionServer = new NodeSMTPServer({
      name: this.config.hostname,
      banner: `${this.config.hostname} ESMTP UltraZend DigiUrban Mail Server`,
      authMethods: ['PLAIN', 'LOGIN'],
      authOptional: !this.config.authRequired,
      maxClients: this.config.maxConnections,
      size: this.config.maxMessageSize,
      socketTimeout: 60000,
      closeTimeout: 30000,
      logger: false,

      onConnect: (session, callback) => this.handleConnect(session as SMTPSession, callback),
      onAuth: (auth, session, callback) => this.handleAuth(auth, session as SMTPSession, callback),
      onMailFrom: (address, session, callback) => this.handleMailFrom(address, session as SMTPSession, callback),
      onRcptTo: (address, session, callback) => this.handleRcptTo(address, session as SMTPSession, callback),
      onData: (stream, session, callback) => this.handleData(stream, session as SMTPSession, callback)
    });
  }

  /**
   * Manipula conexões
   */
  private async handleConnect(
    session: SMTPSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      this.activeConnections++;
      await this.logEvent('INFO', 'SMTP connection', {
        remoteAddress: session.remoteAddress,
        sessionId: session.id
      });
      callback();
    } catch (error) {
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula autenticação
   */
  private async handleAuth(
    auth: any,
    session: SMTPSession,
    callback: (err?: Error | null, response?: any) => void
  ): Promise<void> {
    try {
      const username = auth.username;
      const password = auth.password;

      // Buscar usuário no DigiUrban
      const emailUser = await prisma.emailUser.findUnique({
        where: {
          emailServerId_email: {
            emailServerId: this.config.emailServerId,
            email: username
          }
        }
      });

      if (!emailUser || !emailUser.isActive) {
        await this.logAuthAttempt(username, session.remoteAddress!, false);
        return callback(new Error('535 Authentication failed'));
      }

      const isValidPassword = await bcrypt.compare(password, emailUser.passwordHash);
      if (!isValidPassword) {
        await this.logAuthAttempt(username, session.remoteAddress!, false);
        return callback(new Error('535 Authentication failed'));
      }

      session.user = emailUser;
      session.authenticated = true;

      await this.logAuthAttempt(username, session.remoteAddress!, true);

      // Atualizar lastLoginAt
      await prisma.emailUser.update({
        where: { id: emailUser.id },
        data: { lastLoginAt: new Date() }
      });

      callback(null, { user: emailUser.id });
    } catch (error) {
      console.error('Authentication error:', error);
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula MAIL FROM
   */
  private async handleMailFrom(
    address: any,
    session: SMTPSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      if (!session.authenticated && this.config.authRequired) {
        return callback(new Error('530 Authentication required'));
      }
      callback();
    } catch (error) {
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula RCPT TO
   */
  private async handleRcptTo(
    address: any,
    session: SMTPSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      if (session.authenticated) {
        return callback();
      }
      callback();
    } catch (error) {
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula dados do email
   */
  private async handleData(
    stream: any,
    session: SMTPSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      const parsedEmail = await simpleParser(stream);

      if (session.authenticated) {
        // Email de saída (SMTP Submission - porta 587)
        await this.processOutgoingEmail(parsedEmail, session);
      } else {
        // Email de entrada (MX - porta 25)
        await this.processIncomingEmail(parsedEmail, session);
      }

      callback();
    } catch (error) {
      console.error('Email processing error:', error);
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Processa email de saída
   */
  private async processOutgoingEmail(parsedEmail: ParsedMail, session: SMTPSession): Promise<void> {
    try {
      const messageId = this.generateMessageId();
      const fromEmail = Array.isArray(parsedEmail.from)
        ? parsedEmail.from[0]?.text || ''
        : parsedEmail.from?.text || '';
      const toEmail = Array.isArray(parsedEmail.to)
        ? parsedEmail.to[0]?.text || ''
        : parsedEmail.to?.text || '';

      // Buscar domínio
      const domain = this.extractDomain(fromEmail);
      const emailDomain = await prisma.emailDomain.findFirst({
        where: {
          emailServerId: this.config.emailServerId,
          domainName: domain
        }
      });

      const emailData: EmailData = {
        messageId,
        from: fromEmail,
        to: toEmail,
        subject: parsedEmail.subject || '',
        html: parsedEmail.html?.toString(),
        text: parsedEmail.text,
        headers: parsedEmail.headers as any
      };

      // Assinar com DKIM se disponível
      if (emailDomain?.dkimEnabled && emailDomain.dkimPrivateKey) {
        emailData.dkimSignature = await this.signWithDKIM(emailData, emailDomain);
      }

      // Salvar no banco
      await prisma.email.create({
        data: {
          emailServerId: this.config.emailServerId,
          domainId: emailDomain?.id,
          userId: session.user?.id,
          messageId,
          fromEmail,
          toEmail,
          subject: emailData.subject,
          htmlContent: emailData.html,
          textContent: emailData.text,
          headers: emailData.headers as any,
          status: EmailStatus.QUEUED,
          dkimSigned: !!emailData.dkimSignature,
          dkimSignature: emailData.dkimSignature
        }
      });

      // Entregar via MX
      const result = await this.deliverEmail(emailData);

      // Atualizar status
      await prisma.email.update({
        where: { messageId },
        data: {
          status: result.success ? EmailStatus.DELIVERED : EmailStatus.FAILED,
          sentAt: new Date(),
          deliveredAt: result.success ? new Date() : null,
          failedAt: result.success ? null : new Date(),
          errorMessage: result.error || null
        }
      });

      console.log(`Email ${result.success ? 'delivered' : 'failed'}:`, messageId, toEmail);
    } catch (error) {
      console.error('Failed to process outgoing email:', error);
      throw error;
    }
  }

  /**
   * Processa email de entrada (MX - porta 25)
   */
  private async processIncomingEmail(parsedEmail: ParsedMail, session: SMTPSession): Promise<void> {
    try {
      console.log('📥 Processando email recebido via MX...');

      // Usar serviço de emails recebidos
      const emailId = await receivedEmailService.processIncomingEmail(
        parsedEmail,
        this.config.hostname
      );

      console.log(`✅ Email recebido salvo com ID: ${emailId}`);

      // Log do evento
      await this.logEvent('INFO', 'Email recebido via MX', {
        emailId,
        from: this.extractAddressText(parsedEmail.from),
        to: this.extractAddressText(parsedEmail.to),
        subject: parsedEmail.subject
      });
    } catch (error) {
      console.error('❌ Erro ao processar email recebido:', error);
      await this.logEvent('ERROR', 'Falha ao processar email recebido', {
        error: error instanceof Error ? error.message : String(error),
        from: this.extractAddressText(parsedEmail.from),
        to: this.extractAddressText(parsedEmail.to)
      });
      throw error;
    }
  }

  /**
   * Entrega email via MX
   */
  private async deliverEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const domain = this.extractDomain(emailData.to);
      const mxRecords = await this.getMXRecords(domain);

      if (mxRecords.length === 0) {
        return { success: false, error: `No MX records for ${domain}` };
      }

      for (const mx of mxRecords) {
        try {
          const transporter = await this.getTransporter(mx.exchange);
          await transporter.sendMail({
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            headers: {
              ...emailData.headers,
              ...(emailData.dkimSignature && { 'DKIM-Signature': emailData.dkimSignature })
            }
          });

          return { success: true };
        } catch (error) {
          continue;
        }
      }

      return { success: false, error: `All MX servers failed for ${domain}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Busca MX records
   */
  private async getMXRecords(domain: string): Promise<MXRecord[]> {
    return new Promise((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err) {
          reject(err);
          return;
        }

        const sortedRecords = addresses
          .map(addr => ({ exchange: addr.exchange, priority: addr.priority }))
          .sort((a, b) => a.priority - b.priority);

        resolve(sortedRecords);
      });
    });
  }

  /**
   * Obtém transporter para MX
   */
  private async getTransporter(mxServer: string): Promise<Transporter> {
    if (this.connectionPool.has(mxServer)) {
      return this.connectionPool.get(mxServer)!;
    }

    const transporter = createTransport({
      host: mxServer,
      port: 25,
      secure: false,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      name: this.config.hostname,
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    this.connectionPool.set(mxServer, transporter);
    return transporter;
  }

  /**
   * Assina email com DKIM
   */
  private async signWithDKIM(emailData: EmailData, emailDomain: any): Promise<string> {
    // Implementação simplificada de DKIM
    // TODO: Implementar assinatura DKIM completa
    return '';
  }

  /**
   * Gera message ID
   */
  private generateMessageId(): string {
    return `${crypto.randomBytes(16).toString('hex')}@${this.config.hostname}`;
  }

  /**
   * Extrai domínio do email
   */
  private extractDomain(email: string): string {
    const match = email.match(/@([^>]+)/);
    return match ? match[1].trim() : '';
  }

  /**
   * Log de evento
   */
  private async logEvent(level: string, message: string, data: any): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          emailServerId: this.config.emailServerId,
          level: level as any,
          message,
          data: data as any
        }
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  /**
   * Log de tentativa de autenticação
   */
  private async logAuthAttempt(username: string, remoteAddress: string, success: boolean): Promise<void> {
    try {
      await prisma.emailAuthAttempt.create({
        data: {
          email: username,
          ipAddress: remoteAddress,
          userAgent: null,
          success,
          reason: success ? null : 'Invalid credentials'
        }
      });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Obtém status do servidor
   */
  getRuntimeStatus() {
    return {
      isRunning: this.isRunning,
      uptime: this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0,
      connections: {
        active: this.activeConnections,
        total: this.config.maxConnections
      }
    };
  }
}
