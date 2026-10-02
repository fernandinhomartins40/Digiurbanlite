/**
 * Configuração publicada do DigiBot e perguntas frequentes de cada município
 * (painel › DigiBot). Guardado por 60 s: depois de "Publicar" no painel, o bot
 * passa a usar o novo em até 1 minuto. Sem resposta do sistema, usa o padrão —
 * o bot nunca para por causa disso.
 */

import { MenuOption } from '../types';
import { getDigiUrbanIntegration } from '../DigiUrbanIntegration';
import { getBotTenantId } from '../tenant-context';

export interface BotKnowledgeConfig {
  botName: string;
  welcomeMessage: string;
  farewellMessage: string;
  tone: 'simples' | 'formal';
  /** máximo de usos de IA por conversa (1 hora); 0 = bot sem IA */
  aiCallsPerConversation: number;
  menu: Array<{ id: string; label: string; description?: string; enabled: boolean }>;
  human: { hours: string; waitMessage: string; outOfHoursMessage: string };
}

export interface BotFaqItem {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_CONFIG: BotKnowledgeConfig = {
  botName: 'DigiBot',
  welcomeMessage: 'Olá! Sou o DigiBot, o assistente da prefeitura. Escolha uma opção ou escreva com suas palavras o que você precisa.',
  farewellMessage: 'Atendimento encerrado. Quando precisar, é só mandar uma mensagem.',
  tone: 'simples',
  aiCallsPerConversation: 15,
  menu: [
    { id: 'solicitar_servico', label: 'Solicitar serviço', description: 'Abrir um novo pedido', enabled: true },
    { id: 'explorar_secretarias', label: 'Explorar por secretaria', description: 'Ver serviços por secretaria', enabled: true },
    { id: 'consultar_protocolo', label: 'Consultar protocolo', description: 'Acompanhar um pedido', enabled: true },
    { id: 'meu_perfil', label: 'Meu perfil', description: 'Ver e atualizar meus dados', enabled: true },
    { id: 'documentos', label: 'Meus documentos', description: 'Arquivos que enviei', enabled: true },
    { id: 'ajuda', label: 'Ajuda', description: 'Dúvidas e perguntas frequentes', enabled: true },
  ],
  human: {
    hours: 'Segunda a sexta, das 8h às 17h',
    waitMessage: 'Certo! Vou chamar um atendente da prefeitura. Assim que alguém assumir, ele continua a conversa por aqui.',
    outOfHoursMessage: 'Nosso atendimento humano funciona de segunda a sexta, das 8h às 17h.',
  },
};

const TTL_MS = 60000;
const cache = new Map<string, { at: number; config: BotKnowledgeConfig; faqs: BotFaqItem[] }>();
const key = () => getBotTenantId() || process.env.DEFAULT_TENANT_ID || 'tenant-default';

/** Carrega (ou renova) o conhecimento do município atual. Chamar no início de cada mensagem. */
export async function ensureBotKnowledge(): Promise<void> {
  const k = key();
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < TTL_MS) return;
  try {
    const data = await getDigiUrbanIntegration().getBotKnowledge();
    cache.set(k, {
      at: Date.now(),
      config: { ...DEFAULT_CONFIG, ...(data?.config || {}), human: { ...DEFAULT_CONFIG.human, ...(data?.config?.human || {}) } },
      faqs: Array.isArray(data?.faqs) ? data.faqs : [],
    });
  } catch {
    // sistema fora do ar: mantém o que tinha (ou o padrão) e tenta de novo em 15 s
    cache.set(k, { at: Date.now() - TTL_MS + 15000, config: hit?.config || DEFAULT_CONFIG, faqs: hit?.faqs || [] });
  }
}

export function botConfig(): BotKnowledgeConfig {
  return cache.get(key())?.config || DEFAULT_CONFIG;
}

export function botFaqs(): BotFaqItem[] {
  return cache.get(key())?.faqs || [];
}

/** Itens do menu inicial ligados pelo município, na ordem escolhida */
export function botMenuOptions(): MenuOption[] {
  return botConfig()
    .menu.filter((m) => m.enabled)
    .map((m) => ({ id: m.id, label: m.label, description: m.description }));
}
