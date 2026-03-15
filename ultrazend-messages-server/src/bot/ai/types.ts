import { BotResponse, MenuOption } from '../types';

export type CitizenAiIntent =
  | 'greeting'
  | 'solicitar_servico'
  | 'consultar_protocolo'
  | 'meu_perfil'
  | 'documentos'
  | 'minha_familia'
  | 'notificacoes'
  | 'avaliacao'
  | 'ajuda'
  | 'atendimento_humano'
  | 'unknown';

export type CitizenAiStage =
  | 'triage'
  | 'awaiting_request_mode'
  | 'awaiting_department_selection'
  | 'awaiting_service_selection'
  | 'awaiting_protocol_number'
  | 'collecting_fields'
  | 'awaiting_documents'
  | 'awaiting_review_confirmation'
  | 'paused_human';

export interface CitizenAiIntentAnalysis {
  intent: CitizenAiIntent;
  confidence: number;
  serviceQuery?: string;
  protocolNumber?: string;
  notes?: string;
}

export interface CitizenAiSelection {
  selectedId?: string;
  confidence: number;
}

export interface CitizenAiFieldExtraction {
  values: Record<string, string | number | boolean>;
  description?: string;
  confidence: number;
}

export interface CitizenAiSessionState {
  engine: 'ai_assistant';
  stage: CitizenAiStage;
  lastIntent?: CitizenAiIntent;
  serviceSearchQuery?: string;
  departmentCandidates?: MenuOption[];
  selectedDepartmentId?: string;
  selectedDepartmentName?: string;
  serviceCandidates?: MenuOption[];
  selectedServiceId?: string;
  selectedServiceName?: string;
  selectedServiceData?: Record<string, unknown>;
  formSchemaData?: Record<string, unknown>;
  collectedFormData?: Record<string, unknown>;
  pendingFieldIds?: string[];
  currentFieldId?: string;
  currentFieldLabel?: string;
  description?: string;
  uploadedDocuments?: Array<Record<string, unknown>>;
  protocolNumber?: string;
  reviewText?: string;
  lowConfidenceFallbacks?: number;
  legacyFallbackCount?: number;
}

export interface CitizenAiDecision {
  response: BotResponse;
  session: CitizenAiSessionState;
  redirectToFlowName?: string;
  requestHumanHandover?: boolean;
  handoverReason?: string;
}
