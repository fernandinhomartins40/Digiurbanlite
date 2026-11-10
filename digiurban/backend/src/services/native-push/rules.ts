/**
 * Regras puras do push nativo (sem banco, sem rede) — testadas em
 * __tests__/unit/native-push-rules.test.ts.
 *
 *  - Android: Firebase Cloud Messaging HTTP v1 (conta de serviço → token OAuth)
 *  - iOS: APNs direto (chave .p8, JWT ES256)
 */

import jwt from 'jsonwebtoken';

export type NativePlatform = 'ANDROID' | 'IOS';

export const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
export const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
export const DEFAULT_IOS_BUNDLE_ID = 'br.com.digiurban.app';

export interface FcmServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface NativePushMessage {
  title: string;
  body: string;
  /** vai para o app como texto; `url` = tela que abre ao tocar */
  data?: Record<string, unknown>;
  highPriority?: boolean;
}

/** Lê o JSON da conta de serviço do Firebase. Devolve null se faltar campo. */
export function parseServiceAccount(raw: string | null | undefined): FcmServiceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.project_id || !parsed?.client_email || !parsed?.private_key) return null;
    if (!String(parsed.private_key).includes('PRIVATE KEY')) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** JWT assinado (RS256) trocado no Google por um token de acesso de 1 h */
export function buildFcmAssertion(account: FcmServiceAccount, nowSeconds = Math.floor(Date.now() / 1000)): string {
  return jwt.sign(
    { iss: account.client_email, scope: FCM_SCOPE, aud: account.token_uri || GOOGLE_TOKEN_URI, iat: nowSeconds, exp: nowSeconds + 3600 },
    account.private_key,
    { algorithm: 'RS256' }
  );
}

/** FCM só aceita texto nos dados */
export function stringifyData(data: Record<string, unknown> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return out;
}

export function buildFcmMessage(token: string, message: NativePushMessage) {
  return {
    message: {
      token,
      notification: { title: message.title, body: message.body },
      data: stringifyData(message.data),
      android: { priority: message.highPriority ? 'HIGH' : 'NORMAL', notification: { sound: 'default' } },
    },
  };
}

/** Chave .p8 da Apple: aceita com ou sem as linhas BEGIN/END */
export function normalizeP8(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN PRIVATE KEY')) return trimmed;
  const body = trimmed.replace(/\s+/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join('\n') || body}\n-----END PRIVATE KEY-----`;
}

/** Token da APNs (ES256, vale até 1 h; a Apple pede para reaproveitar) */
export function buildApnsJwt(input: { p8: string; keyId: string; teamId: string }, nowSeconds = Math.floor(Date.now() / 1000)): string {
  return jwt.sign({ iss: input.teamId, iat: nowSeconds }, normalizeP8(input.p8), { algorithm: 'ES256', keyid: input.keyId });
}

export function apnsHost(production: boolean): string {
  return production ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com';
}

export function buildApnsPayload(message: NativePushMessage) {
  return {
    aps: { alert: { title: message.title, body: message.body }, sound: 'default' },
    ...stringifyData(message.data),
  };
}

/**
 * O aparelho não existe mais (app desinstalado, token trocado) → apagar o token.
 * Erro de configuração nossa (chave errada, projeto errado) NÃO apaga.
 */
export function shouldDropToken(platform: NativePlatform, status: number, body: any): boolean {
  if (platform === 'ANDROID') {
    if (status === 404) return true;
    const details: any[] = body?.error?.details || [];
    if (details.some((detail) => detail?.errorCode === 'UNREGISTERED')) return true;
    return status === 400 && /registration token/i.test(String(body?.error?.message || ''));
  }
  if (status === 410) return true;
  return status === 400 && ['BadDeviceToken', 'Unregistered'].includes(String(body?.reason || ''));
}

/** Token do aparelho: FCM é texto longo; APNs é hexadecimal de 64+ caracteres */
export function looksLikeDeviceToken(platform: NativePlatform, token: string): boolean {
  if (platform === 'IOS') return /^[0-9a-fA-F]{64,200}$/.test(token);
  return /^[\w:-]{20,4096}$/.test(token);
}
