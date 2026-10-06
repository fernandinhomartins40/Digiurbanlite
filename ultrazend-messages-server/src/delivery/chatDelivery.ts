/**
 * Entrega de mensagens do chat — porta ÚNICA (tempo real, HTTP e avisos).
 *
 * Antes cada caminho (socket, /messages/send, /messages/send-auto) tinha a sua
 * cópia das regras e cada um esquecia uma coisa: município da mensagem,
 * validação do texto, contador de não lidas, aviso para quem está fora.
 *
 * - Grava a mensagem COM o município da conversa
 * - Atualiza a conversa (prévia, não lidas do outro lado, desarquiva)
 * - Emite em tempo real para a sala da conversa e para quem recebe
 * - Quem recebe está fora do chat: avisa pelo sininho/celular/e-mail
 *   (no máximo um aviso a cada 30 min por conversa)
 */

import type { Conversation, Message, ParticipantType } from '@prisma/client';
import type { Server as SocketIOServer } from 'socket.io';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { resolveTenantId, DEFAULT_TENANT_ID } from '../utils/tenant';
import { getServiceToken } from '../utils/serviceToken';
import { redis } from '../utils/botLock';
import { isAttendant, isParticipant } from '../server/accessControl';

const MAX_TEXT = 4000;
const NOTIFY_THROTTLE_S = 30 * 60;

let io: SocketIOServer | null = null;
export function setChatIO(server: SocketIOServer) {
  io = server;
}
export function getChatIO() {
  return io;
}

export class ChatError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface ChatSender {
  userId: string;
  userType: ParticipantType;
  tenantId?: string;
}

interface Attachment {
  url: string;
  name: string;
  mimeType: string | null;
  size: number | null;
}

/** Só aceita anexos no formato esperado (nada de objeto arbitrário no banco) */
function sanitizeAttachments(raw: unknown): Attachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 5)
    .map((item: any) => ({
      url: typeof item?.url === 'string' ? item.url.slice(0, 500) : '',
      name: typeof item?.name === 'string' ? item.name.slice(0, 200) : 'arquivo',
      mimeType: typeof item?.mimeType === 'string' ? item.mimeType.slice(0, 100) : null,
      size: Number.isFinite(Number(item?.size)) ? Number(item.size) : null,
    }))
    .filter((item) => /^(\/uploads\/|https:\/\/)/.test(item.url));
}

/** Lado de quem envia e de quem recebe na conversa */
function sides(conversation: Conversation, sender: ChatSender) {
  const asAccess = { userId: sender.userId, userType: sender.userType, tenantId: sender.tenantId };
  const senderIsP1 = conversation.participant1Id === sender.userId && conversation.participant1Type === sender.userType;
  if (senderIsP1) {
    return { recipientId: conversation.participant2Id, recipientType: conversation.participant2Type, recipientSide: 2 as const };
  }
  if (isParticipant(conversation as any, asAccess)) {
    return { recipientId: conversation.participant1Id, recipientType: conversation.participant1Type, recipientSide: 1 as const };
  }
  if (isAttendant(conversation as any, asAccess)) {
    // atendimento humano na conversa do assistente: o cidadão é sempre o participante 1
    return { recipientId: conversation.participant1Id, recipientType: conversation.participant1Type, recipientSide: 1 as const };
  }
  throw new ChatError('Você não participa desta conversa', 403);
}

