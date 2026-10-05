/**
 * Prazo de guarda das conversas (LGPD, art. 15/16: dado pessoal é eliminado
 * quando cumprida a finalidade). Configurado em Super-admin › Privacidade.
 *
 * O que acontece com o que passou do prazo:
 *   - mensagens do DigiBot e do chat cidadão × servidor SEM protocolo: o texto
 *     é trocado por um aviso e anexos/metadados são apagados (a conversa fica,
 *     só sem conteúdo — mantém contagens e histórico de atendimento);
 *   - estado dos fluxos do bot já encerrados (dados digitados): zerado;
 *   - mensagens do bot antigo (BotMessage): apagadas;
 *   - conversas do Assistente de IA dos servidores: apagadas.
 * Conversas ligadas a protocolo NÃO entram: fazem parte do processo
 * administrativo e seguem a guarda do protocolo.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';

export const RETENTION_MARK = '[mensagem apagada pelo prazo de guarda]';
const DAY = 86400000;

export async function getRetentionSettings() {
  return runAsPlatform(async () => {
    const found = await prisma.privacyRetentionSettings.findUnique({ where: { id: 'singleton' } });
    if (found) return found;
    // primeira leitura: cria a linha padrão (desligada); se outra requisição criou junto, relê
    return prisma.privacyRetentionSettings
      .create({ data: { id: 'singleton' } })
      .catch(() => prisma.privacyRetentionSettings.findUniqueOrThrow({ where: { id: 'singleton' } }));
  });
}

export async function updateRetentionSettings(data: Partial<{ enabled: boolean; botChatDays: number; humanChatDays: number; assistantDays: number; faceUnmatchedImageDays: number; faceEventImageDays: number; faceEventDays: number }>) {
  return runAsPlatform(async () =>
    prisma.privacyRetentionSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton', ...data }, update: data })
  );
}

export interface RetentionSummary {
  botMessages: number;
  chatMessages: number;
  flowStates: number;
  legacyBotMessages: number;
  assistantConversations: number;
}

/** Conta (dryRun) ou aplica a limpeza. A plataforma toda, de uma vez. */
export async function runRetention(opts: { dryRun?: boolean } = {}): Promise<RetentionSummary> {
  const s = await getRetentionSettings();
  const now = Date.now();
  const botCut = new Date(now - s.botChatDays * DAY);
  const chatCut = new Date(now - s.humanChatDays * DAY);
  const assistantCut = new Date(now - s.assistantDays * DAY);

  const botWhere: Prisma.MessageWhereInput = {
    sentAt: { lt: botCut },
    content: { not: RETENTION_MARK },
    conversation: { isBotConversation: true, protocolId: null },
  };
  const chatWhere: Prisma.MessageWhereInput = {
    sentAt: { lt: chatCut },
    content: { not: RETENTION_MARK },
    conversation: { isBotConversation: false, protocolId: null },
  };
  const flowWhere: Prisma.FlowExecutionWhereInput = { status: { not: 'ACTIVE' }, startedAt: { lt: botCut }, NOT: { state: { equals: {} } } };
  const legacyWhere: Prisma.BotMessageWhereInput = { createdAt: { lt: botCut } };
  const assistantWhere: Prisma.AiAssistantConversationWhereInput = { lastMessageAt: { lt: assistantCut } };

  return runAsPlatform(async () => {
    if (opts.dryRun) {
      const [botMessages, chatMessages, flowStates, legacyBotMessages, assistantConversations] = await Promise.all([
        prisma.message.count({ where: botWhere }),
        prisma.message.count({ where: chatWhere }),
        prisma.flowExecution.count({ where: flowWhere }),
        prisma.botMessage.count({ where: legacyWhere }),
        prisma.aiAssistantConversation.count({ where: assistantWhere }),
      ]);
      return { botMessages, chatMessages, flowStates, legacyBotMessages, assistantConversations };
    }

    const erase = {
      content: RETENTION_MARK,
      attachments: Prisma.DbNull,
      metadata: Prisma.DbNull,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: 'retention',
    };
    const bot = await prisma.message.updateMany({ where: botWhere, data: erase });
    const chat = await prisma.message.updateMany({ where: chatWhere, data: erase });
    // prévia da última mensagem também carrega texto do cidadão
    await prisma.conversation.updateMany({
      where: {
        protocolId: null,
        lastMessagePreview: { not: null },
        OR: [
          { isBotConversation: true, lastMessageAt: { lt: botCut } },
          { isBotConversation: false, lastMessageAt: { lt: chatCut } },
        ],
      },
      data: { lastMessagePreview: null },
    });
    const flows = await prisma.flowExecution.updateMany({ where: flowWhere, data: { state: {}, history: [], metadata: Prisma.DbNull } });
    const legacy = await prisma.botMessage.deleteMany({ where: legacyWhere });
    const assistant = await prisma.aiAssistantConversation.deleteMany({ where: assistantWhere });

    const summary: RetentionSummary = {
      botMessages: bot.count,
      chatMessages: chat.count,
      flowStates: flows.count,
      legacyBotMessages: legacy.count,
      assistantConversations: assistant.count,
    };
    await prisma.privacyRetentionSettings.update({
      where: { id: 'singleton' },
      data: { lastRunAt: new Date(), lastRunSummary: summary as unknown as Prisma.InputJsonValue },
    });
    return summary;
  });
}
