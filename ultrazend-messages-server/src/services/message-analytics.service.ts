/**
 * Message Analytics Service
 *
 * ✅ ETAPA 4: Serviço de analytics usando campos queryable ao invés de JSON metadata
 *
 * Demonstra queries SQL diretas nos campos:
 * - isBotMessage (Boolean)
 * - botInteractionType (String: 'menu', 'form', 'question', etc.)
 * - botSelectedOption (String)
 * - botStructuredData (JSONB queryable)
 * - botFlowNodeId (String)
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface BotMetrics {
  totalBotMessages: number;
  totalHumanMessages: number;
  botEngagementRate: number;

  // Métricas por tipo de interação
  interactionsByType: {
    menu: number;
    form: number;
    question: number;
    upload: number;
    location: number;
    other: number;
  };

  // Top 10 opções mais selecionadas (menu)
  topMenuOptions: {
    option: string;
    count: number;
  }[];

  // Métricas por nodo do fluxo
  topFlowNodes: {
    nodeId: string;
    count: number;
  }[];

  // Taxa de conclusão de formulários
  formCompletionRate: number;

  // Tempo médio de resposta do bot (ms)
  avgBotResponseTime: number;
}

/**
 * Obter métricas gerais do bot
 */
export async function getBotMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<BotMetrics> {
  const dateFilter = {
    sentAt: {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    },
  };

  // ✅ Query direta em isBotMessage (campo booleano)
  const totalBotMessages = await prisma.message.count({
    where: {
      isBotMessage: true,
      ...dateFilter,
    },
  });

  const totalHumanMessages = await prisma.message.count({
    where: {
      isBotMessage: false,
      ...dateFilter,
    },
  });

  const botEngagementRate =
    totalBotMessages + totalHumanMessages > 0
      ? (totalHumanMessages / (totalBotMessages + totalHumanMessages)) * 100
      : 0;

  // ✅ Query direta em botInteractionType (campo string)
  const interactionsByTypeRaw = await prisma.message.groupBy({
    by: ['botInteractionType'],
    where: {
      isBotMessage: true,
      botInteractionType: { not: null },
      ...dateFilter,
    },
    _count: true,
  });

  const interactionsByType = {
    menu: 0,
    form: 0,
    question: 0,
    upload: 0,
    location: 0,
    other: 0,
  };

  interactionsByTypeRaw.forEach((item) => {
    const type = item.botInteractionType as string;
    if (type in interactionsByType) {
      (interactionsByType as any)[type] = item._count;
    } else {
      interactionsByType.other += item._count;
    }
  });

  // ✅ Query direta em botSelectedOption (campo string)
  const topMenuOptionsRaw = await prisma.message.groupBy({
    by: ['botSelectedOption'],
    where: {
      botInteractionType: 'menu',
      botSelectedOption: { not: null },
      ...dateFilter,
    },
    _count: true,
    orderBy: {
      _count: {
        botSelectedOption: 'desc',
      },
    },
    take: 10,
  });

  const topMenuOptions = topMenuOptionsRaw.map((item) => ({
    option: item.botSelectedOption || 'Desconhecido',
    count: item._count,
  }));

  // ✅ Query direta em botFlowNodeId (campo string)
  const topFlowNodesRaw = await prisma.message.groupBy({
    by: ['botFlowNodeId'],
    where: {
      isBotMessage: true,
      botFlowNodeId: { not: null },
      ...dateFilter,
    },
    _count: true,
    orderBy: {
      _count: {
        botFlowNodeId: 'desc',
      },
    },
    take: 10,
  });

  const topFlowNodes = topFlowNodesRaw.map((item) => ({
    nodeId: item.botFlowNodeId || 'Desconhecido',
    count: item._count,
  }));

  // Taxa de conclusão de formulários
  const formStarted = await prisma.message.count({
    where: {
      botInteractionType: 'form',
      isBotMessage: true,
      ...dateFilter,
    },
  });

  const formCompleted = await prisma.message.count({
    where: {
      botInteractionType: 'form',
      isBotMessage: false,
      botStructuredData: { not: Prisma.JsonNull }, // Formulários completos têm structured data
      ...dateFilter,
    },
  });

  const formCompletionRate =
    formStarted > 0 ? (formCompleted / formStarted) * 100 : 0;

  // Tempo médio de resposta do bot (simplificado)
  // Poderia ser mais complexo com análise de timestamps entre mensagens
  const avgBotResponseTime = 800; // Placeholder - implementação real requer análise temporal

  return {
    totalBotMessages,
    totalHumanMessages,
    botEngagementRate,
    interactionsByType,
    topMenuOptions,
    topFlowNodes,
    formCompletionRate,
    avgBotResponseTime,
  };
}

