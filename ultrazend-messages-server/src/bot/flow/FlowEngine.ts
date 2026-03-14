/**
 * FlowEngine
 * Motor principal de execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o de fluxos conversacionais
 */

import prisma from '../../utils/prisma';
import {
  FlowDefinition,
  FlowExecution,
  FlowNode,
  NodeExecutionResult,
  ExecutionContext,
  BotResponse,
  ActionHandlers,
} from '../types';
import { FlowStateManager } from './FlowStateManager';
import { NodeExecutors } from './NodeExecutors';
import { TemplateEngine } from './TemplateEngine';
import { InputValidator } from './InputValidator';

export class FlowEngine {
  private stateManager: FlowStateManager;
  private nodeExecutors: NodeExecutors;
  private templateEngine: TemplateEngine;
  private inputValidator: InputValidator;
  private actionHandlers: ActionHandlers;

  private normalizeFlowName(flowName: string): string {
    return flowName === 'menu_principal' ? 'ai_assistant' : flowName;
  }

  constructor(actionHandlers: ActionHandlers) {
    this.stateManager = new FlowStateManager();
    this.templateEngine = new TemplateEngine();
    this.inputValidator = new InputValidator();
    this.nodeExecutors = new NodeExecutors(this.templateEngine, this.inputValidator);
    this.actionHandlers = actionHandlers;
  }

  /**
   * Inicia novo fluxo para o cidadÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o
   */
  async startFlow(
    citizenId: string,
    flowName: string,
    conversationId?: string
  ): Promise<BotResponse> {
    const normalizedFlowName = this.normalizeFlowName(flowName);

    // Cancela execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµes ativas anteriores
    await this.stateManager.cancelActiveExecutions(citizenId);

    // Busca definiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o do fluxo
    const flow = await this.getFlowDefinition(normalizedFlowName);
    if (!flow) {
      console.error(`[FlowEngine.startFlow] Fluxo '${normalizedFlowName}' nao encontrado no banco`);
      return {
        message: `O fluxo "${normalizedFlowName}" nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ disponÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel no momento. Tente novamente mais tarde.`,
        messageType: 'text' as const,
        metadata: {
          flowId: '',
          executionId: '',
          nodeId: '',
          waitingForInput: false,
          error: true,
        },
      };
    }

    // Cria nova execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o
    const execution = await this.stateManager.createExecution(
      citizenId,
      flow.id,
      conversationId
    );

    // Executa primeiro nodo
    return this.executeCurrentNode(execution, flow);
  }

