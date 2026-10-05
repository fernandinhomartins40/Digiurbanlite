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
import { tenantPortalUrl } from '../mail/links';
import { TenantService } from '../tenant.service';

function escapeHtml(value: string) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderNotificationHtml({ name, title, message, link, senderName }: {
  name: string | null;
  title: string;
  message: string;
  link: string | null;
  senderName: string;
}) {
  const greeting = name ? `Olá, ${escapeHtml(name.split(' ')[0])}` : 'Olá';
  const body = escapeHtml(message).replace(/\n/g, '<br>');
  const button = link
    ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(link)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">Ver detalhes</a></p>`
    : '';
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280">${escapeHtml(senderName)}</p>
          <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3">${escapeHtml(title)}</h1>
          <p style="margin:0 0 12px;font-size:15px">${greeting},</p>
          <p style="margin:0;font-size:15px;line-height:1.6">${body}</p>
          ${button}
        </td></tr>
      </table>
      <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#9ca3af;line-height:1.5">
        Mensagem automática — não responda este e-mail. Você pode desligar os avisos por e-mail nas preferências da sua conta.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

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
    const tenant = tenantId ? await TenantService.getById(tenantId).catch(() => null) : null;
    const rawUrl = typeof data?.url === 'string' ? data.url : null;
    // só links do próprio portal (caminho relativo); nada de URL externa vinda de dado
    const link = rawUrl && rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? `${portalUrl}${rawUrl}` : null;

    const result = await sendMail({
      to: email,
      subject: title,
      html: renderNotificationHtml({ name, title, message, link, senderName: tenant?.nome ? `Prefeitura de ${tenant.nome}` : 'DigiUrban' }),
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
