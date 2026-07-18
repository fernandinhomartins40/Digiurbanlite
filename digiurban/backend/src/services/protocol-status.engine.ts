/**
 * ============================================================================
 * PROTOCOL STATUS ENGINE - Motor Centralizado de Status
 * ============================================================================
 *
 * Gerencia TODAS as mudanças de status de protocolos no sistema.
 * Garante validação, histórico e consistência.
 *
 * ÚNICO PONTO DE ENTRADA para alterações de status.
 * Nenhuma rota/serviço deve fazer `protocolSimplified.update({ status })`
 * diretamente.
 */

import { ProtocolStatus, UserRole, Prisma } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';
import { prisma } from '../lib/prisma';
import {
  UpdateStatusInput,
  StatusTransitionResult,
  TransitionValidationContext,
  InvalidTransitionError,
  PermissionDeniedError
} from '../types/protocol-status.types';
import {
  isTransitionAllowed,
  isTerminalStatus,
  getActionForStatus,
  getDefaultComment,
  SERVICE_TYPE_VALIDATIONS
} from '../config/protocol-status.config';
import messageNotificationService from '../lib/messages/MessageNotificationService';
import NotificationTriggers from './notification-triggers';

/**
 * ============================================================================
 * PROTOCOL STATUS ENGINE CLASS
 * ============================================================================
 */
export class ProtocolStatusEngine {
  /**
   * ⭐ MÉTODO PRINCIPAL - ÚNICO PONTO DE ATUALIZAÇÃO DE STATUS
   *
   * Todas as rotas e serviços DEVEM usar este método para alterar status.
   * Garante:
   * - Validação de transições
   * - Registro de histórico
   * - Finalização do SLA em status terminal
   * - Notificações
   *
   * @param tx Transação externa opcional. Quando fornecida, TODA a mudança
   *           (validação + update + histórico + SLA) roda dentro dela — se o
   *           chamador der rollback, nada persiste. Notificações são enviadas
   *           mesmo assim (fire-and-forget, não-fatais).
   */
  async updateStatus(
    input: UpdateStatusInput,
    tx?: Prisma.TransactionClient
  ): Promise<StatusTransitionResult> {
    const db = tx ?? prisma;

    // 1️⃣ BUSCAR PROTOCOLO ATUAL
    const protocol = await db.protocolSimplified.findUnique({
      where: { id: input.protocolId },
      include: {
        service: true,
        citizen: true,
        department: true
      }
    });

    if (!protocol) {
      throw new Error(`Protocolo não encontrado: ${input.protocolId}`);
    }

    const currentStatus = protocol.status as ProtocolStatus;

    // Não fazer nada se o status já é o mesmo
    if (currentStatus === input.newStatus) {
      return {
        protocol,
        previousStatus: currentStatus,
        newStatus: input.newStatus,
        transitionedAt: new Date(),
        historyId: ''
      };
    }

    // 2️⃣ VALIDAR TRANSIÇÃO
    await this.validateTransition({
      currentStatus,
      newStatus: input.newStatus,
      actorRole: input.actorRole,
      protocolType: protocol.service.serviceType,
      protocol,
      metadata: input.metadata
    });

    // 3️⃣ EXECUTAR TRANSAÇÃO ATÔMICA (ou usar a transação do chamador)
    const runTransition = async (txc: Prisma.TransactionClient) => {
      const isReopening =
        isTerminalStatus(currentStatus) && !isTerminalStatus(input.newStatus);

      // 3.1 - Atualizar status do protocolo
      const updatedProtocol = await txc.protocolSimplified.update({
        where: { id: input.protocolId },
        data: {
          status: input.newStatus,
          updatedAt: new Date(),

          // Status terminal marca o encerramento; reabertura limpa a marca
          ...(isTerminalStatus(input.newStatus)
            ? { concludedAt: new Date() }
            : isReopening
              ? { concludedAt: null }
              : {})
        },
        include: {
          service: true,
          citizen: true,
          department: true
        }
      });

      // 3.2 - SEMPRE registrar no histórico
      const history = await txc.protocolHistorySimplified.create({
        data: {
          protocolId: input.protocolId,
          action: getActionForStatus(input.newStatus),
          oldStatus: currentStatus,
          newStatus: input.newStatus,
          comment: input.comment || getDefaultComment(input.newStatus),
          userId:
            input.actorRole !== 'CITIZEN' && input.actorRole !== 'SYSTEM'
              ? input.actorId
              : undefined,
          metadata: {
            actorRole: input.actorRole,
            actorId: input.actorId,
            ...(input.actorRole === 'CITIZEN' && { citizenId: input.actorId }),
            reason: input.reason,
            ...input.metadata
          } as any
        }
      });

      // 3.3 - Status terminal finaliza o SLA na MESMA transação
      if (isTerminalStatus(input.newStatus)) {
        await this.finalizeSLA(txc, input.protocolId);
      }

      return {
        protocol: updatedProtocol,
        previousStatus: currentStatus,
        newStatus: input.newStatus,
        transitionedAt: new Date(),
        historyId: history.id
      };
    };

    const result = tx ? await runTransition(tx) : await prisma.$transaction(runTransition);

    // 4️⃣ PÓS-TRANSAÇÃO: Notificações (fora da transação para não bloquear)
    this.sendNotifications(result.protocol, currentStatus, input.newStatus).catch((error) => {
      console.error('❌ Erro ao enviar notificações:', error);
      // Não falha a transação se notificação falhar
    });

    NotificationTriggers.onProtocolStatusChanged(
      result.protocol.id,
      currentStatus,
      input.newStatus
    ).catch((error) => {
      console.error('❌ Erro ao disparar trigger de notificação:', error);
    });

    return result;
  }

