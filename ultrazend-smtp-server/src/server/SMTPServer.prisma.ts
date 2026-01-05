/**
 * @ultrazend/smtp-server - SMTP Server (Prisma Version)
 * Servidor SMTP completo independente - Aceita conexões e processa emails
 */

import { SMTPServer as NodeSMTPServer } from 'smtp-server';
import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';
import { generateMessageId } from '../utils/crypto';
import { MXDeliveryService } from '../delivery/MXDeliveryService.prisma';
import { DKIMManager } from '../security/DKIMManager.prisma';
import { SMTPServerConfig, SMTPSession, EmailData } from '../types';
import { prisma } from '../lib/prisma';
import { EmailUser as User, EmailStatus } from '@prisma/client';

/**
 * Helper para extrair texto de endereço de email
 */
function getAddressText(address: AddressObject | AddressObject[] | undefined): string {
  if (!address) return '';
  if (Array.isArray(address)) {
    return address[0]?.text || '';
  }
  return address.text || '';
}

export class UltraZendSMTPServer {
  private mxServer!: NodeSMTPServer;
  private submissionServer!: NodeSMTPServer;
  private config: Required<SMTPServerConfig>;
  private deliveryService: MXDeliveryService;
  private dkimManager: DKIMManager;
  private isRunning = false;

  constructor(config: SMTPServerConfig = {}) {
    this.config = {
      mxPort: config.mxPort || 25,
      submissionPort: config.submissionPort || 587,
      hostname: config.hostname || 'mail.localhost',
      maxConnections: config.maxConnections || 100,
      maxMessageSize: config.maxMessageSize || 50 * 1024 * 1024, // 50MB
      authRequired: config.authRequired !== undefined ? config.authRequired : true,
      tlsEnabled: config.tlsEnabled !== undefined ? config.tlsEnabled : false,
      certPath: config.certPath || '',
      keyPath: config.keyPath || '',
      databasePath: config.databasePath || '', // Não usado com Prisma
      logLevel: config.logLevel || 'info'
    };

    // Inicializar serviços
    this.deliveryService = new MXDeliveryService(this.config.hostname);
    this.dkimManager = new DKIMManager();

    logger.info('UltraZend SMTP Server initialized', {
      mxPort: this.config.mxPort,
      submissionPort: this.config.submissionPort,
      hostname: this.config.hostname
    });
  }

  /**
   * Inicializa servidores SMTP
   */
  private initializeServers(): void {
    // Servidor MX (porta 25) - recebe emails de outros servidores
    this.mxServer = new NodeSMTPServer({
      name: this.config.hostname,
      banner: `${this.config.hostname} ESMTP UltraZend Mail Server`,
      authOptional: true, // Autenticação opcional para MX
      maxClients: this.config.maxConnections,
      size: this.config.maxMessageSize,
      socketTimeout: 60000,
      closeTimeout: 30000,
      logger: false,

      onConnect: (session, callback) => this.handleConnect(session as SMTPSession, callback, 'mx'),
      onAuth: (auth, session, callback) => this.handleAuth(auth, session as SMTPSession, callback),
      onMailFrom: (address, session, callback) => this.handleMailFrom(address, session as SMTPSession, callback),
      onRcptTo: (address, session, callback) => this.handleRcptTo(address, session as SMTPSession, callback),
      onData: (stream, session, callback) => this.handleData(stream, session as SMTPSession, callback, 'mx')
    });

    // Servidor Submission (porta 587) - recebe emails de clientes autenticados
    this.submissionServer = new NodeSMTPServer({
      name: this.config.hostname,
      banner: `${this.config.hostname} ESMTP UltraZend Submission Server`,
      authMethods: ['PLAIN', 'LOGIN'],
      authOptional: !this.config.authRequired,
      maxClients: this.config.maxConnections,
      size: this.config.maxMessageSize,
      socketTimeout: 60000,
      closeTimeout: 30000,
      logger: false,

      onConnect: (session, callback) => this.handleConnect(session as SMTPSession, callback, 'submission'),
      onAuth: (auth, session, callback) => this.handleAuth(auth, session as SMTPSession, callback),
      onMailFrom: (address, session, callback) => this.handleMailFrom(address, session as SMTPSession, callback),
      onRcptTo: (address, session, callback) => this.handleRcptTo(address, session as SMTPSession, callback),
      onData: (stream, session, callback) => this.handleData(stream, session as SMTPSession, callback, 'submission')
    });

    logger.info('SMTP servers configured', {
      mxPort: this.config.mxPort,
      submissionPort: this.config.submissionPort
    });
  }

