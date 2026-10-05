/**
 * Visual único dos e-mails do DigiUrban — mesmo padrão da landing page:
 * azul-marinho → azul, detalhe ciano, logo e mascote.
 *
 * Feito para programas de e-mail (Gmail, Outlook, celular): só tabelas, estilos
 * na própria tag, largura fixa de 600 px e cor sólida de reserva onde o degradê
 * não funciona. As imagens (PNG) ficam em frontend/public/email/.
 */

const NAVY = '#0b2a8c';
const BLUE = '#0f5bd8';
const CYAN = '#13dbe7';
const INK = '#1b2b4b';
const TEXT = '#3d4f70';
const MUTED = '#7b8aa6';
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeMailHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Endereço público das imagens dos e-mails (sempre o da plataforma) */
function assetBase() {
  return (process.env.MAIL_ASSET_BASE_URL || process.env.FRONTEND_URL || 'https://digiurban.com.br').replace(/\/+$/, '');
}

export interface MailLayoutOptions {
  /** título grande do e-mail */
  title: string;
  /** texto de prévia que aparece na lista da caixa de entrada */
  preheader?: string;
  /** miolo já em HTML (use os ajudantes abaixo; texto de usuário SEMPRE escapado) */
  bodyHtml: string;
  button?: { label: string; url: string } | null;
  /** quem manda: "Prefeitura de Palmital" (padrão: DigiUrban) */
  senderName?: string | null;
  /** linha pequena no rodapé */
  footerNote?: string | null;
  /** esconder o mascote (e-mails internos) */
  hideMascot?: boolean;
}

export function mailParagraph(html: string) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${TEXT}">${html}</p>`;
}

/** Caixa de dados (protocolo, serviço, situação...) — valores são escapados aqui */
export function mailInfoBox(rows: Array<[string, unknown]>, options: { raw?: boolean } = {}) {
  const lines = rows
    .filter(([, value]) => value !== null && value !== undefined && String(value) !== '')
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${MUTED};width:38%;vertical-align:top">${escapeMailHtml(label)}</td>` +
        `<td style="padding:6px 0;font-family:${FONT};font-size:15px;color:${INK};font-weight:600">${options.raw ? value : escapeMailHtml(value)}</td></tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:#f3f7fd;border-radius:12px;border-left:4px solid ${CYAN}">
    <tr><td style="padding:14px 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines}</table></td></tr></table>`;
}

/** Aviso em destaque (prazo do link, cuidado de segurança) */
export function mailNotice(html: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;background:#fff8e6;border-radius:12px;border-left:4px solid #ffb400">
    <tr><td style="padding:12px 18px;font-family:${FONT};font-size:14px;line-height:1.5;color:#6b4e00">${html}</td></tr></table>`;
}

export function renderMailLayout(options: MailLayoutOptions): string {
  const base = assetBase();
  const sender = escapeMailHtml(options.senderName || 'DigiUrban');
  const preheader = escapeMailHtml(options.preheader || '');
  const button = options.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr>
        <td bgcolor="${BLUE}" style="border-radius:12px;background:${BLUE};background-image:linear-gradient(90deg,${BLUE},#12c9c9)">
          <a href="${escapeMailHtml(options.button.url)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">${escapeMailHtml(options.button.label)}</a>
        </td></tr></table>
       <p style="margin:0 0 16px;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTED}">Se o botão não abrir, copie este endereço no navegador:<br><span style="word-break:break-all;color:${BLUE}">${escapeMailHtml(options.button.url)}</span></p>`
    : '';
  const mascot = options.hideMascot
    ? ''
    : `<td width="150" align="right" valign="bottom" style="padding:14px 18px 0 0;line-height:0">
         <img src="${base}/email/mascote.png" width="140" alt="Mascote do DigiUrban" style="display:block;border:0;width:140px;height:auto">
       </td>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeMailHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eaf0f8">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eaf0f8" style="background:#eaf0f8">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
      <tr>
        <td bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(120deg,${NAVY} 0%,${BLUE} 70%,#12c9c9 130%)">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle" style="padding:26px 0 24px 28px">
                <img src="${base}/email/logo-branca.png" width="160" alt="DigiUrban" style="display:block;border:0;width:160px;height:auto">
                <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;color:#cfe3ff">${sender}</p>
              </td>
              ${mascot}
            </tr>
          </table>
        </td>
      </tr>
      <tr><td height="4" bgcolor="${CYAN}" style="height:4px;line-height:4px;font-size:0;background:${CYAN}">&nbsp;</td></tr>
      <tr>
        <td style="padding:30px 28px 10px">
          <h1 style="margin:0 0 18px;font-family:${FONT};font-size:23px;line-height:1.3;color:${INK};font-weight:700">${escapeMailHtml(options.title)}</h1>
          ${options.bodyHtml}
          ${button}
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px 26px;border-top:1px solid #e3eaf5">
          <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED}">
            ${escapeMailHtml(options.footerNote || 'Mensagem automática — não é preciso responder.')}<br>
            ${sender} · Enviado pelo DigiUrban, a prefeitura digital.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
