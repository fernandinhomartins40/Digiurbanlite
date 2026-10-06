/**
 * Atendimento humano na conversa do assistente (bot → atendente → bot).
 *
 * - Fila: conversas pausadas pedindo atendente, do município, ainda sem dono.
 * - Assumir: trava para dois atendentes não pegarem a mesma conversa; quem
 *   assume passa a poder responder (ver canWriteConversation) e a conversa
 *   aparece na lista dele.
 * - Aviso de chegada vai para TODOS os servidores do município (antes ia só
 *   para a secretaria da conversa — e a do assistente não tem secretaria).
 * - Ninguém assumiu no tempo do painel (DigiBot › atendimento humano): volta
 *   para o assistente com aviso. Conferido por horário gravado, a cada minuto
 *   (antes era um cronômetro em memória que sumia a cada reinício).
 */

import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { WebSocketServer } from '../server/WebSocketServer';
import { resolveTenantId, DEFAULT_TENANT_ID } from '../utils/tenant';
import { runWithTenant } from '../bot/tenant-context';
import { botConfig, ensureBotKnowledge } from '../bot/ai/botKnowledge';
import { emitToTenantServers } from './chatDelivery';

export class HandoverError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export class HandoverService {
  private wsServer: WebSocketServer | null = null;

  constructor(wsServer?: WebSocketServer) {
    if (wsServer) {
      this.wsServer = wsServer;
    }
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  /** Mensagem do sistema na conversa (entra no histórico e chega na hora) */
  async systemMessage(conversationId: string, content: string, extra: Record<string, unknown> = {}) {
    const message = await prisma.message.create({
      data: {
        tenantId: await resolveTenantId({ conversationId }),
        conversationId,
        senderId: 'DIGIBOT_SYSTEM',
        senderType: 'SYSTEM',
        content,
        contentType: 'TEXT',
        status: 'SENT',
        sentAt: new Date(),
        isBotMessage: true,
        botInteractionType: 'system_message',
        metadata: extra as any,
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessagePreview: content.substring(0, 100), totalMessages: { increment: 1 } },
    });
    this.wsServer?.sendMessageToConversation(conversationId, 'message:new', { conversationId, message });
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { participant1Id: true } });
    if (conv) this.wsServer?.sendMessageToUser(conv.participant1Id, 'CITIZEN', 'message:new', { conversationId, message });
    return message;
  }

  /** Fila do município: pediram atendente e ninguém assumiu ainda */
  async getPendingHandoverQueue(departmentId?: string, tenantId?: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        tenantId: tenantId || DEFAULT_TENANT_ID,
        isBotConversation: true,
        status: 'ACTIVE',
        activeFlowExecution: { isPaused: true },
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        activeFlowExecution: {
          select: { id: true, isPaused: true, pausedAt: true, pausedBy: true, pauseReason: true },
        },
      },
      take: 200,
    });

    const waiting = conversations
      .filter((conv) => !((conv.metadata as Record<string, any> | null) || {}).takenOverBy)
      .sort(
        (a, b) =>
          (a.activeFlowExecution?.pausedAt?.getTime() || 0) - (b.activeFlowExecution?.pausedAt?.getTime() || 0)
      );

    const citizens = await prisma.citizen.findMany({
      where: { id: { in: waiting.map((conv) => conv.participant1Id) } },
      select: { id: true, name: true, email: true, phone: true },
    });
    const byId = new Map(citizens.map((c) => [c.id, c]));

    return waiting.map((conv) => {
      const citizen = byId.get(conv.participant1Id);
      const pausedAt = conv.activeFlowExecution?.pausedAt;
      return {
        conversationId: conv.id,
        citizenId: conv.participant1Id,
        citizenName: citizen?.name || 'Cidadão',
        citizenEmail: citizen?.email,
        citizenPhone: citizen?.phone,
        lastMessage: conv.lastMessagePreview,
        pausedAt,
        pausedBy: conv.activeFlowExecution?.pausedBy,
        pauseReason: conv.activeFlowExecution?.pauseReason,
        waitTime: pausedAt ? Math.floor((Date.now() - pausedAt.getTime()) / 1000) : 0, // segundos
        departmentId: conv.departmentId,
        protocolId: conv.protocolId,
      };
    });
  }

  /**
   * Servidor assume a conversa. Se o assistente ainda não estava pausado
   * (servidor que viu a conversa e resolveu entrar), pausa agora.
   */
  async takeoverConversation(conversationId: string, server: { userId: string; tenantId: string; name?: string | null }) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { activeFlowExecution: true },
    });
    if (!conversation || !conversation.isBotConversation || (conversation.tenantId || DEFAULT_TENANT_ID) !== server.tenantId) {
      throw new HandoverError('Conversa não encontrada', 404);
    }
    const metadata = (conversation.metadata as Record<string, any> | null) || {};
    if (metadata.takenOverBy === server.userId) return { success: true, conversationId, alreadyMine: true };
    if (metadata.takenOverBy) {
      const other = await prisma.user.findUnique({ where: { id: String(metadata.takenOverBy) }, select: { name: true } }).catch(() => null);
      throw new HandoverError(`${other?.name?.split(' ')[0] || 'Outro atendente'} já está atendendo esta conversa`, 409);
    }

    const attendant = server.name || (await prisma.user.findUnique({ where: { id: server.userId }, select: { name: true } }))?.name || 'Atendente';
    const firstName = attendant.split(' ')[0];
    const now = new Date();

    // trava: só grava se a conversa não mudou desde a leitura (dois cliques ao mesmo tempo)
    const taken = await prisma.conversation.updateMany({
      where: { id: conversationId, updatedAt: conversation.updatedAt },
      data: {
        metadata: {
          ...metadata,
          botStatus: 'HUMAN_TAKEOVER',
          botStatusUpdatedAt: now.toISOString(),
          takenOverBy: server.userId,
          takenOverAt: now.toISOString(),
        },
        // o atendente vê a conversa como "lado 2": zera o contador dele
        unreadCount2: 0,
      },
    });
    if (taken.count === 0) throw new HandoverError('Outro atendente acabou de assumir esta conversa', 409);

    if (conversation.activeFlowExecution && !conversation.activeFlowExecution.isPaused) {
      await prisma.flowExecution.update({
        where: { id: conversation.activeFlowExecution.id },
        data: { isPaused: true, pausedAt: now, pausedBy: server.userId, pauseReason: 'server_takeover' },
      });
    }

    await this.systemMessage(conversationId, `${firstName}, da prefeitura, assumiu o atendimento e vai continuar a conversa por aqui.`, {
      handover: 'taken',
      attendantName: firstName,
    });

    this.wsServer?.sendMessageToUser(conversation.participant1Id, 'CITIZEN', 'handover:takeover', {
      conversationId,
      attendantName: firstName,
      message: `${firstName} assumiu o atendimento`,
    });
    emitToTenantServers(server.tenantId, 'handover:taken', { conversationId, attendantId: server.userId, attendantName: firstName });

    return { success: true, conversationId, attendantName: firstName };
  }

  /** O assistente pediu atendente: avisa todos os servidores do município (e a secretaria, se houver) */
  async notifyHandoverRequested(conversationId: string, reason: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, tenantId: true, departmentId: true, participant1Id: true, lastMessagePreview: true },
    });
    if (!conversation) return;
    const citizen = await prisma.citizen.findUnique({ where: { id: conversation.participant1Id }, select: { name: true } });
    const payload = {
      conversationId: conversation.id,
      citizenName: citizen?.name || 'Cidadão',
      lastMessage: conversation.lastMessagePreview,
      reason,
      timestamp: new Date().toISOString(),
    };
    emitToTenantServers(conversation.tenantId, 'handover:new', payload);
    if (conversation.departmentId && this.wsServer) {
      await this.wsServer.broadcastToDepartment(conversation.departmentId, 'handover:new', payload);
    }
  }

  /**
   * Rotina de 1 minuto: quem espera há mais que o tempo do painel sem ninguém
   * assumir volta para o assistente, com aviso honesto.
   */
  async returnExpiredToBot(): Promise<number> {
    const waiting = await prisma.conversation.findMany({
      where: {
        isBotConversation: true,
        status: 'ACTIVE',
        activeFlowExecution: { isPaused: true, pausedAt: { lt: new Date(Date.now() - 60_000) } },
      },
      select: {
        id: true,
        tenantId: true,
        metadata: true,
        activeFlowExecution: { select: { id: true, pausedAt: true } },
      },
      take: 200,
    });

    let returned = 0;
    for (const conv of waiting) {
      const metadata = (conv.metadata as Record<string, any> | null) || {};
      if (metadata.takenOverBy || !conv.activeFlowExecution?.pausedAt) continue;
      const tenantId = conv.tenantId || DEFAULT_TENANT_ID;
      try {
        await runWithTenant(tenantId, async () => {
          await ensureBotKnowledge();
          const human = botConfig().human;
          const limitMin = Number(human.maxWaitMinutes) || 0;
          if (limitMin <= 0) return; // município escolheu esperar sem limite
          if (Date.now() - conv.activeFlowExecution!.pausedAt!.getTime() < limitMin * 60_000) return;

          await prisma.flowExecution.update({
            where: { id: conv.activeFlowExecution!.id },
            data: { isPaused: false, resumedAt: new Date(), resumedBy: 'SYSTEM_AUTO_RESUME' },
          });
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              metadata: {
                ...metadata,
                botStatus: 'ACTIVE',
                botStatusUpdatedAt: new Date().toISOString(),
                autoResumeReason: `sem atendente em ${limitMin} min`,
              },
            },
          });
          await this.systemMessage(conv.id, human.noAttendantMessage, { handover: 'expired' });
          emitToTenantServers(tenantId, 'handover:taken', { conversationId: conv.id, expired: true });
          returned += 1;
        });
      } catch (error) {
        logger.error('[handover] falha ao devolver conversa ao assistente', { conversationId: conv.id, error });
      }
    }
    return returned;
  }
}

export default HandoverService;
