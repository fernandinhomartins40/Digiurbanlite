/**
 * ============================================================================
 * NOTIFICATION SERVICE - Sistema Central de Notificações
 * ============================================================================
 * Gerencia todas as notificações do sistema via fila (BullMQ)
 */

import { Queue, QueueEvents } from 'bullmq';
import { prisma } from '../lib/prisma';
import redis from '../lib/redis';
import { tryGetTenantId } from '../lib/tenant-context';
import {
  NotificationPayload,
  NotificationChannel,
  NotificationType,
  NotificationPreferencesData,
} from '../types/notification.types';

export class NotificationService {
  private queue: Queue;
  private queueEvents: QueueEvents;

  constructor() {
    this.queue = new Queue('notifications', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 86400, // Remove após 24h
          count: 1000, // Mantém últimas 1000
        },
        removeOnFail: false, // Manter falhas para debug
      },
    });

    this.queueEvents = new QueueEvents('notifications', {
      connection: redis,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`✅ [Notification] Job ${jobId} completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ [Notification] Job ${jobId} failed:`, failedReason);
    });
  }

  /**
   * ⭐ MÉTODO PRINCIPAL - Enfileirar notificação
   */
  async notify(payload: NotificationPayload): Promise<void> {
    try {
      // 1. Buscar preferências do destinatário
      const preferences = await this.getPreferences(
        payload.recipientType,
        payload.recipientId
      );

      // 2. Verificar quiet hours
      if (this.isQuietHours(preferences)) {
        // Baixar prioridade durante quiet hours
        payload.priority = 'low';
      }

      // 3. Determinar canais
      const channels = payload.channels || this.getEnabledChannels(preferences, payload.type);

      if (channels.length === 0) {
        console.log(`[Notification] No channels enabled for ${payload.type}`);
        return;
      }

      // 4. Criar notification no DB (para notificações web)
      let notificationId: string | undefined;

      if (channels.includes('web')) {
        const notification = await prisma.notification.create({
          data: {
            [payload.recipientType === 'citizen' ? 'citizenId' : 'userId']: payload.recipientId,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            channel: 'WEB',
            metadata: payload.data || {},
            sentAt: new Date(),
          },
        });
        notificationId = notification.id;
      }

      // 5. Enfileirar jobs para cada canal
      // Fase A Multi-Tenant: o worker roda em outro processo/contexto — o
      // tenantId PRECISA viajar no payload para o processamento ser escopado.
      const tenantId = tryGetTenantId();
      const jobs = channels.map((channel) => ({
        name: `send-${channel}`,
        data: {
          notificationId,
          channel,
          payload,
          tenantId,
        },
        opts: {
          priority: payload.priority === 'high' ? 1 : payload.priority === 'low' ? 20 : 10,
        },
      }));

      await this.queue.addBulk(jobs);

      console.log(
        `📨 [Notification] Enqueued ${channels.length} jobs for ${payload.type} to ${payload.recipientType}:${payload.recipientId}`
      );
    } catch (error) {
      console.error('[Notification] Error enqueueing notification:', error);
      throw error;
    }
  }

  /**
   * Envio em massa (broadcast)
   */
  async broadcast(
    payload: Omit<NotificationPayload, 'recipientId' | 'recipientType'>,
    recipients: Array<{ type: 'user' | 'citizen'; id: string }>
  ): Promise<void> {
    const tenantId = tryGetTenantId();
    const jobs = recipients.map((recipient) => ({
      name: 'notify',
      data: {
        ...payload,
        recipientType: recipient.type,
        recipientId: recipient.id,
        tenantId,
      },
    }));

    await this.queue.addBulk(jobs);
    console.log(`📢 [Notification] Broadcast enqueued for ${recipients.length} recipients`);
  }

  /**
   * Buscar preferências do destinatário
   */
  private async getPreferences(
    recipientType: 'user' | 'citizen',
    recipientId: string
  ): Promise<NotificationPreferencesData | null> {
    const prefs = await prisma.notificationPreference.findUnique({
      where:
        recipientType === 'citizen' ? { citizenId: recipientId } : { userId: recipientId },
    });

    if (!prefs) {
      // Retornar preferências padrão
      return {
        webEnabled: true,
        pushEnabled: false,
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: false,
        preferences: {},
      };
    }

    return {
      webEnabled: prefs.webEnabled,
      pushEnabled: prefs.pushEnabled,
      emailEnabled: prefs.emailEnabled,
      smsEnabled: prefs.smsEnabled,
      whatsappEnabled: (prefs as any).whatsappEnabled ?? false,
      preferences: prefs.preferences as any,
      quietHoursStart: prefs.quietHoursStart || undefined,
      quietHoursEnd: prefs.quietHoursEnd || undefined,
      dailyDigest: prefs.dailyDigest,
      dailyDigestTime: prefs.dailyDigestTime || undefined,
    };
  }

  /**
   * Verificar se está em horário de silêncio
   */
  private isQuietHours(preferences: NotificationPreferencesData | null): boolean {
    if (!preferences?.quietHoursStart || !preferences?.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const start = preferences.quietHoursStart;
    const end = preferences.quietHoursEnd;

    // Caso simples: quiet hours não cruzam meia-noite
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    }

    // Caso complexo: quiet hours cruzam meia-noite (ex: 22:00 - 08:00)
    return currentTime >= start || currentTime <= end;
  }

  /**
   * Determinar canais habilitados para um tipo de notificação
   */
  private getEnabledChannels(
    preferences: NotificationPreferencesData | null,
    notificationType: string
  ): NotificationChannel[] {
    if (!preferences) {
      return ['web']; // Default: apenas web
    }

    const channels: NotificationChannel[] = [];

    // Verificar preferências específicas do tipo
    const typePrefs = preferences.preferences[notificationType];

    if (typePrefs) {
      // Preferências específicas existem
      if (typePrefs.web && preferences.webEnabled) channels.push('web');
      if (typePrefs.push && preferences.pushEnabled) channels.push('push');
      if (typePrefs.email && preferences.emailEnabled) channels.push('email');
      if (typePrefs.sms && preferences.smsEnabled) channels.push('sms');
      if (typePrefs.whatsapp && preferences.whatsappEnabled) channels.push('whatsapp');
    } else {
      // Usar preferências globais
      if (preferences.webEnabled) channels.push('web');
      if (preferences.pushEnabled) channels.push('push');
      if (preferences.whatsappEnabled && this.isImportantNotification(notificationType)) {
        channels.push('whatsapp');
      }
      // Email e SMS apenas para tipos importantes
      if (
        preferences.emailEnabled &&
        this.isImportantNotification(notificationType)
      ) {
        channels.push('email');
      }
    }

    return channels;
  }

  /**
   * Verificar se é notificação importante (merece email/SMS)
   */
  private isImportantNotification(type: string): boolean {
    const importantTypes = [
      NotificationType.PROTOCOL_SLA_EXPIRING,
      NotificationType.PROTOCOL_OVERDUE,
      NotificationType.DOCUMENT_REJECTED,
      NotificationType.APPOINTMENT_REMINDER,
      NotificationType.EXAM_RESULT,
      NotificationType.SYSTEM_MAINTENANCE,
      NotificationType.STUDENT_ENTRY,
      NotificationType.STUDENT_EXIT,
    ];

    return importantTypes.includes(type as NotificationType);
  }

  /**
   * Obter estatísticas da fila
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Limpar jobs antigos
   */
  async cleanOldJobs() {
    await this.queue.clean(86400000, 100, 'completed'); // 24h
    await this.queue.clean(604800000, 50, 'failed'); // 7 dias
  }
}

export default new NotificationService();
