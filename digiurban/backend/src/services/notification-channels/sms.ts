/**
 * ============================================================================
 * SMS CHANNEL - Envio de notificações por SMS
 * ============================================================================
 */

import { NotificationPayload } from '../../types/notification.types';
import { prisma } from '../../lib/prisma';

// TODO: Integrar com serviço de SMS (Twilio, AWS SNS, etc)
export async function sendSMS(payload: NotificationPayload): Promise<{ success: boolean }> {
  try {
    const { recipientType, recipientId, title, message } = payload;

    // Buscar telefone do destinatário
    let phone: string | null = null;

    if (recipientType === 'citizen') {
      const citizen = await prisma.citizen.findUnique({
        where: { id: recipientId },
        select: { phone: true, name: true },
      });
      phone = citizen?.phone || null;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { telefone: true, name: true },
      });
      phone = user?.telefone || null;
    }

    if (!phone) {
      console.warn(`[SMS] No phone for ${recipientType}:${recipientId}`);
      return { success: false };
    }

    // TODO: Integrar com serviço de SMS real
    console.log(`[SMS] Would send to ${phone}:`, { title, message });

    // Por enquanto, apenas simular
    return { success: true };
  } catch (error: any) {
    console.error('[SMS] Error sending notification:', error);
    throw error;
  }
}
