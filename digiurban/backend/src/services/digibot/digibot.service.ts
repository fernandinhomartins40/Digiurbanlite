/**
 * DigiBot — configuração e conhecimento por município.
 *
 * Tudo que o painel "DigiBot" edita (sem JSON): nome, mensagens, menu inicial,
 * atendimento humano, perguntas frequentes, palavras do cidadão por serviço e
 * a lista do que o bot não entendeu. Escopo de município pela tenant-extension
 * (todas as tabelas têm tenantId).
 *
 * Configuração tem RASCUNHO e PUBLICADA: o gestor edita, confere na prévia e
 * publica; cada publicação vira uma versão e dá para voltar à anterior.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import { redact } from '../ai-gateway/pii';
import { normalizeText, scoreMatch, tokenScores } from './text-match';

// ---------------------------------------------------------------- configuração

export interface BotMenuItem {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface BotConfig {
  botName: string;
  welcomeMessage: string;
  farewellMessage: string;
  tone: 'simples' | 'formal';
  /** máximo de usos de IA por conversa (janela de 1 hora); 0 = bot sem IA */
  aiCallsPerConversation: number;
  menu: BotMenuItem[];
  human: {
    hours: string;
    waitMessage: string;
    outOfHoursMessage: string;
    /** minutos na fila até voltar para o assistente (0 = sem limite) */
    maxWaitMinutes: number;
    noAttendantMessage: string;
  };
}

/** Itens que nunca podem sair do menu: sem eles o cidadão fica sem saída */
export const ESSENTIAL_MENU = ['solicitar_servico', 'consultar_protocolo'];

export const DEFAULT_MENU: BotMenuItem[] = [
  { id: 'solicitar_servico', label: 'Solicitar serviço', description: 'Abrir um novo pedido', enabled: true },
  { id: 'explorar_secretarias', label: 'Explorar por secretaria', description: 'Ver serviços por secretaria', enabled: true },
  { id: 'consultar_protocolo', label: 'Consultar protocolo', description: 'Acompanhar um pedido', enabled: true },
  { id: 'meu_perfil', label: 'Meu perfil', description: 'Ver e atualizar meus dados', enabled: true },
  { id: 'documentos', label: 'Meus documentos', description: 'Arquivos que enviei', enabled: true },
  { id: 'notificacoes', label: 'Avisos', description: 'Novidades dos meus pedidos', enabled: false },
  { id: 'minha_familia', label: 'Minha família', description: 'Familiares cadastrados', enabled: false },
  { id: 'avaliacao', label: 'Avaliar atendimento', description: 'Dar nota a um pedido concluído', enabled: false },
  { id: 'ajuda', label: 'Ajuda', description: 'Dúvidas e perguntas frequentes', enabled: true },
];

export const DEFAULT_CONFIG: BotConfig = {
  botName: 'DigiBot',
  welcomeMessage: 'Olá! Sou o DigiBot, o assistente da prefeitura. Escolha uma opção ou escreva com suas palavras o que você precisa.',
  farewellMessage: 'Atendimento encerrado. Quando precisar, é só mandar uma mensagem.',
  tone: 'simples',
  aiCallsPerConversation: 15,
  menu: DEFAULT_MENU,
  human: {
    hours: 'Segunda a sexta, das 8h às 17h',
    waitMessage: 'Certo! Vou chamar um atendente da prefeitura. Assim que alguém assumir, ele continua a conversa por aqui.',
    outOfHoursMessage: 'Nosso atendimento humano funciona de segunda a sexta, das 8h às 17h. Deixe sua mensagem que respondemos assim que possível.',
    maxWaitMinutes: 15,
    noAttendantMessage: 'Nenhum atendente conseguiu assumir agora. Você pode tentar de novo mais tarde ou abrir um pedido pelo portal. Posso ajudar com outra coisa?',
  },
};

const clip = (v: unknown, max: number, fallback: string) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : fallback;
};

