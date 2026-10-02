import { BotResponse, MenuOption } from '../types';

export type CitizenAiIntent =
  | 'greeting'
  | 'solicitar_servico'
  | 'consultar_protocolo'
  | 'corrigir_dados'
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
  | 'awaiting_protocol_lookup_mode'
  | 'awaiting_protocol_number'
  | 'awaiting_protocol_selection'
  | 'awaiting_protocol_pending_selection'
  | 'awaiting_protocol_pending_text_resolution'
  | 'awaiting_protocol_pending_document_upload'
  | 'collecting_fields'
  | 'awaiting_documents'
  | 'awaiting_review_confirmation'
  | 'awaiting_correction_field'
  | 'paused_human'
  // autoatendimento (antes eram fluxos do motor antigo) — ver CitizenSelfService.ts
  | 'help_menu'
  | 'faq_menu'
  | 'profile_menu'
  | 'profile_update_choice'
  | 'profile_collect'
  | 'documents_menu'
  | 'documents_protocol_selection'
  | 'notifications_menu'
  | 'evaluation_selection'
  | 'evaluation_rating'
  | 'evaluation_comment';

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

export interface CitizenAiCorrectionExtraction {
  fieldId?: string;
  value?: string | number | boolean;
  description?: string;
  confidence: number;
}

export interface CitizenAiGuidance {
  message: string;
  suggestedActionIds: string[];
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
  awaitingCorrectionFieldId?: string;
  awaitingCorrectionFieldLabel?: string;
  description?: string;
  uploadedDocuments?: Array<Record<string, unknown>>;
  protocolNumber?: string;
  protocolCandidates?: MenuOption[];
  currentProtocolId?: string;
  currentProtocolTitle?: string;
  pendingCandidates?: MenuOption[];
  currentPendingId?: string;
  currentPendingTitle?: string;
  currentPendingType?: string;
  currentPendingDocumentRequests?: Array<Record<string, unknown>>;
  currentPendingFieldRequests?: Array<Record<string, unknown>>;
  reviewText?: string;
  reviewCard?: Record<string, any>;
  createdProtocolId?: string;
  createdProtocolNumber?: string;
  createdProtocolFingerprint?: string;
  createdProtocolAt?: string;
  lowConfidenceFallbacks?: number;
  legacyFallbackCount?: number;
  /** estado das etapas de autoatendimento (perfil, avaliação, documentos...) */
  selfService?: {
    profileField?: string;
    addressStep?: number;
    addressDraft?: Record<string, string>;
    candidates?: MenuOption[];
    evalProtocolId?: string;
    evalProtocolLabel?: string;
    evalRating?: number;
  };
}

export interface CitizenAiDecision {
  response: BotResponse;
  session: CitizenAiSessionState;
  redirectToFlowName?: string;
  requestHumanHandover?: boolean;
  handoverReason?: string;
}
