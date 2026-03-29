import { UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotificationPayload } from '../../types/notification.types';
import ultraZendMessages from '../../lib/messages/UltraZendMessagesAdapter';
import { generateToken } from '../../utils/jwt';

async function resolveSenderUserId(recipientId: string, recipientType: 'user' | 'citizen') {
  if (recipientType === 'user') {
    return recipientId;
  }

  const adminUser = await prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER],
      },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return adminUser?.id || 'system';
}

export async function sendWhatsApp(payload: NotificationPayload): Promise<{ success: boolean }> {
  const senderUserId = await resolveSenderUserId(payload.recipientId, payload.recipientType);

  try {
    const token = generateToken({
      userId: senderUserId,
      userType: 'SERVER',
      role: 'ADMIN',
      name: 'Digiurban',
      email: 'notificacoes@digiurban.local',
    });

    ultraZendMessages.setToken(token);

    await ultraZendMessages.sendMessage(senderUserId, 'SERVER', {
      participant2Id: payload.recipientId,
      participant2Type: payload.recipientType === 'citizen' ? 'CITIZEN' : 'SERVER',
      content: `${payload.title}\n\n${payload.message}`,
      departmentId: (payload.data?.departmentId as string | undefined) || undefined,
      protocolId: (payload.data?.protocolId as string | undefined) || undefined,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp] Error sending notification:', error);
    throw error;
  }
}