/** Junta o salvo com o padrão e aplica as proteções (nunca confia no que veio da tela) */
export function sanitizeConfig(input: unknown): BotConfig {
  const c = (input && typeof input === 'object' ? input : {}) as Partial<BotConfig>;
  const human = (c.human || {}) as Partial<BotConfig['human']>;
  const savedMenu = Array.isArray(c.menu) ? c.menu : [];
  // menu: a ordem salva vale; itens novos do padrão entram no fim; itens desconhecidos saem
  const known = new Map(DEFAULT_MENU.map((m) => [m.id, m]));
  const menu: BotMenuItem[] = [];
  for (const item of savedMenu) {
    const base = known.get(String((item as BotMenuItem)?.id));
    if (!base || menu.some((m) => m.id === base.id)) continue;
    menu.push({
      id: base.id,
      label: clip((item as BotMenuItem).label, 40, base.label),
      description: clip((item as BotMenuItem).description, 80, base.description || ''),
      enabled: ESSENTIAL_MENU.includes(base.id) ? true : (item as BotMenuItem).enabled !== false,
    });
  }
  for (const base of DEFAULT_MENU) if (!menu.some((m) => m.id === base.id)) menu.push({ ...base });

  return {
    botName: clip(c.botName, 30, DEFAULT_CONFIG.botName),
    welcomeMessage: clip(c.welcomeMessage, 400, DEFAULT_CONFIG.welcomeMessage),
    farewellMessage: clip(c.farewellMessage, 300, DEFAULT_CONFIG.farewellMessage),
    tone: c.tone === 'formal' ? 'formal' : 'simples',
    aiCallsPerConversation: Number.isFinite(Number(c.aiCallsPerConversation))
      ? Math.max(0, Math.min(50, Math.round(Number(c.aiCallsPerConversation))))
      : DEFAULT_CONFIG.aiCallsPerConversation,
    menu,
    human: {
      hours: clip(human.hours, 120, DEFAULT_CONFIG.human.hours),
      waitMessage: clip(human.waitMessage, 300, DEFAULT_CONFIG.human.waitMessage),
      outOfHoursMessage: clip(human.outOfHoursMessage, 300, DEFAULT_CONFIG.human.outOfHoursMessage),
      maxWaitMinutes: Number.isFinite(Number(human.maxWaitMinutes))
        ? Math.max(0, Math.min(240, Math.round(Number(human.maxWaitMinutes))))
        : DEFAULT_CONFIG.human.maxWaitMinutes,
      noAttendantMessage: clip(human.noAttendantMessage, 300, DEFAULT_CONFIG.human.noAttendantMessage),
    },
  };
}

async function settingsRow() {
  const tenantId = tryGetTenantId() || null;
  const found = await prisma.botSettings.findFirst({});
  if (found) return found;
  return prisma.botSettings
    .create({ data: { tenantId, published: DEFAULT_CONFIG as unknown as Prisma.InputJsonValue } })
    .catch(() => prisma.botSettings.findFirstOrThrow({}));
}

export async function getBotSettings() {
  const row = await settingsRow();
  return {
    published: sanitizeConfig(row.published),
    draft: row.draft ? sanitizeConfig(row.draft) : null,
    version: row.version,
    publishedAt: row.publishedAt,
  };
}

export async function getPublishedConfig(): Promise<BotConfig> {
  return (await getBotSettings()).published;
}

export async function saveDraft(input: unknown) {
  const row = await settingsRow();
  const draft = sanitizeConfig(input);
  await prisma.botSettings.update({ where: { id: row.id }, data: { draft: draft as unknown as Prisma.InputJsonValue } });
  return getBotSettings();
}

export async function discardDraft() {
  const row = await settingsRow();
  await prisma.botSettings.update({ where: { id: row.id }, data: { draft: Prisma.DbNull } });
  return getBotSettings();
}

export async function publishDraft(userId?: string) {
  const row = await settingsRow();
  if (!row.draft) return getBotSettings();
  const data = sanitizeConfig(row.draft);
  const version = row.version + 1;
  await prisma.$transaction([
    prisma.botSettingsVersion.create({ data: { tenantId: row.tenantId, version: row.version, data: row.published as Prisma.InputJsonValue, createdBy: userId } }),
    prisma.botSettings.update({
      where: { id: row.id },
      data: { published: data as unknown as Prisma.InputJsonValue, draft: Prisma.DbNull, version, publishedAt: new Date(), publishedBy: userId },
    }),
  ]);
  return getBotSettings();
}

export async function listVersions() {
  return prisma.botSettingsVersion.findMany({ orderBy: { version: 'desc' }, take: 20, select: { id: true, version: true, createdAt: true, createdBy: true } });
}

/** Volta para uma versão anterior (ela vira a publicada; a atual vai para o histórico) */
export async function restoreVersion(versionId: string, userId?: string) {
  const v = await prisma.botSettingsVersion.findFirst({ where: { id: versionId } });
  if (!v) throw Object.assign(new Error('Versão não encontrada'), { status: 404 });
  const row = await settingsRow();
  await prisma.botSettings.update({ where: { id: row.id }, data: { draft: sanitizeConfig(v.data) as unknown as Prisma.InputJsonValue } });
  return publishDraft(userId);
}

// ---------------------------------------------------------------- perguntas frequentes

