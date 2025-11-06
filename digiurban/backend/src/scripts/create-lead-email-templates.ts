import { prisma } from '../lib/prisma';

const templates = [
  {
    name: 'lead-demo-notification',
    category: 'LEAD',
    subject: 'Novo Lead - Solicitação de Demo: {{company}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Solicitação de Demo</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .lead-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; color: #4a5568; }
        .value { margin-left: 10px; }
        .cta { text-align: center; margin: 20px 0; }
        .btn { background-color: #48bb78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Nova Solicitação de Demo</h1>
        <p>Um novo lead interessado no DigiUrban!</p>
    </div>

    <div class="content">
        <div class="lead-info">
            <h2>Informações do Lead</h2>

            <div class="field">
                <span class="label">Nome:</span>
                <span class="value">{{leadName}}</span>
            </div>

            <div class="field">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:{{leadEmail}}">{{leadEmail}}</a></span>
            </div>

            <div class="field">
                <span class="label">Telefone:</span>
                <span class="value">{{leadPhone}}</span>
            </div>

            <div class="field">
                <span class="label">Empresa:</span>
                <span class="value">{{company}}</span>
            </div>

            <div class="field">
                <span class="label">Cargo:</span>
                <span class="value">{{position}}</span>
            </div>

            <div class="field">
                <span class="label">Data da Solicitação:</span>
                <span class="value">{{createdAt}}</span>
            </div>

            {{#if message}}
            <div class="field">
                <span class="label">Mensagem:</span>
                <div class="value" style="margin-top: 10px; padding: 10px; background-color: #edf2f7; border-radius: 4px;">
                    {{message}}
                </div>
            </div>
            {{/if}}
        </div>

        <div class="cta">
            <a href="mailto:{{leadEmail}}?subject=Demo%20DigiUrban%20-%20{{company}}" class="btn">
                📧 Responder Lead
            </a>
        </div>

        <p><strong>Próximos passos sugeridos:</strong></p>
        <ul>
            <li>Entrar em contato em até 2 horas</li>
            <li>Agendar demonstração personalizada</li>
            <li>Enviar material complementar</li>
            <li>Qualificar orçamento e cronograma</li>
        </ul>
    </div>

    <div class="footer">
        <p>Lead ID: {{leadId}} | DigiUrban CRM</p>
    </div>
</body>
</html>`,
    textContent: `
Nova Solicitação de Demo - DigiUrban

Informações do Lead:
- Nome: {{leadName}}
- Email: {{leadEmail}}
- Telefone: {{leadPhone}}
- Empresa: {{company}}
- Cargo: {{position}}
- Data: {{createdAt}}

{{#if message}}
Mensagem: {{message}}
{{/if}}

Entre em contato: {{leadEmail}}
Lead ID: {{leadId}}
`,
    variables: [
      'leadName',
      'leadEmail',
      'leadPhone',
      'company',
      'position',
      'message',
      'createdAt',
      'leadId',
    ],
    isActive: true
        },

  {
    name: 'lead-contact-notification',
    category: 'LEAD',
    subject: 'Nova Mensagem de Contato: {{leadName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Mensagem de Contato</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #38b2ac; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .contact-info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .message-box { background-color: #e2e8f0; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #38b2ac; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; color: #4a5568; }
        .value { margin-left: 10px; }
        .cta { text-align: center; margin: 20px 0; }
        .btn { background-color: #38b2ac; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💬 Nova Mensagem de Contato</h1>
        <p>Alguém entrou em contato pelo site</p>
    </div>

    <div class="content">
        <div class="contact-info">
            <h2>Informações do Contato</h2>

            <div class="field">
                <span class="label">Nome:</span>
                <span class="value">{{leadName}}</span>
            </div>

            <div class="field">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:{{leadEmail}}">{{leadEmail}}</a></span>
            </div>

            <div class="field">
                <span class="label">Telefone:</span>
                <span class="value">{{leadPhone}}</span>
            </div>

            <div class="field">
                <span class="label">Empresa:</span>
                <span class="value">{{company}}</span>
            </div>

            <div class="field">
                <span class="label">Data:</span>
                <span class="value">{{createdAt}}</span>
            </div>
        </div>

        <div class="message-box">
            <h3>Mensagem:</h3>
            <p>{{message}}</p>
        </div>

        <div class="cta">
            <a href="mailto:{{leadEmail}}?subject=Re:%20Contato%20DigiUrban" class="btn">
                📧 Responder Mensagem
            </a>
        </div>
    </div>

    <div class="footer">
        <p>Lead ID: {{leadId}} | DigiUrban Suporte</p>
    </div>
</body>
</html>`,
    textContent: `
Nova Mensagem de Contato - DigiUrban

Informações:
- Nome: {{leadName}}
- Email: {{leadEmail}}
- Telefone: {{leadPhone}}
- Empresa: {{company}}
- Data: {{createdAt}}

Mensagem:
{{message}}

Responder para: {{leadEmail}}
Lead ID: {{leadId}}
`,
    variables: ['leadName', 'leadEmail', 'leadPhone', 'company', 'message', 'createdAt', 'leadId'],
    isActive: true
        },

  {
    name: 'trial-welcome',
    category: 'TRIAL',
    subject: 'Bem-vindo ao DigiUrban! Seu trial está ativo - {{tenantName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao DigiUrban</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .welcome-box { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .access-info { background-color: #e6fffa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #38b2ac; }
        .trial-info { background-color: #fff5f5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f56565; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; color: #4a5568; }
        .value { margin-left: 10px; font-family: monospace; background-color: #edf2f7; padding: 2px 6px; border-radius: 3px; }
        .cta { text-align: center; margin: 30px 0; }
        .btn { background-color: #48bb78; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .next-steps { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Bem-vindo ao DigiUrban!</h1>
        <p>Seu trial de {{trialDays}} dias está ativo</p>
    </div>

    <div class="content">
        <div class="welcome-box">
            <h2>Olá, {{userName}}!</h2>
            <p>Parabéns! Sua conta trial do DigiUrban para <strong>{{tenantName}}</strong> foi criada com sucesso e está pronta para uso.</p>
            <p>Você tem acesso completo a todas as funcionalidades do sistema por {{trialDays}} dias, até <strong>{{trialExpiryDate}}</strong>.</p>
        </div>

        <div class="access-info">
            <h3>🔑 Informações de Acesso</h3>

            <div class="field">
                <span class="label">URL de Acesso:</span>
                <div class="value">{{loginUrl}}</div>
            </div>

            <div class="field">
                <span class="label">Email:</span>
                <div class="value">{{email}}</div>
            </div>

            <div class="field">
                <span class="label">Senha Temporária:</span>
                <div class="value">{{temporaryPassword}}</div>
            </div>

            <p><small>⚠️ <strong>Importante:</strong> Altere sua senha no primeiro acesso por motivos de segurança.</small></p>
        </div>

        <div class="trial-info">
            <h3>⏰ Informações do Trial</h3>
            <ul>
                <li>Duração: <strong>{{trialDays}} dias</strong></li>
                <li>Expira em: <strong>{{trialExpiryDate}}</strong></li>
                <li>Usuários: Até 10 usuários</li>
                <li>Protocolos: Até 1.000 protocolos</li>
                <li>Departamentos: Até 5 secretarias</li>
                <li>Armazenamento: 1GB</li>
            </ul>
        </div>

        <div class="cta">
            <a href="{{loginUrl}}" class="btn">
                🚀 Acessar o Sistema
            </a>
        </div>

        <div class="next-steps">
            <h3>📋 Próximos Passos</h3>
            <ol>
                <li><strong>Primeiro acesso:</strong> Faça login e altere sua senha</li>
                <li><strong>Configuração inicial:</strong> Configure departamentos e usuários</li>
                <li><strong>Explore o sistema:</strong> Teste todas as funcionalidades</li>
                <li><strong>Importe dados:</strong> Transfira seus dados existentes</li>
                <li><strong>Treinamento:</strong> Nossa equipe pode ajudar com onboarding</li>
            </ol>
        </div>

        <div class="welcome-box">
            <h3>🤝 Precisa de Ajuda?</h3>
            <p>Nossa equipe está pronta para ajudar você a ter sucesso com o DigiUrban:</p>
            <ul>
                <li>📧 Email: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></li>
                <li>🎓 Agendamento de treinamento gratuito</li>
                <li>📚 Documentação completa disponível no sistema</li>
                <li>💬 Suporte técnico especializado</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>DigiUrban - Gestão Municipal Inteligente</p>
        <p>Este trial expira em {{trialExpiryDate}}</p>
    </div>
</body>
</html>`,
    textContent: `
Bem-vindo ao DigiUrban!

Olá, {{userName}}!

Sua conta trial do DigiUrban para {{tenantName}} foi criada com sucesso.

INFORMAÇÕES DE ACESSO:
- URL: {{loginUrl}}
- Email: {{email}}
- Senha temporária: {{temporaryPassword}}

TRIAL:
- Duração: {{trialDays}} dias
- Expira em: {{trialExpiryDate}}

PRÓXIMOS PASSOS:
1. Faça seu primeiro acesso
2. Altere sua senha
3. Configure departamentos e usuários
4. Explore todas as funcionalidades

SUPORTE:
Email: {{supportEmail}}

Acesse agora: {{loginUrl}}
`,
    variables: [
      'userName',
      'companyName',
      'tenantName',
      'loginUrl',
      'email',
      'temporaryPassword',
      'trialExpiryDate',
      'supportEmail',
      'trialDays',
    ],
    isActive: true
        },

  {
    name: 'trial-expiry-warning',
    category: 'TRIAL',
    subject: 'Seu trial DigiUrban expira em {{daysRemaining}} dias - {{tenantName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Expirando</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ed8936; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .warning-box { background-color: #fff5f5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ed8936; }
        .cta { text-align: center; margin: 30px 0; }
        .btn { background-color: #48bb78; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Trial Expirando</h1>
        <p>{{tenantName}}</p>
    </div>

    <div class="content">
        <div class="warning-box">
            <h2>Seu trial expira em {{daysRemaining}} dias</h2>
            <p>Seu trial do DigiUrban expira em <strong>{{expiryDate}}</strong>.</p>
            <p>Para continuar usando o sistema, faça upgrade para um plano pago.</p>
        </div>

        <div class="cta">
            <a href="{{upgradeUrl}}" class="btn">
                🚀 Fazer Upgrade Agora
            </a>
        </div>

        <p>Precisa de ajuda? Entre em contato: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    </div>
</body>
</html>`,
    textContent: `
Trial Expirando - DigiUrban

{{tenantName}}

Seu trial expira em {{daysRemaining}} dias ({{expiryDate}}).

Para continuar usando o sistema, faça upgrade para um plano pago.

Upgrade: {{upgradeUrl}}
Suporte: {{supportEmail}}
`,
    variables: ['tenantName', 'daysRemaining', 'expiryDate', 'upgradeUrl', 'supportEmail'],
    isActive: true
        },

  {
    name: 'trial-expiry-final',
    category: 'TRIAL',
    subject: '🚨 URGENTE: Seu trial DigiUrban expira AMANHÃ - {{tenantName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Expira Amanhã</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e53e3e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .urgent-box { background-color: #fff5f5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e53e3e; }
        .cta { text-align: center; margin: 30px 0; }
        .btn { background-color: #e53e3e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 URGENTE: Trial Expira Amanhã!</h1>
        <p>{{tenantName}}</p>
    </div>

    <div class="content">
        <div class="urgent-box">
            <h2>Seu trial expira em {{expiryDate}}</h2>
            <p><strong>Ação necessária HOJE!</strong></p>
            <p>Seu trial do DigiUrban expira amanhã. Faça upgrade agora para não perder o acesso aos seus dados.</p>
        </div>

        <div class="cta">
            <a href="{{upgradeUrl}}" class="btn">
                🚨 UPGRADE URGENTE
            </a>
        </div>

        <p><strong>Precisa de ajuda imediata?</strong> Entre em contato: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    </div>
</body>
</html>`,
    textContent: `
🚨 URGENTE: Trial Expira Amanhã!

{{tenantName}}

Seu trial do DigiUrban expira em {{expiryDate}}.

AÇÃO NECESSÁRIA HOJE!

Faça upgrade agora para não perder acesso aos seus dados.

Upgrade: {{upgradeUrl}}
Suporte urgente: {{supportEmail}}
`,
    variables: ['tenantName', 'expiryDate', 'upgradeUrl', 'supportEmail'],
    isActive: true
        },

  {
    name: 'trial-expired',
    category: 'TRIAL',
    subject: 'Seu trial DigiUrban expirou - {{tenantName}}',
    htmlContent: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Expirado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #718096; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .expired-box { background-color: #f7fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #718096; }
        .cta { text-align: center; margin: 30px 0; }
        .btn { background-color: #48bb78; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Trial Expirado</h1>
        <p>{{tenantName}}</p>
    </div>

    <div class="content">
        <div class="expired-box">
            <h2>Seu trial do DigiUrban expirou</h2>
            <p>Obrigado por testar o DigiUrban! Esperamos que tenha tido uma ótima experiência.</p>
            <p>Para reativar sua conta e continuar usando todas as funcionalidades, faça upgrade para um plano pago.</p>
            <p>Seus dados estão seguros e serão restaurados assim que você ativar um plano.</p>
        </div>

        <div class="cta">
            <a href="{{upgradeUrl}}" class="btn">
                🚀 Reativar Conta
            </a>
        </div>

        <p>Tem dúvidas? Nossa equipe está aqui para ajudar: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
    </div>
</body>
</html>`,
    textContent: `
Trial Expirado - DigiUrban

{{tenantName}}

Seu trial do DigiUrban expirou.

Obrigado por testar nossa plataforma! Para reativar sua conta e continuar usando, faça upgrade para um plano pago.

Seus dados estão seguros e serão restaurados quando você ativar um plano.

Reativar: {{upgradeUrl}}
Suporte: {{supportEmail}}
`,
    variables: ['tenantName', 'upgradeUrl', 'supportEmail'],
    isActive: true
        },
];

async function createEmailTemplates() {
  console.log('⚠️  SCRIPT DESABILITADO: Templates de email não são criados em modo single-tenant');
  console.log('DIA 3: DISABLED - tenant model removed, script não executado');
  return;

  // CÓDIGO ORIGINAL DESABILITADO ABAIXO
  /*
  console.log('Criando templates de email para leads...');

  try {
    // Primeiro, verificar se existe ou criar tenant system
    // DIA 3: DISABLED - tenant model removed
    let systemTenant = await (prisma as any).tenant.findFirst({
      where: {
          OR: [{ name: 'System' }, { cnpj: '99.999.999/0001-99' }]
        }
        });

    if (!systemTenant) {
      console.log('Criando tenant system para templates globais...');
    // DIA 3: DISABLED - tenant model removed
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
        }
        });
    }
    for (const template of templates) {
      // Verifica se já existe
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: { name: template.name }
        });

      if (existingTemplate) {
        console.log(`Template ${template.name} já existe, atualizando...`);
        await prisma.emailTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            subject: template.subject,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            variables: template.variables,
            category: template.category,
            isActive: template.isActive,
            updatedAt: new Date()
        }
        });
      } else {
        console.log(`Criando template ${template.name}...`);
        await prisma.emailTemplate.create({
          data: {
            tenantId: systemTenant.id, // Templates de sistema
            name: template.name,
            subject: template.subject,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            variables: template.variables,
            category: template.category,
            isActive: template.isActive
        }
        });
      }
    }

    console.log('✅ Todos os templates de email foram criados/atualizados com sucesso!');

    // Criar tabela de email subscriptions se não existir
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "EmailSubscription" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "name" TEXT,
          "source" TEXT,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "unsubscribedAt" DATETIME,
          "preferences" TEXT,
          "metadata" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('✅ Tabela EmailSubscription criada/verificada!');
    } catch (error) {
      console.log('Tabela EmailSubscription já existe ou erro ao criar:', (error as Error).message);
    }

    // Adicionar campo trialEndsAt à tabela Tenant se não existir
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" DATETIME;
      `;
      console.log('✅ Campo trialEndsAt adicionado à tabela Tenant!');
    } catch (error) {
      console.log('Campo trialEndsAt já existe ou erro ao adicionar:', (error as Error).message);
    }
  } catch (error) {
    console.error('Erro ao criar templates:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createEmailTemplates()
    .then(() => {
      console.log('Script de templates concluído!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro no script:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
  */
}

export { createEmailTemplates };