  /**
   * Processa mensagem do usuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡rio no fluxo ativo
   */
  async processMessage(
    citizenId: string,
    userInput: string | any,
    conversationId?: string
  ): Promise<BotResponse> {
    console.log('[FlowEngine.processMessage] Iniciando processamento:', {
      citizenId,
      userInput,
      conversationId,
    });

    // Busca execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o ativa
    let execution = await this.stateManager.getActiveExecution(citizenId);

    if (!execution) {
      // NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o hÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ fluxo ativo: inicia menu principal
      console.log('[FlowEngine.processMessage] Nenhuma execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o ativa, iniciando menu principal');
      return this.startFlow(citizenId, 'menu_principal', conversationId);
    }

    console.log('[FlowEngine.processMessage] ExecuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o ativa encontrada:', {
      executionId: execution.id,
      flowId: execution.flowId,
      currentNodeId: execution.currentNodeId,
      retryCount: execution.metadata?.retryCount || 0,
    });

    if (execution.metadata?.paused) {
      return {
        message: 'Atendimento humano em andamento. Aguarde a resposta do atendente.',
        messageType: 'text',
        metadata: {
          flowId: execution.flowId,
          executionId: execution.id,
          nodeId: execution.currentNodeId,
          waitingForInput: false,
          paused: true,
        },
      };
    }

    // Busca definiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o do fluxo
    const flow = await this.getFlowById(execution.flowId);
    if (!flow) {
      console.error(`[FlowEngine.processMessage] Fluxo ${execution.flowId} nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o encontrado`);
      await this.stateManager.cancelActiveExecutions(citizenId);
      return this.startFlow(citizenId, 'menu_principal', conversationId);
    }

    // Busca nodo atual
    const currentNode = flow.nodes.find((n) => n.id === execution!.currentNodeId);
    if (!currentNode) {
      console.error(`[FlowEngine.processMessage] Nodo ${execution.currentNodeId} nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o encontrado no fluxo ${flow.name}`);
      await this.stateManager.cancelActiveExecutions(citizenId);
      return this.startFlow(citizenId, 'menu_principal', conversationId);
    }

    console.log('[FlowEngine.processMessage] Nodo atual:', {
      nodeId: currentNode.id,
      nodeType: currentNode.type,
    });

    // Cria contexto de execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o
    const context: ExecutionContext = {
      execution,
      flow,
      currentNode,
      citizenId,
      userInput,
      state: execution.state as any,
    };

    // Executa nodo com input do usuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡rio
    const result = await this.executeNode(currentNode, context);

    console.log('[FlowEngine.processMessage] Resultado da execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o:', {
      success: result.success,
      nextNodeId: result.nextNodeId,
      waitingForInput: result.waitingForInput,
      error: result.error,
    });

    if (!result.success) {
      // Incrementa contador de retry
      const retryCount = (execution.metadata?.retryCount || 0) + 1;
      const maxRetries = 3;

      console.log(`[FlowEngine.processMessage] Erro no nodo, tentativa ${retryCount}/${maxRetries}`);

      await this.stateManager.updateExecution(execution.id, {
        metadata: {
          ...execution.metadata,
          retryCount,
          lastError: result.error || result.message,
          lastErrorAt: new Date().toISOString(),
        },
      });

      // Se excedeu limite de retries, volta ao menu principal
      if (retryCount >= maxRetries) {
        console.log('[FlowEngine.processMessage] Limite de retries excedido, voltando ao menu principal');
        await this.stateManager.cancelActiveExecutions(citizenId);

        return {
          message: 'ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Houve muitas tentativas sem sucesso. Vamos voltar ao menu principal.\n\nO que vocÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âª gostaria de fazer?',
          messageType: 'text',
          metadata: {
            flowId: flow.id,
            executionId: execution.id,
            nodeId: currentNode.id,
            waitingForInput: false,
            resetToMain: true,
          },
        };
      }

      // Erro: retorna mensagem de erro e mantÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©m no mesmo nodo
      // Preserva messageType e dados do nodo para que o frontend renderize corretamente
      const retryResponse: BotResponse = {
        message: result.error || result.message || 'Erro ao processar',
        messageType: 'text',
        metadata: {
          flowId: flow.id,
          executionId: execution.id,
          nodeId: currentNode.id,
          waitingForInput: result.waitingForInput || true,
          retryCount,
        },
      };

      // Para menus: preserva messageType 'menu' e inclui opÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµes para re-render dos botÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âµes
      if (currentNode.type === 'menu') {
        retryResponse.messageType = 'menu';
        const menuConfig = currentNode.config as any;
        if (Array.isArray(menuConfig.options)) {
          retryResponse.data = { options: menuConfig.options };
        }
      } else if (currentNode.type === 'form') {
        retryResponse.messageType = 'form';
        const formConfig = currentNode.config as any;
        if (Array.isArray(formConfig.fields)) {
          retryResponse.data = { fields: formConfig.fields };
        }
      }

      return retryResponse;
    }

    // Reseta contador de retry em caso de sucesso
    if (execution.metadata?.retryCount) {
      await this.stateManager.updateExecution(execution.id, {
        metadata: {
          ...execution.metadata,
          retryCount: 0,
        },
      });
    }

    // Atualiza estado se houver
    if (result.stateUpdates) {
      console.log('[FlowEngine.processMessage] Atualizando estado:', JSON.stringify(result.stateUpdates, null, 2));
      await this.stateManager.updateExecution(execution.id, {
        stateUpdates: result.stateUpdates,
        addToHistory: currentNode.id,
      });

      // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ CRÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂTICO: Recarregar execution do banco apÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³s atualizar estado
      // Sem isso, o prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo nodo usa estado ANTIGO em memÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ria
      const reloadedExecution = await this.stateManager.getExecution(execution.id);
      if (reloadedExecution) {
        execution = reloadedExecution;
        console.log('[FlowEngine.processMessage] Estado recarregado do banco:', JSON.stringify(execution.state, null, 2));
      }
    }

    // Caso especial: startFlow action
    if (result.data?.specialAction === 'startFlow') {
      const flowName = result.data.flowName;
      // Cancela fluxo atual e inicia novo
      await this.stateManager.completeExecution(execution.id);
      return this.startFlow(execution.citizenId, flowName, execution.conversationId);
    }

    if (result.data?.returnToMain) {
      await this.stateManager.completeExecution(execution.id);
      return this.startFlow(execution.citizenId, 'menu_principal', execution.conversationId);
    }

    // Se estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ aguardando input, retorna resposta e mantÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©m nodo
    if (result.waitingForInput) {
      return this.buildBotResponse(result, execution, flow, currentNode);
    }

    // AvanÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§a para prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo nodo
    if (result.nextNodeId) {
      await this.stateManager.updateExecution(execution.id, {
        currentNodeId: result.nextNodeId,
      });

      // Recarrega execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o atualizada
      const updatedExecution = await this.stateManager.getExecution(execution.id);
      if (!updatedExecution) {
        throw new Error('Failed to reload execution');
      }
      execution = updatedExecution;

      // Executa prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo nodo
      return this.executeCurrentNode(execution, flow);
    }

    // Nenhum prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo nodo: finaliza fluxo
    await this.stateManager.completeExecution(execution.id);

    return {
      message: result.message || 'Conversa finalizada',
      messageType: 'text',
      metadata: {
        flowId: flow.id,
        executionId: execution.id,
        nodeId: currentNode.id,
        waitingForInput: false,
      },
    };
  }

