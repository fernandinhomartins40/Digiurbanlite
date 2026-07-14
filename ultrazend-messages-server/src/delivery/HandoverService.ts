/**
 * HandoverService
 * Gerencia transição bot → humano → bot
 */

import prisma from '../utils/prisma';
import { WebSocketServer } from '../server/WebSocketServer';
import { resolveTenantId } from '../utils/tenant';

export class HandoverService {
  private wsServer: WebSocketServer | null = null;
  private autoResumeTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(wsServer?: WebSocketServer) {
    if (wsServer) {
      this.wsServer = wsServer;
    }
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  /**
   * Lista conversas aguardando atendimento humano (fila de handover)
   */
  async getPendingHandoverQueue(departmentId?: string) {
    const where: any = {
      isBotConversation: true,
      status: 'ACTIVE',
      activeFlowExecution: {
        isPaused: true,
      },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        activeFlowExecution: {
          select: {
            id: true,
            isPaused: true,
            pausedAt: true,
            pausedBy: true,
            pauseReason: true,
            currentNodeId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'asc', // FIFO: primeiro que pausou é atendido primeiro
      },
    });

    // Buscar dados dos cidadãos
    const conversationsWithCitizen = await Promise.all(
      conversations.map(async (conv) => {
        const citizen = await prisma.citizen.findUnique({
          where: { id: conv.participant1Id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        });

        const waitTime = conv.activeFlowExecution?.pausedAt
          ? Math.floor((Date.now() - conv.activeFlowExecution.pausedAt.getTime()) / 1000)
          : 0;

        return {
          conversationId: conv.id,
          citizenId: citizen?.id || conv.participant1Id,
          citizenName: citizen?.name || 'Cidadão',
          citizenEmail: citizen?.email,
          citizenPhone: citizen?.phone,
          lastMessage: conv.lastMessagePreview,
          pausedAt: conv.activeFlowExecution?.pausedAt,
          pausedBy: conv.activeFlowExecution?.pausedBy,
          pauseReason: conv.activeFlowExecution?.pauseReason,
          waitTime, // segundos
          departmentId: conv.departmentId,
          protocolId: conv.protocolId,
        };
      })
    );

    return conversationsWithCitizen;
  }

  /**
   * Servidor assume conversa (takeover)
   */
  async takeoverConversation(conversationId: string, serverId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        activeFlowExecution: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    if (!conversation.activeFlowExecution?.isPaused) {
      throw new Error('Conversa não está aguardando atendimento humano');
    }

    // Atualizar metadata da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: {
          ...((conversation.metadata as any) || {}),
          botStatus: 'HUMAN_TAKEOVER',
          takenOverBy: serverId,
          takenOverAt: new Date().toISOString(),
        },
      },
    });

    // Cancelar auto-resume se existir
    this.cancelAutoResume(conversationId);

    // Notificar cidadão via WebSocket
    if (this.wsServer) {
      this.wsServer.sendMessageToUser(
        conversation.participant1Id,
        'CITIZEN',
        'handover:takeover',
        {
          conversationId,
          message: 'Um atendente humano assumiu sua conversa',
        }
      );
    }

    return {
      success: true,
      conversationId,
      serverId,
    };
  }

  /**
   * Notificar departamento sobre nova conversa aguardando
   */
  async notifyDepartmentHandover(
    conversationId: string,
    departmentId: string | null,
    reason: string
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participant1Id: true,
        lastMessagePreview: true,
      },
    });

    if (!conversation) {
      return;
    }

    const citizen = await prisma.citizen.findUnique({
      where: { id: conversation.participant1Id },
      select: { name: true },
    });

    // Emitir WebSocket para todos os servidores do departamento
    if (this.wsServer && departmentId) {
      this.wsServer.broadcastToDepartment(departmentId, 'handover:new', {
        conversationId: conversation.id,
        citizenName: citizen?.name || 'Cidadão',
        lastMessage: conversation.lastMessagePreview,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    // Agendar auto-resume (10 minutos)
    this.scheduleAutoResume(conversationId, conversation.participant1Id, 10 * 60 * 1000);
  }

  /**
   * Agendar retomada automática do bot (timeout)
   */
  private scheduleAutoResume(conversationId: string, _citizenId: string, delay: number) {
    // Cancelar timeout existente
    this.cancelAutoResume(conversationId);

    // Criar novo timeout
    const timeout = setTimeout(async () => {
      try {
        // Verificar se ainda está pausado
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            activeFlowExecution: true,
          },
        });

        if (conversation?.activeFlowExecution?.isPaused) {
          // Retomar execução
          await prisma.flowExecution.update({
            where: { id: conversation.activeFlowExecution.id },
            data: {
              isPaused: false,
              resumedAt: new Date(),
              resumedBy: 'SYSTEM_AUTO_RESUME',
            },
          });

          // Atualizar conversa
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              metadata: {
                ...((conversation.metadata as any) || {}),
                botStatus: 'ACTIVE',
                botStatusUpdatedAt: new Date().toISOString(),
                autoResumeReason: 'timeout_10min',
              },
            },
          });

          // Enviar mensagem ao cidadão
          const botMessage = await prisma.message.create({
            data: {
              // Fase 5 multi-tenant: mensagem herda o tenant (ALS ou conversa)
              tenantId: await resolveTenantId({ conversationId }),
              conversationId,
              senderId: 'DIGIBOT_SYSTEM',
              senderType: 'SYSTEM',
              content:
                '⏰ Desculpe pela espera. Retomando atendimento automático. Como posso ajudar?',
              contentType: 'TEXT',
              status: 'SENT',
              sentAt: new Date(),
              isBotMessage: true,
              botInteractionType: 'system_message',
            },
          });

          // Notificar via WebSocket
          if (this.wsServer) {
            this.wsServer.sendMessageToConversation(conversationId, 'message:new', {
              conversationId,
              message: botMessage,
            });
          }
        }

        // Remover timeout do map
        this.autoResumeTimeouts.delete(conversationId);
      } catch (error) {
        console.error('[HandoverService] Erro no auto-resume:', error);
      }
    }, delay);

    this.autoResumeTimeouts.set(conversationId, timeout);
  }

  /**
   * Cancelar auto-resume agendado
   */
  private cancelAutoResume(conversationId: string) {
    const existing = this.autoResumeTimeouts.get(conversationId);
    if (existing) {
      clearTimeout(existing);
      this.autoResumeTimeouts.delete(conversationId);
    }
  }

  /**
   * Limpar todos os timeouts (cleanup ao fechar servidor)
   */
  cleanup() {
    for (const timeout of this.autoResumeTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.autoResumeTimeouts.clear();
  }
}

export default HandoverService;
