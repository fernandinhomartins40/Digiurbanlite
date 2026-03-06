import { AiConversation, AiMessage, AiMessageRole } from '@prisma/client';
import { config } from '../config/config';
import prisma from '../utils/prisma';
import { apiKeyService } from './api-key.service';
import { knowledgeService } from './knowledge.service';
import { ollamaService } from './ollama.service';
import { ChatMessageInput } from '../types';
import logger from '../utils/logger';

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

interface MessageAttachmentInput {
  name: string;
  mimeType?: string;
  size?: number;
  contentText?: string;
}

function normalizeAttachmentText(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+\n/g, '\n');
  if (!normalized) return undefined;
  return normalized.slice(0, 2500);
}

function normalizeAttachments(input?: MessageAttachmentInput[]): MessageAttachmentInput[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, 6)
    .map((item) => ({
      name: (item.name || '').trim().slice(0, 180),
      mimeType: item.mimeType?.trim().slice(0, 120) || undefined,
      size: typeof item.size === 'number' && Number.isFinite(item.size) ? Math.max(0, item.size) : undefined,
      contentText: normalizeAttachmentText(item.contentText),
    }))
    .filter((item) => item.name.length > 0);
}

function formatAttachmentSize(size?: number): string {
  if (!size || size <= 0) return '';

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAttachmentContext(attachments: MessageAttachmentInput[]): string {
  if (!attachments.length) return '';

  return attachments
    .map((attachment, index) => {
      const details = [
        attachment.mimeType || 'tipo-desconhecido',
        formatAttachmentSize(attachment.size),
      ]
        .filter(Boolean)
        .join(' | ');

      const header = `Arquivo ${index + 1}: ${attachment.name}${details ? ` (${details})` : ''}`;
      if (!attachment.contentText) return header;

      return `${header}\nConteudo extraido:\n${attachment.contentText}`;
    })
    .join('\n\n');
}

function extractAttachmentsFromMetadata(metadata: unknown): MessageAttachmentInput[] {
  if (!metadata || typeof metadata !== 'object') return [];

  const attachments = (metadata as { attachments?: unknown }).attachments;
  if (!Array.isArray(attachments)) return [];

  return normalizeAttachments(
    attachments.map((item) => {
      if (!item || typeof item !== 'object') return { name: '' };

      const raw = item as Record<string, unknown>;
      return {
        name: typeof raw.name === 'string' ? raw.name : '',
        mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : undefined,
        size: typeof raw.size === 'number' ? raw.size : undefined,
        contentText: typeof raw.contentText === 'string' ? raw.contentText : undefined,
      };
    }),
  );
}

function buildModelMessageContent(message: AiMessage): string {
  const baseContent = (message.content || '').trim();
  if (message.role !== AiMessageRole.USER) {
    return baseContent;
  }

  const attachments = extractAttachmentsFromMetadata(message.metadata);
  if (!attachments.length) {
    return baseContent;
  }

  const attachmentContext = buildAttachmentContext(attachments);
  if (!attachmentContext) {
    return baseContent;
  }

  return `${baseContent}\n\n[Arquivos anexados]\n${attachmentContext}`;
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
    attachments?: MessageAttachmentInput[];
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

    const attachments = normalizeAttachments(params.attachments);
    const attachmentsMetadata = attachments.map((attachment) => ({
      name: attachment.name,
      ...(attachment.mimeType ? { mimeType: attachment.mimeType } : {}),
      ...(typeof attachment.size === 'number' ? { size: attachment.size } : {}),
      ...(attachment.contentText ? { contentText: attachment.contentText } : {}),
    }));

    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: AiMessageRole.USER,
        content: normalized,
        metadata: attachmentsMetadata.length > 0 ? { attachments: attachmentsMetadata } : undefined,
      },
    });

    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: config.maxConversationMessagesContext,
    });

    let relevantChunks: Array<{ content: string; sourceId: string; score: number }> = [];
    try {
      relevantChunks = await knowledgeService.searchRelevantChunks({
        tenantId: params.tenantId,
        query: normalized,
        limit: config.maxContextChunks,
      });
    } catch (error) {
      logger.warn('Knowledge context lookup failed for chat message', {
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

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
          content: buildModelMessageContent(message),
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

    try {
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
    } catch (error) {
      logger.warn('Failed to record AI usage (message flow)', {
        tenantId: params.tenantId,
        conversationId: conversation.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

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

    let relevantChunks: Array<{ content: string; sourceId: string; score: number }> = [];
    try {
      relevantChunks = await knowledgeService.searchRelevantChunks({
        tenantId: params.tenantId,
        query: prompt,
        limit: config.maxContextChunks,
      });
    } catch (error) {
      logger.warn('Knowledge context lookup failed for stateless completion', {
        tenantId: params.tenantId,
        userId: params.userId,
        source: params.source,
        error: error instanceof Error ? error.message : String(error),
      });
    }

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

    try {
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
    } catch (error) {
      logger.warn('Failed to record AI usage (stateless flow)', {
        tenantId: params.tenantId,
        userId: params.userId,
        source: params.source,
        error: error instanceof Error ? error.message : String(error),
      });
    }

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
