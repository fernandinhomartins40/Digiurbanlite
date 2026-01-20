/**
 * FlowStateManager
 * Gerencia o estado de execuções de fluxos
 */

import { PrismaClient } from '@prisma/client';
import { FlowExecution, FlowState } from '../../../types/flow.types';

const prisma = new PrismaClient();

export class FlowStateManager {
  /**
   * Cria nova execução de fluxo
   */
  async createExecution(
    citizenId: string,
    flowId: string,
    conversationId?: string
  ): Promise<FlowExecution> {
    const execution = await prisma.flowExecution.create({
      data: {
        citizenId,
        flowId,
        conversationId,
        currentNodeId: 'start', // Todo fluxo começa no nodo 'start'
        state: {},
        history: [],
        status: 'ACTIVE',
      },
    });

    return this.mapToFlowExecution(execution);
  }

  /**
   * Busca execução ativa do cidadão
   */
  async getActiveExecution(citizenId: string): Promise<FlowExecution | null> {
    const execution = await prisma.flowExecution.findFirst({
      where: {
        citizenId,
        status: 'ACTIVE',
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return execution ? this.mapToFlowExecution(execution) : null;
  }

  /**
   * Busca execução por ID
   */
  async getExecution(executionId: string): Promise<FlowExecution | null> {
    const execution = await prisma.flowExecution.findUnique({
      where: { id: executionId },
    });

    return execution ? this.mapToFlowExecution(execution) : null;
  }

  /**
   * Atualiza nodo atual e estado
   */
  async updateExecution(
    executionId: string,
    updates: {
      currentNodeId?: string;
      stateUpdates?: Partial<FlowState>;
      addToHistory?: string;
      status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
      errorMessage?: string;
    }
  ): Promise<FlowExecution> {
    const execution = await prisma.flowExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const currentState = execution.state as FlowState;
    const currentHistory = execution.history as string[];

    const newState = updates.stateUpdates
      ? { ...currentState, ...updates.stateUpdates }
      : currentState;

    const newHistory = updates.addToHistory
      ? [...currentHistory, updates.addToHistory]
      : currentHistory;

    const updateData: any = {
      state: newState,
      history: newHistory,
      updatedAt: new Date(),
    };

    if (updates.currentNodeId) {
      updateData.currentNodeId = updates.currentNodeId;
    }

    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === 'COMPLETED' || updates.status === 'CANCELLED') {
        updateData.completedAt = new Date();
      }
    }

    if (updates.errorMessage) {
      updateData.errorMessage = updates.errorMessage;
    }

    const updated = await prisma.flowExecution.update({
      where: { id: executionId },
      data: updateData,
    });

    return this.mapToFlowExecution(updated);
  }

  /**
   * Cancela execução
   */
  async cancelExecution(executionId: string): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Cancela todas as execuções ativas do cidadão
   */
  async cancelActiveExecutions(citizenId: string): Promise<void> {
    await prisma.flowExecution.updateMany({
      where: {
        citizenId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Completa execução
   */
  async completeExecution(executionId: string): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Registra erro na execução
   */
  async setExecutionError(
    executionId: string,
    errorMessage: string
  ): Promise<void> {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status: 'ERROR',
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Lista execuções do cidadão
   */
  async listExecutions(
    citizenId: string,
    options?: {
      status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
      limit?: number;
    }
  ): Promise<FlowExecution[]> {
    const executions = await prisma.flowExecution.findMany({
      where: {
        citizenId,
        ...(options?.status && { status: options.status }),
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: options?.limit || 10,
    });

    return executions.map(this.mapToFlowExecution);
  }

  /**
   * Limpa execuções antigas
   */
  async cleanupOldExecutions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.flowExecution.deleteMany({
      where: {
        status: {
          in: ['COMPLETED', 'CANCELLED', 'ERROR'],
        },
        completedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Mapeia registro do Prisma para FlowExecution
   */
  private mapToFlowExecution(execution: any): FlowExecution {
    return {
      id: execution.id,
      citizenId: execution.citizenId,
      flowId: execution.flowId,
      conversationId: execution.conversationId,
      currentNodeId: execution.currentNodeId,
      state: execution.state as FlowState,
      history: execution.history as string[],
      status: execution.status,
      errorMessage: execution.errorMessage,
      startedAt: execution.startedAt,
      updatedAt: execution.updatedAt,
      completedAt: execution.completedAt,
    };
  }

  /**
   * Obtém valor do estado usando caminho com dot notation
   * Ex: getStateValue(state, "user.profile.name")
   */
  getStateValue(state: FlowState, path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], state);
  }

  /**
   * Define valor no estado usando caminho com dot notation
   */
  setStateValue(state: FlowState, path: string, value: any): FlowState {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, state);
    target[lastKey] = value;
    return state;
  }
}
