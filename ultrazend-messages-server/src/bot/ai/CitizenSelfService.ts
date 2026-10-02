/**
 * Autoatendimento do DigiBot dentro do assistente (motor único).
 *
 * Antes, Ajuda, Meu perfil, Documentos, Minha família, Notificações e
 * Avaliação eram fluxos JSON de um SEGUNDO motor. O assistente "passava" o
 * cidadão para lá e cada passagem gerava defeito (cards do menu caindo em
 * "Não entendi sua escolha", atendimento sem fim). Agora tudo roda aqui, com
 * as mesmas etapas e regras de saída do resto do assistente.
 *
 * Regra de ouro: se a mensagem não for uma opção desta etapa, a função
 * devolve null e o assistente trata normalmente (menu, outro pedido, etc.).
 */

import { FlowExecution } from '@prisma/client';
import { BotResponse, MenuOption } from '../types';
import { CitizenAiDecision, CitizenAiSessionState, CitizenAiStage } from './types';

export type SelfServiceTool = 'ajuda' | 'meu_perfil' | 'documentos' | 'minha_familia' | 'notificacoes' | 'avaliacao';

export const SELF_SERVICE_STAGES: CitizenAiStage[] = [
  'help_menu',
  'faq_menu',
  'profile_menu',
  'profile_update_choice',
  'profile_collect',
  'documents_menu',
  'documents_protocol_selection',
  'notifications_menu',
  'evaluation_selection',
  'evaluation_rating',
  'evaluation_comment',
];

export interface SelfServiceContext {
  execution: FlowExecution;
  runAction: (name: string, params: Record<string, unknown>, session: CitizenAiSessionState) => Promise<Record<string, any>>;
  meta: (session: CitizenAiSessionState, waitingForInput: boolean, extra?: Record<string, unknown>) => BotResponse['metadata'];
  persist: (session: CitizenAiSessionState) => Promise<void>;
  welcome: (session: CitizenAiSessionState) => BotResponse;
  requestHuman: (session: CitizenAiSessionState) => Promise<CitizenAiDecision>;
  /** perguntas frequentes do município (painel › DigiBot); vazio = padrão */
  faqs?: () => Array<{ id: string; question: string; answer: string }>;
}