export async function deliverChatMessage(
  conversation: Conversation,
  sender: ChatSender,
  input: { content?: unknown; attachments?: unknown; replyToId?: unknown }
): Promise<Message> {
  const content = String(input.content ?? '').trim();
  const attachments = sanitizeAttachments(input.attachments);
  if (!content && attachments.length === 0) throw new ChatError('Escreva a mensagem');
  if (content.length > MAX_TEXT) throw new ChatError(`A mensagem passou de ${MAX_TEXT} caracteres`);

  const { recipientId, recipientType, recipientSide } = sides(conversation, sender);

  let replyToId: string | null = null;
  if (typeof input.replyToId === 'string' && input.replyToId) {
    const original = await prisma.message.findFirst({
      where: { id: input.replyToId.slice(0, 40), conversationId: conversation.id },
      select: { id: true },
    });
    replyToId = original?.id || null;
  }

  const contentType = attachments.length
    ? attachments.every((a) => a.mimeType?.startsWith('image/'))
      ? 'IMAGE'
      : 'DOCUMENT'
    : 'TEXT';
  const now = new Date();
  const tenantId = conversation.tenantId || (await resolveTenantId({ conversationId: conversation.id }));

  const message = await prisma.message.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      senderId: sender.userId,
      senderType: sender.userType,
      content: content || `Arquivo enviado (${attachments.length})`,
      contentType,
      attachments: attachments as any,
      replyToId,
      status: 'SENT',
      sentAt: now,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      lastMessagePreview: message.content.substring(0, 100),
      totalMessages: { increment: 1 },
      // conversa arquivada volta para a lista quando chega mensagem nova
      ...(conversation.status === 'ARCHIVED' ? { status: 'ACTIVE' } : {}),
      ...(recipientSide === 1
        ? { unreadCount1: { increment: 1 }, deletedAt1: null }
        : { unreadCount2: { increment: 1 }, deletedAt2: null }),
    },
  });

  const payload = { conversationId: conversation.id, message };
  if (io) {
    io.to(`conversation:${conversation.id}`).emit('message:new', payload);
    io.to(`user:${recipientId}:${recipientType}`).emit('message:new', payload);
    // outras abas de quem enviou (a tela ignora repetidas pelo id)
    io.to(`user:${sender.userId}:${sender.userType}`).emit('message:new', payload);
  }

  void notifyIfOffline({
    recipientId,
    recipientType,
    tenantId,
    conversationId: conversation.id,
    sender,
    preview: message.content,
  }).catch((error) => logger.warn('chat: falha ao avisar destinatário fora do chat', { error: error?.message || error }));

  return message;
}

async function senderName(sender: ChatSender): Promise<string> {
  if (sender.userType === 'CITIZEN') {
    const citizen = await prisma.citizen.findUnique({ where: { id: sender.userId }, select: { name: true } });
    return citizen?.name?.split(' ')[0] || 'Cidadão';
  }
  if (sender.userType === 'SERVER') {
    const user = await prisma.user.findUnique({ where: { id: sender.userId }, select: { name: true } }).catch(() => null);
    return user?.name?.split(' ')[0] || 'Prefeitura';
  }
  return 'Prefeitura';
}

const memoryThrottle = new Map<string, number>();

async function firstNoticeInWindow(key: string): Promise<boolean> {
  const client = await redis();
  if (client) {
    const result = await client.set(key, '1', { NX: true, EX: NOTIFY_THROTTLE_S });
    return result === 'OK';
  }
  const last = memoryThrottle.get(key) || 0;
  if (Date.now() - last < NOTIFY_THROTTLE_S * 1000) return false;
  memoryThrottle.set(key, Date.now());
  return true;
}

/** Aviso pelo sistema principal (sininho, celular e — para o cidadão — e-mail) */
export async function notifyIfOffline(params: {
  recipientId: string;
  recipientType: ParticipantType;
  tenantId: string | null;
  conversationId: string;
  sender: ChatSender;
  preview: string;
}) {
  const { recipientId, recipientType } = params;
  if (recipientType !== 'CITIZEN' && recipientType !== 'SERVER') return;
  if (!recipientId || recipientId.startsWith('platform:')) return;
  if (io) {
    const sockets = await io.in(`user:${recipientId}:${recipientType}`).fetchSockets();
    if (sockets.length > 0) return; // está com o chat aberto: já vê na hora
  }
  if (!(await firstNoticeInWindow(`chat-notify:${recipientType}:${recipientId}:${params.conversationId}`))) return;

  const name = await senderName(params.sender);
  const preview = params.preview.length > 140 ? `${params.preview.slice(0, 137)}...` : params.preview;
  const citizen = recipientType === 'CITIZEN';
  const apiUrl = (process.env.DIGIURBAN_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
  const token = await getServiceToken();
  const response = await fetch(`${apiUrl}/internal/notifications/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': params.tenantId || DEFAULT_TENANT_ID,
    },
    body: JSON.stringify({
      recipientType: citizen ? 'citizen' : 'user',
      recipientId,
      type: 'CHAT_MESSAGE',
      title: citizen ? 'Nova mensagem da prefeitura' : 'Nova mensagem no chat',
      message: `${name}: ${preview}`,
      data: {
        conversationId: params.conversationId,
        senderName: name,
        url: citizen ? '/cidadao/assistente' : '/admin/mensagens',
      },
      priority: 'normal',
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) logger.warn('chat: aviso fora do chat recusado pelo backend', { status: response.status });
}

/** Avisa todos os servidores do município (fila de atendimento humano) */
export function emitToTenantServers(tenantId: string | null, event: string, data: unknown) {
  if (!io) return;
  io.to(`t:${tenantId || DEFAULT_TENANT_ID}:servers`).emit(event, data);
}