  /**
   * Executa nodo atual do fluxo
   */
  private async executeCurrentNode(
    execution: FlowExecution,
    flow: FlowDefinition
  ): Promise<BotResponse> {
    const currentNode = flow.nodes.find((n) => n.id === execution.currentNodeId);

    if (!currentNode) {
      throw new Error(`Node ${execution.currentNodeId} not found`);
    }

    const context: ExecutionContext = {
      execution,
      flow,
      currentNode,
      citizenId: execution.citizenId,
      state: execution.state as any,
    };

    const result = await this.executeNode(currentNode, context);

    if (!result.success) {
      await this.stateManager.setExecutionError(
        execution.id,
        result.error || 'Unknown error'
      );

      return {
        message: result.error || 'Erro ao processar fluxo',
        messageType: 'error',
        metadata: {
          flowId: flow.id,
          executionId: execution.id,
          nodeId: currentNode.id,
          waitingForInput: false,
        },
      };
    }

    // Atualiza estado
    if (result.stateUpdates) {
      console.log('[FlowEngine.executeCurrentNode] Atualizando estado:', JSON.stringify(result.stateUpdates, null, 2));
      await this.stateManager.updateExecution(execution.id, {
        stateUpdates: result.stateUpdates,
      });

      // ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ CRÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂTICO: Recarregar execution do banco apÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³s atualizar estado
      // Mesmo bug que em processMessage - sem isso prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo nodo usa estado ANTIGO
      const reloadedExecution = await this.stateManager.getExecution(execution.id);
      if (reloadedExecution) {
        execution = reloadedExecution;
        console.log('[FlowEngine.executeCurrentNode] Estado recarregado do banco:', JSON.stringify(execution.state, null, 2));
      }
    }

    // Caso especial: startFlow action
    if (result.data?.specialAction === 'startFlow') {
      const flowName = result.data.flowName;
      // Cancela fluxo atual e inicia novo
      await this.stateManager.completeExecution(execution.id);
      return this.startFlow(execution.citizenId, flowName, execution.conversationId);
    }

    if (result.data?.returnToMain) {
      await this.stateManager.completeExecution(execution.id);
      return this.startFlow(execution.citizenId, 'menu_principal', execution.conversationId);
    }

    // Se aguarda input, retorna
    if (result.waitingForInput) {
      return this.buildBotResponse(result, execution, flow, currentNode);
    }

    // AvanÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§a para prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ximo nodo automaticamente
    if (result.nextNodeId) {
      await this.stateManager.updateExecution(execution.id, {
        currentNodeId: result.nextNodeId,
        addToHistory: currentNode.id,
      });

      const updatedExecution = (await this.stateManager.getExecution(execution.id))!;
      return this.executeCurrentNode(updatedExecution, flow);
    }

    // Fim do fluxo
    await this.stateManager.completeExecution(execution.id);

    return {
      message: result.message || 'Conversa finalizada',
      messageType: 'text',
      metadata: {
        flowId: flow.id,
        executionId: execution.id,
        nodeId: currentNode.id,
        waitingForInput: false,
      },
    };
  }

  /**
   * Executa um nodo
   */
  private async executeNode(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    try {
      switch (node.type) {
        case 'message':
          return await this.nodeExecutors.executeMessage(node, context);
        case 'question':
          return await this.nodeExecutors.executeQuestion(node, context);
        case 'menu':
          return await this.nodeExecutors.executeMenu(node, context);
        case 'action':
          return await this.nodeExecutors.executeAction(node, context, this.actionHandlers);
        case 'condition':
          return await this.nodeExecutors.executeCondition(node, context);
        case 'form':
          return await this.nodeExecutors.executeForm(node, context);
        case 'upload':
          return await this.nodeExecutors.executeUpload(node, context);
        case 'location':
          return await this.nodeExecutors.executeLocation(node, context);
        case 'end':
          return await this.nodeExecutors.executeEnd(node, context);
        default:
          return {
            success: false,
            error: `Unknown node type: ${node.type}`,
            waitingForInput: false,
          };
      }
    } catch (error: any) {
      const friendlyError = this.formatNodeError(error, node);
      console.error(`[FlowEngine] Erro no nodo ${node.id} (${node.type}):`, error?.message);
      return {
        success: false,
        error: friendlyError,
        waitingForInput: false,
      };
    }
  }

