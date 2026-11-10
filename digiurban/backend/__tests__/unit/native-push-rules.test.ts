import { generateKeyPairSync } from 'crypto';
import jwt from 'jsonwebtoken';
import {
  buildApnsJwt,
  buildApnsPayload,
  buildFcmAssertion,
  buildFcmMessage,
  FCM_SCOPE,
  looksLikeDeviceToken,
  normalizeP8,
  parseServiceAccount,
  shouldDropToken,
} from '../../src/services/native-push/rules';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1', publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });

const account = { project_id: 'digiurban-app', client_email: 'push@digiurban-app.iam.gserviceaccount.com', private_key: rsa.privateKey };

describe('push nativo — Firebase (Android)', () => {
  it('lê o JSON da conta de serviço e recusa o incompleto', () => {
    expect(parseServiceAccount(JSON.stringify(account))?.project_id).toBe('digiurban-app');
    expect(parseServiceAccount(JSON.stringify({ project_id: 'x' }))).toBeNull();
    expect(parseServiceAccount('não é json')).toBeNull();
    expect(parseServiceAccount(null)).toBeNull();
  });

  it('assina o pedido de token OAuth com a chave da conta (RS256, 1 h)', () => {
    const assertion = buildFcmAssertion(account, 1000);
    const decoded: any = jwt.verify(assertion, rsa.publicKey, { algorithms: ['RS256'], ignoreExpiration: true });
    expect(decoded).toMatchObject({ iss: account.client_email, scope: FCM_SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: 1000, exp: 4600 });
  });

  it('monta a mensagem com dados só em texto', () => {
    const body = buildFcmMessage('tok', { title: 'Pedido', body: 'Atualizado', data: { url: '/cidadao/protocolos/1', count: 2, nada: null }, highPriority: true });
    expect(body.message.token).toBe('tok');
    expect(body.message.data).toEqual({ url: '/cidadao/protocolos/1', count: '2' });
    expect(body.message.android.priority).toBe('HIGH');
  });
});

describe('push nativo — APNs (iOS)', () => {
  it('assina o token ES256 com Key ID e Team ID', () => {
    const token = buildApnsJwt({ p8: ec.privateKey, keyId: 'ABC123DEFG', teamId: 'TEAM123456' }, 2000);
    const decoded: any = jwt.verify(token, ec.publicKey, { algorithms: ['ES256'] });
    expect(decoded).toMatchObject({ iss: 'TEAM123456', iat: 2000 });
    expect((jwt.decode(token, { complete: true }) as any).header).toMatchObject({ alg: 'ES256', kid: 'ABC123DEFG' });
  });

  it('aceita a chave .p8 colada sem as linhas BEGIN/END', () => {
    const body = ec.privateKey.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
    expect(normalizeP8(body)).toContain('-----BEGIN PRIVATE KEY-----');
    expect(() => buildApnsJwt({ p8: body, keyId: 'K', teamId: 'T' })).not.toThrow();
  });

  it('payload leva alerta e o endereço da tela', () => {
    expect(buildApnsPayload({ title: 'Oi', body: 'Corpo', data: { url: '/cidadao' } })).toEqual({ aps: { alert: { title: 'Oi', body: 'Corpo' }, sound: 'default' }, url: '/cidadao' });
  });
});

describe('push nativo — quando apagar o token', () => {
  it('Android: aparelho que não existe mais', () => {
    expect(shouldDropToken('ANDROID', 404, {})).toBe(true);
    expect(shouldDropToken('ANDROID', 400, { error: { message: 'The registration token is not a valid FCM registration token' } })).toBe(true);
    expect(shouldDropToken('ANDROID', 403, { error: { details: [{ errorCode: 'UNREGISTERED' }] } })).toBe(true);
  });

  it('Android: erro de configuração não apaga', () => {
    expect(shouldDropToken('ANDROID', 401, { error: { message: 'auth' } })).toBe(false);
    expect(shouldDropToken('ANDROID', 403, { error: { details: [{ errorCode: 'SENDER_ID_MISMATCH' }] } })).toBe(false);
    expect(shouldDropToken('ANDROID', 0, {})).toBe(false);
  });

  it('iOS: 410 e BadDeviceToken apagam; chave errada não', () => {
    expect(shouldDropToken('IOS', 410, { reason: 'Unregistered' })).toBe(true);
    expect(shouldDropToken('IOS', 400, { reason: 'BadDeviceToken' })).toBe(true);
    expect(shouldDropToken('IOS', 403, { reason: 'InvalidProviderToken' })).toBe(false);
    expect(shouldDropToken('IOS', 400, { reason: 'DeviceTokenNotForTopic' })).toBe(false);
  });

  it('confere o formato do token do aparelho', () => {
    expect(looksLikeDeviceToken('IOS', 'a'.repeat(64))).toBe(true);
    expect(looksLikeDeviceToken('IOS', 'xyz')).toBe(false);
    expect(looksLikeDeviceToken('ANDROID', 'fcm:APA91b' + 'x'.repeat(100))).toBe(true);
    expect(looksLikeDeviceToken('ANDROID', 'tem espaço no meio do token')).toBe(false);
  });
});
