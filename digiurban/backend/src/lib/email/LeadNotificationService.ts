import { prisma } from '../prisma';
import { TransactionalEmailService } from './TransactionalEmailService';
import { INotificationService, IEmailService } from '../../types';
import {
  LeadDataForService as LeadData,
  TrialDataForService as TrialData,
  safeStringWithDefault,
  DEFAULT_VALUES
        } from '../../types/lead';
import { getSystemEmail, getPrimaryEmailDomain } from '../../utils/email-domain.utils';
import { sendMail } from '../../services/mail/mailer';
import { escapeMailHtml, mailInfoBox, mailParagraph, renderMailLayout } from '../../services/mail/layout';
import { getPlatformMail } from '../../services/mail/mail-settings.service';

export class LeadNotificationService {
  private emailService: TransactionalEmailService;

  constructor() {
    this.emailService = new TransactionalEmailService();
  }

  /**
   * Avisa a equipe DigiUrban de um pedido de demonstração da landing.
   * Vai para o "E-mail da equipe" do painel (Super-admin › E-mail).
   */
  async notifyDemoRequest(lead: LeadData): Promise<void> {
    await this.notifyTeam(lead, 'demo');
  }

  /** Avisa a equipe DigiUrban de uma mensagem do formulário de contato */
  async notifyContactForm(lead: LeadData): Promise<void> {
    await this.notifyTeam(lead, 'contact');
  }

