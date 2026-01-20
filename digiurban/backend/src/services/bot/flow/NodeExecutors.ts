/**
 * NodeExecutors
 * Executores para cada tipo de nodo do fluxo
 */

import {
  FlowNode,
  NodeExecutionResult,
  ExecutionContext,
  MessageNodeConfig,
  QuestionNodeConfig,
  MenuNodeConfig,
  ActionNodeConfig,
  ConditionNodeConfig,
  FormNodeConfig,
  UploadNodeConfig,
  LocationNodeConfig,
  EndNodeConfig,
  MenuOption,
} from '../../../types/flow.types';
import { TemplateEngine } from './TemplateEngine';
import { InputValidator } from './InputValidator';

export class NodeExecutors {
  constructor(
    private templateEngine: TemplateEngine,
    private inputValidator: InputValidator
  ) {}

  /**
   * Executa nodo MESSAGE
   */
  async executeMessage(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as MessageNodeConfig;
    const text = this.templateEngine.render(config.text, context.execution.state);

    // Avança automaticamente para o próximo nodo
    const nextNodeId = node.transitions[0]?.to;

    return {
      success: true,
      message: text,
      nextNodeId,
      waitingForInput: false,
      data: config.media ? { media: config.media } : undefined,
    };
  }

  /**
   * Executa nodo QUESTION
   */
  async executeQuestion(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as QuestionNodeConfig;
    const text = this.templateEngine.render(config.text, context.execution.state);

    // Se há input do usuário, valida e salva
    if (context.userInput !== undefined) {
      const validation = config.validation;
      if (validation) {
        const isValid = this.inputValidator.validate(
          context.userInput as string,
          validation
        );

        if (!isValid.valid) {
          return {
            success: false,
            message: isValid.error || validation.errorMessage || 'Entrada inválida',
            waitingForInput: true,
          };
        }
      }

      // Salva resposta no estado
      const stateUpdates: any = {};
      const saveAs = config.saveAs || node.id;
      stateUpdates[saveAs] = context.userInput;

      // Avança para próximo nodo
      const nextNodeId = node.transitions[0]?.to;

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
      };
    }

