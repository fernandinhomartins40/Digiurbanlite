import { AiConversation, AiMessage, AiMessageRole } from '@prisma/client';
import { config } from '../config/config';
import prisma from '../utils/prisma';
import { apiKeyService } from './api-key.service';
import { knowledgeService } from './knowledge.service';
import { ollamaService } from './ollama.service';
import { ChatMessageInput } from '../types';

function normalizeConversationTitle(input: string): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, 80);
}

function mapStoredRoleToModelRole(role: AiMessageRole): ChatMessageInput['role'] {
  switch (role) {
    case AiMessageRole.SYSTEM:
      return 'system';
    case AiMessageRole.ASSISTANT:
      return 'assistant';
    case AiMessageRole.TOOL:
      return 'tool';
    case AiMessageRole.USER:
    default:
      return 'user';
  }
}

function buildSystemPrompt(params: {
  userName?: string;
  departmentId?: string;
  retrievedContext: string[];
  extraInstruction?: string;
}): string {
  const contextBlock = params.retrievedContext.length
    ? params.retrievedContext
        .map((chunk, index) => `[Contexto ${index + 1}]\n${chunk}`)
        .join('\n\n')
    : 'Nenhum contexto recuperado no momento.';

  const persona = [
    'Você é a DigiUrban IA, assistente operacional para gestão pública municipal.',
    'Responda em português do Brasil com clareza, objetividade e foco em execução.',
    'Use prioritariamente o contexto fornecido.',
    'Se faltar evidência no contexto, diga explicitamente que não há dados suficientes.',
    'Nunca invente IDs, normas, status de protocolo ou informações de cidadão.',
  ].join(' ');

  const operator =
    params.userName || params.departmentId
      ? `Servidor atual: ${params.userName || 'não informado'}; departamento: ${
          params.departmentId || 'não informado'
        }.`
      : 'Servidor atual não identificado.';

  const extra = params.extraInstruction?.trim()
    ? `Instrução adicional: ${params.extraInstruction.trim()}`
    : '';

  return [persona, operator, extra, `Base de conhecimento:\n${contextBlock}`]
    .filter(Boolean)
    .join('\n\n');
}

export class ChatService {
  async listConversations(params: {
    tenantId: string;
    userId: string;
  }): Promise<AiConversation[]> {
    return prisma.aiConversation.findMany({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }

  async createConversation(params: {
    tenantId: string;
    userId: string;
    departmentId?: string;
    title?: string;
  }): Promise<AiConversation> {
    return prisma.aiConversation.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        departmentId: params.departmentId,
        title: params.title?.trim() || 'Nova conversa',
      },
    });
  }

  async getConversationWithMessages(params: {
    tenantId: string;
    userId: string;
    conversationId: string;
  }): Promise<AiConversation & { messages: AiMessage[] }> {
    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(params: {
    tenantId: string;
    userId: string;
    userName?: string;
    departmentId?: string;
    conversationId: string;
    content: string;
    model?: string;
    extraInstruction?: string;
  }): Promise<{
    conversationId: string;
    assistantMessage: AiMessage;
    contextSources: number;
  }> {
    const normalized = params.content.trim();
    if (!normalized) {
      throw new Error('Message content is required');
    }

    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id: params.conversationId,
        tenantId: params.tenantId,
        userId: params.userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content: normalized,
      },
    });

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: config.maxConversationMessagesContext,
    });

    const relevantChunks = await knowledgeService.searchRelevantChunks({
      tenantId: params.tenantId,
      query: normalized,
      limit: config.maxContextChunks,
    });

    const systemPrompt = buildSystemPrompt({
      userName: params.userName,
      departmentId: params.departmentId,
      retrievedContext: relevantChunks.map((item) => item.content),
      extraInstruction: params.extraInstruction,
    });

    const modelMessages: ChatMessageInput[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages
        .reverse()
        .map((message) => ({
          role: mapStoredRoleToModelRole(message.role),
          content: message.content,
        }))
        .filter((message) => message.content.trim().length > 0),
    ];

    const completion = await ollamaService.chat(modelMessages, params.model);
    const assistantMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.ASSISTANT,
        content: completion.content,
        model: completion.model,
        promptTokens: completion.inputTokens,
        completionTokens: completion.outputTokens,
        totalTokens: completion.totalTokens,
        latencyMs: completion.latencyMs,
        metadata: {
          finishReason: completion.finishReason,
          contextSources: relevantChunks.slice(0, 5).map((item) => item.sourceId),
        },
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        title:
          conversation.title === 'Nova conversa'
            ? normalizeConversationTitle(userMessage.content)
            : undefined,
      },
    });

    await apiKeyService.recordUsage({
      tenantId: params.tenantId,
      conversationId: conversation.id,
      userId: params.userId,
      source: 'ADMIN_CHAT',
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      totalTokens: completion.totalTokens,
      estimatedCostCents: 0,
    });

    return {
      conversationId: conversation.id,
      assistantMessage,
      contextSources: relevantChunks.length,
    };
  }

  async completeStateless(params: {
    tenantId: string;
    userId?: string;
    userName?: string;
    departmentId?: string;
    prompt: string;
    model?: string;
    extraInstruction?: string;
    source: 'INTERNAL_API' | 'PUBLIC_API' | 'ADMIN_CHAT';
    apiKeyId?: string;
    planId?: string;
  }): Promise<{
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    contextSources: number;
  }> {
    const prompt = params.prompt.trim();
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const relevantChunks = await knowledgeService.searchRelevantChunks({
      tenantId: params.tenantId,
      query: prompt,
      limit: config.maxContextChunks,
    });

    const systemPrompt = buildSystemPrompt({
      userName: params.userName,
      departmentId: params.departmentId,
      retrievedContext: relevantChunks.map((item) => item.content),
      extraInstruction: params.extraInstruction,
    });

    const completion = await ollamaService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      params.model,
    );

    await apiKeyService.recordUsage({
      tenantId: params.tenantId,
      planId: params.planId,
      apiKeyId: params.apiKeyId,
      userId: params.userId,
      source: params.source,
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      totalTokens: completion.totalTokens,
      estimatedCostCents: 0,
    });

    return {
      content: completion.content,
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      totalTokens: completion.totalTokens,
      contextSources: relevantChunks.length,
    };
  }
}

export const chatService = new ChatService();
