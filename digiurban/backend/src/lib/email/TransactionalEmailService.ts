import { prisma } from '../prisma';
import { sendMail } from '../../services/mail/mailer';
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

      const template = await prisma.emailTemplate.findFirst({ where: { name: templateName } });
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      const subject = this.processTemplate(template.subject, variables);
      const html = this.processTemplate(template.htmlContent, variables);
      const text = template.textContent ? this.processTemplate(template.textContent, variables) : this.convertHtmlToText(html);

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
  private processTemplate(template: string, variables: EmailTemplateVariables): string {
    let processed = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    return processed;
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
    const defaultTemplates: Omit<EmailTemplate, 'id'>[] = [
      {
        name: 'user-confirmation',
        subject: 'Confirme seu cadastro - {{tenantName}}',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmação de Cadastro</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #007bff;">Bem-vindo ao {{tenantName}}!</h1>
              </div>

              <p>Olá <strong>{{userName}}</strong>,</p>

              <p>Obrigado por se cadastrar em nossa plataforma. Para confirmar seu cadastro e ativar sua conta, clique no botão abaixo:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{confirmationUrl}}"
                   style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Confirmar Cadastro
                </a>
              </div>

              <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
              <p style="word-break: break-all; color: #666;">{{confirmationUrl}}</p>

              <p>Se você não se cadastrou em nossa plataforma, pode ignorar este email com segurança.</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                Este é um email automático, não responda.<br>
                {{tenantName}} - Gestão Municipal Digital
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
Bem-vindo ao {{tenantName}}!

Olá {{userName}},

Obrigado por se cadastrar em nossa plataforma. Para confirmar seu cadastro e ativar sua conta, acesse o link abaixo:

{{confirmationUrl}}

Se você não se cadastrou em nossa plataforma, pode ignorar este email com segurança.

---
Este é um email automático, não responda.
{{tenantName}} - Gestão Municipal Digital
        `,
        variables: ['userName', 'confirmationUrl', 'tenantName'],
        category: 'transactional'
        },
      {
        name: 'password-recovery',
        subject: 'Recuperação de senha - {{tenantName}}',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #28a745;">Recuperação de Senha</h1>
              </div>

              <p>Olá <strong>{{userName}}</strong>,</p>

              <p>Você solicitou a recuperação de sua senha. Clique no botão abaixo para criar uma nova senha:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}"
                   style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Recuperar Senha
                </a>
              </div>

              <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
              <p style="word-break: break-all; color: #666;">{{recoveryUrl}}</p>

              <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Importante:</strong> Este link expira em 24 horas por segurança.
                </p>
              </div>

              <p>Se você não solicitou esta recuperação, pode ignorar este email com segurança.</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                Este é um email automático, não responda.<br>
                {{tenantName}} - Gestão Municipal Digital
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
Recuperação de Senha - {{tenantName}}

Olá {{userName}},

Você solicitou a recuperação de sua senha. Acesse o link abaixo para criar uma nova senha:

{{recoveryUrl}}

IMPORTANTE: Este link expira em 24 horas por segurança.

Se você não solicitou esta recuperação, pode ignorar este email com segurança.

---
Este é um email automático, não responda.
{{tenantName}} - Gestão Municipal Digital
        `,
        variables: ['userName', 'recoveryUrl', 'tenantName'],
        category: 'transactional'
        },
      {
        name: 'protocol-confirmation',
        subject: 'Protocolo {{protocolNumber}} confirmado - {{tenantName}}',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Protocolo Confirmado</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #007bff;">Protocolo Confirmado</h1>
              </div>

              <p>Olá <strong>{{citizenName}}</strong>,</p>

              <p>Sua solicitação foi registrada com sucesso em nossa plataforma!</p>

              <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0; border-radius: 0 5px 5px 0;">
                <h3 style="margin: 0 0 15px 0; color: #007bff;">Detalhes do Protocolo</h3>
                <p style="margin: 5px 0;"><strong>Número:</strong> {{protocolNumber}}</p>
                <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
                <p style="margin: 5px 0;"><strong>Data:</strong> {{createdAt}}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745;">{{status}}</span></p>
              </div>

              <p>Você pode acompanhar o andamento do seu protocolo a qualquer momento clicando no botão abaixo:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{trackingUrl}}"
                   style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Acompanhar Protocolo
                </a>
              </div>

              <p>Guarde este número de protocolo para futuras consultas: <strong>{{protocolNumber}}</strong></p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                Este é um email automático, não responda.<br>
                {{tenantName}} - Gestão Municipal Digital
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
Protocolo Confirmado - {{tenantName}}

Olá {{citizenName}},

Sua solicitação foi registrada com sucesso!

DETALHES DO PROTOCOLO:
- Número: {{protocolNumber}}
- Serviço: {{serviceName}}
- Data: {{createdAt}}
- Status: {{status}}

Acompanhe o andamento em: {{trackingUrl}}

Guarde este número de protocolo: {{protocolNumber}}

---
Este é um email automático, não responda.
{{tenantName}} - Gestão Municipal Digital
        `,
        variables: [
          'citizenName',
          'protocolNumber',
          'serviceName',
          'createdAt',
          'status',
          'trackingUrl',
          'tenantName',
        ],
        category: 'transactional'
        },
      {
        name: 'protocol-update',
        subject: 'Atualização no protocolo {{protocolNumber}} - {{tenantName}}',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Atualização de Protocolo</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ffc107;">Atualização de Protocolo</h1>
              </div>

              <p>Olá <strong>{{citizenName}}</strong>,</p>

              <p>Há uma atualização no seu protocolo <strong>{{protocolNumber}}</strong>:</p>

              <div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 0 5px 5px 0;">
                <h3 style="margin: 0 0 15px 0; color: #ffc107;">Status Atualizado</h3>
                <p style="margin: 5px 0;"><strong>Serviço:</strong> {{serviceName}}</p>
                <p style="margin: 5px 0;"><strong>Novo Status:</strong> <span style="color: #007bff;">{{status}}</span></p>
                {{#if comment}}
                <p style="margin: 15px 0 5px 0;"><strong>Observações:</strong></p>
                <p style="background: #e9ecef; padding: 10px; border-radius: 5px; margin: 5px 0;">{{comment}}</p>
                {{/if}}
              </div>

              <p>Para ver todos os detalhes e acompanhar o andamento:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{trackingUrl}}"
                   style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Ver Detalhes
                </a>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                Este é um email automático, não responda.<br>
                {{tenantName}} - Gestão Municipal Digital
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
Atualização de Protocolo - {{tenantName}}

Olá {{citizenName}},

Há uma atualização no seu protocolo {{protocolNumber}}:

NOVO STATUS:
- Serviço: {{serviceName}}
- Status: {{status}}
{{#if comment}}
- Observações: {{comment}}
{{/if}}

Acompanhe em: {{trackingUrl}}

---
Este é um email automático, não responda.
{{tenantName}} - Gestão Municipal Digital
        `,
        variables: [
          'citizenName',
          'protocolNumber',
          'serviceName',
          'status',
          'comment',
          'trackingUrl',
          'tenantName',
        ],
        category: 'transactional'
        },
      {
        name: 'citizen-welcome',
        subject: 'Bem-vindo ao {{tenantName}}!',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #007bff;">Bem-vindo ao {{tenantName}}!</h1>
              </div>

              <p>Olá <strong>{{citizenName}}</strong>,</p>

              <p>É um prazer recebê-lo em nossa plataforma! Seu cadastro foi realizado com sucesso.</p>

              <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 0 5px 5px 0;">
                <h3 style="margin: 0 0 15px 0; color: #28a745;">O que você pode fazer agora?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Acessar serviços públicos digitais</li>
                  <li>Abrir protocolos e acompanhar solicitações</li>
                  <li>Consultar informações municipais</li>
                  <li>Receber notificações importantes</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{siteUrl}}"
                   style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Acessar Portal
                </a>
              </div>

              <p>Se precisar de ajuda, nossa equipe está à disposição em <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 12px; color: #666; text-align: center;">
                Este é um email automático, não responda.<br>
                {{tenantName}} - Gestão Municipal Digital
              </p>
            </div>
          </body>
          </html>
        `,
        textContent: `
Bem-vindo ao {{tenantName}}!

Olá {{citizenName}},

É um prazer recebê-lo em nossa plataforma! Seu cadastro foi realizado com sucesso.

O QUE VOCÊ PODE FAZER AGORA?
- Acessar serviços públicos digitais
- Abrir protocolos e acompanhar solicitações
- Consultar informações municipais
- Receber notificações importantes

Acesse: {{siteUrl}}

Se precisar de ajuda: {{supportEmail}}

---
Este é um email automático, não responda.
{{tenantName}} - Gestão Municipal Digital
        `,
        variables: ['citizenName', 'tenantName', 'siteName', 'siteUrl', 'supportEmail'],
        category: 'transactional'
        },
    ];

    // Single tenant: Criar templates no banco
    for (const template of defaultTemplates) {
      await prisma.emailTemplate.upsert({
        where: {
          name: template.name
        },
        update: {},
        create: {
          ...template,
          variables: template.variables || []
        }
      });
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
