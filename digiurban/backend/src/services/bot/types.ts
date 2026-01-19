// ============================================
// TIPOS DO SISTEMA DE BOT
// ============================================

export interface BotMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'CITIZEN' | 'BOT' | 'SYSTEM';
  createdAt: Date;
  messageType: 'text' | 'card' | 'form' | 'quick_reply' | 'interactive';
  metadata?: any;
}

export interface BotResponse {
  response: string;
  messageType: 'text' | 'card' | 'form' | 'quick_reply' | 'interactive';
  metadata?: {
    cards?: MessageCardData[];
    quickReplies?: string[];
    form?: any;
    stepType?: string;
    options?: any[];
    progress?: number;
    totalSteps?: number;
    currentStepNumber?: number;
    confirmationData?: any;
    [key: string]: any; // Permite outros metadados
  };
}

export interface MessageCardData {
  id: string;
  title: string;
  description?: string;
  department?: string;
  estimatedDays?: number;
  date?: string;
  status?: string;
  action?: {
    type: 'open_service' | 'open_protocol' | 'open_document' | 'custom' | 'select_service' | 'select_protocol' | 'rate_service';
    label: string;
    serviceId?: string;
    protocolId?: string;
    documentId?: string;
    url?: string;
  };
}

// ============================================
// TIPOS DE FLUXOS CONVERSACIONAIS
// ============================================

export interface FlowDefinition {
  name: string;
  steps: FlowStep[];
  onComplete: string; // Nome da função a executar ao completar
  metadata?: any; // Metadados adicionais do fluxo
}

export interface FlowStep {
  id: string;
  type: FlowStepType;
  message: string;
  required: boolean;
  saveAs?: string; // Campo onde salvar o dado coletado
  options?: FlowOption[];
  validation?: FlowValidation;
  placeholder?: string;
  accept?: string; // Para file upload
  maxFiles?: number;
  maxSize?: number;
  allowCurrentLocation?: boolean;
  allowManualAddress?: boolean;
  allowMapPicker?: boolean;
  dynamicOptions?: boolean; // Opções serão carregadas dinamicamente
}

export type FlowStepType =
  | 'selection' // Seleção única
  | 'multiple_choice' // Múltipla escolha
  | 'searchable_select' // Busca com autocomplete
  | 'text' // Texto livre
  | 'phone' // Telefone
  | 'date' // Data
  | 'time' // Hora
  | 'file_upload' // Upload de arquivo
  | 'location' // Localização
  | 'confirmation' // Confirmação
  | 'info'; // Apenas informação (sem input)

export interface FlowOption {
  value: string;
  label: string;
  description?: string;
}

export interface FlowValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  minValue?: number;
  maxValue?: number;
  min?: number; // Valor mínimo (compatível com formSchema)
  max?: number; // Valor máximo (compatível com formSchema)
}

// ============================================
// VALIDAÇÃO DE ENTRADAS
// ============================================

export interface ValidationRule {
  type: 'required' | 'format' | 'length' | 'custom';
  errorMessage: string;
  validator: (value: any) => boolean;
}

export interface InputValidator {
  fieldName: string;
  rules: ValidationRule[];
}

// ============================================
// ANÁLISE DE SENTIMENTO
// ============================================

export interface SentimentAnalysis {
  score: number; // -1 (negativo) a 1 (positivo)
  magnitude: number; // Intensidade
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  isFrustrated: boolean;
  shouldTransferToHuman: boolean;
  keywords: string[];
}

// ============================================
// NOTIFICAÇÕES PROATIVAS
// ============================================

export interface ProactiveNotificationData {
  type: NotificationType;
  citizenId: string;
  title: string;
  message: string;
  metadata?: any;
  scheduledFor: Date;
}

export type NotificationType =
  | 'protocol_expiring'
  | 'protocol_approved'
  | 'protocol_rejected'
  | 'protocol_update'
  | 'appointment_reminder'
  | 'document_approved'
  | 'document_rejected'
  | 'suggestion'
  | 'renewal_reminder';

// ============================================
// SUGESTÕES DO SISTEMA
// ============================================

export interface BotSuggestion {
  id: string;
  type: 'service' | 'action' | 'tip';
  title: string;
  description: string;
  action?: string;
  metadata?: any;
  priority: number;
  expiresAt?: Date;
}

// ============================================
// ANALYTICS DO BOT
// ============================================

export interface BotAnalyticsData {
  intent: string;
  success: boolean; // Resolvido sem transferência
  confidence: number;
  responseTime: number; // ms
  citizenId: string;
  wasTransferred: boolean;
  timestamp: Date;
}

export interface BotStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  avgConfidence: number;
  avgResponseTime: number;
  successRate: number; // % resolvido sem transferência
  transferRate: number; // % transferido para humano
  topIntents: Array<{ intent: string; count: number }>;
  satisfactionRating: number; // 1-5
}

// ============================================
// TRANSFER PARA ATENDENTE
// ============================================

export interface TransferRequest {
  conversationId: string;
  citizenId: string;
  reason: TransferReason;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  context: {
    lastIntent?: string;
    conversationHistory: BotMessage[];
    sentimentAnalysis?: SentimentAnalysis;
    attempts: number;
  };
  createdAt: Date;
}

export type TransferReason =
  | 'USER_REQUEST' // Usuário pediu atendente
  | 'LOW_CONFIDENCE' // Confiança baixa repetida
  | 'FRUSTRATION_DETECTED' // Frustração detectada
  | 'COMPLEX_ISSUE' // Problema muito complexo
  | 'OUT_OF_SCOPE' // Fora do escopo do bot
  | 'ERROR'; // Erro técnico

// ============================================
// CONTEXTO DE CONVERSA
// ============================================

export interface ConversationContext {
  citizenId: string;
  lastIntent?: string;
  lastMessage?: string;
  conversationHistory: Array<{
    role: 'user' | 'bot' | 'system';
    content: string;
    timestamp: Date;
  }>;
  currentFlow?: string;
  flowData?: Record<string, any>;
  metadata?: {
    preferences?: string[];
    frequentServices?: string[];
    lastServiceUsed?: string;
    avgSatisfaction?: number;
  };
  timestamp?: Date;
}

// ============================================
// UPLOAD DE ARQUIVOS
// ============================================

export interface BotFileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

// ============================================
// LOCALIZAÇÃO
// ============================================

export interface LocationData {
  type: 'current' | 'manual' | 'map';
  latitude?: number;
  longitude?: number;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  formattedAddress?: string;
}
