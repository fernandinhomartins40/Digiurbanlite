/**
 * ============================================================================
 * SSE CHANNEL - Server-Sent Events para notificações em tempo real
 * ============================================================================
 */

import { sendNotificationToUser } from '../../routes/notifications.routes';
import { NotificationPayload } from '../../types/notification.types';

export async function sendSSE(payload: NotificationPayload): Promise<{ success: boolean }> {
  try {
    const event = {
      type: payload.type,
      data: {
        title: payload.title,
        message: payload.message,
        ...payload.data,
      },
      timestamp: new Date(),
    };

    // Enviar via SSE existente
    sendNotificationToUser(payload.recipientId, event);

    return { success: true };
  } catch (error: any) {
    console.error('[SSE] Error sending notification:', error);
    throw error;
  }
}
