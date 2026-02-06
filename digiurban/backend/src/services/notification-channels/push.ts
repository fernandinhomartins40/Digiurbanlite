/**
 * ============================================================================
 * PUSH CHANNEL - Web Push API para notificações push
 * ============================================================================
 */

import webpush from 'web-push';
import { prisma } from '../../lib/prisma';
import { NotificationPayload } from '../../types/notification.types';

// Configurar VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@digiurban.com.br';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('✅ [Push] VAPID configured');
} else {
  console.warn('⚠️  [Push] VAPID keys not configured - push notifications disabled');
}

export async function sendPush(payload: NotificationPayload): Promise<{ success: boolean; sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID not configured, skipping push notification');
    return { success: false, sent: 0, failed: 0 };
  }

  try {
    const { recipientType, recipientId, title, message, data } = payload;

    // Buscar subscriptions ativas
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        [recipientType === 'citizen' ? 'citizenId' : 'userId']: recipientId,
      },
    });

    if (subscriptions.length === 0) {
      console.log(`[Push] No subscriptions for ${recipientType}:${recipientId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const pushPayload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data || {},
      timestamp: Date.now(),
      tag: payload.type, // Agrupar notificações do mesmo tipo
      requireInteraction: payload.priority === 'high',
    });

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          );

          // Atualizar lastUsed
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsed: new Date() },
          });

          sent++;
        } catch (error: any) {
          failed++;

          // Se subscription expirou (410 Gone), remover
          if (error.statusCode === 410) {
            console.log(`[Push] Subscription expired, removing: ${sub.id}`);
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error(`[Push] Error sending to ${sub.id}:`, error.message);
          }

          throw error;
        }
      })
    );

    console.log(`[Push] Sent ${sent}/${subscriptions.length} notifications (${failed} failed)`);

    return { success: sent > 0, sent, failed };
  } catch (error: any) {
    console.error('[Push] Error sending notification:', error);
    throw error;
  }
}
