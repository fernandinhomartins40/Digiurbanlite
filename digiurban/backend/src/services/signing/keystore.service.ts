/**
 * Cofre das chaves de assinatura (sem .env — o operador não edita o .env):
 *  - chave mestra que cifra as chaves privadas dos certificados (AES-256-GCM);
 *  - autoridade certificadora (AC) da plataforma, que emite os certificados
 *    dos servidores, dos cidadãos e o selo de cada município.
 *
 * Criadas sozinhas no primeiro uso e guardadas cifradas em platform_secrets
 * (mesma cifra dos outros segredos da plataforma). Antes: a chave mestra caía
 * num texto fixo do código e a AC era sorteada de novo a cada certificado
 * (nenhum certificado podia ser conferido).
 */

import crypto from 'crypto';
import { promisify } from 'util';
import * as forge from 'node-forge';
import { prisma } from '../../lib/prisma';
import { runAsPlatform } from '../../lib/tenant-context';
import { openSecret, sealSecret } from '../platform-secrets.service';

const MASTER_KEY = 'cert_master_key';
const CA_KEY = 'signing_ca_private_key';
const CA_CERT = 'signing_ca_certificate';

const generateKeyPair = promisify(crypto.generateKeyPair);

async function readSecret(key: string): Promise<string | null> {
  const row = await runAsPlatform(async () => prisma.platformSecret.findUnique({ where: { key } }));
  return row ? openSecret(row.valueEnc) : null;
}

/** Grava só se ainda não existe; se outro processo gravou antes, vale o dele */
async function createSecret(key: string, value: string): Promise<string> {
  try {
    await runAsPlatform(async () => prisma.platformSecret.create({ data: { key, valueEnc: sealSecret(value) } }));
    return value;
  } catch {
    const existing = await readSecret(key);
    if (!existing) throw new Error(`Não foi possível guardar ${key}`);
    return existing;
  }
}

let masterKey: Buffer | null = null;
let masterPending: Promise<Buffer> | null = null;

/** Chave mestra (32 bytes) que cifra as chaves privadas dos certificados */
export async function getCertMasterKey(): Promise<Buffer> {
  if (masterKey) return masterKey;
  if (!masterPending) {
    masterPending = (async () => {
      const stored = (await readSecret(MASTER_KEY)) || (await createSecret(MASTER_KEY, crypto.randomBytes(32).toString('base64')));
      masterKey = Buffer.from(stored, 'base64');
      return masterKey;
    })().finally(() => {
      masterPending = null;
    });
  }
  return masterPending;
}

export interface PlatformCA {
  key: forge.pki.rsa.PrivateKey;
  cert: forge.pki.Certificate;
  certPem: string;
  /** identificador curto da AC (gravado em DigitalCertificate.issuerCA) */
  id: string;
}

let ca: PlatformCA | null = null;
let caPending: Promise<PlatformCA> | null = null;

export function randomSerial(): string {
  // número de série positivo (primeiro byte < 0x80)
  const bytes = crypto.randomBytes(16);
  bytes[0] = bytes[0] & 0x7f;
  return bytes.toString('hex');
}

export async function generateRsaKeyPair(bits: number): Promise<{ privateKeyPem: string; publicKeyPem: string }> {
  // nativo do Node (rápido, não trava o servidor como o gerador em JS)
  const { privateKey, publicKey } = await generateKeyPair('rsa', {
    modulusLength: bits,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  return { privateKeyPem: privateKey as unknown as string, publicKeyPem: publicKey as unknown as string };
}

function certThumbprint(cert: forge.pki.Certificate): string {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  return forge.md.sha256.create().update(der).digest().toHex();
}

async function createCA(): Promise<{ keyPem: string; certPem: string }> {
  const { privateKeyPem, publicKeyPem } = await generateRsaKeyPair(4096);
  const cert = forge.pki.createCertificate();
  cert.publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  cert.serialNumber = randomSerial();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 20);
  const attrs = [
    { name: 'commonName', value: 'Autoridade Certificadora DigiUrban' },
    { name: 'organizationName', value: 'DigiUrban' },
    { name: 'countryName', value: 'BR' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
    { name: 'subjectKeyIdentifier' },
  ]);
  cert.sign(forge.pki.privateKeyFromPem(privateKeyPem), forge.md.sha256.create());
  return { keyPem: privateKeyPem, certPem: forge.pki.certificateToPem(cert) };
}

/** Autoridade certificadora da plataforma (criada uma vez, guardada cifrada) */
export async function getPlatformCA(): Promise<PlatformCA> {
  if (ca) return ca;
  if (!caPending) {
    caPending = (async () => {
      let keyPem = await readSecret(CA_KEY);
      let certPem = await readSecret(CA_CERT);
      if (!keyPem || !certPem) {
        const created = await createCA();
        // a chave primeiro: se outro processo criou junto, as duas leituras abaixo ficam coerentes
        keyPem = await createSecret(CA_KEY, created.keyPem);
        certPem = keyPem === created.keyPem ? await createSecret(CA_CERT, created.certPem) : await waitForSecret(CA_CERT);
      }
      const cert = forge.pki.certificateFromPem(certPem);
      ca = { key: forge.pki.privateKeyFromPem(keyPem) as forge.pki.rsa.PrivateKey, cert, certPem, id: `DIGIURBAN-AC-${certThumbprint(cert).slice(0, 16).toUpperCase()}` };
      return ca;
    })().finally(() => {
      caPending = null;
    });
  }
  return caPending;
}

async function waitForSecret(key: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const value = await readSecret(key);
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${key} não apareceu`);
}

/** Confere se o certificado foi emitido pela AC atual (assinatura do emissor válida) */
export async function isIssuedByPlatformCA(certPem: string): Promise<boolean> {
  try {
    const authority = await getPlatformCA();
    const cert = forge.pki.certificateFromPem(certPem);
    return authority.cert.verify(cert);
  } catch {
    return false;
  }
}

export { certThumbprint };
