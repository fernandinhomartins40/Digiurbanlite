/**
 * ============================================================================
 * PROTOCOL STATUS ENGINE - Motor Centralizado de Status
 * ============================================================================
 *
 * Gerencia TODAS as mudanças de status de protocolos no sistema.
 * Garante validação, histórico e consistência.
 *
 * ÚNICO PONTO DE ENTRADA para alterações de status.
 */

import { ProtocolStatus, UserRole, Prisma } from '@prisma/client';
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
   * - Execução de hooks
   * - Notificações
   */
  async updateStatus(input: UpdateStatusInput): Promise<StatusTransitionResult> {
    // 1️⃣ BUSCAR PROTOCOLO ATUAL
    const protocol = await prisma.protocolSimplified.findUnique({
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
      console.log(`⚠️ Status já é ${input.newStatus}, ignorando atualização`);
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
      protocol
    });

    // 3️⃣ EXECUTAR TRANSAÇÃO ATÔMICA
    const result = await prisma.$transaction(async (tx) => {
      // 3.1 - Atualizar status do protocolo
      const updatedProtocol = await tx.protocolSimplified.update({
        where: { id: input.protocolId },
        data: {
          status: input.newStatus,
          updatedAt: new Date(),

          // Se status terminal, marcar conclusão
          ...(isTerminalStatus(input.newStatus) && {
            concludedAt: new Date()
          })
        },
        include: {
          service: true,
          citizen: true,
          department: true
        }
      });

      // 3.2 - SEMPRE registrar no histórico
      const history = await tx.protocolHistorySimplified.create({
        data: {
          protocolId: input.protocolId,
          action: getActionForStatus(input.newStatus),
          oldStatus: currentStatus,
          newStatus: input.newStatus,
          comment: input.comment || getDefaultComment(input.newStatus),
          userId: input.actorRole !== 'CITIZEN' ? input.actorId : undefined,
          metadata: {
            actorRole: input.actorRole,
            reason: input.reason,
            ...input.metadata
          } as any
        }
      });

      // 3.3 - Executar hooks específicos do módulo
      await this.executeModuleHooks(tx, updatedProtocol, currentStatus, input.newStatus);

      return {
        protocol: updatedProtocol,
        previousStatus: currentStatus,
        newStatus: input.newStatus,
        transitionedAt: new Date(),
        historyId: history.id
      };
    });

    // 4️⃣ PÓS-TRANSAÇÃO: Notificações (fora da transação para não bloquear)
    this.sendNotifications(result.protocol, currentStatus, input.newStatus).catch((error) => {
      console.error('❌ Erro ao enviar notificações:', error);
      // Não falha a transação se notificação falhar
    });

    console.log(`✅ Status atualizado: ${currentStatus} → ${input.newStatus} (Protocolo: ${protocol.number})`);

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
    const { currentStatus, newStatus, actorRole, protocolType, protocol } = context;

    // 1. Verificar se status é terminal
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

    // 3. ✅ FASE 1: Validações específicas por tipo de serviço
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
   * HOOKS DE MÓDULO
   * ============================================================================
   */

  /**
   * Executa hooks específicos do módulo após mudança de status
   */
  private async executeModuleHooks(
    tx: Prisma.TransactionClient,
    protocol: any,
    oldStatus: ProtocolStatus,
    newStatus: ProtocolStatus
  ): Promise<void> {
    const moduleType = protocol.moduleType;

    if (!moduleType) {
      return; // Sem módulo, sem hooks
    }

    // Hook: PROGRESSO → Ativar entidade do módulo (se existir)
    if (newStatus === ProtocolStatus.PROGRESSO && oldStatus === ProtocolStatus.VINCULADO) {
      await this.activateModuleEntity(tx, protocol);
    }

    // Hook: CONCLUIDO → Marcar entidade como concluída
    if (newStatus === ProtocolStatus.CONCLUIDO) {
      await this.completeModuleEntity(tx, protocol);
    }

    // Hook: CANCELADO → Inativar entidade
    if (newStatus === ProtocolStatus.CANCELADO) {
      await this.deactivateModuleEntity(tx, protocol);
    }

    // Hook: PENDENCIA → Marcar entidade como pendente
    if (newStatus === ProtocolStatus.PENDENCIA) {
      await this.markModuleEntityPending(tx, protocol);
    }
  }

  /**
   * Ativar entidade do módulo quando protocolo vai para PROGRESSO
   */
  private async activateModuleEntity(
    tx: Prisma.TransactionClient,
    protocol: any
  ): Promise<void> {
    const moduleType = protocol.moduleType;

    if (moduleType) {
      console.log(`✓ Protocolo aprovado para módulo ${moduleType} - dados em customData`);
      // Com o novo sistema de templates, não há tabelas específicas de módulos
      // Os dados ficam em ProtocolSimplified.customData
    }
  }

  /**
   * Marcar entidade como concluída quando protocolo é concluído
   */
  private async completeModuleEntity(
    tx: Prisma.TransactionClient,
    protocol: any
  ): Promise<void> {
    const moduleType = protocol.moduleType;

    if (moduleType) {
      console.log(`✓ Protocolo concluído para módulo ${moduleType} - dados em customData`);
    }
  }

  /**
   * Inativar entidade quando protocolo é cancelado
   */
  private async deactivateModuleEntity(
    tx: Prisma.TransactionClient,
    protocol: any
  ): Promise<void> {
    const moduleType = protocol.moduleType;

    if (moduleType) {
      console.log(`✓ Protocolo cancelado para módulo ${moduleType} - dados em customData`);
    }
  }

  /**
   * Marcar entidade como pendente
   */
  private async markModuleEntityPending(
    tx: Prisma.TransactionClient,
    protocol: any
  ): Promise<void> {
    const moduleType = protocol.moduleType;

    if (moduleType) {
      console.log(`✓ Protocolo com pendência para módulo ${moduleType} - dados em customData`);
    }
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
    // TODO: Implementar sistema de notificações
    // - Email para cidadão
    // - Notificação in-app
    // - SMS (opcional)

    console.log(`📧 [Notificação] Protocolo ${protocol.number}: ${oldStatus} → ${newStatus}`);
    console.log(`   Cidadão: ${protocol.citizen?.name || 'N/A'}`);
    console.log(`   Departamento: ${protocol.department?.name || 'N/A'}`);

    // Aqui você pode integrar com serviço de email, SMS, etc.
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
