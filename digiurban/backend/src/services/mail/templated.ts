/**
 * E-mail a partir de um modelo (tabela email_templates, editável no
 * Super-admin › Modelos de e-mail). Todas as funções do sistema que mandam
 * e-mail passam por aqui — o texto fica no modelo, não espalhado no código.
 *
 * - Modelo que falta no banco é criado na hora com o padrão.
 * - Modelo desligado no painel não envia (exceto os de acesso: senha e conta).
 * - `{{senderName}}` e `{{portalUrl}}` são preenchidos sozinhos.
 */

import { prisma } from '../../lib/prisma';
import { runAsPlatform, tryGetTenantId } from '../../lib/tenant-context';
import { buildDefaultTemplates, EMAIL_TEMPLATE_INFO, MAIL_LAYOUT_MARK } from '../../lib/email/default-templates';
import { fillTemplate, MailVariables } from './template-fill';
import { mailSenderName, tenantPortalUrl } from './links';
import { MailAttachmentInput, sendMail, SendMailInput } from './mailer';

export type { MailVariables } from './template-fill';

export interface SendTemplatedMailInput {
  template: string;
  to: string;
  variables?: MailVariables;
  /** município (padrão: o do contexto atual) */
  tenantId?: string | null;
  priority?: SendMailInput['priority'];
  attachments?: MailAttachmentInput[];
  replyTo?: string | null;
  fromName?: string | null;
  sendAt?: Date | null;
  tags?: string[];
}

let ensured: Promise<void> | null = null;
const LEGACY_REWRITE_UNTIL = new Date('2026-10-06T12:00:00-03:00');

/** Cria os modelos padrão que faltam; o modelo que ninguém editou ganha o texto novo */
export function ensureDefaultTemplates(force = false): Promise<void> {
  if (!ensured || force) {
    ensured = runAsPlatform(async () => {
      for (const template of buildDefaultTemplates()) {
        const existing = await prisma.emailTemplate.findFirst({ where: { name: template.name } });
        if (!existing) {
          await prisma.emailTemplate.create({ data: { ...template } });
          continue;
        }
        // a versão de 05/10 regravava o modelo sem manter as datas juntas: o modelo no
        // visual novo que não mudou desde então também conta como "nunca editado"
        const neverEdited =
          Math.abs(existing.updatedAt.getTime() - existing.createdAt.getTime()) < 5000 ||
          (existing.htmlContent.includes(MAIL_LAYOUT_MARK) && existing.updatedAt < LEGACY_REWRITE_UNTIL);
        if (neverEdited &&(existing.htmlContent !== template.htmlContent || existing.subject !== template.subject)) {
          // mantém o "nunca editado": createdAt e updatedAt andam juntos
          const now = new Date();
          await prisma.emailTemplate.update({
            where: { id: existing.id },
            data: { ...template, isActive: existing.isActive, createdAt: now, updatedAt: now },
          });
        }
      }
    }).catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}

export async function sendTemplatedMail(input: SendTemplatedMailInput): Promise<{ queued: boolean; emailId?: string; reason?: string }> {
  try {
    await ensureDefaultTemplates();
  } catch (error) {
    console.error('[mail] Não foi possível conferir os modelos padrão:', error);
  }

  const template = await runAsPlatform(async () => prisma.emailTemplate.findFirst({ where: { name: input.template } }));
  if (!template) {
    console.error(`[mail] Modelo de e-mail "${input.template}" não existe`);
    return { queued: false, reason: `Modelo "${input.template}" não existe` };
  }
  const critical = EMAIL_TEMPLATE_INFO[input.template]?.critical === true || input.priority === 'critical';
  if (!template.isActive && !critical) {
    return { queued: false, reason: `Modelo "${input.template}" desligado no painel` };
  }

  const tenantId = input.tenantId === undefined ? tryGetTenantId() || null : input.tenantId;
  const portalUrl = await tenantPortalUrl(tenantId);
  const variables: MailVariables = {
    senderName: await mailSenderName(tenantId),
    portalUrl,
    actionUrl: portalUrl,
    trackingUrl: portalUrl,
    ...Object.fromEntries(Object.entries(input.variables || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')),
  };

  const subject = fillTemplate(template.subject, variables, false).replace(/\s+/g, ' ').trim();
  const html = fillTemplate(template.htmlContent, variables, true);
  const text = template.textContent ? fillTemplate(template.textContent, variables, false) : undefined;

  return sendMail({
    to: input.to,
    subject: subject || 'Aviso',
    html,
    text,
    tenantId,
    priority: input.priority || (critical ? 'critical' : 'normal'),
    attachments: input.attachments,
    replyTo: input.replyTo,
    fromName: input.fromName,
    sendAt: input.sendAt,
    tags: input.tags || [input.template],
    kind: `template:${input.template}`,
  });
}

/** Link do portal do município a partir de um caminho interno ("/cidadao/...") */
export async function portalLink(path: string, tenantId?: string | null): Promise<string> {
  const base = await tenantPortalUrl(tenantId);
  return path.startsWith('/') && !path.startsWith('//') ? `${base}${path}` : base;
}
