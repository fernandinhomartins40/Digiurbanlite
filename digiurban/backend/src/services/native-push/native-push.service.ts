/**
 * Push dos apps nativos (Android/iOS) — 2026-11-10.
 *
 * Credenciais pelo painel (Super-admin › Apps nativos), cifradas em platform_secrets:
 *  - Android: JSON da conta de serviço do Firebase (FCM HTTP v1);
 *  - iOS: chave .p8 da APNs + Key ID + Team ID + bundle (br.com.digiurban.app)
 *    e se é produção (App Store/TestFlight) ou teste (build do Xcode).
 * Sem credencial de uma plataforma, os aparelhos dela só não recebem.
 */

import axios from 'axios';
import * as http2 from 'node:http2';
import { prisma } from '../../lib/prisma';
import { PLATFORM_CONTEXT_ID, runAsPlatform, tryGetTenantId } from '../../lib/tenant-context';
import { openSecret, sealSecret } from '../platform-secrets.service';
import {
  apnsHost,
  buildApnsJwt,
  buildApnsPayload,
  buildFcmAssertion,
  buildFcmMessage,
  DEFAULT_IOS_BUNDLE_ID,
  GOOGLE_TOKEN_URI,
  NativePlatform,
  NativePushMessage,
  parseServiceAccount,
  shouldDropToken,
} from './rules';

const KEYS = {
  fcmServiceAccount: 'native_push_fcm_service_account',
  apnsKey: 'native_push_apns_key',
  apnsKeyId: 'native_push_apns_key_id',
  apnsTeamId: 'native_push_apns_team_id',
  apnsBundleId: 'native_push_apns_bundle_id',
  apnsProduction: 'native_push_apns_production',
} as const;

export interface NativePushSettings {
  fcmServiceAccount: string | null;
  apnsKey: string | null;
  apnsKeyId: string | null;
  apnsTeamId: string | null;
  apnsBundleId: string;
  apnsProduction: boolean;
}

let cache: { at: number; value: NativePushSettings } | null = null;

async function read(key: string): Promise<string | null> {
  const row = await runAsPlatform(async () => prisma.platformSecret.findUnique({ where: { key } }));
  if (!row) return null;
  try {
    return openSecret(row.valueEnc);
  } catch {
    return null;
  }
}

async function write(key: string, value: string | null) {
  await runAsPlatform(async () => {
    if (value === null || value === '') {
      await prisma.platformSecret.deleteMany({ where: { key } });
      return;
    }
    await prisma.platformSecret.upsert({
      where: { key },
      create: { key, valueEnc: sealSecret(value) },
      update: { valueEnc: sealSecret(value), rotatedAt: new Date() },
    });
  });
}

export async function getNativePushSettings(): Promise<NativePushSettings> {
  if (cache && Date.now() - cache.at < 60000) return cache.value;
  const [fcmServiceAccount, apnsKey, apnsKeyId, apnsTeamId, apnsBundleId, apnsProduction] = await Promise.all(
    [KEYS.fcmServiceAccount, KEYS.apnsKey, KEYS.apnsKeyId, KEYS.apnsTeamId, KEYS.apnsBundleId, KEYS.apnsProduction].map(read)
  );
  const value = {
    fcmServiceAccount,
    apnsKey,
    apnsKeyId,
    apnsTeamId,
    apnsBundleId: apnsBundleId || DEFAULT_IOS_BUNDLE_ID,
    apnsProduction: apnsProduction !== 'false',
  };
  cache = { at: Date.now(), value };
  return value;
}

/** Campo ausente = mantém; texto vazio = apaga */
export async function saveNativePushSettings(input: Partial<Omit<NativePushSettings, 'apnsProduction'>> & { apnsProduction?: boolean }) {
  for (const field of ['fcmServiceAccount', 'apnsKey', 'apnsKeyId', 'apnsTeamId', 'apnsBundleId'] as const) {
    if (input[field] !== undefined) await write(KEYS[field], (input[field] || '').trim());
  }
  if (input.apnsProduction !== undefined) await write(KEYS.apnsProduction, input.apnsProduction ? 'true' : 'false');
  cache = null;
  fcmToken = null;
  apnsToken = null;
  return getNativePushSettings();
}

// ---------------------------------------------------------------- Android (FCM)

let fcmToken: { value: string; expiresAt: number; projectId: string } | null = null;

async function fcmAccess(settings: NativePushSettings) {
  const account = parseServiceAccount(settings.fcmServiceAccount);
  if (!account) return null;
  if (fcmToken && fcmToken.expiresAt > Date.now() + 60000 && fcmToken.projectId === account.project_id) return fcmToken;
  const response = await axios.post<any>(
    account.token_uri || GOOGLE_TOKEN_URI,
    new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: buildFcmAssertion(account) }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  fcmToken = { value: response.data.access_token, expiresAt: Date.now() + (Number(response.data.expires_in) || 3600) * 1000, projectId: account.project_id };
  return fcmToken;
}

