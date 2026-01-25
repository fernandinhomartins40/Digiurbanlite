/**
 * @ultrazend/smtp-server - MX Delivery Service (Prisma Version)
 * Serviço de entrega direta via MX records - CORE do servidor independente
 */

import { createTransport, Transporter } from 'nodemailer';
import * as dns from 'dns';
import { logger } from '../utils/logger';
import { EmailData, MXRecord, DeliveryResult } from '../types';
import { prisma } from '../lib/prisma';
import { EmailStatus } from '@prisma/client';

export class MXDeliveryService {
  private connectionPool: Map<string, Transporter> = new Map();
  private hostname: string;

  constructor(hostname: string = 'mail.localhost') {
    this.hostname = hostname;
    logger.info('🚀 MX Delivery Service initialized - Direct delivery mode');
  }

  /**
   * Entrega email diretamente via MX records
   * CORE FUNCTIONALITY - Não depende de provedores externos
   */
  async deliverEmail(emailData: EmailData): Promise<DeliveryResult> {
    logger.info('📧 Starting direct MX delivery', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      mode: 'Direct MX'
    });

    try {
      const domain = this.extractDomain(emailData.to);

      // Buscar MX records do domínio de destino
      const mxRecords = await this.getMXRecords(domain);
      if (mxRecords.length === 0) {
        const error = `No MX records found for domain ${domain}`;
        await this.recordDeliveryFailure(emailData, error);
        return { success: false, error };
      }

      logger.info('🌐 Found MX records', {
        domain,
        mxCount: mxRecords.length,
        mxServers: mxRecords.map(mx => `${mx.exchange} (${mx.priority})`)
      });

      // Tentar entrega em ordem de prioridade
      for (const mx of mxRecords) {
        try {
          logger.info('🔄 Attempting delivery via MX', {
            mxServer: mx.exchange,
            priority: mx.priority,
            to: emailData.to
          });

          const success = await this.attemptDeliveryViaMX(emailData, mx.exchange);
          if (success) {
            await this.recordDeliverySuccess(emailData, mx.exchange);
            logger.info('✅ Email delivered successfully', {
              to: emailData.to,
              mxServer: mx.exchange
            });
            return {
              success: true,
              messageId: emailData.messageId,
              mxServer: mx.exchange
            };
          }
        } catch (error) {
          logger.warn('⚠️ MX delivery failed, trying next server', {
            to: emailData.to,
            mxServer: mx.exchange,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          continue;
        }
      }

      const error = `All MX servers failed for domain ${domain}`;
      await this.recordDeliveryFailure(emailData, error);
      return { success: false, error };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ MX delivery failed', {
        to: emailData.to,
        error: errorMessage
      });
      await this.recordDeliveryFailure(emailData, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca MX records via DNS
   */
  private async getMXRecords(domain: string): Promise<MXRecord[]> {
    return new Promise((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err) {
          reject(err);
          return;
        }

        // Ordenar por prioridade (menor número = maior prioridade)
        const sortedRecords = addresses
          .map(addr => ({
            exchange: addr.exchange,
            priority: addr.priority
          }))
          .sort((a, b) => a.priority - b.priority);

        resolve(sortedRecords);
      });
    });
  }

  /**
   * Tenta entrega em um servidor MX específico
   */
  private async attemptDeliveryViaMX(emailData: EmailData, mxServer: string): Promise<boolean> {
    const transporter = await this.getTransporter(mxServer, emailData);

    try {
      // Preparar anexos para o nodemailer
      const attachments = emailData.attachments?.map(att => {
        const attachment: any = {
          filename: att.filename,
          contentType: att.contentType
        };

        // Usar content (Buffer) se disponível, senão path
        if (att.content) {
          attachment.content = att.content;
        } else if (att.path) {
          attachment.path = att.path;
        }

        // Adicionar encoding se especificado
        if (att.encoding) {
          attachment.encoding = att.encoding;
        }

        // Adicionar CID para imagens inline
        if (att.cid) {
          attachment.cid = att.cid;
        }

        return attachment;
      }) || [];

      // ✅ DEBUG: Log detalhado dos anexos antes de enviar
      if (attachments.length > 0) {
        logger.info('📎 [MX DELIVERY] Anexos preparados para MX:', {
          mxServer,
          count: attachments.length,
          details: attachments.map(att => ({
            filename: att.filename,
            contentType: att.contentType,
            hasContent: !!att.content,
            hasPath: !!att.path,
            contentLength: att.content?.length,
            encoding: att.encoding
          }))
        });
      }

      const mailOptions: any = {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        messageId: emailData.messageId,
        headers: {
          ...emailData.headers,
          'X-Mailer': 'UltraZend SMTP Server'
        }
      };

      // Adicionar anexos se houver
      if (attachments.length > 0) {
        mailOptions.attachments = attachments;
        logger.info('📎 [MX DELIVERY] mailOptions.attachments definido:', { count: attachments.length });
      }

      const result = await transporter.sendMail(mailOptions);

      logger.info('📨 Email sent via MX with DKIM', {
        to: emailData.to,
        mxServer,
        messageId: result.messageId,
        from: emailData.from
      });

      return true;
    } catch (error) {
      logger.warn('MX delivery attempt failed', {
        to: emailData.to,
        mxServer,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Obtém ou cria transporter para servidor MX com DKIM
   */
  private async getTransporter(mxServer: string, emailData: EmailData): Promise<Transporter> {
    // Não usar pool para permitir DKIM dinâmico por domínio
    const domain = this.extractDomain(emailData.from);

    // Buscar configuração DKIM do domínio
    const emailDomain = await prisma.emailDomain.findFirst({
      where: { domainName: domain }
    });

    const transportOptions: any = {
      host: mxServer,
      port: 25, // Porta padrão MX
      secure: false,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      name: this.hostname // Identificação do nosso servidor
    };

    // Configurar DKIM se disponível (igual ao email de teste)
    if (emailDomain?.dkimEnabled && emailDomain.dkimPrivateKey) {
      transportOptions.dkim = {
        domainName: domain,
        keySelector: emailDomain.dkimSelector || 'default',
        privateKey: emailDomain.dkimPrivateKey
      };

      logger.info('DKIM enabled for delivery', {
        domain,
        selector: emailDomain.dkimSelector,
        mxServer
      });
    } else {
      logger.warn('DKIM not configured for domain', { domain });
    }

    return createTransport(transportOptions);
  }

  /**
   * Registra entrega bem-sucedida
   */
  private async recordDeliverySuccess(emailData: EmailData, mxServer: string): Promise<void> {
    try {
      // Buscar domínio do email (se existir)
      const domain = this.extractDomain(emailData.from);
      const domainRecord = await prisma.emailDomain.findFirst({
        where: { domainName: domain }
      });

      await prisma.email.upsert({
        where: { messageId: emailData.messageId || `msg-${Date.now()}` },
        update: {
          status: EmailStatus.DELIVERED,
          deliveredAt: new Date(),
          metadata: {
            mxServer,
            direction: 'OUTBOUND'
          }
        },
        create: {
          messageId: emailData.messageId || `msg-${Date.now()}`,
          domainId: domainRecord?.id,
          fromEmail: emailData.from,
          toEmail: emailData.to,
          subject: emailData.subject,
          htmlContent: emailData.html,
          textContent: emailData.text,
          status: EmailStatus.DELIVERED,
          sentAt: new Date(),
          deliveredAt: new Date(),
          metadata: {
            mxServer,
            direction: 'OUTBOUND',
            serverType: 'MX'
          }
        }
      });
    } catch (error) {
      logger.error('Failed to record delivery success', { error });
    }
  }

  /**
   * Registra falha na entrega
   */
  private async recordDeliveryFailure(emailData: EmailData, errorMessage: string): Promise<void> {
    try {
      // Buscar domínio do email (se existir)
      const domain = this.extractDomain(emailData.from);
      const domainRecord = await prisma.emailDomain.findFirst({
        where: { domainName: domain }
      });

      await prisma.email.upsert({
        where: { messageId: emailData.messageId || `msg-${Date.now()}` },
        update: {
          status: EmailStatus.FAILED,
          errorMessage,
          retryCount: { increment: 1 }
        },
        create: {
          messageId: emailData.messageId || `msg-${Date.now()}`,
          domainId: domainRecord?.id,
          fromEmail: emailData.from,
          toEmail: emailData.to,
          subject: emailData.subject,
          htmlContent: emailData.html,
          textContent: emailData.text,
          status: EmailStatus.FAILED,
          sentAt: new Date(),
          errorMessage,
          metadata: {
            direction: 'OUTBOUND',
            serverType: 'MX'
          }
        }
      });
    } catch (error) {
      logger.error('Failed to record delivery failure', { error });
    }
  }

  /**
   * Extrai domínio do email
   */
  private extractDomain(email: string): string {
    const match = email.match(/@([^>]+)/);
    return match ? match[1].trim() : '';
  }

  /**
   * Testa conectividade MX
   */
  async testMXConnectivity(domain: string): Promise<boolean> {
    try {
      const mxRecords = await this.getMXRecords(domain);
      if (mxRecords.length === 0) {
        return false;
      }

      // Criar transporter simples para teste (sem DKIM)
      const transporter = createTransport({
        host: mxRecords[0].exchange,
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false },
        name: this.hostname
      });

      await transporter.verify();
      return true;
    } catch (error) {
      logger.error('MX connectivity test failed', { domain, error });
      return false;
    }
  }

  /**
   * Fecha todas as conexões
   */
  async close(): Promise<void> {
    for (const [server, transporter] of this.connectionPool) {
      try {
        transporter.close();
        logger.debug('Closed connection to MX server', { server });
      } catch (error) {
        logger.error('Error closing MX connection', { server, error });
      }
    }
    this.connectionPool.clear();
    logger.info('MX Delivery Service closed');
  }
}