export const DEFAULT_FAQS = [
  { question: 'Quanto tempo leva um pedido?', answer: 'Cada serviço tem um prazo próprio, mostrado quando você faz o pedido e nos detalhes do protocolo. Pedidos com os documentos completos andam mais rápido.', keywords: ['prazo', 'demora', 'quanto tempo'] },
  { question: 'Quais documentos preciso enviar?', answer: 'Depende do serviço: ao pedir, eu mostro a lista. Você pode enviar PDF, fotos ou documentos do Office, até 10 MB por arquivo.', keywords: ['documentos necessarios', 'anexar', 'arquivo'] },
  { question: 'Como acompanho meu pedido?', answer: 'Escolha "Consultar protocolo" no menu e informe o número, ou veja a lista dos seus pedidos.', keywords: ['andamento', 'situacao do pedido', 'status'] },
  { question: 'Posso cancelar um pedido?', answer: 'Enquanto o pedido não começou a ser analisado, sim. Depois disso, fale com um atendente para avaliar o seu caso.', keywords: ['cancelar', 'desistir'] },
  { question: 'Como atualizo meus dados?', answer: 'Escolha "Meu perfil" no menu e depois "Atualizar dados".', keywords: ['mudar telefone', 'trocar email', 'endereco novo'] },
];

export async function listFaqs(onlyActive = false) {
  return prisma.botFaq.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
}

/** Município sem perguntas cadastradas começa com as padrão (editáveis) */
export async function ensureDefaultFaqs() {
  if ((await prisma.botFaq.count()) > 0) return;
  const tenantId = tryGetTenantId() || null;
  await prisma.botFaq.createMany({ data: DEFAULT_FAQS.map((f, i) => ({ ...f, tenantId, order: i })) });
}

export async function upsertFaq(input: { id?: string; question: string; answer: string; keywords?: string[]; isActive?: boolean; order?: number }) {
  const data = {
    question: input.question.trim().slice(0, 200),
    answer: input.answer.trim().slice(0, 2000),
    keywords: (input.keywords || []).map((k) => k.trim().slice(0, 60)).filter(Boolean).slice(0, 20),
    isActive: input.isActive ?? true,
    ...(input.order !== undefined ? { order: input.order } : {}),
  };
  if (input.id) {
    const found = await prisma.botFaq.findFirst({ where: { id: input.id } });
    if (!found) throw Object.assign(new Error('Pergunta não encontrada'), { status: 404 });
    return prisma.botFaq.update({ where: { id: found.id }, data });
  }
  return prisma.botFaq.create({ data: { ...data, tenantId: tryGetTenantId() || null } });
}

export async function deleteFaq(id: string) {
  const found = await prisma.botFaq.findFirst({ where: { id } });
  if (!found) throw Object.assign(new Error('Pergunta não encontrada'), { status: 404 });
  await prisma.botFaq.delete({ where: { id: found.id } });
}

/** Pergunta frequente que responde ao texto do cidadão (ou null) */
export async function matchFaq(query: string) {
  const faqs = await listFaqs(true);
  let best: { faq: (typeof faqs)[number]; score: number } | null = null;
  for (const faq of faqs) {
    const score = scoreMatch(query, { fields: [{ text: faq.question, weight: 3 }, { text: faq.keywords.join(' '), weight: 3 }], phrases: faq.keywords });
    if (!best || score > best.score) best = { faq, score };
  }
  return best && best.score >= 0.6 ? { id: best.faq.id, question: best.faq.question, answer: best.faq.answer, score: best.score } : null;
}

// ---------------------------------------------------------------- busca de serviços

type SearchableService = { id: string; name: string; description: string | null; category: string | null; department: { id: string; name: string } | null };

/**
 * Serviços que combinam com o pedido do cidadão, do mais provável ao menos.
 * Com um vencedor claro, devolve só ele (o bot já abre o formulário).
 */
export async function searchServicesForBot<T extends SearchableService>(query: string, services: T[], limit = 6): Promise<Array<T & { matchScore: number }>> {
  if (!normalizeText(query) || !services.length) return [];
  const terms = await prisma.botServiceTerm.findMany({ where: { serviceId: { in: services.map((s) => s.id) } }, select: { serviceId: true, term: true } });
  const termsBy = new Map<string, string[]>();
  for (const t of terms) termsBy.set(t.serviceId, [...(termsBy.get(t.serviceId) || []), t.term]);

  const perService = services.map((s) => {
    const own = termsBy.get(s.id) || [];
    return {
      service: s,
      ...tokenScores(query, {
        fields: [
          { text: s.name, weight: 3 },
          { text: own.join(' '), weight: 3 },
          { text: `${s.category || ''} ${s.department?.name || ''}`, weight: 1.2 },
          { text: s.description || '', weight: 1.5 },
        ],
        phrases: [s.name, ...own],
      }),
    };
  });

  // Palavras que não combinam com NENHUM serviço do município ("esquina",
  // "queimou", "enorme") não dizem nada sobre o pedido: saem da conta. Antes,
  // cada palavra solta derrubava a nota e "lâmpada do poste da esquina
  // queimou" não achava Iluminação pública.
  const allWords = perService[0] ? Array.from(perService[0].scores.keys()) : [];
  const informative = allWords.filter((w) => perService.some((p) => (p.scores.get(w) || 0) > 0));
  if (!informative.length && !perService.some((p) => p.phrase)) return [];
  const coverage = allWords.length ? informative.length / allWords.length : 0;

  const scored = perService
    .map((p) => {
      const sum = informative.reduce((acc, w) => acc + (p.scores.get(w) || 0), 0);
      let matchScore = informative.length ? (sum / informative.length) * (0.7 + 0.3 * coverage) : 0;
      if (p.phrase) matchScore = Math.max(matchScore, 0.9);
      return { ...p.service, matchScore: Math.min(1, matchScore) };
    })
    .filter((s) => s.matchScore >= 0.45)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (!scored.length) return [];
  const top = scored[0];
  const second = scored[1];
  if (top.matchScore >= 0.75 && (!second || second.matchScore < top.matchScore * 0.75)) return [top];
  return scored.filter((s) => s.matchScore >= top.matchScore * 0.6).slice(0, limit);
}