async function sendFcm(settings: NativePushSettings, token: string, message: NativePushMessage): Promise<{ ok: boolean; status: number; body: any }> {
  const access = await fcmAccess(settings);
  if (!access) return { ok: false, status: 0, body: { error: { message: 'Firebase não configurado' } } };
  const response = await axios.post(`https://fcm.googleapis.com/v1/projects/${access.projectId}/messages:send`, buildFcmMessage(token, message), {
    headers: { Authorization: `Bearer ${access.value}` },
    timeout: 15000,
    validateStatus: () => true,
  });
  return { ok: response.status >= 200 && response.status < 300, status: response.status, body: response.data };
}

// ---------------------------------------------------------------- iOS (APNs)

let apnsToken: { value: string; createdAt: number } | null = null;

function apnsJwt(settings: NativePushSettings): string | null {
  if (!settings.apnsKey || !settings.apnsKeyId || !settings.apnsTeamId) return null;
  // a Apple recusa token renovado mais de uma vez a cada 20 min e vencido depois de 1 h
  if (apnsToken && Date.now() - apnsToken.createdAt < 50 * 60 * 1000) return apnsToken.value;
  apnsToken = { value: buildApnsJwt({ p8: settings.apnsKey, keyId: settings.apnsKeyId, teamId: settings.apnsTeamId }), createdAt: Date.now() };
  return apnsToken.value;
}

function sendApns(settings: NativePushSettings, token: string, message: NativePushMessage): Promise<{ ok: boolean; status: number; body: any }> {
  const bearer = apnsJwt(settings);
  if (!bearer) return Promise.resolve({ ok: false, status: 0, body: { reason: 'APNs não configurada' } });
  return new Promise((resolve) => {
    const client = http2.connect(apnsHost(settings.apnsProduction));
    const done = (result: { ok: boolean; status: number; body: any }) => {
      client.close();
      resolve(result);
    };
    client.on('error', (error) => done({ ok: false, status: 0, body: { reason: error.message } }));
    client.setTimeout(15000, () => done({ ok: false, status: 0, body: { reason: 'Tempo esgotado' } }));
    const request = client.request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${bearer}`,
      'apns-topic': settings.apnsBundleId,
      'apns-push-type': 'alert',
      'apns-priority': message.highPriority ? '10' : '5',
      'content-type': 'application/json',
    });
    let status = 0;
    let raw = '';
    request.setEncoding('utf8');
    request.on('response', (headers) => {
      status = Number(headers[':status']) || 0;
    });
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      let body: any = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        body = { reason: raw };
      }
      done({ ok: status === 200, status, body });
    });
    request.on('error', (error) => done({ ok: false, status: 0, body: { reason: error.message } }));
    request.end(JSON.stringify(buildApnsPayload(message)));
  });
}

// ---------------------------------------------------------------- envio

export async function sendToDevice(device: { id?: string; platform: string; token: string }, message: NativePushMessage, settings?: NativePushSettings) {
  const config = settings || (await getNativePushSettings());
  const platform = device.platform as NativePlatform;
  const result = platform === 'IOS' ? await sendApns(config, device.token, message) : await sendFcm(config, device.token, message);
  if (!result.ok && device.id && shouldDropToken(platform, result.status, result.body)) {
    await prisma.nativePushDevice.deleteMany({ where: { id: device.id } }).catch(() => undefined);
    return { ...result, dropped: true };
  }
  if (result.ok && device.id) {
    await prisma.nativePushDevice.updateMany({ where: { id: device.id }, data: { lastUsed: new Date() } }).catch(() => undefined);
  }
  return { ...result, dropped: false };
}

/** Manda para todos os aparelhos da pessoa. Nunca lança erro. */
export async function sendNativePush(recipientType: 'user' | 'citizen', recipientId: string, message: NativePushMessage) {
  try {
    // aviso de um município nunca vai para aparelho registrado em outro
    const tenantId = tryGetTenantId();
    const devices = await prisma.nativePushDevice.findMany({
      where: {
        ...(recipientType === 'citizen' ? { citizenId: recipientId } : { userId: recipientId }),
        ...(tenantId && tenantId !== PLATFORM_CONTEXT_ID ? { tenantId } : {}),
      },
      select: { id: true, platform: true, token: true },
    });
    if (devices.length === 0) return { sent: 0, failed: 0 };
    const settings = await getNativePushSettings();
    const results = await Promise.all(devices.map((device) => sendToDevice(device, message, settings).catch(() => ({ ok: false }))));
    const sent = results.filter((result) => result.ok).length;
    return { sent, failed: results.length - sent };
  } catch (error) {
    console.error('[NativePush] erro ao enviar', error instanceof Error ? error.message : error);
    return { sent: 0, failed: 0 };
  }
}

/** Sair da conta / excluir conta: tira o aparelho (ou todos da pessoa) */
export async function removeNativeDevices(where: { token?: string; citizenId?: string; userId?: string }) {
  if (!where.token && !where.citizenId && !where.userId) return 0;
  const result = await prisma.nativePushDevice.deleteMany({ where });
  return result.count;
}