const BACK: MenuOption = { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Retornar para as opções iniciais' };

// ---------------------------------------------------------------- textos da Ajuda

const HOW_IT_WORKS = [
  '**Como usar o DigiBot**',
  '',
  '1. **Pedir um serviço**: escreva o que precisa (ex.: "carteirinha de estudante") ou escolha a secretaria. Eu pergunto os dados e você recebe o número do protocolo.',
  '2. **Acompanhar um pedido**: informe o número do protocolo ou veja a lista dos seus pedidos.',
  '3. **Meus dados**: veja e atualize nome, e-mail, telefone e endereço.',
  '4. **Avisos**: veja as novidades sobre seus pedidos.',
  '',
  'A qualquer momento escreva **menu** para voltar ao início ou **atendente** para falar com uma pessoa.',
].join('\n');

const DEFAULT_FAQ: Array<MenuOption & { answer: string }> = [
  {
    id: 'faq_prazo',
    label: 'Quanto tempo leva um pedido?',
    description: 'Prazos de atendimento',
    answer: 'Cada serviço tem um prazo próprio, mostrado quando você faz o pedido e nos detalhes do protocolo. Pedidos com os documentos completos andam mais rápido.',
  },
  {
    id: 'faq_documentos',
    label: 'Quais documentos preciso enviar?',
    description: 'Documentação',
    answer: 'Depende do serviço: ao pedir, eu mostro a lista. Você pode enviar PDF, fotos ou documentos do Office, até 10 MB por arquivo. Tire fotos nítidas.',
  },
  {
    id: 'faq_acompanhar',
    label: 'Como acompanho meu pedido?',
    description: 'Consulta de andamento',
    answer: 'Escolha **Consultar protocolo** no menu e informe o número, ou veja a lista dos seus pedidos. Ali aparecem a situação atual, o histórico e as pendências.',
  },
  {
    id: 'faq_cancelar',
    label: 'Posso cancelar um pedido?',
    description: 'Cancelamento',
    answer: 'Enquanto o pedido não começou a ser analisado, sim. Depois disso, fale com um atendente para avaliar o seu caso.',
  },
  {
    id: 'faq_dados',
    label: 'Como atualizo meus dados?',
    description: 'Cadastro',
    answer: 'Escolha **Meu perfil** no menu e depois **Atualizar dados**. Mantenha telefone e e-mail em dia para receber os avisos.',
  },
];

// ---------------------------------------------------------------- perfil

const PROFILE_FIELDS: MenuOption[] = [
  { id: 'name', label: 'Nome', description: 'Nome completo' },
  { id: 'email', label: 'E-mail' },
  { id: 'phone', label: 'Telefone' },
  { id: 'phoneSecondary', label: 'Telefone secundário' },
  { id: 'address', label: 'Endereço', description: 'CEP, rua, número, bairro, cidade' },
];

const ADDRESS_STEPS: Array<{ id: string; label: string; optional?: boolean }> = [
  { id: 'cep', label: 'CEP (ex.: 12345-678)' },
  { id: 'logradouro', label: 'Rua ou avenida' },
  { id: 'numero', label: 'Número' },
  { id: 'complemento', label: 'Complemento (ou escreva "pular")', optional: true },
  { id: 'bairro', label: 'Bairro' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'uf', label: 'Estado (UF, ex.: PR)' },
];

function validateField(field: string, raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  const digits = value.replace(/\D/g, '');
  switch (field) {
    case 'name':
      return value.length >= 3 && value.length <= 100 ? { ok: true, value } : { ok: false, error: 'O nome precisa ter entre 3 e 100 letras.' };
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? { ok: true, value: value.toLowerCase() } : { ok: false, error: 'Esse e-mail não parece válido. Exemplo: maria@email.com' };
    case 'phone':
    case 'phoneSecondary':
      return digits.length === 10 || digits.length === 11 ? { ok: true, value: digits } : { ok: false, error: 'Informe o telefone com DDD, ex.: (43) 99999-1234.' };
    case 'cep':
      return digits.length === 8 ? { ok: true, value: `${digits.slice(0, 5)}-${digits.slice(5)}` } : { ok: false, error: 'O CEP tem 8 números, ex.: 86000-000.' };
    case 'uf':
      return /^[a-zA-Z]{2}$/.test(value) ? { ok: true, value: value.toUpperCase() } : { ok: false, error: 'Informe a sigla do estado com 2 letras, ex.: PR.' };
    case 'numero':
      return value.length >= 1 && value.length <= 10 ? { ok: true, value } : { ok: false, error: 'Informe o número (até 10 caracteres).' };
    default:
      return value.length >= 2 && value.length <= 200 ? { ok: true, value } : { ok: false, error: 'Esse dado parece curto demais. Pode repetir?' };
  }
}

// ---------------------------------------------------------------- utilidades

const normalize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Opção escolhida: id exato, rótulo, ou número da posição ("2") */
function pickOption(message: string, options: MenuOption[]): MenuOption | undefined {
  const n = normalize(message);
  if (!n) return undefined;
  const byIndex = /^\d{1,2}$/.test(n) ? options[Number(n) - 1] : undefined;
  if (byIndex) return byIndex;
  return options.find((o) => normalize(o.id) === n || normalize(o.label) === n);
}

const isSkip = (message: string) => ['pular', 'nao', 'nao quero', 'sem comentario', 'nenhum'].includes(normalize(message));

const fmtDate = (value: unknown) => {
  const d = value ? new Date(String(value)) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : '';
};

export class CitizenSelfService {
  constructor(private readonly ctx: SelfServiceContext) {}

  /** Perguntas do município; sem cadastro, as padrão */
  private faqList(): Array<MenuOption & { answer: string }> {
    const custom = this.ctx.faqs?.() || [];
    return custom.length ? custom.slice(0, 12).map((f) => ({ id: `faq_${f.id}`, label: f.question, answer: f.answer })) : DEFAULT_FAQ;
  }

  private menu(session: CitizenAiSessionState, message: string, options: MenuOption[]): BotResponse {
    return { message, messageType: 'menu', data: { options }, metadata: this.ctx.meta(session, true) };
  }

  private text(session: CitizenAiSessionState, message: string): BotResponse {
    return { message, messageType: 'text', metadata: this.ctx.meta(session, true) };
  }

  private async go(session: CitizenAiSessionState, response: BotResponse): Promise<CitizenAiDecision> {
    await this.ctx.persist(session);
    return { session, response };
  }

  private async backToMenu(session: CitizenAiSessionState, intro?: string): Promise<CitizenAiDecision> {
    const next: CitizenAiSessionState = { ...session, stage: 'triage', lastIntent: 'greeting', selfService: undefined };
    const welcome = this.ctx.welcome(next);
    return this.go(next, intro ? { ...welcome, message: `${intro}\n\n${welcome.message}` } : welcome);
  }

  // ------------------------------------------------------------ entrada

  async enter(tool: SelfServiceTool, session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const base: CitizenAiSessionState = { ...session, lastIntent: tool, selfService: {} };
    switch (tool) {
      case 'ajuda':
        return this.showHelp(base);
      case 'meu_perfil':
        return this.showProfile(base);
      case 'documentos':
        return this.showDocuments(base);
      case 'minha_familia':
        return this.showFamily(base);
      case 'notificacoes':
        return this.showNotifications(base, true);
      case 'avaliacao':
        return this.showPendingEvaluations(base);
    }
  }

  /** Mensagem do cidadão numa etapa de autoatendimento; null = não é desta etapa */
  async handle(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    switch (session.stage) {
      case 'help_menu':
        return this.onHelpMenu(session, message);
      case 'faq_menu':
        return this.onFaqMenu(session, message);
      case 'profile_menu':
        return this.onProfileMenu(session, message);
      case 'profile_update_choice':
        return this.onProfileUpdateChoice(session, message);
      case 'profile_collect':
        return this.onProfileCollect(session, message);
      case 'documents_menu':
        return this.onDocumentsMenu(session, message);
      case 'documents_protocol_selection':
        return this.onDocumentsProtocol(session, message);
      case 'notifications_menu':
        return this.onNotificationsMenu(session, message);
      case 'evaluation_selection':
        return this.onEvaluationSelection(session, message);
      case 'evaluation_rating':
        return this.onEvaluationRating(session, message);
      case 'evaluation_comment':
        return this.onEvaluationComment(session, message);
      default:
        return null;
    }
  }

  // ------------------------------------------------------------ ajuda

  private helpOptions(): MenuOption[] {
    return [
      { id: 'como_funciona', label: 'Como funciona', description: 'O que eu consigo fazer' },
      { id: 'perguntas', label: 'Perguntas frequentes', description: 'Prazos, documentos, cancelamento' },
      { id: 'falar_atendente', label: 'Falar com um atendente', description: 'Uma pessoa da prefeitura continua' },
      BACK,
    ];
  }

  private showHelp(session: CitizenAiSessionState, intro = 'Como posso te ajudar?'): Promise<CitizenAiDecision> {
    const next: CitizenAiSessionState = { ...session, stage: 'help_menu' };
    return this.go(next, this.menu(next, intro, this.helpOptions()));
  }

  private async onHelpMenu(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const option = pickOption(message, this.helpOptions());
    if (!option) return null;
    if (option.id === 'como_funciona') return this.showHelp(session, `${HOW_IT_WORKS}\n\nPosso ajudar em mais alguma coisa?`);
    if (option.id === 'perguntas') {
      const next: CitizenAiSessionState = { ...session, stage: 'faq_menu' };
      return this.go(next, this.menu(next, 'Escolha a sua dúvida:', [...this.faqList().map(({ answer, ...o }) => o), BACK]));
    }
    if (option.id === 'falar_atendente') return this.ctx.requestHuman({ ...session, lastIntent: 'atendimento_humano', selfService: undefined });
    return this.backToMenu(session);
  }

  private async onFaqMenu(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const options = [...this.faqList().map(({ answer, ...o }) => o), BACK];
    const option = pickOption(message, options);
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    const item = this.faqList().find((f) => f.id === option.id)!;
    return this.go(session, this.menu(session, `**${item.label}**\n\n${item.answer}\n\nQuer ver outra dúvida?`, options));
  }

  // ------------------------------------------------------------ perfil

  private profileMenuOptions(): MenuOption[] {
    return [{ id: 'atualizar_dados', label: 'Atualizar dados', description: 'Nome, e-mail, telefone ou endereço' }, BACK];
  }

  private async showProfile(session: CitizenAiSessionState, intro?: string): Promise<CitizenAiDecision> {
    const result = await this.ctx.runAction('getCitizenProfile', {}, session);
    const p = (result?.profile || {}) as Record<string, any>;
    const a = (p.address || {}) as Record<string, any>;
    const address = [a.logradouro, a.numero, a.complemento, a.bairro, a.cidade && `${a.cidade}${a.uf ? `/${a.uf}` : ''}`, a.cep]
      .filter(Boolean)
      .join(', ');
    const card = result?.error
      ? 'Não consegui carregar seus dados agora.'
      : [
          '**Seus dados**',
          `Nome: ${p.name || '—'}`,
          `CPF: ${p.cpf ? `${String(p.cpf).replace(/\D/g, '').slice(0, 3)}.***.***-${String(p.cpf).replace(/\D/g, '').slice(-2)}` : '—'}`,
          `E-mail: ${p.email || '—'}`,
          `Telefone: ${p.phone || '—'}`,
          `Endereço: ${address || '—'}`,
        ].join('\n');
    const next: CitizenAiSessionState = { ...session, stage: 'profile_menu', selfService: {} };
    return this.go(next, this.menu(next, intro ? `${intro}\n\n${card}` : card, this.profileMenuOptions()));
  }

  private async onProfileMenu(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const option = pickOption(message, this.profileMenuOptions()) || (normalize(message).includes('atualizar') ? this.profileMenuOptions()[0] : undefined);
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    const next: CitizenAiSessionState = { ...session, stage: 'profile_update_choice' };
    return this.go(next, this.menu(next, 'O que você quer atualizar?', [...PROFILE_FIELDS, BACK]));
  }

  private async onProfileUpdateChoice(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const option = pickOption(message, [...PROFILE_FIELDS, BACK]);
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    const field = option.id;
    const prompt = field === 'address' ? `Vamos atualizar o endereço. Qual o ${ADDRESS_STEPS[0].label}?` : `Digite o novo ${option.label.toLowerCase()}:`;
    const next: CitizenAiSessionState = { ...session, stage: 'profile_collect', selfService: { profileField: field, addressStep: 0, addressDraft: {} } };
    return this.go(next, this.text(next, prompt));
  }

  private async onProfileCollect(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision> {
    const state = session.selfService || {};
    const field = String(state.profileField || '');

    if (field === 'address') {
      const step = ADDRESS_STEPS[state.addressStep || 0];
      const draft = { ...(state.addressDraft || {}) } as Record<string, string>;
      if (step.optional && isSkip(message)) {
        // complemento pulado
      } else {
        const v = validateField(step.id, message);
        if (!v.ok) return this.go(session, this.text(session, `${v.error}\n\n${step.label}:`));
        draft[step.id] = v.value;
      }
      const nextStep = (state.addressStep || 0) + 1;
      if (nextStep < ADDRESS_STEPS.length) {
        const next: CitizenAiSessionState = { ...session, selfService: { ...state, addressStep: nextStep, addressDraft: draft } };
        return this.go(next, this.text(next, `${ADDRESS_STEPS[nextStep].label}:`));
      }
      return this.saveProfile(session, { address: draft });
    }

    const v = validateField(field, message);
    if (!v.ok) return this.go(session, this.text(session, `${v.error}\n\nTente de novo:`));
    return this.saveProfile(session, { [field]: v.value });
  }

  private async saveProfile(session: CitizenAiSessionState, updates: Record<string, unknown>): Promise<CitizenAiDecision> {
    const result = await this.ctx.runAction('updateCitizenProfile', updates, session);
    if (result?.success === false) {
      const next: CitizenAiSessionState = { ...session, stage: 'profile_menu', selfService: {} };
      return this.go(next, this.menu(next, `Não consegui salvar: ${result.error || 'tente novamente em instantes.'}`, this.profileMenuOptions()));
    }
    return this.showProfile(session, 'Pronto, dados atualizados!');
  }

  // ------------------------------------------------------------ documentos

  private documentsOptions(): MenuOption[] {
    return [{ id: 'docs_por_protocolo', label: 'Ver por protocolo', description: 'Documentos de um pedido' }, BACK];
  }

  private async showDocuments(session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const result = await this.ctx.runAction('getDocuments', { limit: 20 }, session);
    const docs: MenuOption[] = Array.isArray(result?.documents) ? result.documents : [];
    const next: CitizenAiSessionState = { ...session, stage: 'documents_menu', selfService: {} };
    if (result?.success === false) return this.go(next, this.menu(next, 'Não consegui carregar seus documentos agora.', this.documentsOptions()));
    if (!docs.length) return this.go(next, this.menu(next, 'Você ainda não tem documentos. Eles aparecem aqui quando você envia arquivos num pedido.', [BACK]));
    const list = docs
      .slice(0, 20)
      .map((d) => {
        const m = d.metadata || {};
        const extra = [m.protocolNumber && `protocolo ${m.protocolNumber}`, fmtDate(m.uploadedAt)].filter(Boolean).join(' · ');
        return `• **${d.label}**${extra ? ` — ${extra}` : ''}`;
      })
      .join('\n');
    return this.go(next, this.menu(next, `**Seus documentos (${docs.length})**\n\n${list}`, this.documentsOptions()));
  }

  private async onDocumentsMenu(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const option = pickOption(message, this.documentsOptions());
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    const result = await this.ctx.runAction('getProtocols', { limit: 20 }, session);
    const protocols: MenuOption[] = Array.isArray(result?.protocols) ? result.protocols : [];
    if (!protocols.length) return this.go(session, this.menu(session, 'Você ainda não tem pedidos.', [BACK]));
    const next: CitizenAiSessionState = { ...session, stage: 'documents_protocol_selection', selfService: { candidates: protocols } };
    return this.go(next, this.menu(next, 'De qual pedido?', [...protocols, BACK]));
  }

  private async onDocumentsProtocol(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const candidates = (session.selfService?.candidates || []) as MenuOption[];
    const option = pickOption(message, [...candidates, BACK]);
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    const result = await this.ctx.runAction('getProtocolDocuments', { protocolId: option.id }, session);
    const docs: MenuOption[] = Array.isArray(result?.documents) ? result.documents : [];
    const next: CitizenAiSessionState = { ...session, stage: 'documents_menu', selfService: {} };
    const body = docs.length
      ? docs.map((d) => `• **${d.label}**${fmtDate(d.metadata?.uploadedAt) ? ` — ${fmtDate(d.metadata?.uploadedAt)}` : ''}`).join('\n')
      : 'Este pedido não tem documentos anexados.';
    return this.go(next, this.menu(next, `**Documentos de ${option.label}**\n\n${body}`, this.documentsOptions()));
  }

  // ------------------------------------------------------------ família

  private async showFamily(session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const result = await this.ctx.runAction('getFamilyMembers', {}, session);
    const members: MenuOption[] = Array.isArray(result?.members) ? result.members : [];
    const next: CitizenAiSessionState = { ...session, stage: 'triage', selfService: undefined };
    const body = result?.success === false
      ? 'Não consegui carregar sua família agora.'
      : members.length
        ? `**Sua família (${members.length})**\n\n${members.map((m) => `• **${m.label}** — ${m.description || 'familiar'}`).join('\n')}\n\nPara incluir ou alterar alguém, use a tela **Minha Família** do app.`
        : 'Você ainda não tem familiares cadastrados. Use a tela **Minha Família** do app para incluir.';
    return this.go(next, this.menu(next, body, [BACK]));
  }

  // ------------------------------------------------------------ notificações

  private notificationsOptions(): MenuOption[] {
    return [
      { id: 'ver_todos_avisos', label: 'Ver todos os avisos' },
      { id: 'marcar_lidos', label: 'Marcar todos como lidos' },
      BACK,
    ];
  }

  private async showNotifications(session: CitizenAiSessionState, unreadOnly: boolean, intro?: string): Promise<CitizenAiDecision> {
    const result = await this.ctx.runAction('getNotifications', { unreadOnly, limit: 10 }, session);
    const items: MenuOption[] = Array.isArray(result?.notifications) ? result.notifications : [];
    const next: CitizenAiSessionState = { ...session, stage: 'notifications_menu', selfService: {} };
    let body: string;
    if (result?.success === false) body = 'Não consegui carregar seus avisos agora.';
    else if (!items.length) body = unreadOnly ? 'Você não tem avisos novos.' : 'Você ainda não recebeu avisos.';
    else
      body = `**${unreadOnly ? 'Avisos novos' : 'Seus avisos'} (${items.length})**\n\n${items
        .map((n) => `• **${n.label}**${fmtDate(n.metadata?.createdAt) ? ` (${fmtDate(n.metadata?.createdAt)})` : ''}\n  ${String(n.description || '').slice(0, 160)}`)
        .join('\n')}`;
    return this.go(next, this.menu(next, intro ? `${intro}\n\n${body}` : body, this.notificationsOptions()));
  }

  private async onNotificationsMenu(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const option = pickOption(message, this.notificationsOptions());
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    if (option.id === 'ver_todos_avisos') return this.showNotifications(session, false);
    const result = await this.ctx.runAction('markNotificationsAsRead', { markAll: true }, session);
    return this.showNotifications(session, true, result?.success === false ? 'Não consegui marcar agora.' : 'Pronto, todos marcados como lidos.');
  }

  // ------------------------------------------------------------ avaliação

  private ratingOptions(): MenuOption[] {
    return [
      { id: '5', label: '5 — Excelente' },
      { id: '4', label: '4 — Bom' },
      { id: '3', label: '3 — Regular' },
      { id: '2', label: '2 — Ruim' },
      { id: '1', label: '1 — Péssimo' },
    ];
  }

  private async showPendingEvaluations(session: CitizenAiSessionState, intro?: string): Promise<CitizenAiDecision> {
    const result = await this.ctx.runAction('getPendingEvaluations', {}, session);
    const protocols: MenuOption[] = Array.isArray(result?.protocols) ? result.protocols : [];
    if (result?.success === false || !protocols.length) {
      const next: CitizenAiSessionState = { ...session, stage: 'triage', selfService: undefined };
      const body = result?.success === false ? 'Não consegui buscar suas avaliações agora.' : 'Você não tem atendimentos para avaliar no momento. Obrigado!';
      return this.go(next, this.menu(next, intro ? `${intro}\n\n${body}` : body, [BACK]));
    }
    const next: CitizenAiSessionState = { ...session, stage: 'evaluation_selection', selfService: { candidates: protocols } };
    return this.go(next, this.menu(next, `${intro ? `${intro}\n\n` : ''}Qual atendimento você quer avaliar?`, [...protocols, BACK]));
  }

  private async onEvaluationSelection(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const candidates = (session.selfService?.candidates || []) as MenuOption[];
    const option = pickOption(message, [...candidates, BACK]);
    if (!option) return null;
    if (option.id === BACK.id) return this.backToMenu(session);
    const next: CitizenAiSessionState = { ...session, stage: 'evaluation_rating', selfService: { evalProtocolId: option.id, evalProtocolLabel: option.label } };
    return this.go(next, this.menu(next, `Que nota você dá para **${option.label}**?`, this.ratingOptions()));
  }

  private async onEvaluationRating(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const n = normalize(message);
    const option = this.ratingOptions().find((o) => o.id === n || normalize(o.label) === n || n.startsWith(`${o.id} `));
    if (!option) return null;
    const next: CitizenAiSessionState = { ...session, stage: 'evaluation_comment', selfService: { ...session.selfService, evalRating: Number(option.id) } };
    return this.go(next, this.menu(next, 'Quer deixar um comentário? Escreva aqui ou toque em "Sem comentário".', [{ id: 'pular', label: 'Sem comentário' }]));
  }

  private async onEvaluationComment(session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision> {
    const state = session.selfService || {};
    const comment = isSkip(message) ? undefined : message.trim().slice(0, 1000);
    const result = await this.ctx.runAction('submitEvaluation', { protocolId: state.evalProtocolId, rating: state.evalRating, comment }, session);
    const intro = result?.success === false ? `Não consegui enviar sua avaliação: ${result.error || 'tente novamente.'}` : 'Obrigado pela avaliação!';
    return this.showPendingEvaluations({ ...session, selfService: {} }, intro);
  }
}
