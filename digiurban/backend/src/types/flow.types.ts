/**
 * Sistema de Fluxos Programados do DigiBot
 * Tipos TypeScript para o motor de fluxos
 */

// ============================================
// TIPOS DE NODOS
// ============================================

export type NodeType =
  | 'message'      // Exibe mensagem ao usuário
  | 'question'     // Faz pergunta e aguarda resposta
  | 'menu'         // Exibe menu com opções
  | 'action'       // Executa ação no backend
  | 'condition'    // Decisão baseada em dados
  | 'api_call'     // Chama API externa
  | 'form'         // Coleta múltiplos campos
  | 'upload'       // Solicita arquivo
  | 'location'     // Solicita localização
  | 'wait'         // Aguarda tempo ou evento
  | 'end';         // Finaliza fluxo

// ============================================
// CONFIGURAÇÕES DE NODOS
// ============================================

export interface MessageNodeConfig {
  text: string;
  media?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
  };
}

export interface QuestionNodeConfig {
  text: string;
  placeholder?: string;
  validation?: {
    type: 'text' | 'number' | 'email' | 'cpf' | 'phone' | 'date' | 'protocol';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  saveAs?: string; // Nome da variável no estado
}

export interface MenuOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface MenuNodeConfig {
  text: string;
  options: MenuOption[] | string; // Array ou template "{{state.variable}}"
  multiSelect?: boolean;
  saveAs?: string;
}

export interface ActionNodeConfig {
  action: string; // Nome da action handler
  params?: Record<string, any>; // Pode usar templates {{state.variable}}
  saveResultAs?: string; // Nome da variável para salvar resultado
}

export interface ConditionNodeConfig {
  conditions: Array<{
    field: string; // Campo do estado para avaliar
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'exists';
    value?: any;
    goto: string; // ID do nodo de destino
  }>;
  defaultGoto?: string; // Fallback se nenhuma condição for verdadeira
}

export interface ApiCallNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string; // Pode usar templates
  headers?: Record<string, string>;
  body?: Record<string, any>;
  saveResultAs?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: QuestionNodeConfig['validation'];
  defaultValue?: any;
}

export interface FormNodeConfig {
  text?: string;
  fields: FormField[] | string; // Array ou caminho para formSchema dinâmico
  dynamicFields?: boolean;
  saveAs?: string;
}

export interface UploadNodeConfig {
  text: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // em MB
  allowedTypes?: string[]; // ['image/*', 'application/pdf', etc]
  allowSkip?: boolean;
  saveAs?: string;
}

export interface LocationNodeConfig {
  text: string;
  allowManualInput?: boolean;
  saveAs?: string;
}

export interface WaitNodeConfig {
  duration?: number; // em milissegundos
  waitForEvent?: string; // Nome do evento para aguardar
  timeout?: number;
}

export interface EndNodeConfig {
  message?: string;
  returnToMain?: boolean;
  clearState?: boolean;
}

export type NodeConfig =
  | MessageNodeConfig
  | QuestionNodeConfig
  | MenuNodeConfig
  | ActionNodeConfig
  | ConditionNodeConfig
  | ApiCallNodeConfig
  | FormNodeConfig
  | UploadNodeConfig
  | LocationNodeConfig
  | WaitNodeConfig
  | EndNodeConfig;

// ============================================
// TRANSIÇÕES
// ============================================

export interface Transition {
  when?: string; // Condição (ex: "sim", "opcao1") ou vazio para transição automática
  to: string;    // ID do nodo de destino
}

// ============================================
// NODO
// ============================================

export interface FlowNode {
  id: string;
  type: NodeType;
  config: NodeConfig;
  transitions: Transition[];
  metadata?: {
    label?: string;
    description?: string;
    position?: { x: number; y: number }; // Para editor visual
  };
}

// ============================================
// DEFINIÇÃO DE FLUXO
// ============================================

export interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  isActive: boolean;
  isDefault: boolean;
  municipioId?: string;
  nodes: FlowNode[];
  metadata?: {
    icon?: string;
    color?: string;
    tags?: string[];
    category?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// ============================================
// EXECUÇÃO DE FLUXO
// ============================================

export interface FlowState {
  [key: string]: any; // Estado flexível para armazenar qualquer dado coletado
}

export interface FlowExecution {
  id: string;
  citizenId: string;
  flowId: string;
  conversationId?: string;
  currentNodeId: string;
  state: FlowState;
  history: string[]; // Array de IDs de nodos visitados
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
  errorMessage?: string;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================
// RESULTADO DE EXECUÇÃO DE NODO
// ============================================

export interface NodeExecutionResult {
  success: boolean;
  nextNodeId?: string; // Próximo nodo a executar
  message?: string;    // Mensagem para enviar ao usuário
  data?: any;          // Dados adicionais (cards, opções, etc)
  waitingForInput?: boolean; // Se true, aguarda resposta do usuário
  error?: string;
  stateUpdates?: Partial<FlowState>; // Atualizações para o estado
}

// ============================================
// CONTEXTO DE EXECUÇÃO
// ============================================

export interface ExecutionContext {
  execution: FlowExecution;
  flow: FlowDefinition;
  currentNode: FlowNode;
  citizenId: string;
  municipioId?: string;
  userInput?: string | any; // Input do usuário
}

// ============================================
// ACTION HANDLER
// ============================================

export type ActionHandler = (
  params: Record<string, any>,
  context: ExecutionContext
) => Promise<any>;

export interface ActionHandlers {
  [actionName: string]: ActionHandler;
}

// ============================================
// RESPOSTA DO BOT
// ============================================

export interface BotResponse {
  message: string;
  messageType: 'text' | 'menu' | 'form' | 'upload' | 'location' | 'card' | 'error';
  data?: {
    options?: MenuOption[];
    fields?: FormField[];
    cards?: any[];
    uploadConfig?: UploadNodeConfig;
    locationConfig?: LocationNodeConfig;
  };
  metadata?: {
    flowId: string;
    executionId: string;
    nodeId: string;
    waitingForInput: boolean;
  };
}

// ============================================
// VALIDAÇÃO DE FLUXO
// ============================================

export interface FlowValidationError {
  nodeId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: FlowValidationError[];
  warnings: FlowValidationError[];
}
