/**
 * ============================================================================
 * EMAIL CHANNEL - Envio de notificações por email
 * ============================================================================
 * Coloca o aviso na fila do e-mail transacional (VeloMail), sempre a partir do
 * modelo do tipo de aviso (Super-admin › Modelos de e-mail). Roda dentro do
 * contexto do município (notification.worker usa runAsTenant).
 */

import { NotificationPayload } from '../../types/notification.types';
import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import { portalLink, sendTemplatedMail, MailVariables } from '../mail/templated';
import { NOTIFICATION_TEMPLATE_BY_TYPE } from '../../lib/email/default-templates';


function formatDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export async function sendEmail(payload: NotificationPayload): Promise<{ success: boolean }> {
  try {
    const { recipientType, recipientId, title, message, data = {} } = payload;

    // Buscar email do destinatário
    let email: string | null = null;
    let name: string | null = null;

    if (recipientType === 'citizen') {
      const citizen = await prisma.citizen.findUnique({
        where: { id: recipientId },
        select: { email: true, name: true },
      });
      email = citizen?.email || null;
      name = citizen?.name || null;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, name: true },
      });
      email = user?.email || null;
      name = user?.name || null;
    }

    if (!email) {
      console.warn(`[Email] No email for ${recipientType}:${recipientId}`);
      return { success: false };
    }

    const tenantId = tryGetTenantId() || null;
    const firstName = name ? name.trim().split(' ')[0] : '';
    const rawUrl = typeof data.url === 'string' ? data.url : '';
    // só links do próprio portal (caminho relativo); nada de URL externa vinda de dado
    const actionUrl = await portalLink(rawUrl, tenantId);

    const template = NOTIFICATION_TEMPLATE_BY_TYPE[String(payload.type)] || 'notification';
    const variables: MailVariables = {
      recipientName: firstName,
      citizenName: recipientType === 'citizen' ? firstName : data.citizenName,
      userName: firstName,
      title,
      message,
      actionUrl,
      trackingUrl: actionUrl,
      protocolNumber: data.protocolNumber,
      serviceName: data.serviceName,
      status: data.statusLabel,
      createdAt: formatDate(data.createdAt),
      pendingTitle: data.pendingTitle,
      dueDate: formatDate(data.dueDate) || 'sem prazo definido',
      documentName: data.documentName,
      reason: data.reason,
      count: data.count,
      protocolList: data.protocolList,
    };

    const result = await sendTemplatedMail({
      template,
      to: email,
      variables,
      tenantId,
      priority: payload.priority === 'low' ? 'low' : 'normal',
      tags: ['notification', String(payload.type).toLowerCase()],
    });

    if (!result.queued) {
      console.warn(`[Email] Not queued for ${recipientType}:${recipientId}: ${result.reason}`);
    }
    return { success: result.queued };
  } catch (error: any) {
    console.error('[Email] Error sending notification:', error);
    throw error;
  }
}
