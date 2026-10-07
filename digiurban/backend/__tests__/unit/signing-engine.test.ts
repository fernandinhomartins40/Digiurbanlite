/**
 * Motor único de assinatura: regras puras (código, conferência criptográfica,
 * nome abreviado) e a folha de assinaturas no PDF.
 */

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));
jest.mock('../../src/services/notification.service', () => ({ __esModule: true, default: { notify: jest.fn() } }));
jest.mock('../../src/services/mail/links', () => ({ tenantPortalUrl: jest.fn(async () => 'https://teste.exemplo') }));
jest.mock('../../src/services/protocol-access.service', () => ({ assertProtocolAccess: jest.fn() }));

import crypto from 'crypto';
import * as forge from 'node-forge';
import { PDFDocument } from 'pdf-lib';
import { internalContentHash, maskName, normalizeCode, rsaVerify, signatureCode } from '../../src/services/signing/signature.service';
import { appendManifest } from '../../src/services/signing/signed-pdf.service';

describe('motor de assinatura', () => {
  it('código da assinatura tem 16 caracteres em grupos de 4 e aceita digitação solta', () => {
    const code = signatureCode('assinatura-qualquer');
    expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(normalizeCode(code.toLowerCase().replace(/-/g, ' '))).toBe(code);
    expect(normalizeCode('VAL-2026-123')).toBeNull();
  });

  it('assinatura RSA confere só com o mesmo conteúdo e a mesma chave', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });
    const content = crypto.createHash('sha256').update('conteúdo do documento').digest('hex');
    const key = forge.pki.privateKeyFromPem(privateKey);
    const md = forge.md.sha256.create();
    md.update(Buffer.from(content, 'hex').toString('binary'), 'raw');
    const signature = forge.util.encode64(key.sign(md));
    expect(rsaVerify(publicKey, content, signature)).toBe(true);
    const other = crypto.createHash('sha256').update('conteúdo alterado').digest('hex');
    expect(rsaVerify(publicKey, other, signature)).toBe(false);
  });

  it('conteúdo do documento interno muda quando o texto muda', () => {
    const doc = { id: 'd1', title: 'DFD', content: 'texto' };
    expect(internalContentHash(doc)).toBe(internalContentHash({ ...doc }));
    expect(internalContentHash({ ...doc, content: 'texto!' })).not.toBe(internalContentHash(doc));
  });

  it('nome do cidadão sai abreviado na conferência pública', () => {
    expect(maskName('Maria Aparecida da Silva')).toBe('Maria A. da S.');
    expect(maskName('João')).toBe('João');
    expect(maskName(null)).toBeNull();
  });

  it('folha de assinaturas vai no fim, sem mexer nas páginas do original', async () => {
    const original = await PDFDocument.create();
    original.addPage();
    const bytes = Buffer.from(await original.save());
    const signed = await appendManifest(bytes, {
      municipality: 'Prefeitura de Teste',
      title: 'Certidão — nº 1',
      verifyCode: 'ABCD-1234-ABCD-1234',
      verifyUrl: 'https://teste.exemplo/validar-documento?codigo=ABCD-1234-ABCD-1234',
      contentHash: 'a'.repeat(64),
      signatures: [{ name: 'Ana “Teste”', role: 'Servidor - Saúde', signedAt: new Date(), code: 'AAAA-BBBB-CCCC-DDDD' }],
    });
    const result = await PDFDocument.load(signed);
    expect(result.getPageCount()).toBe(2);
  });
});