  /**
   * Formata erro de nodo de forma amigÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡vel para o cidadÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o
   */
  private formatNodeError(error: any, _node: FlowNode): string {
    const code = error?.code || error?.response?.status;
    const message = error?.message || '';

    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      return 'O sistema estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ temporariamente indisponÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel. Por favor, tente novamente em alguns minutos.';
    }
    if (code === 'ECONNABORTED' || message.includes('timeout')) {
      return 'A operaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o demorou mais do que o esperado. Tente novamente em instantes.';
    }
    if (code === 401 || code === 403) {
      return 'Sua sessÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o expirou. Por favor, faÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§a login novamente.';
    }
    if (code === 404) {
      return 'O recurso solicitado nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi encontrado. Verifique os dados e tente novamente.';
    }
    if (code >= 500) {
      return 'Ocorreu um erro interno. Nossa equipe jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ foi notificada. Tente novamente em breve.';
    }

    return 'Ocorreu um erro ao processar sua solicitaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o. Tente novamente.';
  }

  /**
   * ConstrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³i resposta do bot
   */
  private buildBotResponse(
    result: NodeExecutionResult,
    execution: FlowExecution,
    flow: FlowDefinition,
    node: FlowNode
  ): BotResponse {
    let messageType: BotResponse['messageType'] = 'text';

    if (node.type === 'menu') {
      messageType = 'menu';
    } else if (node.type === 'form') {
      messageType = 'form';
    } else if (node.type === 'upload') {
      messageType = 'upload';
    } else if (node.type === 'location') {
      messageType = 'location';
    }

    return {
      message: result.message || '',
      messageType,
      data: result.data,
      metadata: {
        flowId: flow.id,
        executionId: execution.id,
        nodeId: node.id,
        waitingForInput: result.waitingForInput || false,
      },
    };
  }

  /**
   * Busca definiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o de fluxo por nome
   */
  private async getFlowDefinition(name: string): Promise<FlowDefinition | null> {
    const flow = await prisma.flowDefinition.findFirst({
      where: {
        name,
        isActive: true,
      },
    });

    return flow ? this.mapToFlowDefinition(flow) : null;
  }

  /**
   * Busca definiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o de fluxo por ID
   */
  private async getFlowById(id: string): Promise<FlowDefinition | null> {
    const flow = await prisma.flowDefinition.findUnique({
      where: { id },
    });

    return flow ? this.mapToFlowDefinition(flow) : null;
  }

  /**
   * Mapeia registro do Prisma para FlowDefinition
   */
  private mapToFlowDefinition(flow: any): FlowDefinition {
    return {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      version: flow.version,
      isActive: flow.isActive,
      isDefault: flow.isDefault,
      municipioId: flow.municipioId,
      nodes: flow.nodes as FlowNode[],
      metadata: flow.metadata || undefined,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      createdBy: flow.createdBy,
    };
  }

  /**
   * Cancela fluxo ativo do cidadÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o
   */
  async cancelActiveFlow(citizenId: string): Promise<void> {
    await this.stateManager.cancelActiveExecutions(citizenId);
  }

  /**
   * ObtÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©m execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o ativa
   */
  async getActiveExecution(citizenId: string): Promise<FlowExecution | null> {
    return this.stateManager.getActiveExecution(citizenId);
  }

  /**
   * Pausa execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o do bot (atendimento humano assumindo)
   */
  async pauseExecution(citizenId: string): Promise<void> {
    const execution = await this.stateManager.getActiveExecution(citizenId);

    if (execution) {
      await this.stateManager.updateExecution(execution.id, {
        metadata: {
          ...execution.metadata,
          paused: true,
          pausedAt: new Date().toISOString(),
          pausedReason: 'HUMAN_TAKEOVER',
        },
      });
    }
  }

  /**
   * Retoma execuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o do bot (apÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³s atendimento humano)
   */
  async resumeExecution(citizenId: string): Promise<FlowExecution | null> {
    const execution = await this.stateManager.getActiveExecution(citizenId);

    if (execution && execution.metadata?.paused) {
      await this.stateManager.updateExecution(execution.id, {
        metadata: {
          ...execution.metadata,
          paused: false,
          resumedAt: new Date().toISOString(),
        },
      });

      return this.stateManager.getExecution(execution.id);
    }

    return null;
  }
}
