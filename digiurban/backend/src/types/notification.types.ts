/**
 * ============================================================================
 * NOTIFICATION TYPES - Sistema de Notificações
 * ============================================================================
 */

export type RecipientType = 'user' | 'citizen';
export type NotificationChannel = 'web' | 'push' | 'email' | 'sms';
export type NotificationPriority = 'high' | 'normal' | 'low';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'CLICKED';

// Tipos de notificações
export enum NotificationType {
  // Protocolos
  PROTOCOL_CREATED = 'PROTOCOL_CREATED',
  PROTOCOL_STATUS = 'PROTOCOL_STATUS',
  PROTOCOL_ASSIGNED = 'PROTOCOL_ASSIGNED',
  PROTOCOL_MESSAGE = 'PROTOCOL_MESSAGE',
  PROTOCOL_SLA_EXPIRING = 'PROTOCOL_SLA_EXPIRING',
  PROTOCOL_OVERDUE = 'PROTOCOL_OVERDUE',
  PROTOCOL_COMPLETED = 'PROTOCOL_COMPLETED',

  // Documentos
  DOCUMENT_REQUESTED = 'DOCUMENT_REQUESTED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',

  // Avaliações
  EVALUATION_PENDING = 'EVALUATION_PENDING',
  EVALUATION_RECEIVED = 'EVALUATION_RECEIVED',

  // Agendamentos (Apps Saúde)
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',

  // Saúde
  PRESCRIPTION_ISSUED = 'PRESCRIPTION_ISSUED',
  EXAM_RESULT = 'EXAM_RESULT',
  VACCINATION_DUE = 'VACCINATION_DUE',

  // Família
  FAMILY_INVITE = 'FAMILY_INVITE',
  FAMILY_ACCEPTED = 'FAMILY_ACCEPTED',
  FAMILY_REJECTED = 'FAMILY_REJECTED',

  // Sistema
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',

  // Categorização
  NEW_CATEGORY_SUGGESTION = 'NEW_CATEGORY_SUGGESTION',
  SUGGESTION_APPROVED = 'SUGGESTION_APPROVED',

  // Admin
  NEW_CITIZEN_REGISTRATION = 'NEW_CITIZEN_REGISTRATION',
  STATS_UPDATE = 'STATS_UPDATE',
}

export interface NotificationPayload {
  recipientType: RecipientType;
  recipientId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
}

export interface NotificationPreferencesData {
  webEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferences: Record<string, {
    web?: boolean;
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  }>;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dailyDigest?: boolean;
  dailyDigestTime?: string;
}

export interface SendNotificationResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
}
