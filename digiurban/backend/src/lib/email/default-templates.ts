/**
 * Modelos padrão de e-mail (tabela email_templates), todos no visual único do
 * DigiUrban (services/mail/layout.ts). As variáveis `{{nome}}` são trocadas na
 * hora do envio. Sempre preenchidas sozinhas: `{{senderName}}` (nome da
 * prefeitura) e `{{portalUrl}}` (endereço do portal do município).
 *
 * Cada função do sistema que manda e-mail tem o seu modelo aqui — a lista
 * aparece no Super-admin › Modelos de e-mail com "quando é enviado".
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

export interface EmailTemplateInfo {
  /** nome amigável na tela */
  label: string;
  /** quando o sistema manda */
  when: string;
  /** quem recebe */
  audience: 'cidadão' | 'servidor' | 'cidadão ou servidor' | 'convidado';
  /** e-mail de acesso (senha, conta): vai mesmo com o modelo desligado */
  critical?: boolean;
}

/** Marca dos modelos gerados por aqui (serve para saber o que pode ser atualizado) */
export const MAIL_LAYOUT_MARK = '<meta name="color-scheme" content="light">';

const sender = '{{senderName}}';
const hello = (variable: string) => mailParagraph(`Olá, <strong>{{${variable}}}</strong>!`);

/** Descrição de cada modelo (não fica no banco) */
export const EMAIL_TEMPLATE_INFO: Record<string, EmailTemplateInfo> = {
  'citizen-welcome': { label: 'Boas-vindas ao cidadão', when: 'O cidadão cria a conta no portal', audience: 'cidadão' },
  'citizen-account-created': {
    label: 'Conta criada pela prefeitura',
    when: 'Um servidor cadastra o cidadão no balcão sem definir senha — o e-mail traz o link para criar a senha',
    audience: 'cidadão',
    critical: true,
  },
  'password-recovery': {
    label: 'Criar nova senha',
    when: 'Alguém pede "Esqueci minha senha" no portal do cidadão ou no painel dos servidores',
    audience: 'cidadão ou servidor',
    critical: true,
  },
  'protocol-confirmation': { label: 'Pedido recebido', when: 'Um pedido (protocolo) é aberto pelo portal, pelo assistente ou no balcão', audience: 'cidadão' },
  'protocol-update': { label: 'Novidade no pedido', when: 'O pedido muda de situação (em andamento, cancelado...)', audience: 'cidadão' },
  'protocol-completed': { label: 'Pedido concluído', when: 'O pedido é concluído', audience: 'cidadão' },
  'protocol-pending': { label: 'Prefeitura precisa de algo seu', when: 'A equipe abre uma pendência para o cidadão responder ou enviar documento', audience: 'cidadão' },
  'protocol-pending-reminder': { label: 'Lembrete de pendência', when: 'Uma pendência está perto do prazo ou passou do prazo (um lembrete de cada tipo)', audience: 'cidadão' },
  'protocol-pending-expired': { label: 'Pendência sem resposta', when: 'O prazo da pendência acaba sem resposta', audience: 'cidadão' },
  'document-delivery': { label: 'Documento enviado por e-mail', when: 'O servidor envia o documento do pedido por e-mail (vai anexado)', audience: 'cidadão' },
  'document-rejected': { label: 'Documento recusado', when: 'Um documento pessoal enviado pelo cidadão é recusado', audience: 'cidadão' },
  'chat-message': {
    label: 'Resposta no chat',
    when: 'A prefeitura responde o cidadão no chat e ele não está com o chat aberto (no máximo um a cada 30 min por conversa)',
    audience: 'cidadão',
  },
  'family-invite': { label: 'Convite para a família', when: 'O cidadão convida alguém para a composição familiar', audience: 'convidado' },
  'server-protocol-assigned': { label: 'Pedido passado para você', when: 'Um pedido é atribuído, delegado ou encaminhado a um servidor', audience: 'servidor' },
  'server-pending-answered': { label: 'Cidadão respondeu a pendência', when: 'O cidadão responde uma pendência de um pedido do servidor', audience: 'servidor' },
  'server-overdue-digest': { label: 'Resumo de pedidos atrasados', when: 'Uma vez por dia (9h), para coordenadores e gerentes com pedidos vencidos', audience: 'servidor' },
  'ai-credits-low': { label: 'Créditos de IA acabando', when: 'O saldo de créditos de IA do município fica abaixo do limite', audience: 'servidor' },
  notification: { label: 'Aviso geral', when: 'Outros avisos importantes (consulta, exame, entrada/saída de aluno, manutenção)', audience: 'cidadão ou servidor' },
  'user-confirmation': { label: 'Confirmar e-mail (reserva)', when: 'Não é usado hoje — fica pronto para confirmação de cadastro', audience: 'cidadão ou servidor' },
};

