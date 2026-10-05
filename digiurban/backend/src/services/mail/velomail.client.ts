/**
 * Cliente da API de envio do VeloMail (POST /emails/send, header x-api-key `re_...`).
 * Classifica os erros para a fila: o que vale tentar de novo e o que não adianta.
 */

import crypto from 'crypto';

export interface VeloMailPayload {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  tags?: string[];
  attachments?: Array<{ filename: string; content: string; contentType?: string; encoding?: string }>;
  tracking_enabled?: boolean;
}

export class VeloMailError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string | null,
    /** vale tentar de novo (rede, 5xx, limite por minuto) */
    public retryable: boolean,
    public retryAfterMs: number | null = null
  ) {
    super(message);
    this.name = 'VeloMailError';
  }
}

export async function sendViaVeloMail(
  baseUrl: string,
  apiKey: string,
  payload: VeloMailPayload,
  timeoutMs = 20000
): Promise<{ messageId: string | null; raw: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/emails/send`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error: any) {
    throw new VeloMailError(
      error?.name === 'AbortError' ? 'VeloMail não respondeu a tempo' : `Falha de rede com o VeloMail: ${error?.message || error}`,
      0,
      'NETWORK',
      true
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 300) };
  }

  if (response.ok) {
    return { messageId: body.message_id || body.messageId || body.id || null, raw: body };
  }

  const code: string | null = body.code || body.error_code || null;
  const message = String(body.error || body.message || `HTTP ${response.status}`);
  const retryAfterSeconds = Number(body.retryAfter || body.retry_after || response.headers.get('retry-after'));
  const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : null;

  // 429 (limite do plano) e 5xx: tenta de novo. 4xx de dados/chave/domínio: não adianta repetir.
  const retryable = response.status === 429 || response.status >= 500;
  throw new VeloMailError(message, response.status, code, retryable, retryAfterMs);
}

/** Assinatura do webhook: `X-Webhook-Signature: sha256=<hex>` (HMAC SHA-256 dos bytes do corpo) */
export function verifyVeloMailSignature(rawBody: Buffer, signature: string, secret: string) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signature || '');
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Espera antes da próxima tentativa: o tempo pedido pelo VeloMail (429) ou
 * 1, 2, 4, 8, 16, 32, 64, 120 min (teto de 2 h).
 */
export function mailRetryDelay(attemptsMade: number, err?: Error) {
  const asked = (err as VeloMailError | undefined)?.retryAfterMs;
  if (asked) return Math.min(asked + 1000, 60 * 60 * 1000);
  return Math.min(60_000 * 2 ** Math.max(attemptsMade - 1, 0), 2 * 60 * 60 * 1000);
}
