/**
 * ============================================================================
 * EMAIL CHANNEL - Envio de notificações por email
 * ============================================================================
 * Coloca o aviso na fila do e-mail transacional (VeloMail). Roda dentro do
 * contexto do município (notification.worker usa runAsTenant).
 */

import { NotificationPayload } from '../../types/notification.types';
import { prisma } from '../../lib/prisma';
import { tryGetTenantId } from '../../lib/tenant-context';
import { sendMail } from '../mail/mailer';
import { mailSenderName, tenantPortalUrl } from '../mail/links';
import { escapeMailHtml, mailParagraph, renderMailLayout } from '../mail/layout';

export async function sendEmail(payload: NotificationPayload): Promise<{ success: boolean }> {
  try {
    const { recipientType, recipientId, title, message, data } = payload;

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
    const portalUrl = await tenantPortalUrl(tenantId);
    const senderName = await mailSenderName(tenantId);
    const firstName = name ? name.trim().split(' ')[0] : '';
    const rawUrl = typeof data?.url === 'string' ? data.url : null;
    // só links do próprio portal (caminho relativo); nada de URL externa vinda de dado
    const link = rawUrl && rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? `${portalUrl}${rawUrl}` : null;

    const result = await sendMail({
      to: email,
      subject: title,
      html: renderMailLayout({
        title,
        preheader: message,
        senderName,
        bodyHtml:
          mailParagraph(firstName ? `Olá, <strong>${escapeMailHtml(firstName)}</strong>!` : 'Olá!') +
          mailParagraph(escapeMailHtml(message).replace(/\n/g, '<br>')),
        button: link ? { label: 'Ver detalhes', url: link } : null,
        footerNote: 'Mensagem automática. Você pode desligar os avisos por e-mail nas preferências da sua conta.',
      }),
      priority: payload.priority === 'low' ? 'low' : 'normal',
      tags: ['notification', String(payload.type).toLowerCase()],
      kind: `notification:${payload.type}`,
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
