import { prisma } from '../prisma';
import { sendMail } from '../../services/mail/mailer';
import { mailSenderName } from '../../services/mail/links';
import { escapeMailHtml } from '../../services/mail/layout';
import { buildDefaultTemplates } from './default-templates';
import {
  IEmailService,
  EmailTemplate as CentralEmailTemplate,
  EmailData as EmailOpts
        } from '../../types';
import * as crypto from 'crypto';

// FASE 2 - Interfaces Investigadas para Transactional Email Service

/**
 * Interface para servidor de email com relacionamentos
 * Baseada no modelo Prisma EmailServer com includes
 * DIA 3: Removed tenantId from interface
 */
interface EmailServerWithRelations {
  id: string;
  // DIA 3: tenantId removed
  hostname: string;
  submissionPort: number;
  mxPort: number;
  isActive: boolean;
  domains: EmailDomainWithVerification[];
  users: EmailUserWithAdmin[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para domínio de email verificado
 * Baseada no modelo Prisma EmailDomain
 */
interface EmailDomainWithVerification {
  id: string;
  emailServerId: string;
  domainName: string;
  isVerified: boolean;
  dkimEnabled: boolean;
  dkimPrivateKey?: string | null;
  dkimSelector?: string;
  verificationToken?: string | null;
  dkimPublicKey?: string | null;
  spfEnabled?: boolean;
  spfRecord?: string | null;
  dmarcEnabled?: boolean;
  dmarcPolicy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para usuário admin de email
 * Baseada no modelo Prisma EmailUser
 */
interface EmailUserWithAdmin {
  id: string;
  emailServerId: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para variáveis de template de email
export interface EmailTemplateVariables {
  // Variáveis comuns para todos os templates
  recipientName?: string;
  senderName?: string;
  tenantName?: string;
  siteName?: string;
  siteUrl?: string;
  supportEmail?: string;
  logoUrl?: string;

  // Variáveis específicas de protocolos
  protocolNumber?: string;
  protocolStatus?: string;
  protocolDescription?: string;
  createdAt?: string;
  updatedAt?: string;

  // Variáveis específicas de usuário
  userName?: string;
  userEmail?: string;
  resetPasswordUrl?: string;
  confirmationUrl?: string;

  // Variáveis específicas de notificações
  notificationTitle?: string;
  notificationMessage?: string;
  actionUrl?: string;
  actionText?: string;

  // Permite variáveis adicionais específicas
  [key: string]: string | number | boolean | Date | undefined;
}

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  emailServerId: string; // DIA 3: Changed from tenantId to emailServerId
  templateName: string;
  to: string;
  variables: EmailTemplateVariables;
  from?: {
    name?: string;
    email?: string;
  };
  priority?: number;
  scheduledFor?: Date;
  tags?: string[];
  campaignId?: string;
  attachments?: EmailAttachment[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  category?: string;
}

export class TransactionalEmailService {
  constructor() {}

  /**
   * Envia um email transacional usando template
   */
  async sendEmail(
    options: SendEmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Desde 2026-10-05 o envio é pela fila do e-mail transacional (VeloMail).
    // emailServerId fica na assinatura só por compatibilidade com quem chama.
    try {
      const { templateName, to, variables, from, priority = 3, scheduledFor, tags = ['transactional'], attachments = [] } = options;

      let template = await prisma.emailTemplate.findFirst({ where: { name: templateName } });
      if (!template) {
        // banco sem os modelos padrão (instalação nova): cria e tenta de novo
        await this.createDefaultTemplates('');
        template = await prisma.emailTemplate.findFirst({ where: { name: templateName } });
      }
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const vars = { senderName: await mailSenderName(), ...variables } as EmailTemplateVariables;
      const subject = this.processTemplate(template.subject, vars);
      const html = this.processTemplate(template.htmlContent, vars, true);
      const text = template.textContent ? this.processTemplate(template.textContent, vars) : this.convertHtmlToText(html);

      const result = await sendMail({
        to,
        subject,
        html,
        text,
        fromName: from?.name || null,
        priority: priority <= 2 ? 'critical' : priority >= 5 ? 'low' : 'normal',
        tags,
        kind: `template:${templateName}`,
        sendAt: scheduledFor || null,
        attachments: attachments.map((item) => ({
          filename: item.filename,
          path: item.path,
          content: item.content,
          contentType: item.contentType,
        })),
      });

      return result.queued
        ? { success: true, messageId: result.emailId }
        : { success: false, error: result.reason };
    } catch (error) {
      console.error('Error sending transactional email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Envia email de confirmação de usuário
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async sendUserConfirmation(
    emailServerId: string, // DIA 3: Changed from tenantId
    userEmail: string,
    userName: string,
    confirmationUrl: string,
    tenantName: string = 'DigiUrban' // DIA 3: Added parameter instead of DB lookup
  ) {
    // DIA 3: Removed tenant lookup - prisma.tenant no longer exists

    return this.sendEmail({
      emailServerId, // DIA 3: Changed from tenantId
      templateName: 'user-confirmation',
      to: userEmail,
      variables: {
        userName,
        confirmationUrl,
        tenantName, // DIA 3: Use parameter instead of DB lookup
      }
        });
  }

  /**
   * Envia email de recuperação de senha
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async sendPasswordRecovery(
    emailServerId: string, // DIA 3: Changed from tenantId
    userEmail: string,
    userName: string,
    recoveryUrl: string,
    tenantName: string = 'DigiUrban' // DIA 3: Added parameter instead of DB lookup
  ) {
    // DIA 3: Removed tenant lookup - prisma.tenant no longer exists

    return this.sendEmail({
      emailServerId, // DIA 3: Changed from tenantId
      templateName: 'password-recovery',
      to: userEmail,
      variables: {
        userName,
        recoveryUrl,
        tenantName, // DIA 3: Use parameter instead of DB lookup
      }
        });
  }

  /**
   * Envia email de boas-vindas para novo cidadão
   */
  async sendWelcomeEmail(
    emailServerId: string,
    citizenEmail: string,
    citizenName: string,
    tenantName: string = 'DigiUrban',
    siteUrl: string = 'https://digiurban.com.br',
    supportEmail: string = 'suporte@digiurban.com.br'
  ) {
    return this.sendEmail({
      emailServerId,
      templateName: 'citizen-welcome',
      to: citizenEmail,
      variables: {
        citizenName,
        tenantName,
        siteName: 'Portal do Cidadão',
        siteUrl,
        supportEmail,
      }
    });
  }

  /**
   * Envia email com documento anexado
   */
  async sendEmailWithDocument(
    emailServerId: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    message: string,
    documentPath: string,
    documentFileName: string
  ) {
    return this.sendEmail({
      emailServerId,
      templateName: 'document-delivery',
      to: recipientEmail,
      variables: {
        recipientName,
        subject,
        message,
        documentName: documentFileName
      },
      attachments: [{
        filename: documentFileName,
        path: documentPath
      }]
    });
  }

  /**
   * Envia confirmação de protocolo
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async sendProtocolConfirmation(
    emailServerId: string, // DIA 3: Changed from tenantId
    citizenEmail: string,
    citizenName: string,
    protocol: {
      number: string;
      serviceName: string;
      createdAt: Date;
      status: string;
    },
    trackingUrl: string,
    tenantName: string = 'DigiUrban' // DIA 3: Added parameter instead of DB lookup
  ) {
    // DIA 3: Removed tenant lookup - prisma.tenant no longer exists

    return this.sendEmail({
      emailServerId, // DIA 3: Changed from tenantId
      templateName: 'protocol-confirmation',
      to: citizenEmail,
      variables: {
        citizenName,
        protocolNumber: protocol.number,
        serviceName: protocol.serviceName,
        createdAt: protocol.createdAt.toLocaleDateString('pt-BR'),
        status: protocol.status,
        trackingUrl,
        tenantName, // DIA 3: Use parameter instead of DB lookup
      }
        });
  }

  /**
   * Envia notificação de atualização de protocolo
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async sendProtocolUpdate(
    emailServerId: string, // DIA 3: Changed from tenantId
    citizenEmail: string,
    citizenName: string,
    protocol: {
      number: string;
      serviceName: string;
      status: string;
      comment?: string;
    },
    trackingUrl: string,
    tenantName: string = 'DigiUrban' // DIA 3: Added parameter instead of DB lookup
  ) {
    // DIA 3: Removed tenant lookup - prisma.tenant no longer exists

    return this.sendEmail({
      emailServerId, // DIA 3: Changed from tenantId
      templateName: 'protocol-update',
      to: citizenEmail,
      variables: {
        citizenName,
        protocolNumber: protocol.number,
        serviceName: protocol.serviceName,
        status: protocol.status,
        comment: protocol.comment || '',
        trackingUrl,
        tenantName, // DIA 3: Use parameter instead of DB lookup
      }
        });
  }

  /**
   * Processa template substituindo variáveis
   */
  private processTemplate(template: string, variables: EmailTemplateVariables, html = false): string {
    let processed = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      // no HTML o valor entra escapado: nome ou mensagem digitada não vira código
      const text = html ? escapeMailHtml(value) : String(value ?? '');
      processed = processed.replace(regex, () => text);
    }

    // variável que não veio some, em vez de aparecer "{{assim}}" no e-mail
    return processed.replace(/{{\s*[\w.]+\s*}}/g, '');
  }

  /**
   * Converte HTML simples para texto
   */
  private convertHtmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Cria templates padrão para um emailServer
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async createDefaultTemplates(emailServerId: string): Promise<void> {
    const defaultTemplates = buildDefaultTemplates();

    for (const template of defaultTemplates) {
      const existing = await prisma.emailTemplate.findFirst({ where: { name: template.name } });
      if (!existing) {
        await prisma.emailTemplate.create({ data: { ...template } });
        continue;
      }
      // Modelo que ninguém editou no painel ganha o visual novo; o que foi
      // personalizado fica como está.
      const neverEdited = Math.abs(existing.updatedAt.getTime() - existing.createdAt.getTime()) < 5000;
      if (neverEdited && existing.htmlContent !== template.htmlContent) {
        await prisma.emailTemplate.update({ where: { id: existing.id }, data: { ...template } });
      }
    }
  }

  /**
   * Lista templates disponíveis para um emailServer
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async getTemplates(emailServerId: string): Promise<EmailTemplate[]> {
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return templates.map(template => ({
      ...template,
      textContent: template.textContent || undefined,
      variables: (template.variables as string[]) || undefined,
      category: template.category || undefined
        }));
  }

  /**
   * Atualiza um template
   * DIA 3: Changed parameter from tenantId to emailServerId
   */
  async updateTemplate(
    emailServerId: string, // DIA 3: Changed from tenantId
    templateName: string,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate> {
    const template = await prisma.emailTemplate.update({
      where: {
        name: templateName
      },
      data: updates
        });

    return {
      ...template,
      textContent: template.textContent || undefined,
      variables: (template.variables as string[]) || undefined,
      category: template.category || undefined
        };
  }

  /**
   * Envia email raw (sem template) — troca de senha e outros diretos.
   * Vai pela fila do e-mail transacional com prioridade máxima.
   */
  async sendRawEmail({
    to,
    subject,
    html,
    text,
  }: {
    from?: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    emailServerId?: string;
    domainId?: string;
  }): Promise<void> {
    const result = await sendMail({ to, subject, html, text, priority: 'critical', kind: 'raw' });
    if (!result.queued) {
      throw new Error(result.reason || 'E-mail não enfileirado');
    }
  }
}

// Export singleton instance
export const transactionalEmailService = new TransactionalEmailService();
