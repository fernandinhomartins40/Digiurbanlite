/**
 * ============================================================================
 * EMAIL CHANNEL - Envio de notificações por email
 * ============================================================================
 */

import { NotificationPayload } from '../../types/notification.types';
import { prisma } from '../../lib/prisma';

// TODO: Integrar com sistema de email existente (nodemailer)
export async function sendEmail(payload: NotificationPayload): Promise<{ success: boolean }> {
  try {
    const { recipientType, recipientId, title, message, data } = payload;

    // Buscar email do destinatário
    let email: string | null = null;

    if (recipientType === 'citizen') {
      const citizen = await prisma.citizen.findUnique({
        where: { id: recipientId },
        select: { email: true, name: true },
      });
      email = citizen?.email || null;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, name: true },
      });
      email = user?.email || null;
    }

    if (!email) {
      console.warn(`[Email] No email for ${recipientType}:${recipientId}`);
      return { success: false };
    }

    // TODO: Integrar com sistema de email real
    console.log(`[Email] Would send to ${email}:`, { title, message, data });

    // Por enquanto, apenas simular
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error sending notification:', error);
    throw error;
  }
}