  /**
   * ============================================================================
   * VALIDAÇÃO DE TRANSIÇÕES
   * ============================================================================
   */

  /**
   * Valida se a transição de status é permitida
   */
  private async validateTransition(context: TransitionValidationContext): Promise<void> {
    const { currentStatus, newStatus, actorRole, protocolType, protocol, metadata } = context;

    // 1. Verificar se status é terminal
    const isReopen =
      (newStatus === ProtocolStatus.PROGRESSO || newStatus === ProtocolStatus.PENDENCIA) &&
      metadata?.action === 'reopen' &&
      actorRole !== 'CITIZEN';

    if (isReopen) {
      return;
    }

    if (isTerminalStatus(currentStatus) && actorRole !== UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new InvalidTransitionError(
        `Protocolo já está em status terminal: ${currentStatus}. Apenas administradores podem alterar.`,
        currentStatus,
        newStatus,
        actorRole
      );
    }

    // 2. Verificar permissão de transição
    if (!isTransitionAllowed(currentStatus, newStatus, actorRole)) {
      throw new PermissionDeniedError(
        `Transição não permitida: ${currentStatus} → ${newStatus} para ${actorRole}`,
        actorRole
      );
    }

    // 3. Validações específicas por tipo de serviço
    if (protocolType === 'COM_DADOS') {
      const validation = SERVICE_TYPE_VALIDATIONS.COM_DADOS;

      // ✅ BLOQUEAR: VINCULADO → CONCLUIDO (deve passar por PROGRESSO)
      if (currentStatus === ProtocolStatus.VINCULADO && newStatus === ProtocolStatus.CONCLUIDO) {
        throw new InvalidTransitionError(
          `Serviços COM_DADOS não podem ser concluídos diretamente. É necessário iniciar o workflow (status PROGRESSO).`,
          currentStatus,
          newStatus,
          actorRole
        );
      }

      // Serviços COM_DADOS podem requerer aprovação específica
      if (validation.requiresApproval && newStatus === ProtocolStatus.CONCLUIDO) {
        // Permitir conclusão direta apenas de status aprovados (PROGRESSO)
        if (currentStatus !== ProtocolStatus.PROGRESSO && currentStatus !== ProtocolStatus.CONCLUIDO) {
          throw new InvalidTransitionError(
            `Serviços COM_DADOS devem estar em PROGRESSO antes de concluir`,
            currentStatus,
            newStatus,
            actorRole
          );
        }
      }
    }

    // 4. Validação de campos obrigatórios
    if (newStatus === ProtocolStatus.CANCELADO && !context.protocol.customData) {
      // Cancelamento deveria ter um motivo, mas não bloqueamos
      console.warn(`⚠️ Protocolo ${protocol.number} cancelado sem motivo especificado`);
    }
  }

  /**
   * ============================================================================
   * SLA
   * ============================================================================
   */

  /**
   * Finaliza o SLA quando o protocolo entra em status terminal.
   * Roda dentro da transação da transição — se ela falhar, o SLA não é tocado.
   */
  private async finalizeSLA(
    tx: Prisma.TransactionClient,
    protocolId: string
  ): Promise<void> {
    const sla = await tx.protocolSLA.findUnique({ where: { protocolId } });

    if (!sla || sla.actualEndDate) {
      return; // Sem SLA ou já finalizado
    }

    const actualEndDate = new Date();
    const isOverdue = actualEndDate > sla.expectedEndDate;

    await tx.protocolSLA.update({
      where: { protocolId },
      data: {
        actualEndDate,
        isOverdue,
        daysOverdue: isOverdue
          ? differenceInCalendarDays(actualEndDate, sla.expectedEndDate)
          : 0
      }
    });
  }

  /**
   * ============================================================================
   * NOTIFICAÇÕES
   * ============================================================================
   */

  /**
   * Envia notificações sobre mudança de status
   */
  private async sendNotifications(
    protocol: any,
    oldStatus: ProtocolStatus,
    newStatus: ProtocolStatus
  ): Promise<void> {
    try {
      await messageNotificationService.notifyProtocolStatusChanged(
        protocol.id,
        oldStatus,
        newStatus
      );
    } catch (error) {
      console.error('✗ Erro ao enviar notificação via mensageiro:', error);
      // Não falha a transação se notificação falhar
    }
  }

  /**
   * ============================================================================
   * MÉTODOS AUXILIARES
   * ============================================================================
   */

  /**
   * Verifica se um protocolo pode ser cancelado pelo cidadão
   */
  async canCitizenCancel(protocolId: string): Promise<boolean> {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) {
      return false;
    }

    // Não pode cancelar se já estiver concluído ou cancelado
    return !isTerminalStatus(protocol.status as ProtocolStatus);
  }

  /**
   * Obtém histórico de mudanças de status de um protocolo
   */
  async getStatusHistory(protocolId: string) {
    return prisma.protocolHistorySimplified.findMany({
      where: { protocolId },
      orderBy: { timestamp: 'desc' }
    });
  }
}

/**
 * ============================================================================
 * SINGLETON EXPORT
 * ============================================================================
 */
export const protocolStatusEngine = new ProtocolStatusEngine();