export async function listServiceTerms() {
  const [services, terms] = await Promise.all([
    prisma.serviceSimplified.findMany({
      where: { isActive: true },
      select: { id: true, name: true, category: true, department: { select: { name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.botServiceTerm.findMany({ select: { id: true, serviceId: true, term: true }, orderBy: { createdAt: 'asc' } }),
  ]);
  return services.map((s) => ({ ...s, terms: terms.filter((t) => t.serviceId === s.id).map((t) => ({ id: t.id, term: t.term })) }));
}

export async function addServiceTerm(serviceId: string, term: string) {
  const service = await prisma.serviceSimplified.findFirst({ where: { id: serviceId }, select: { id: true } });
  if (!service) throw Object.assign(new Error('Serviço não encontrado'), { status: 404 });
  const clean = term.trim().toLowerCase().slice(0, 60);
  if (clean.length < 2) throw Object.assign(new Error('Escreva ao menos 2 letras'), { status: 400 });
  const exists = await prisma.botServiceTerm.findFirst({ where: { serviceId, term: clean } });
  if (exists) return exists;
  return prisma.botServiceTerm.create({ data: { tenantId: tryGetTenantId() || null, serviceId, term: clean } });
}

export async function removeServiceTerm(id: string) {
  const found = await prisma.botServiceTerm.findFirst({ where: { id } });
  if (!found) throw Object.assign(new Error('Palavra não encontrada'), { status: 404 });
  await prisma.botServiceTerm.delete({ where: { id: found.id } });
}

// ---------------------------------------------------------------- o que o bot não entendeu

/** Registra (com CPF, telefone, e-mail etc. mascarados) — contagem por frase igual */
export async function recordUnanswered(rawText: string) {
  const text = redact(String(rawText || '').slice(0, 300)).text.trim();
  const normalized = normalizeText(text).slice(0, 200);
  if (normalized.length < 3) return;
  const tenantId = tryGetTenantId() || null;
  const existing = await prisma.botUnanswered.findFirst({ where: { normalized } });
  if (existing) {
    await prisma.botUnanswered.update({
      where: { id: existing.id },
      data: { count: { increment: 1 }, lastSeenAt: new Date(), ...(existing.status === 'IGNORED' ? {} : { status: 'OPEN' }) },
    });
    return;
  }
  await prisma.botUnanswered.create({ data: { tenantId, text, normalized } }).catch(() => undefined);
}

export async function listUnanswered(status: 'OPEN' | 'RESOLVED' | 'IGNORED' = 'OPEN') {
  return prisma.botUnanswered.findMany({ where: { status }, orderBy: [{ count: 'desc' }, { lastSeenAt: 'desc' }], take: 100 });
}

/**
 * Ensinar o bot: a frase vira palavra de um serviço, ou uma pergunta frequente,
 * ou é ignorada.
 */
export async function resolveUnanswered(
  id: string,
  action: { type: 'service'; serviceId: string; term?: string } | { type: 'faq'; answer: string; question?: string } | { type: 'ignore' },
  userId?: string
) {
  const item = await prisma.botUnanswered.findFirst({ where: { id } });
  if (!item) throw Object.assign(new Error('Item não encontrado'), { status: 404 });
  if (action.type === 'service') await addServiceTerm(action.serviceId, action.term || item.text);
  if (action.type === 'faq') await upsertFaq({ question: action.question || item.text, answer: action.answer, keywords: [item.text] });
  await prisma.botUnanswered.update({
    where: { id: item.id },
    data: {
      status: action.type === 'ignore' ? 'IGNORED' : 'RESOLVED',
      resolution: action as unknown as Prisma.InputJsonValue,
      resolvedAt: new Date(),
      resolvedBy: userId,
    },
  });
}