  private async notifyTeam(lead: LeadData, kind: 'demo' | 'contact'): Promise<void> {
    const { settings } = await getPlatformMail();
    const to = settings.teamEmail || process.env.SALES_TEAM_EMAIL || null;
    if (!to) {
      console.warn('[LEADS] "E-mail da equipe" não configurado no painel (Super-admin › E-mail) — aviso não enviado');
      return;
    }
    const title = kind === 'demo' ? 'Pedido de demonstração' : 'Mensagem de contato';
    const html = renderMailLayout({
      title,
      preheader: `${lead.name} — ${lead.company || lead.email}`,
      senderName: 'Site do DigiUrban',
      bodyHtml:
        mailInfoBox([
          ['Nome', lead.name],
          ['E-mail', lead.email],
          ['Telefone', safeStringWithDefault(lead.phone, DEFAULT_VALUES.PHONE)],
          ['Prefeitura / empresa', safeStringWithDefault(lead.company, DEFAULT_VALUES.COMPANY)],
          ['Cargo', safeStringWithDefault(lead.position, DEFAULT_VALUES.POSITION)],
          ['Recebido em', lead.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })],
        ]) +
        (lead.message ? mailParagraph(`<strong>Mensagem</strong><br>${escapeMailHtml(lead.message).replace(/\n/g, '<br>')}`) : ''),
      footerNote: `Responda a este e-mail para falar direto com ${lead.name}.`,
    });

    const result = await sendMail({
      to,
      tenantId: null,
      subject: `${title}: ${lead.company || lead.name}`,
      html,
      replyTo: lead.email,
      fromName: 'DigiUrban — Site',
      priority: 'normal',
      tags: ['lead', kind],
      kind: `lead:${kind}`,
    });
    if (!result.queued) console.warn('[LEADS] aviso não enfileirado:', result.reason);
  }

  /**
   * Envia email de boas-vindas para leads que iniciam trial
   */
  async sendTrialWelcomeEmail(trialData: TrialData): Promise<void> {
    try {
      // DIA 3: Assuming trialData has emailServerId or using default
      const emailServerId = (trialData as any).emailServerId || process.env.DEFAULT_EMAIL_SERVER_ID || 'system';
      const supportEmail = process.env.SUPPORT_TEAM_EMAIL || await getSystemEmail('suporte');
      const onboardingEmail = await getSystemEmail('onboarding');

      await this.emailService.sendEmail({
        emailServerId, // DIA 3: Changed from tenantId
        templateName: 'trial-welcome',
        to: trialData.email,
        variables: {
          userName: trialData.name,
          companyName: trialData.company,
          tenantName: trialData.tenantName,
          loginUrl: trialData.loginUrl,
          email: trialData.email,
          temporaryPassword: trialData.temporaryPassword,
          trialExpiryDate: this.getTrialExpiryDate().toLocaleDateString('pt-BR'),
          supportEmail: supportEmail,
          trialDays: 30
        },
        from: {
          name: 'Equipe DigiUrban',
          email: onboardingEmail
        },
        priority: 1,
        tags: ['trial', 'welcome', 'onboarding']
        });

      await prisma.email.create({
        data: {
          messageId: `trial-welcome-${trialData.id}-${Date.now()}`, // DIA 3: Removed tenantId from messageId
          fromEmail: onboardingEmail,
          toEmail: trialData.email,
          subject: `Bem-vindo ao DigiUrban - ${trialData.tenantName}`,
          htmlContent: `<p>Bem-vindo ao DigiUrban, ${trialData.tenantName}!</p>`,
          headers: {
            leadId: trialData.id,
            // DIA 3: Removed tenantId from headers (kept as data for now)
            type: 'TRIAL_WELCOME'
        }
        }
        });
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas trial:', error);
      throw new Error('Falha ao enviar email de boas-vindas');
    }
  }

  /**
   * Adiciona lead à automação de marketing (integração com Mailchimp/SendGrid)
   */
  async addToMarketingAutomation(lead: LeadData): Promise<void> {
    try {
      // Primeiro, salva na lista interna
      await this.addToInternalMarketingList(lead);

      // Se configurado, integra com plataforma externa
      if (process.env.MAILCHIMP_API_KEY) {
        await this.addToMailchimp(lead);
      } else if (process.env.SENDGRID_API_KEY) {
        await this.addToSendGrid(lead);
      } else {
        console.log(
          'Nenhuma plataforma de email marketing configurada. Lead salvo apenas internamente.'
        );
      }

      // Log da adição à lista
      const systemEmail = await getSystemEmail('system');
      await prisma.email.create({
        data: {
          messageId: `marketing-add-${lead.id}-${Date.now()}`,
          fromEmail: systemEmail,
          toEmail: lead.email,
          subject: 'Adicionado à lista de marketing',
          htmlContent: '<p>Você foi adicionado à nossa lista de marketing</p>',
          headers: {
            leadId: lead.id,
            source: lead.source,
            listType: 'marketing_automation',
            type: 'MARKETING_LIST_ADD'
        }
        }
        });
    } catch (error) {
      console.error('Erro ao adicionar lead à automação de marketing:', error);
      throw new Error('Falha ao adicionar à automação de marketing');
    }
  }

  /**
   * Adiciona lead à lista interna de marketing
   * TODO: Implementar quando o modelo EmailSubscription for criado no schema.prisma
   */
  private async addToInternalMarketingList(lead: LeadData): Promise<void> {
    try {
      // TEMPORARIAMENTE DESABILITADO: modelo EmailSubscription não existe no schema
      console.log('addToInternalMarketingList: Funcionalidade desabilitada temporariamente');
      return;

      /* TODO: Descomentar quando EmailSubscription for adicionado ao schema.prisma
      // Verifica se já existe
      const existingSubscription = await prisma.emailSubscription.findUnique({
        where: {
          email: lead.email }
        });

      if (!existingSubscription) {
        await prisma.emailSubscription.create({
          data: {
            email: lead.email,
            name: lead.name,
            source: lead.source,
            status: 'ACTIVE',
            subscribedAt: new Date(),
            preferences: {
              newsletter: true,
              productUpdates: true,
              marketing: true
        },
            metadata: {
              leadId: lead.id,
              company: lead.company,
              position: lead.position
        }
        }
        });
      }
      */
    } catch (error) {
      console.error('Erro ao adicionar à lista interna:', error);
      throw error;
    }
  }

  /**
   * Integração com Mailchimp
   */
  private async addToMailchimp(lead: LeadData): Promise<void> {
    try {
      const mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
      const listId = process.env.MAILCHIMP_LIST_ID;

      if (!mailchimpApiKey || !listId) {
        console.warn('Mailchimp não configurado completamente');
        return;
      }

      const datacenter = mailchimpApiKey.split('-')[1];
      const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}/members`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `apikey ${mailchimpApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_address: lead.email,
          status: 'subscribed',
          merge_fields: {
            FNAME: lead.name.split(' ')[0],
            LNAME: lead.name.split(' ').slice(1).join(' '),
            COMPANY: lead.company,
            POSITION: safeStringWithDefault(lead.position, '')
        },
          tags: [lead.source.toLowerCase(), 'digiurban-lead']
        })
        });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro Mailchimp:', error);
        throw new Error(`Mailchimp API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na integração Mailchimp:', error);
      throw error;
    }
  }

  /**
   * Integração com SendGrid
   */
  private async addToSendGrid(lead: LeadData): Promise<void> {
    try {
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      const listId = process.env.SENDGRID_LIST_ID;

      if (!sendgridApiKey || !listId) {
        console.warn('SendGrid não configurado completamente');
        return;
      }

      const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          list_ids: [listId],
          contacts: [
            {
              email: lead.email,
              first_name: lead.name.split(' ')[0],
              last_name: lead.name.split(' ').slice(1).join(' '),
              custom_fields: {
                company: lead.company,
                position: safeStringWithDefault(lead.position, ''),
                source: lead.source
        }
        },
          ]
        })
        });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erro SendGrid:', error);
        throw new Error(`SendGrid API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na integração SendGrid:', error);
      throw error;
    }
  }

  /**
   * Configura trial com expiração automática
   * DIA 3: DISABLED - tenant model removed
   */
  async setupTrialExpiration(tenantId: string, trialDays: number = 30): Promise<void> {
    console.warn('setupTrialExpiration is disabled - tenant model removed in DIA 3');
    return;
    /* DIA 3: COMMENTED OUT - prisma.tenant no longer exists
    try {
      const expiryDate = this.getTrialExpiryDate(trialDays);

      // Atualiza o tenant com data de expiração
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          trialEndsAt: expiryDate,
          metadata: {
            trialDays,
            trialStartedAt: new Date().toISOString(),
            automatedExpiry: true
        }
        }
        });

      // Agenda notificações de expiração
      await this.scheduleTrialExpiryNotifications(tenantId, expiryDate);
    } catch (error) {
      console.error('Erro ao configurar expiração do trial:', error);
      throw new Error('Falha ao configurar trial');
    }
    */
  }

  /**
   * Agenda notificações de expiração do trial
   * DIA 3: DISABLED - tenant model removed
   */
  private async scheduleTrialExpiryNotifications(
    tenantId: string,
    expiryDate: Date
  ): Promise<void> {
    console.warn('scheduleTrialExpiryNotifications is disabled - tenant model removed in DIA 3');
    return;
    /* DIA 3: COMMENTED OUT - prisma.tenant no longer exists
    try {
      // DIA 3: DISABLED
      // const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { users: { where: { role: 'ADMIN' } } }
        });

      if (!tenant || tenant.users.length === 0) return;

      const adminEmail = tenant.users[0].email;
      const now = new Date();

      // Buscar support email uma vez para todas as notificações
      const supportEmail = process.env.SUPPORT_TEAM_EMAIL || await getSystemEmail('suporte');

      // Notificação 7 dias antes do vencimento
      const sevenDaysBefore = new Date(expiryDate);
      sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

      if (sevenDaysBefore > now) {
        await this.emailService.sendEmail({
                    templateName: 'trial-expiry-warning',
          to: adminEmail,
          variables: {
            tenantName: tenant.name,
            daysRemaining: 7,
            expiryDate: expiryDate.toLocaleDateString('pt-BR'),
            upgradeUrl: `${process.env.FRONTEND_URL}/upgrade`,
            supportEmail: supportEmail
        },
          scheduledFor: sevenDaysBefore,
          priority: 2,
          tags: ['trial', 'expiry', 'warning']
        });
      }

      // Notificação 1 dia antes do vencimento
      const oneDayBefore = new Date(expiryDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      if (oneDayBefore > now) {
        await this.emailService.sendEmail({
                    templateName: 'trial-expiry-final',
          to: adminEmail,
          variables: {
            tenantName: tenant.name,
            expiryDate: expiryDate.toLocaleDateString('pt-BR'),
            upgradeUrl: `${process.env.FRONTEND_URL}/upgrade`,
            supportEmail: supportEmail
        },
          scheduledFor: oneDayBefore,
          priority: 1,
          tags: ['trial', 'expiry', 'urgent']
        });
      }

      // Notificação no dia do vencimento
      await this.emailService.sendEmail({
                templateName: 'trial-expired',
        to: adminEmail,
        variables: {
          tenantName: tenant.name,
          upgradeUrl: `${process.env.FRONTEND_URL}/upgrade`,
          supportEmail: supportEmail
        },
        scheduledFor: expiryDate,
        priority: 1,
        tags: ['trial', 'expired']
        });
    } catch (error) {
      console.error('Erro ao agendar notificações de expiração:', error);
    }
    */
  }

  /**
   * Obter tenant de sistema para templates globais
   * DIA 3: DISABLED - tenant model removed
   */
  private async getSystemTenant(): Promise<{ id: string }> {
    // DIA 3: Return default system ID since tenant model removed
    return { id: process.env.DEFAULT_EMAIL_SERVER_ID || 'system' };

    /* DIA 3: COMMENTED OUT - prisma.tenant no longer exists
    let systemTenant = await prisma.tenant.findFirst({
      where: {
          OR: [{ name: 'System' }, { cnpj: '99.999.999/0001-99' }]
        },
      select: { id: true }
      });

    if (!systemTenant) {
      // Criar tenant system se não existir
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'System',
          cnpj: '99.999.999/0001-99', // CNPJ específico para sistema
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          limits: {
            users: -1, // Ilimitado
            protocols: -1,
            storage: -1,
            departments: -1
        }
        },
        select: { id: true }
      });
    }

    return systemTenant;
    */
  }

  /**
   * Calcula data de expiração do trial
   */
  private getTrialExpiryDate(days: number = 30): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    expiryDate.setHours(23, 59, 59, 999); // Expira no final do dia
    return expiryDate;
  }

  /**
   * Verifica e processa trials expirados (para executar via cron)
   * DIA 3: DISABLED - tenant model removed
   */
  async processExpiredTrials(): Promise<void> {
    console.warn('processExpiredTrials is disabled - tenant model removed in DIA 3');
    return;

    /* DIA 3: COMMENTED OUT - prisma.tenant no longer exists
    try {
      // DIA 3: DISABLED
      // const expiredTrials = await prisma.tenant.findMany({
        where: {
          status: 'TRIAL',
          trialEndsAt: {
            lt: new Date()
        }
        },
        include: {
          users: { where: { role: 'ADMIN' } }
        }
        });

      for (const trial of expiredTrials) {
        // Muda status para EXPIRED
        await prisma.tenant.update({
          where: { id: trial.id },
          data: {
            status: 'EXPIRED',
            updatedAt: new Date()
        }
        });

        // Desabilita usuários
        await prisma.user.updateMany({
          where: { tenantId: trial.id },
          data: { isActive: false }
        });

        console.log(`Trial expirado e processado: ${trial.name} (${trial.id})`);
      }
    } catch (error) {
      console.error('Erro ao processar trials expirados:', error);
    }
    */
  }
}

// Export singleton instance
export const leadNotificationService = new LeadNotificationService();
