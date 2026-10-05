/**
 * Modelos padrão de e-mail (tabela email_templates), todos no visual único do
 * DigiUrban (services/mail/layout.ts). As variáveis `{{nome}}` são trocadas na
 * hora do envio; `{{senderName}}` é preenchida sozinha com o nome da prefeitura.
 */

import { mailInfoBox, mailNotice, mailParagraph, renderMailLayout } from '../../services/mail/layout';

export interface DefaultEmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: string;
  isActive: boolean;
}

/** Marca dos modelos gerados por aqui (serve para saber o que pode ser atualizado) */
export const MAIL_LAYOUT_MARK = '<meta name="color-scheme" content="light">';

export function buildDefaultTemplates(): DefaultEmailTemplate[] {
  const sender = '{{senderName}}';
  return [
    {
      name: 'citizen-welcome',
      subject: 'Boas-vindas ao Portal do Cidadão — {{senderName}}',
      htmlContent: renderMailLayout({
        title: 'Seu cadastro está pronto!',
        preheader: 'Agora você resolve com a prefeitura pelo celular ou computador.',
        senderName: sender,
        bodyHtml:
          mailParagraph('Olá, <strong>{{citizenName}}</strong>!') +
          mailParagraph('Seu cadastro no <strong>Portal do Cidadão</strong> foi criado. A partir de agora você pode:') +
          mailInfoBox([
            ['Pedir serviços', 'sem sair de casa'],
            ['Acompanhar', 'cada pedido pelo número do protocolo'],
            ['Receber', 'documentos e avisos da prefeitura'],
            ['Conversar', 'com o assistente virtual a qualquer hora'],
          ]) +
          mailParagraph('Precisa de ajuda? Escreva para <a href="mailto:{{supportEmail}}" style="color:#0f5bd8">{{supportEmail}}</a>.'),
        button: { label: 'Entrar no portal', url: '{{siteUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nSeu cadastro no Portal do Cidadão foi criado.\n\nEntre em: {{siteUrl}}\n\nPrecisa de ajuda? {{supportEmail}}\n\n{{senderName}}',
      variables: ['citizenName', 'tenantName', 'siteName', 'siteUrl', 'supportEmail', 'senderName'],
      category: 'transactional',
      isActive: true,
    },
    {
      name: 'user-confirmation',
      subject: 'Confirme o seu cadastro — {{senderName}}',
      htmlContent: renderMailLayout({
        title: 'Confirme o seu cadastro',
        preheader: 'Falta só um clique para ativar a sua conta.',
        senderName: sender,
        bodyHtml:
          mailParagraph('Olá, <strong>{{userName}}</strong>!') +
          mailParagraph('Para ativar a sua conta, confirme o seu e-mail clicando no botão abaixo.'),
        button: { label: 'Confirmar cadastro', url: '{{confirmationUrl}}' },
        footerNote: 'Se você não fez este cadastro, ignore este e-mail.',
      }),
      textContent: 'Olá, {{userName}}!\n\nConfirme o seu cadastro em: {{confirmationUrl}}\n\n{{senderName}}',
      variables: ['userName', 'confirmationUrl', 'tenantName', 'senderName'],
      category: 'transactional',
      isActive: true,
    },
    {
      name: 'password-recovery',
      subject: 'Criar nova senha — {{senderName}}',
      htmlContent: renderMailLayout({
        title: 'Criar uma nova senha',
        preheader: 'Link para criar uma nova senha.',
        senderName: sender,
        bodyHtml:
          mailParagraph('Olá, <strong>{{userName}}</strong>!') +
          mailParagraph('Recebemos um pedido para trocar a sua senha. Clique no botão abaixo para criar uma nova.') +
          mailNotice('<strong>Atenção:</strong> o link vale por pouco tempo e só pode ser usado uma vez.'),
        button: { label: 'Criar nova senha', url: '{{recoveryUrl}}' },
        footerNote: 'Se você não pediu a troca de senha, ignore este e-mail: a sua senha continua a mesma.',
      }),
      textContent: 'Olá, {{userName}}!\n\nCrie uma nova senha em: {{recoveryUrl}}\n\nSe não foi você, ignore este e-mail.\n\n{{senderName}}',
      variables: ['userName', 'recoveryUrl', 'tenantName', 'senderName'],
      category: 'transactional',
      isActive: true,
    },
    {
      name: 'protocol-confirmation',
      subject: 'Recebemos o seu pedido — protocolo {{protocolNumber}}',
      htmlContent: renderMailLayout({
        title: 'Recebemos o seu pedido',
        preheader: 'Protocolo {{protocolNumber}} — guarde este número.',
        senderName: sender,
        bodyHtml:
          mailParagraph('Olá, <strong>{{citizenName}}</strong>!') +
          mailParagraph('Seu pedido foi registrado. Guarde o número do protocolo para acompanhar.') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Serviço', '{{serviceName}}'],
            ['Data', '{{createdAt}}'],
            ['Situação', '{{status}}'],
          ]),
        button: { label: 'Acompanhar o pedido', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nRecebemos o seu pedido.\n\nProtocolo: {{protocolNumber}}\nServiço: {{serviceName}}\nData: {{createdAt}}\nSituação: {{status}}\n\nAcompanhe em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'protocolNumber', 'serviceName', 'createdAt', 'status', 'trackingUrl', 'tenantName', 'senderName'],
      category: 'transactional',
      isActive: true,
    },
    {
      name: 'protocol-update',
      subject: 'Novidade no protocolo {{protocolNumber}}',
      htmlContent: renderMailLayout({
        title: 'Seu pedido teve novidade',
        preheader: 'Protocolo {{protocolNumber}}: {{status}}',
        senderName: sender,
        bodyHtml:
          mailParagraph('Olá, <strong>{{citizenName}}</strong>!') +
          mailParagraph('O seu pedido foi atualizado:') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Serviço', '{{serviceName}}'],
            ['Situação', '{{status}}'],
            ['Observação', '{{comment}}'],
          ]),
        button: { label: 'Ver o pedido', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nO seu pedido foi atualizado.\n\nProtocolo: {{protocolNumber}}\nServiço: {{serviceName}}\nSituação: {{status}}\nObservação: {{comment}}\n\nVeja em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'protocolNumber', 'serviceName', 'status', 'comment', 'trackingUrl', 'tenantName', 'senderName'],
      category: 'transactional',
      isActive: true,
    },
    {
      name: 'document-delivery',
      subject: '{{subject}}',
      htmlContent: renderMailLayout({
        title: 'Seu documento está disponível',
        preheader: '{{subject}}',
        senderName: sender,
        bodyHtml:
          mailParagraph('Olá, <strong>{{recipientName}}</strong>!') +
          mailParagraph('{{message}}') +
          mailParagraph('O documento vai <strong>anexado</strong> a este e-mail.'),
      }),
      textContent: 'Olá, {{recipientName}}!\n\n{{message}}\n\nO documento vai anexado a este e-mail.\n\n{{senderName}}',
      variables: ['recipientName', 'subject', 'message', 'senderName'],
      category: 'transactional',
      isActive: true,
    },
  ];
}