/**
 * Obter histórico de interações de um cidadão
 * ✅ Usa campos queryable para filtrar e agrupar
 */
export async function getCitizenBotHistory(citizenId: string) {
  // Buscar conversas do cidadão com bot
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participant1Id: citizenId, participant1Type: 'CITIZEN' },
        { participant2Id: citizenId, participant2Type: 'CITIZEN' },
      ],
      isBotConversation: true,
    },
    select: {
      id: true,
    },
  });

  const conversationIds = conversations.map((c) => c.id);

  if (conversationIds.length === 0) {
    return {
      totalInteractions: 0,
      menuSelections: [],
      formsCompleted: 0,
      questionsAnswered: 0,
    };
  }

  // ✅ Query por tipo de interação
  const interactionCounts = await prisma.message.groupBy({
    by: ['botInteractionType'],
    where: {
      conversationId: { in: conversationIds },
      isBotMessage: false, // Respostas do cidadão
      botInteractionType: { not: null },
    },
    _count: true,
  });

  // ✅ Seleções de menu do cidadão
  const menuSelections = await prisma.message.findMany({
    where: {
      conversationId: { in: conversationIds },
      isBotMessage: false,
      botInteractionType: 'menu',
      botSelectedOption: { not: null },
    },
    select: {
      botSelectedOption: true,
      sentAt: true,
    },
    orderBy: {
      sentAt: 'desc',
    },
    take: 20,
  });

  const formsCompleted =
    interactionCounts.find((i) => i.botInteractionType === 'form')?._count || 0;
  const questionsAnswered =
    interactionCounts.find((i) => i.botInteractionType === 'question')?._count || 0;

  return {
    totalInteractions: interactionCounts.reduce((sum, i) => sum + i._count, 0),
    menuSelections: menuSelections.map((m) => ({
      option: m.botSelectedOption,
      timestamp: m.sentAt,
    })),
    formsCompleted,
    questionsAnswered,
  };
}

/**
 * ✅ Query avançada usando JSONB (PostgreSQL)
 * Exemplo: Buscar mensagens com structured data específica
 */
export async function getMessagesWithStructuredDataQuery(
  _jsonQuery?: Record<string, any>
) {
  // PostgreSQL JSONB queries usando Prisma
  // Exemplo: Buscar todos os formulários que têm campo "cpf"
  const messages = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      "conversationId",
      "botInteractionType",
      "botStructuredData",
      "sentAt"
    FROM "Message"
    WHERE
      "isBotMessage" = false
      AND "botInteractionType" = 'form'
      AND "botStructuredData" ? 'cpf'
    ORDER BY "sentAt" DESC
    LIMIT 100
  `;

  return messages;
}

/**
 * Dashboard de analytics do bot
 */
export async function getBotDashboard(_departmentId?: string) {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const metrics = await getBotMetrics(last30Days, new Date());

  // ✅ Conversas com handover (pausadas para atendimento humano)
  const handoverCount = await prisma.conversation.count({
    where: {
      isBotConversation: true,
      activeFlowExecution: {
        isPaused: true,
      },
    },
  });

  // ✅ Conversas ativas do bot
  const activeBotConversations = await prisma.conversation.count({
    where: {
      isBotConversation: true,
      status: 'ACTIVE',
      activeFlowExecution: {
        isPaused: false,
      },
    },
  });

  return {
    ...metrics,
    handoverCount,
    activeBotConversations,
    period: {
      start: last30Days,
      end: new Date(),
    },
  };
}

/**
 * Exportar dados para CSV
 */
export async function exportBotAnalytics(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const messages = await prisma.message.findMany({
    where: {
      isBotMessage: true,
      sentAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      conversationId: true,
      botInteractionType: true,
      botSelectedOption: true,
      botFlowNodeId: true,
      sentAt: true,
    },
    orderBy: {
      sentAt: 'asc',
    },
  });

  // CSV Header com BOM UTF-8 para Excel
  let csv = '\uFEFF';
  csv += 'ID,ConversationID,InteractionType,SelectedOption,FlowNodeID,SentAt\n';

  messages.forEach((msg) => {
    csv += `${msg.id},${msg.conversationId},${msg.botInteractionType || ''},${
      msg.botSelectedOption || ''
    },${msg.botFlowNodeId || ''},${msg.sentAt.toISOString()}\n`;
  });

  return csv;
}