/** Tipo de aviso → modelo de e-mail. O que não está aqui usa o modelo "notification". */
export const NOTIFICATION_TEMPLATE_BY_TYPE: Record<string, string> = {
  PROTOCOL_CREATED: 'protocol-confirmation',
  PROTOCOL_STATUS: 'protocol-update',
  PROTOCOL_COMPLETED: 'protocol-completed',
  PROTOCOL_PENDING_CREATED: 'protocol-pending',
  PROTOCOL_PENDING_REMINDER: 'protocol-pending-reminder',
  PROTOCOL_PENDING_OVERDUE: 'protocol-pending-reminder',
  PROTOCOL_PENDING_EXPIRED: 'protocol-pending-expired',
  DOCUMENT_REJECTED: 'document-rejected',
  PROTOCOL_ASSIGNED: 'server-protocol-assigned',
  PROTOCOL_PENDING_RESOLVED: 'server-pending-answered',
  PROTOCOL_OVERDUE_DIGEST: 'server-overdue-digest',
  AI_CREDITS_LOW: 'ai-credits-low',
  CHAT_MESSAGE: 'chat-message',
};

export function buildDefaultTemplates(): DefaultEmailTemplate[] {
  const list: DefaultEmailTemplate[] = [
    {
      name: 'citizen-welcome',
      subject: 'Boas-vindas ao Portal do Cidadão — {{senderName}}',
      htmlContent: renderMailLayout({
        title: 'Seu cadastro está pronto!',
        preheader: 'Agora você resolve com a prefeitura pelo celular ou computador.',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
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
      variables: ['citizenName', 'siteUrl', 'supportEmail', 'senderName'],
      category: 'cidadao',
      isActive: true,
    },
    {
      name: 'citizen-account-created',
      subject: 'Sua conta no Portal do Cidadão — {{senderName}}',
      htmlContent: renderMailLayout({
        title: 'A prefeitura criou a sua conta',
        preheader: 'Crie a sua senha para entrar no Portal do Cidadão.',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('A prefeitura fez o seu cadastro no <strong>Portal do Cidadão</strong>. Para entrar, crie a sua senha no botão abaixo.') +
          mailParagraph('Depois é só entrar com o seu <strong>CPF</strong> e a senha que você criou.') +
          mailNotice('<strong>Atenção:</strong> o link vale por {{expirationText}} e só pode ser usado uma vez. Se vencer, use "Esqueci minha senha" na tela de entrada.'),
        button: { label: 'Criar minha senha', url: '{{setPasswordUrl}}' },
        footerNote: 'Se você não pediu este cadastro, procure a prefeitura.',
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nA prefeitura fez o seu cadastro no Portal do Cidadão. Crie a sua senha em:\n{{setPasswordUrl}}\n\nO link vale por {{expirationText}}.\n\n{{senderName}}',
      variables: ['citizenName', 'setPasswordUrl', 'expirationText', 'senderName'],
      category: 'cidadao',
      isActive: true,
    },
    {
      name: 'password-recovery',
      subject: 'Criar nova senha — {{portalName}}',
      htmlContent: renderMailLayout({
        title: 'Criar uma nova senha',
        preheader: 'Link para criar uma nova senha.',
        senderName: sender,
        bodyHtml:
          hello('userName') +
          mailParagraph('Recebemos um pedido para trocar a sua senha no <strong>{{portalName}}</strong>. Clique no botão abaixo para criar uma nova.') +
          mailNotice('<strong>Atenção:</strong> o link vale por {{expirationText}} e só pode ser usado uma vez.'),
        button: { label: 'Criar nova senha', url: '{{recoveryUrl}}' },
        footerNote: 'Se você não pediu a troca de senha, ignore este e-mail: a sua senha continua a mesma.',
      }),
      textContent:
        'Olá, {{userName}}!\n\nCrie uma nova senha no {{portalName}} em:\n{{recoveryUrl}}\n\nO link vale por {{expirationText}}. Se não foi você, ignore este e-mail.\n\n{{senderName}}',
      variables: ['userName', 'recoveryUrl', 'portalName', 'expirationText', 'senderName'],
      category: 'acesso',
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
          hello('citizenName') +
          mailParagraph('Seu pedido foi registrado. Guarde o número do protocolo para acompanhar.') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Serviço', '{{serviceName}}'],
            ['Data', '{{createdAt}}'],
          ]) +
          mailParagraph('Avisaremos por aqui quando houver novidade.'),
        button: { label: 'Acompanhar o pedido', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nRecebemos o seu pedido.\n\nProtocolo: {{protocolNumber}}\nServiço: {{serviceName}}\nData: {{createdAt}}\n\nAcompanhe em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'protocolNumber', 'serviceName', 'createdAt', 'trackingUrl', 'senderName'],
      category: 'pedidos',
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
          hello('citizenName') +
          mailParagraph('O seu pedido foi atualizado:') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Serviço', '{{serviceName}}'],
            ['Situação', '{{status}}'],
          ]),
        button: { label: 'Ver o pedido', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nO seu pedido foi atualizado.\n\nProtocolo: {{protocolNumber}}\nServiço: {{serviceName}}\nSituação: {{status}}\n\nVeja em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'protocolNumber', 'serviceName', 'status', 'trackingUrl', 'senderName'],
      category: 'pedidos',
      isActive: true,
    },
    {
      name: 'protocol-completed',
      subject: 'Seu pedido foi concluído — protocolo {{protocolNumber}}',
      htmlContent: renderMailLayout({
        title: 'Pedido concluído!',
        preheader: 'O protocolo {{protocolNumber}} foi concluído.',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('O seu pedido foi <strong>concluído</strong>.') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Serviço', '{{serviceName}}'],
          ]) +
          mailParagraph('Se houver documento, ele fica disponível no pedido. Conte para a gente como foi o atendimento — leva menos de um minuto.'),
        button: { label: 'Ver o pedido', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nO seu pedido {{protocolNumber}} ({{serviceName}}) foi concluído.\n\nVeja em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'protocolNumber', 'serviceName', 'trackingUrl', 'senderName'],
      category: 'pedidos',
      isActive: true,
    },
    {
      name: 'protocol-pending',
      subject: 'A prefeitura precisa de algo seu — protocolo {{protocolNumber}}',
      htmlContent: renderMailLayout({
        title: 'Precisamos de algo seu',
        preheader: '{{pendingTitle}}',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('Para continuar o seu pedido, a equipe da prefeitura precisa que você responda:') +
          mailInfoBox([
            ['O que falta', '{{pendingTitle}}'],
            ['Protocolo', '{{protocolNumber}}'],
            ['Responder até', '{{dueDate}}'],
          ]) +
          mailParagraph('Enquanto você não responde, o pedido fica parado.'),
        button: { label: 'Responder agora', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nPara continuar o seu pedido {{protocolNumber}}, a prefeitura precisa de: {{pendingTitle}}\nResponder até: {{dueDate}}\n\nResponda em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'pendingTitle', 'protocolNumber', 'dueDate', 'trackingUrl', 'senderName'],
      category: 'pedidos',
      isActive: true,
    },
    {
      name: 'protocol-pending-reminder',
      subject: 'Lembrete: o seu pedido {{protocolNumber}} espera uma resposta',
      htmlContent: renderMailLayout({
        title: 'Seu pedido está esperando você',
        preheader: '{{pendingTitle}}',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('{{message}}') +
          mailInfoBox([
            ['O que falta', '{{pendingTitle}}'],
            ['Protocolo', '{{protocolNumber}}'],
            ['Prazo', '{{dueDate}}'],
          ]),
        button: { label: 'Responder agora', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\n{{message}}\n\nO que falta: {{pendingTitle}}\nProtocolo: {{protocolNumber}}\nPrazo: {{dueDate}}\n\nResponda em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'message', 'pendingTitle', 'protocolNumber', 'dueDate', 'trackingUrl', 'senderName'],
      category: 'pedidos',
      isActive: true,
    },
    {
      name: 'protocol-pending-expired',
      subject: 'Prazo encerrado no protocolo {{protocolNumber}}',
      htmlContent: renderMailLayout({
        title: 'O prazo para responder acabou',
        preheader: '{{pendingTitle}}',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('O prazo para responder esta pendência acabou sem resposta:') +
          mailInfoBox([
            ['Pendência', '{{pendingTitle}}'],
            ['Protocolo', '{{protocolNumber}}'],
          ]) +
          mailParagraph('O pedido voltou para a equipe da prefeitura decidir. Se ainda precisar, entre no pedido ou fale com a prefeitura.'),
        button: { label: 'Ver o pedido', url: '{{trackingUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nO prazo da pendência "{{pendingTitle}}" do protocolo {{protocolNumber}} acabou sem resposta. O pedido voltou para a equipe decidir.\n\nVeja em: {{trackingUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'pendingTitle', 'protocolNumber', 'trackingUrl', 'senderName'],
      category: 'pedidos',
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
          hello('recipientName') +
          mailParagraph('{{message}}') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Documentos', '{{documentList}}'],
          ]) +
          mailParagraph('Os arquivos vão <strong>anexados</strong> a este e-mail e também ficam no pedido, no portal.'),
        button: { label: 'Abrir o portal', url: '{{portalUrl}}' },
      }),
      textContent:
        'Olá, {{recipientName}}!\n\n{{message}}\n\nProtocolo: {{protocolNumber}}\nDocumentos: {{documentList}}\n\nOs arquivos vão anexados a este e-mail.\n\n{{senderName}}',
      variables: ['recipientName', 'subject', 'message', 'protocolNumber', 'documentList', 'senderName'],
      category: 'documentos',
      isActive: true,
    },
    {
      name: 'document-rejected',
      subject: 'Envie de novo: {{documentName}}',
      htmlContent: renderMailLayout({
        title: 'Seu documento foi recusado',
        preheader: '{{documentName}}: {{reason}}',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('A equipe da prefeitura não conseguiu aceitar um documento que você enviou:') +
          mailInfoBox([
            ['Documento', '{{documentName}}'],
            ['Motivo', '{{reason}}'],
          ]) +
          mailParagraph('É só tirar uma foto nova (ou escolher o arquivo certo) e enviar de novo em "Meus documentos".'),
        button: { label: 'Enviar de novo', url: '{{actionUrl}}' },
      }),
      textContent:
        'Olá, {{citizenName}}!\n\nSeu documento "{{documentName}}" foi recusado.\nMotivo: {{reason}}\n\nEnvie de novo em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'documentName', 'reason', 'actionUrl', 'senderName'],
      category: 'documentos',
      isActive: true,
    },
    {
      name: 'chat-message',
      subject: 'Você recebeu uma resposta da prefeitura',
      htmlContent: renderMailLayout({
        title: 'Nova mensagem no chat',
        preheader: '{{message}}',
        senderName: sender,
        bodyHtml:
          hello('citizenName') +
          mailParagraph('A prefeitura respondeu você no chat do portal:') +
          mailInfoBox([['Mensagem', '{{message}}']]) +
          mailParagraph('Para continuar a conversa, abra o assistente no portal.'),
        button: { label: 'Abrir o chat', url: '{{actionUrl}}' },
        footerNote: 'Mensagem automática. Você pode desligar os avisos por e-mail nas preferências da sua conta.',
      }),
      textContent: 'Olá, {{citizenName}}!\n\nA prefeitura respondeu você no chat:\n{{message}}\n\nAbra o chat em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['citizenName', 'message', 'actionUrl', 'senderName'],
      category: 'cidadao',
      isActive: true,
    },
    {
      name: 'family-invite',
      subject: '{{headName}} convidou você para a família no Portal do Cidadão',
      htmlContent: renderMailLayout({
        title: 'Você recebeu um convite',
        preheader: '{{headName}} quer adicionar você à família no Portal do Cidadão.',
        senderName: sender,
        bodyHtml:
          hello('inviteeName') +
          mailParagraph('<strong>{{headName}}</strong> convidou você para fazer parte da família no <strong>Portal do Cidadão</strong>.') +
          mailInfoBox([
            ['Parentesco', '{{relationship}}'],
            ['Convite válido até', '{{expiresAt}}'],
          ]) +
          mailParagraph('Para aceitar, abra o convite e entre com a sua conta. Se ainda não tem conta, é só criar — leva poucos minutos.'),
        button: { label: 'Ver o convite', url: '{{inviteUrl}}' },
        footerNote: 'Se você não conhece quem mandou, ignore este e-mail.',
      }),
      textContent:
        'Olá, {{inviteeName}}!\n\n{{headName}} convidou você para a família no Portal do Cidadão ({{relationship}}).\n\nVeja o convite em: {{inviteUrl}}\nVálido até: {{expiresAt}}\n\n{{senderName}}',
      variables: ['inviteeName', 'headName', 'relationship', 'expiresAt', 'inviteUrl', 'senderName'],
      category: 'cidadao',
      isActive: true,
    },
    {
      name: 'server-protocol-assigned',
      subject: 'Pedido {{protocolNumber}} passado para você',
      htmlContent: renderMailLayout({
        title: 'Um pedido foi passado para você',
        preheader: 'Protocolo {{protocolNumber}} — {{serviceName}}',
        senderName: sender,
        hideMascot: true,
        bodyHtml:
          hello('userName') +
          mailParagraph('{{message}}') +
          mailInfoBox([
            ['Protocolo', '{{protocolNumber}}'],
            ['Serviço', '{{serviceName}}'],
            ['Cidadão', '{{citizenName}}'],
          ]),
        button: { label: 'Abrir o pedido', url: '{{actionUrl}}' },
        footerNote: 'Aviso do painel dos servidores. Você pode desligar os avisos por e-mail nas suas preferências.',
      }),
      textContent:
        'Olá, {{userName}}!\n\n{{message}}\n\nProtocolo: {{protocolNumber}}\nServiço: {{serviceName}}\nCidadão: {{citizenName}}\n\nAbra em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['userName', 'message', 'protocolNumber', 'serviceName', 'citizenName', 'actionUrl', 'senderName'],
      category: 'servidores',
      isActive: true,
    },
    {
      name: 'server-pending-answered',
      subject: 'Resposta do cidadão no protocolo {{protocolNumber}}',
      htmlContent: renderMailLayout({
        title: 'O cidadão respondeu',
        preheader: '{{citizenName}} respondeu: {{pendingTitle}}',
        senderName: sender,
        hideMascot: true,
        bodyHtml:
          hello('userName') +
          mailParagraph('<strong>{{citizenName}}</strong> respondeu a pendência do pedido. Confira e siga o atendimento.') +
          mailInfoBox([
            ['Pendência', '{{pendingTitle}}'],
            ['Protocolo', '{{protocolNumber}}'],
          ]),
        button: { label: 'Conferir a resposta', url: '{{actionUrl}}' },
        footerNote: 'Aviso do painel dos servidores. Você pode desligar os avisos por e-mail nas suas preferências.',
      }),
      textContent:
        'Olá, {{userName}}!\n\n{{citizenName}} respondeu a pendência "{{pendingTitle}}" do protocolo {{protocolNumber}}.\n\nConfira em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['userName', 'citizenName', 'pendingTitle', 'protocolNumber', 'actionUrl', 'senderName'],
      category: 'servidores',
      isActive: true,
    },
    {
      name: 'server-overdue-digest',
      subject: '{{count}} pedido(s) atrasado(s) na sua equipe',
      htmlContent: renderMailLayout({
        title: 'Pedidos passaram do prazo',
        preheader: '{{count}} pedido(s) atrasado(s) na sua equipe.',
        senderName: sender,
        hideMascot: true,
        bodyHtml:
          hello('userName') +
          mailParagraph('Hoje a sua equipe tem <strong>{{count}} pedido(s)</strong> que passaram do prazo:') +
          mailParagraph('{{protocolList}}') +
          mailParagraph('Este resumo chega uma vez por dia enquanto houver pedido atrasado.'),
        button: { label: 'Ver os pedidos', url: '{{actionUrl}}' },
        footerNote: 'Aviso do painel dos servidores. Você pode desligar os avisos por e-mail nas suas preferências.',
      }),
      textContent:
        'Olá, {{userName}}!\n\nA sua equipe tem {{count}} pedido(s) atrasado(s):\n{{protocolList}}\n\nVeja em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['userName', 'count', 'protocolList', 'actionUrl', 'senderName'],
      category: 'servidores',
      isActive: true,
    },
    {
      name: 'ai-credits-low',
      subject: '{{title}} — {{senderName}}',
      htmlContent: renderMailLayout({
        title: '{{title}}',
        preheader: '{{message}}',
        senderName: sender,
        hideMascot: true,
        bodyHtml: hello('userName') + mailParagraph('{{message}}'),
        button: { label: 'Comprar créditos', url: '{{actionUrl}}' },
        footerNote: 'Aviso enviado aos administradores do município.',
      }),
      textContent: 'Olá, {{userName}}!\n\n{{message}}\n\nCompre créditos em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['userName', 'title', 'message', 'actionUrl', 'senderName'],
      category: 'servidores',
      isActive: true,
    },
    {
      name: 'notification',
      subject: '{{title}}',
      htmlContent: renderMailLayout({
        title: '{{title}}',
        preheader: '{{message}}',
        senderName: sender,
        bodyHtml: hello('recipientName') + mailParagraph('{{message}}'),
        button: { label: 'Ver detalhes', url: '{{actionUrl}}' },
        footerNote: 'Mensagem automática. Você pode desligar os avisos por e-mail nas preferências da sua conta.',
      }),
      textContent: 'Olá, {{recipientName}}!\n\n{{message}}\n\nVeja em: {{actionUrl}}\n\n{{senderName}}',
      variables: ['recipientName', 'title', 'message', 'actionUrl', 'senderName'],
      category: 'avisos',
      isActive: true,
    },
    {
      name: 'user-confirmation',
      subject: 'Confirme o seu cadastro — {{senderName}}',
      htmlContent: renderMailLayout({
        title: 'Confirme o seu cadastro',
        preheader: 'Falta só um clique para ativar a sua conta.',
        senderName: sender,
        bodyHtml: hello('userName') + mailParagraph('Para ativar a sua conta, confirme o seu e-mail clicando no botão abaixo.'),
        button: { label: 'Confirmar cadastro', url: '{{confirmationUrl}}' },
        footerNote: 'Se você não fez este cadastro, ignore este e-mail.',
      }),
      textContent: 'Olá, {{userName}}!\n\nConfirme o seu cadastro em: {{confirmationUrl}}\n\n{{senderName}}',
      variables: ['userName', 'confirmationUrl', 'senderName'],
      category: 'acesso',
      isActive: true,
    },
  ];
  return list;
}
