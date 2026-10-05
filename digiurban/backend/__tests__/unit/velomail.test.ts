/**
 * E-mail transacional (VeloMail): assinatura do webhook e espera entre tentativas.
 */
import crypto from 'crypto';
import { isVeloMailRateLimit, mailRetryDelay, splitFromAddress, verifyVeloMailSignature, VeloMailError } from '../../src/services/mail/velomail.client';

const secret = 'whsec_teste_1234567890';
const body = Buffer.from(JSON.stringify({ event: 'email.delivered', data: { message_id: 'abc' }, timestamp: '2026-10-05T12:00:00Z' }));
const sign = (raw: Buffer, key = secret) => 'sha256=' + crypto.createHmac('sha256', key).update(raw).digest('hex');

describe('verifyVeloMailSignature', () => {
  it('aceita a assinatura certa', () => {
    expect(verifyVeloMailSignature(body, sign(body), secret)).toBe(true);
  });

  it('recusa corpo alterado', () => {
    const changed = Buffer.from(body.toString().replace('delivered', 'failed'));
    expect(verifyVeloMailSignature(changed, sign(body), secret)).toBe(false);
  });

  it('recusa segredo errado, assinatura vazia ou sem o prefixo', () => {
    expect(verifyVeloMailSignature(body, sign(body, 'outro-segredo-qualquer'), secret)).toBe(false);
    expect(verifyVeloMailSignature(body, '', secret)).toBe(false);
    expect(verifyVeloMailSignature(body, sign(body).replace('sha256=', ''), secret)).toBe(false);
  });
});

describe('mailRetryDelay', () => {
  it('dobra a espera a cada tentativa a partir de 1 minuto', () => {
    expect(mailRetryDelay(1)).toBe(60_000);
    expect(mailRetryDelay(2)).toBe(120_000);
    expect(mailRetryDelay(4)).toBe(480_000);
  });

  it('não passa de 2 horas', () => {
    expect(mailRetryDelay(20)).toBe(2 * 60 * 60 * 1000);
  });

  it('respeita o tempo pedido pelo VeloMail no limite por minuto (429)', () => {
    const error = new VeloMailError('limite', 429, 'RATE_LIMIT_EXCEEDED', true, 30_000);
    expect(mailRetryDelay(1, error)).toBe(31_000);
  });

  it('não espera mais de 1 hora mesmo se o VeloMail pedir', () => {
    const error = new VeloMailError('limite', 429, 'RATE_LIMIT_EXCEEDED', true, 24 * 3600 * 1000);
    expect(mailRetryDelay(1, error)).toBe(60 * 60 * 1000);
  });
});

describe('splitFromAddress', () => {
  it('separa nome e endereço (o VeloMail só aceita o endereço em "from")', () => {
    expect(splitFromAddress('"Prefeitura de Palmital" <nao-responda@notificacoes.digiurban.com.br>')).toEqual({
      name: 'Prefeitura de Palmital',
      email: 'nao-responda@notificacoes.digiurban.com.br',
    });
    expect(splitFromAddress('DigiUrban <a@b.com>')).toEqual({ name: 'DigiUrban', email: 'a@b.com' });
  });

  it('endereço sem nome passa direto', () => {
    expect(splitFromAddress('a@b.com')).toEqual({ name: null, email: 'a@b.com' });
  });
});

describe('isVeloMailRateLimit', () => {
  it('só o limite do plano conta como espera', () => {
    expect(isVeloMailRateLimit(new VeloMailError('x', 429, 'RATE_LIMIT_EXCEEDED', true, 60_000))).toBe(true);
    expect(isVeloMailRateLimit(new VeloMailError('x', 429, 'TENANT_POLICY_BLOCKED', true))).toBe(false);
    expect(isVeloMailRateLimit(new Error('x'))).toBe(false);
  });
});