  /**
   * Manipula novas conexões
   */
  private async handleConnect(
    session: SMTPSession,
    callback: (err?: Error | null) => void,
    serverType: 'mx' | 'submission'
  ): Promise<void> {
    try {
      const remoteAddress = session.remoteAddress || 'unknown';

      logger.info('SMTP connection', {
        remoteAddress,
        serverType,
        sessionId: session.id
      });

      // Log da conexão
      await this.logConnection(remoteAddress, serverType, 'accepted');

      callback();

    } catch (error) {
      logger.error('Connection handler error', { error, serverType });
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

      logger.info('SMTP authentication attempt', {
        username,
        method: auth.method,
        remoteAddress: session.remoteAddress
      });

      // Validar credenciais
      const user = await this.validateUserCredentials(username, password);
      if (!user) {
        await this.logAuthAttempt(username, session.remoteAddress!, false, null);
        return callback(new Error('535 Authentication failed'));
      }

      session.user = user;
      session.authenticated = true;

      await this.logAuthAttempt(username, session.remoteAddress!, true, user.id);

      logger.info('Authentication successful', { username, userId: user.id });
      callback(null, { user: user.id });

    } catch (error) {
      logger.error('Authentication error', { error });
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula comando MAIL FROM
   */
  private async handleMailFrom(
    address: any,
    session: SMTPSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      const senderEmail = address.address;

      logger.info('MAIL FROM', {
        sender: senderEmail,
        authenticated: session.authenticated,
        userId: session.user?.id
      });

      // Para servidor submission, verificar se usuário está autenticado
      if (!session.authenticated && this.config.authRequired) {
        return callback(new Error('530 Authentication required'));
      }

      callback();

    } catch (error) {
      logger.error('MAIL FROM error', { error });
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula comando RCPT TO
   */
  private async handleRcptTo(
    address: any,
    session: SMTPSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      const recipientEmail = address.address;

      logger.info('RCPT TO', {
        recipient: recipientEmail,
        authenticated: session.authenticated
      });

      // Para clientes autenticados, permitir qualquer destinatário
      if (session.authenticated) {
        return callback();
      }

      // Para MX, verificar se destinatário é local (implementar conforme necessário)
      callback();

    } catch (error) {
      logger.error('RCPT TO error', { error });
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Manipula dados do email
   */
  private async handleData(
    stream: any,
    session: SMTPSession,
    callback: (err?: Error | null) => void,
    serverType: 'mx' | 'submission'
  ): Promise<void> {
    try {
      logger.info('Processing email data', {
        serverType,
        authenticated: session.authenticated,
        userId: session.user?.id
      });

      // Parse do email
      const parsedEmail = await simpleParser(stream);

      // Determinar se é email de saída (outgoing) ou entrada (incoming)
      // Emails na porta submission (587) devem ser ENVIADOS
      // Emails na porta MX (25) devem ser RECEBIDOS
      if (serverType === 'submission') {
        // Email enviado via porta submission - fazer entrega externa
        // Pode ser autenticado ou não (interno Docker sem auth)
        await this.processOutgoingEmail(parsedEmail, session);
      } else {
        // Email recebido via MX - processar entrada
        await this.processIncomingEmail(parsedEmail, session);
      }

      callback();

    } catch (error) {
      logger.error('Email processing error', { error, serverType });
      callback(new Error('421 Temporary server error'));
    }
  }

  /**
   * Processa email de saída (submission)
   */
  private async processOutgoingEmail(parsedEmail: ParsedMail, session: SMTPSession): Promise<void> {
    try {
      const messageId = generateMessageId(this.config.hostname);

      const emailData: EmailData = {
        messageId,
        from: getAddressText(parsedEmail.from),
        to: getAddressText(parsedEmail.to),
        subject: parsedEmail.subject || '',
        html: parsedEmail.html?.toString(),
        text: parsedEmail.text,
        headers: parsedEmail.headers as any
      };

      // Assinar com DKIM
      const signedEmail = await this.dkimManager.signEmail(emailData);

      // Entregar via MX
      const result = await this.deliveryService.deliverEmail(signedEmail);

      if (result.success) {
        logger.info('Outgoing email delivered', {
          messageId,
          to: emailData.to,
          mxServer: result.mxServer
        });
      } else {
        logger.error('Outgoing email delivery failed', {
          messageId,
          to: emailData.to,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Failed to process outgoing email', { error });
      throw error;
    }
  }

  /**
   * Processa email de entrada (MX) - SALVA EM ReceivedEmail
   */
  private async processIncomingEmail(parsedEmail: ParsedMail, session: SMTPSession): Promise<void> {
    try {
      const messageId = parsedEmail.messageId || generateMessageId(this.config.hostname);

      // Extrair endereços
      const fromEmail = this.extractEmail(parsedEmail.from);
      const toEmail = this.extractEmail(parsedEmail.to);
      const fromName = this.extractName(parsedEmail.from);

      // Buscar servidor de email
      const emailServer = await prisma.emailServer.findFirst({
        where: {
          hostname: this.config.hostname,
          isActive: true
        }
      });

      if (!emailServer) {
        logger.warn('Email server not found or inactive', { hostname: this.config.hostname });
        // Continuar mesmo assim para não rejeitar o email
      }

      // Tentar encontrar usuário destinatário
      const emailUser = emailServer ? await prisma.emailUser.findFirst({
        where: {
          emailServerId: emailServer.id,
          email: toEmail,
          isActive: true
        }
      }) : null;

      // Processar anexos
      const attachments = parsedEmail.attachments?.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        cid: att.cid,
        contentDisposition: att.contentDisposition
      })) || [];

      // Processar CC e BCC
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

      // ✅ SALVAR em ReceivedEmail (tabela correta!)
      await prisma.receivedEmail.upsert({
        where: { messageId },
        update: {}, // Não atualizar se já existe (evitar duplicatas)
        create: {
          messageId,
          fromEmail,
          fromName,
          toEmail,
          ccEmails: ccEmails && ccEmails.length > 0 ? ccEmails : null,
          bccEmails: bccEmails && bccEmails.length > 0 ? bccEmails : null,
          replyTo: parsedEmail.replyTo ? this.extractEmail(parsedEmail.replyTo) : null,
          subject: parsedEmail.subject || '(Sem assunto)',
          textContent: parsedEmail.text || null,
          htmlContent: parsedEmail.html ? parsedEmail.html.toString() : null,
          headers: parsedEmail.headers ? Object.fromEntries(parsedEmail.headers.entries()) : null,
          attachments: attachments.length > 0 ? attachments : null,
          size: this.calculateEmailSize(parsedEmail),
          receivedAt: parsedEmail.date || new Date(),
          emailServerId: emailServer?.id || '',
          emailUserId: emailUser?.id || null,
          isRead: false,
          isStarred: false,
          isArchived: false,
          isTrash: false,
          isSpam: false,
          folder: 'inbox'
        }
      });

      logger.info('✅ Incoming email received and saved to ReceivedEmail', {
        messageId,
        from: fromEmail,
        to: toEmail,
        subject: parsedEmail.subject
      });

    } catch (error) {
      logger.error('❌ Failed to process incoming email', { error });
      throw error;
    }
  }

  /**
   * Helpers para extração de dados
   */
  private extractEmail(address: AddressObject | AddressObject[] | undefined): string {
    if (!address) return '';
    if (Array.isArray(address)) {
      return address[0]?.value?.[0]?.address || '';
    }
    return address.value?.[0]?.address || '';
  }

  private extractName(address: AddressObject | AddressObject[] | undefined): string | undefined {
    if (!address) return undefined;
    if (Array.isArray(address)) {
      return address[0]?.value?.[0]?.name || undefined;
    }
    return address.value?.[0]?.name || undefined;
  }

  private calculateEmailSize(parsed: ParsedMail): number {
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
   * Valida credenciais do usuário
   */
  private async validateUserCredentials(username: string, password: string): Promise<User | null> {
    try {
      // Usar EmailUser do DigiUrban
      const user = await prisma.emailUser.findFirst({
        where: {
          email: username,
          isActive: true
        }
      });

      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error validating credentials', { error, username });
      return null;
    }
  }

  /**
   * Registra conexão
   */
  private async logConnection(
    remoteAddress: string,
    serverType: string,
    status: string
  ): Promise<void> {
    try {
      // Log usando EmailLog do DigiUrban
      await prisma.emailLog.create({
        data: {
          level: 'INFO',
          type: 'SMTP_CONNECTION',
          message: `${serverType} connection from ${remoteAddress}: ${status}`,
          metadata: {
            remoteAddress,
            serverType,
            status
          }
        }
      });
    } catch (error) {
      logger.error('Failed to log connection', { error });
    }
  }

  /**
   * Registra tentativa de autenticação
   */
  private async logAuthAttempt(
    username: string,
    remoteAddress: string,
    success: boolean,
    userId: string | null
  ): Promise<void> {
    try {
      // Log usando EmailAuthAttempt do DigiUrban
      await prisma.emailAuthAttempt.create({
        data: {
          userId,
          email: username,
          ipAddress: remoteAddress,
          success,
          reason: success ? null : 'Invalid credentials'
        }
      });
    } catch (error) {
      logger.error('Failed to log auth attempt', { error });
    }
  }

  /**
   * Inicia o servidor
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting UltraZend SMTP Server...');

      // Inicializar servidores
      this.initializeServers();

      // Iniciar servidor MX
      await new Promise<void>((resolve, reject) => {
        this.mxServer.listen(this.config.mxPort, (err?: Error) => {
          if (err) reject(err);
          else {
            logger.info(`MX Server listening on port ${this.config.mxPort}`);
            resolve();
          }
        });
      });

      // Iniciar servidor Submission
      await new Promise<void>((resolve, reject) => {
        this.submissionServer.listen(this.config.submissionPort, (err?: Error) => {
          if (err) reject(err);
          else {
            logger.info(`Submission Server listening on port ${this.config.submissionPort}`);
            resolve();
          }
        });
      });

      this.isRunning = true;

      logger.info('🚀 UltraZend SMTP Server started successfully!', {
        mxPort: this.config.mxPort,
        submissionPort: this.config.submissionPort,
        hostname: this.config.hostname
      });

    } catch (error) {
      logger.error('Failed to start SMTP server', { error });
      throw error;
    }
  }

  /**
   * Para o servidor
   */
  async stop(): Promise<void> {
    try {
      if (this.mxServer) {
        await new Promise<void>((resolve) => {
          this.mxServer.close(() => {
            logger.info('MX Server stopped');
            resolve();
          });
        });
      }

      if (this.submissionServer) {
        await new Promise<void>((resolve) => {
          this.submissionServer.close(() => {
            logger.info('Submission Server stopped');
            resolve();
          });
        });
      }

      await this.deliveryService.close();
      await prisma.$disconnect();

      this.isRunning = false;
      logger.info('UltraZend SMTP Server stopped');

    } catch (error) {
      logger.error('Error stopping SMTP server', { error });
      throw error;
    }
  }

  /**
   * Obtém status do servidor
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtém gerenciador DKIM (para uso externo)
   */
  getDKIMManager(): DKIMManager {
    return this.dkimManager;
  }
}
