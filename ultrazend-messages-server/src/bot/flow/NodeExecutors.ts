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
} from '../types';
import { TemplateEngine } from './TemplateEngine';
import { InputValidator } from './InputValidator';

export class NodeExecutors {
  constructor(
    private templateEngine: TemplateEngine,
    private inputValidator: InputValidator
  ) {}

  private buildStateUpdates(
    saveAs: string,
    value: any,
    currentState: Record<string, any>
  ): Record<string, any> {
    if (!saveAs.includes('.')) {
      return { [saveAs]: value };
    }

    const keys = saveAs.split('.');
    const rootKey = keys.shift()!;
    const rootValue =
      currentState[rootKey] && typeof currentState[rootKey] === 'object'
        ? { ...currentState[rootKey] }
        : {};

    let cursor: any = rootValue;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const key = keys[i];
      const existing =
        cursor[key] && typeof cursor[key] === 'object' ? cursor[key] : {};
      cursor[key] = { ...existing };
      cursor = cursor[key];
    }

    cursor[keys[keys.length - 1]] = value;

    return { [rootKey]: rootValue };
  }

  private resolveParams(params: Record<string, any>, state: Record<string, any>) {
    return this.templateEngine.renderObject(params, state);
  }

  private normalizeFormFields(fieldsData: any): any[] {
    if (Array.isArray(fieldsData)) {
      return fieldsData.map((field) => this.normalizeField(field));
    }

    if (!fieldsData || typeof fieldsData !== 'object') {
      return [];
    }

    if (Array.isArray(fieldsData.fields)) {
      return fieldsData.fields.map((field: any) => this.normalizeField(field));
    }

    if (fieldsData.properties && typeof fieldsData.properties === 'object') {
      const requiredFields = Array.isArray(fieldsData.required) ? fieldsData.required : [];
      return Object.entries(fieldsData.properties).map(([key, schema]: [string, any]) => {
        const field: any = {
          id: key,
          label: schema?.title || key,
          required: requiredFields.includes(key),
          placeholder: schema?.description,
          type: schema?.type,
        };

        if (schema?.enum) {
          field.type = 'select';
          field.options = schema.enum.map((value: any) => ({
            value: String(value),
            label: String(value),
          }));
        } else if (schema?.format === 'date') {
          field.type = 'date';
        } else if (schema?.type === 'integer' || schema?.type === 'number') {
          field.type = 'number';
        } else if (schema?.type === 'boolean') {
          field.type = 'checkbox';
        } else {
          field.type = 'text';
        }

        return this.normalizeField(field);
      });
    }

    return [];
  }

  private normalizeField(field: any): any {
    if (!field || typeof field !== 'object') {
      return field;
    }

    const id = field.id || field.name;
    const label = field.label || field.title || id;

    return {
      ...field,
      id,
      label,
      name: field.name || id,
    };
  }

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
      const saveAs = config.saveAs || node.id;
      const stateUpdates = this.buildStateUpdates(
        saveAs,
        context.userInput,
        context.execution.state as any
      );

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
      // ✅ CORRIGIDO: Usar renderObject ao invés de resolve
      // renderObject detecta {{template}} e extrai o caminho corretamente
      const optionsData = this.templateEngine.renderObject(
        config.options,
        context.execution.state
      );

      console.log('[NodeExecutors.executeMenu] Opções resolvidas:', Array.isArray(optionsData) ? `Array com ${optionsData.length} itens` : typeof optionsData);

      // ✅ CRÍTICO: Validar se a resolução retornou dados válidos
      if (!optionsData) {
        console.error('[NodeExecutors.executeMenu] Template resolution returned null/undefined:', config.options);
        return {
          success: false,
          error: '⚠️ Não foi possível carregar as opções. Verifique se a ação anterior foi bem-sucedida.',
          waitingForInput: false,
        };
      }

      options = Array.isArray(optionsData) ? optionsData : [];

      // ✅ CRÍTICO: Validar se o array de opções está vazio
      if (options.length === 0) {
        console.warn('[NodeExecutors.executeMenu] Options array is empty for:', config.options);
        return {
          success: false,
          error: '❌ Nenhuma opção disponível no momento. A operação anterior pode ter falhado ou não retornou dados.',
          waitingForInput: false,
        };
      }
    } else {
      options = config.options;
    }

    // Se há input do usuário, processa seleção
    if (context.userInput !== undefined) {
      const userInputRaw = context.userInput;

      // Normaliza o input do usuário para fazer matching inteligente
      const normalizedInput = this.normalizeText(
        Array.isArray(userInputRaw) ? userInputRaw[0] : String(userInputRaw)
      );

      console.log('[NodeExecutors.executeMenu] Input do usuário:', {
        raw: userInputRaw,
        normalized: normalizedInput,
        options: options.map(o => ({ id: o.id, label: o.label }))
      });

      // Tenta fazer matching inteligente com as opções
      let matchedOption: MenuOption | undefined;

      // 1. Tenta match exato por ID
      matchedOption = options.find((opt) => opt.id === normalizedInput);

      // 2. Tenta match exato por label normalizado
      if (!matchedOption) {
        matchedOption = options.find((opt) =>
          this.normalizeText(opt.label) === normalizedInput
        );
      }

      // 3. Tenta match parcial por label (contém)
      if (!matchedOption) {
        matchedOption = options.find((opt) =>
          this.normalizeText(opt.label).includes(normalizedInput) ||
          normalizedInput.includes(this.normalizeText(opt.label))
        );
      }

      // 4. Tenta match por keywords no input
      if (!matchedOption) {
        matchedOption = this.findOptionByKeywords(normalizedInput, options);
      }

      // 5. Se o input é um objeto com optionId (do frontend)
      if (!matchedOption && typeof userInputRaw === 'object' && userInputRaw !== null) {
        const inputObj = userInputRaw as any;
        if (inputObj.optionId) {
          matchedOption = options.find((opt) => opt.id === inputObj.optionId);
        }
      }

      if (!matchedOption) {
        const optionsList = options.map(o => `• ${o.label}`).join('\n');
        return {
          success: false,
          message: `❌ Não entendi sua escolha. Por favor, selecione uma das opções abaixo:\n\n${optionsList}`,
          waitingForInput: true,
        };
      }

      console.log('[NodeExecutors.executeMenu] Opção matched:', matchedOption);

      // Salva seleção no estado
      const saveAs = config.saveAs || node.id;
      const stateUpdates = this.buildStateUpdates(
        saveAs,
        matchedOption.id,
        context.execution.state as any
      );
      stateUpdates[`${saveAs}_data`] = matchedOption;

      // Determina próximo nodo baseado na seleção
      let nextNodeId: string | undefined;

      // Busca transição correspondente
      const transition = node.transitions.find((t) => t.when === matchedOption!.id);

      if (transition) {
        nextNodeId = transition.to;
      } else {
        // Transição padrão (sem 'when')
        nextNodeId = node.transitions.find((t) => !t.when)?.to;
      }

      console.log('[NodeExecutors.executeMenu] Próximo nodo:', nextNodeId);

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
        stateUpdates,
      };
    }

    // Primeira vez: exibe menu e aguarda seleção
    const extraData: Record<string, any> = {};
    const cfg = config as any;

    // Passa campos extras do config para a metadata (displayMode, categories, etc.)
    if (cfg.displayMode) {
      extraData.displayMode = cfg.displayMode;
    }

    // Resolve campos extras que podem ser templates (e.g. "{{deptServicesData.categories}}")
    for (const extraKey of ['categories', 'departmentName'] as const) {
      if (cfg[extraKey]) {
        if (typeof cfg[extraKey] === 'string' && cfg[extraKey].includes('{{')) {
          extraData[extraKey] = this.templateEngine.renderObject(cfg[extraKey], context.execution.state);
        } else {
          extraData[extraKey] = cfg[extraKey];
        }
      }
    }

    return {
      success: true,
      message: text,
      waitingForInput: true,
      data: {
        options,
        multiSelect: config.multiSelect,
        ...extraData,
      },
    };
  }

  /**
   * Normaliza texto para comparação (remove emojis, lowercase, trim)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      // Remove pontuação extra
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Busca opção por palavras-chave
   */
  private findOptionByKeywords(input: string, options: MenuOption[]): MenuOption | undefined {
    const keywords: Record<string, string[]> = {
      'buscar': ['buscar', 'busca', 'pesquisar', 'pesquisa', 'procurar', 'encontrar', 'nome'],
      'listar': ['listar', 'lista', 'todos', 'ver', 'mostrar', 'exibir'],
      'categorias': ['categoria', 'categorias', 'departamento', 'area', 'filtrar'],
      'voltar': ['voltar', 'menu', 'inicio', 'principal', 'cancelar'],
      'protocolo': ['protocolo', 'numero', 'acompanhar', 'consultar'],
      'servico': ['servico', 'servicos', 'solicitar', 'pedir', 'requerer'],
      'perfil': ['perfil', 'dados', 'cadastro', 'atualizar', 'editar'],
      'familia': ['familia', 'membros', 'dependentes', 'composicao'],
      'notificacoes': ['notificacao', 'notificacoes', 'avisos', 'alertas'],
      'ajuda': ['ajuda', 'duvida', 'duvidas', 'suporte', 'faq'],
      'documentos': ['documento', 'documentos', 'arquivo', 'arquivos', 'anexo'],
      'sim': ['sim', 's', 'yes', 'ok', 'confirmar', 'confirmo'],
      'nao': ['nao', 'não', 'n', 'no', 'cancelar', 'negar'],
    };

    for (const option of options) {
      const optionId = this.normalizeText(option.id);
      const optionLabel = this.normalizeText(option.label);

      // Verifica se alguma keyword do optionId aparece no input
      for (const [key, synonyms] of Object.entries(keywords)) {
        if (optionId.includes(key) || optionLabel.includes(key)) {
          for (const synonym of synonyms) {
            if (input.includes(synonym)) {
              return option;
            }
          }
        }
      }
    }

    return undefined;
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
    const resolvedParams = this.resolveParams(params, context.execution.state as any);

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
      const nextNodeId = node.transitions[0]?.to;
      const result = await handler(resolvedParams, context);

      if (
        result &&
        typeof result === 'object' &&
        ((result as any).success === false ||
          ((result as any).error && (result as any).success !== true))
      ) {
        return {
          success: false,
          error: (result as any).error || `Action '${config.action}' failed`,
          waitingForInput: false,
        };
      }

      // Salva resultado no estado se configurado
      if (config.saveResultAs) {
        const stateUpdates = this.buildStateUpdates(
          config.saveResultAs,
          result,
          context.execution.state as any
        );
        return {
          success: true,
          nextNodeId,
          waitingForInput: false,
          stateUpdates,
          data: result,
        };
      }

      return {
        success: true,
        nextNodeId,
        waitingForInput: false,
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
    let fieldsData: any;
    if (typeof config.fields === 'string') {
      // ✅ CORRIGIDO: Usar renderObject ao invés de resolve
      // renderObject detecta {{template}} e extrai o caminho corretamente
      // resolve() falha com strings tipo "{{selectedService.service.formSchema}}"
      fieldsData = this.templateEngine.renderObject(
        config.fields,
        context.execution.state
      );
    } else {
      fieldsData = config.fields;
    }

    const fields = this.normalizeFormFields(fieldsData);

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
      const saveAs = config.saveAs || node.id;
      const stateUpdates = this.buildStateUpdates(
        saveAs,
        formData,
        context.execution.state as any
      );

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
      const saveAs = config.saveAs || node.id;
      const stateUpdates = this.buildStateUpdates(
        saveAs,
        files,
        context.execution.state as any
      );

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
      const saveAs = config.saveAs || node.id;
      const stateUpdates = this.buildStateUpdates(
        saveAs,
        context.userInput,
        context.execution.state as any
      );

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
    _context: ExecutionContext
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