    // Primeira vez: exibe a pergunta e aguarda resposta
    return {
      success: true,
      message: text,
      waitingForInput: true,
      data: {
        placeholder: config.placeholder,
        validation: config.validation,
      },
    };
  }

  /**
   * Executa nodo MENU
   */
  async executeMenu(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as MenuNodeConfig;
    const text = this.templateEngine.render(config.text, context.execution.state);

    // Resolve opções (pode ser array direto ou template)
    let options: MenuOption[];
    if (typeof config.options === 'string') {
      // Template: busca do estado
      const optionsData = this.templateEngine.resolve(
        config.options,
        context.execution.state
      );
      options = Array.isArray(optionsData) ? optionsData : [];
    } else {
      options = config.options;
    }

    // Se há input do usuário, processa seleção
    if (context.userInput !== undefined) {
      const selectedIds = Array.isArray(context.userInput)
        ? context.userInput
        : [context.userInput];

      // Valida seleções
      const validOptions = options.filter((opt) => selectedIds.includes(opt.id));

      if (validOptions.length === 0) {
        return {
          success: false,
          message: 'Opção inválida. Por favor, escolha uma das opções disponíveis.',
          waitingForInput: true,
        };
      }

      // Salva seleção no estado
      const stateUpdates: any = {};
      const saveAs = config.saveAs || node.id;
      stateUpdates[saveAs] = config.multiSelect ? selectedIds : selectedIds[0];
      stateUpdates[`${saveAs}_data`] = config.multiSelect
        ? validOptions
        : validOptions[0];

      // Determina próximo nodo baseado na seleção
      let nextNodeId: string | undefined;

      // Busca transição correspondente
      const selectedId = selectedIds[0]; // Usa primeiro selecionado para routing
      const transition = node.transitions.find((t) => t.when === selectedId);

      if (transition) {
        nextNodeId = transition.to;
      } else {
        // Transição padrão (sem 'when')
        nextNodeId = node.transitions.find((t) => !t.when)?.to;
      }

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
      };
    }

    // Primeira vez: exibe menu e aguarda seleção
    return {
      success: true,
      message: text,
      waitingForInput: true,
      data: {
        options,
        multiSelect: config.multiSelect,
      },
    };
  }

  /**
   * Executa nodo ACTION
   */
  async executeAction(
    node: FlowNode,
    context: ExecutionContext,
    actionHandlers: any
  ): Promise<NodeExecutionResult> {
    const config = node.config as ActionNodeConfig;

    // Resolve parâmetros com templates
    const params = config.params || {};
    const resolvedParams: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        resolvedParams[key] = this.templateEngine.render(value, context.execution.state);
      } else {
        resolvedParams[key] = value;
      }
    }

    // Caso especial: startFlow deve ser tratado pelo FlowEngine
    if (config.action === 'startFlow') {
      return {
        success: true,
        nextNodeId: node.transitions[0]?.to,
        waitingForInput: false,
        data: {
          specialAction: 'startFlow',
          flowName: resolvedParams.flowName,
        },
      };
    }

    // Executa action handler
    const handler = actionHandlers[config.action];
    if (!handler) {
      return {
        success: false,
        error: `Action handler '${config.action}' not found`,
        waitingForInput: false,
      };
    }

    try {
      const result = await handler(resolvedParams, context);

      // Salva resultado no estado se configurado
      const stateUpdates: any = {};
      if (config.saveResultAs) {
        stateUpdates[config.saveResultAs] = result;
      }

      // Avança para próximo nodo
      const nextNodeId = node.transitions[0]?.to;

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Action '${config.action}' failed: ${error.message}`,
        waitingForInput: false,
      };
    }
  }

  /**
   * Executa nodo CONDITION
   */
  async executeCondition(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as ConditionNodeConfig;

    // Avalia condições
    for (const condition of config.conditions) {
      const fieldValue = this.templateEngine.resolve(
        condition.field,
        context.execution.state
      );

      let conditionMet = false;

      switch (condition.operator) {
        case 'eq':
          conditionMet = fieldValue === condition.value;
          break;
        case 'ne':
          conditionMet = fieldValue !== condition.value;
          break;
        case 'gt':
          conditionMet = fieldValue > condition.value;
          break;
        case 'gte':
          conditionMet = fieldValue >= condition.value;
          break;
        case 'lt':
          conditionMet = fieldValue < condition.value;
          break;
        case 'lte':
          conditionMet = fieldValue <= condition.value;
          break;
        case 'contains':
          conditionMet =
            typeof fieldValue === 'string' &&
            fieldValue.includes(condition.value);
          break;
        case 'in':
          conditionMet = Array.isArray(condition.value)
            ? condition.value.includes(fieldValue)
            : false;
          break;
        case 'exists':
          conditionMet = fieldValue !== undefined && fieldValue !== null;
          break;
      }

      if (conditionMet) {
        return {
          success: true,
          nextNodeId: condition.goto,
          waitingForInput: false,
        };
      }
    }

    // Nenhuma condição atendida: usa defaultGoto ou erro
    if (config.defaultGoto) {
      return {
        success: true,
        nextNodeId: config.defaultGoto,
        waitingForInput: false,
      };
    }

    return {
      success: false,
      error: 'No condition matched and no default route configured',
      waitingForInput: false,
    };
  }

  /**
   * Executa nodo FORM
   */
  async executeForm(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as FormNodeConfig;

    // Resolve fields (pode ser array ou path para schema dinâmico)
    let fields: any[];
    if (typeof config.fields === 'string') {
      const fieldsData = this.templateEngine.resolve(
        config.fields,
        context.execution.state
      );
      fields = Array.isArray(fieldsData) ? fieldsData : [];
    } else {
      fields = config.fields;
    }

    // Se há input do usuário, valida e salva
    if (context.userInput !== undefined) {
      const formData = context.userInput as Record<string, any>;

      // Valida campos obrigatórios
      for (const field of fields) {
        if (field.required && !formData[field.id]) {
          return {
            success: false,
            message: `Campo obrigatório: ${field.label}`,
            waitingForInput: true,
          };
        }

        // Valida formato se houver validação
        if (formData[field.id] && field.validation) {
          const isValid = this.inputValidator.validate(
            formData[field.id],
            field.validation
          );

          if (!isValid.valid) {
            return {
              success: false,
              message: `${field.label}: ${isValid.error}`,
              waitingForInput: true,
            };
          }
        }
      }

      // Salva dados do formulário no estado
      const stateUpdates: any = {};
      const saveAs = config.saveAs || node.id;
      stateUpdates[saveAs] = formData;

      // Avança para próximo nodo
      const nextNodeId = node.transitions[0]?.to;

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
      };
    }

    // Primeira vez: exibe formulário e aguarda preenchimento
    return {
      success: true,
      message: config.text || 'Por favor, preencha o formulário:',
      waitingForInput: true,
      data: { fields },
    };
  }

  /**
   * Executa nodo UPLOAD
   */
  async executeUpload(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as UploadNodeConfig;
    const text = this.templateEngine.render(config.text, context.execution.state);

    // Se há arquivos, salva no estado
    if (context.userInput !== undefined) {
      // Validações
      const files = Array.isArray(context.userInput)
        ? context.userInput
        : [context.userInput];

      if (!config.allowSkip && files.length === 0) {
        return {
          success: false,
          message: 'É necessário enviar ao menos um arquivo.',
          waitingForInput: true,
        };
      }

      if (config.maxFiles && files.length > config.maxFiles) {
        return {
          success: false,
          message: `Máximo de ${config.maxFiles} arquivo(s) permitido(s).`,
          waitingForInput: true,
        };
      }

      // Salva arquivos no estado
      const stateUpdates: any = {};
      const saveAs = config.saveAs || node.id;
      stateUpdates[saveAs] = files;

      // Avança para próximo nodo
      const nextNodeId = node.transitions[0]?.to;

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
      };
    }

    // Primeira vez: solicita upload
    return {
      success: true,
      message: text,
      waitingForInput: true,
      data: {
        uploadConfig: config,
      },
    };
  }

  /**
   * Executa nodo LOCATION
   */
  async executeLocation(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as LocationNodeConfig;
    const text = this.templateEngine.render(config.text, context.execution.state);

    // Se há localização, salva no estado
    if (context.userInput !== undefined) {
      const stateUpdates: any = {};
      const saveAs = config.saveAs || node.id;
      stateUpdates[saveAs] = context.userInput;

      // Avança para próximo nodo
      const nextNodeId = node.transitions[0]?.to;

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
      };
    }

    // Primeira vez: solicita localização
    return {
      success: true,
      message: text,
      waitingForInput: true,
      data: {
        locationConfig: config,
      },
    };
  }

  /**
   * Executa nodo END
   */
  async executeEnd(
    node: FlowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const config = node.config as EndNodeConfig;

    return {
      success: true,
      message: config.message || 'Conversa finalizada.',
      waitingForInput: false,
      data: {
        returnToMain: config.returnToMain,
        clearState: config.clearState,
      },
    };
  }
}
