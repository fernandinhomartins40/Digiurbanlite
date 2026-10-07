/**
 * Emissão e revogação de certificados (AC da plataforma — signing/keystore).
 *
 * O certificado do servidor/cidadão é emitido SOZINHO na primeira assinatura
 * (ensureUserCertificate / ensureCitizenCertificate): assinar é confirmar a
 * senha. A chave privada nunca sai do servidor (nenhuma resposta a devolve) e
 * fica cifrada com a chave mestra do cofre.
 *
 * Assinatura eletrônica avançada (Lei 14.063/2020, art. 4º, II): certificado
 * não ICP-Brasil, ligado ao titular, com uso condicionado à senha dele.
 */

import * as forge from 'node-forge';
import { prisma } from '../lib/prisma';
import { tryGetTenantId } from '../lib/tenant-context';
import { decryptPrivateKey, encryptPrivateKey, isLegacyEncrypted } from './encryption.service';
import { certThumbprint, generateRsaKeyPair, getPlatformCA, randomSerial } from './signing/keystore.service';

export interface IssueCertificateInput {
  userId?: string;
  citizenId?: string;
  commonName: string;
  email: string;
  department?: string;
  certificateType: 'SERVER' | 'CITIZEN' | 'SYSTEM';
  validityYears?: number;
  createdBy?: string;
}

async function tenantName(): Promise<string> {
  const tenantId = tryGetTenantId();
  if (!tenantId) return 'Prefeitura Municipal';
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId }, select: { nome: true } }).catch(() => null);
  return (tenant as any)?.nome || 'Prefeitura Municipal';
}

/** Emite um certificado assinado pela AC da plataforma. Não devolve a chave privada. */
export async function issueCertificate(input: IssueCertificateInput) {
  const authority = await getPlatformCA();
  const { privateKeyPem, publicKeyPem } = await generateRsaKeyPair(2048);
  const organization = await tenantName();

  const cert = forge.pki.createCertificate();
  cert.publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  cert.serialNumber = randomSerial();
  const now = new Date();
  cert.validity.notBefore = now;
  cert.validity.notAfter = new Date(now.getTime() + (input.validityYears || 2) * 365 * 24 * 60 * 60 * 1000);
  cert.setSubject([
    { name: 'commonName', value: input.commonName.slice(0, 64) },
    ...(input.email ? [{ name: 'emailAddress', value: input.email.slice(0, 128) }] : []),
    { name: 'organizationName', value: organization.slice(0, 64) },
    { name: 'organizationalUnitName', value: (input.department || (input.certificateType === 'CITIZEN' ? 'Cidadão' : 'Servidor')).slice(0, 64) },
    { name: 'countryName', value: 'BR' },
  ]);
  cert.setIssuer(authority.cert.subject.attributes);
  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, critical: true },
    { name: 'extKeyUsage', emailProtection: true },
    { name: 'subjectKeyIdentifier' },
  ]);
  cert.sign(authority.key, forge.md.sha256.create());

  const certPem = forge.pki.certificateToPem(cert);
  const privateKeyHash = forge.md.sha256.create().update(privateKeyPem).digest().toHex();

  return prisma.digitalCertificate.create({
    data: {
      userId: input.userId || undefined,
      citizenId: input.citizenId || undefined,
      certificateType: input.certificateType,
      serialNumber: cert.serialNumber,
      commonName: input.commonName,
      email: input.email || '',
      organization,
      department: input.department,
      publicKey: publicKeyPem,
      privateKeyHash,
      encryptedPrivateKey: await encryptPrivateKey(privateKeyPem),
      issuedAt: cert.validity.notBefore,
      expiresAt: cert.validity.notAfter,
      issuerCA: authority.id,
      certificateChain: `${certPem}\n${authority.certPem}`,
      thumbprint: certThumbprint(cert),
      createdBy: input.createdBy || input.userId || input.citizenId || 'SYSTEM',
    },
  });
}

/** Mantido para as telas antigas de emissão/aprovação (agora sem chave privada na resposta) */
export const issueServerCertificate = issueCertificate;

/** Certificado válido emitido pela AC atual? (os antigos, de AC sorteada, não servem mais) */
async function usable(cert: { status: string; expiresAt: Date; issuerCA: string } | null) {
  if (!cert || cert.status !== 'ACTIVE' || cert.expiresAt <= new Date()) return false;
  return cert.issuerCA === (await getPlatformCA()).id;
}

/** Substitui certificados antigos/vencidos do titular (sem apagar: as assinaturas feitas continuam conferíveis) */
async function retireOld(where: { userId?: string; citizenId?: string }, keepId: string) {
  const authority = await getPlatformCA();
  const old = await prisma.digitalCertificate.findMany({
    where: { ...where, status: 'ACTIVE', id: { not: keepId }, OR: [{ issuerCA: { not: authority.id } }, { expiresAt: { lte: new Date() } }] },
    select: { id: true },
  });
  if (old.length) {
    await prisma.digitalCertificate.updateMany({
      where: { id: { in: old.map((item) => item.id) } },
      data: { status: 'REVOKED', revokedAt: new Date(), revocationReason: 'SUPERSEDED', isActive: false },
    });
  }
}

/** Certificado de assinatura do servidor: o atual, ou emite um novo na hora */
export async function ensureUserCertificate(userId: string) {
  const current = await prisma.digitalCertificate.findFirst({
    where: { userId, status: 'ACTIVE', certificateType: 'SERVER' },
    orderBy: { issuedAt: 'desc' },
  });
  if (current && (await usable(current))) return current;
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { name: true, email: true, department: { select: { name: true } } },
  });
  if (!user) throw new Error('Servidor não encontrado');
  const issued = await issueCertificate({
    userId,
    commonName: user.name,
    email: user.email,
    department: (user as any).department?.name || undefined,
    certificateType: 'SERVER',
    createdBy: userId,
  });
  await retireOld({ userId }, issued.id);
  return issued;
}

/** Certificado de assinatura do cidadão: o atual, ou emite um novo na hora */
export async function ensureCitizenCertificate(citizenId: string) {
  const current = await prisma.digitalCertificate.findFirst({
    where: { citizenId, status: 'ACTIVE', certificateType: 'CITIZEN' },
    orderBy: { issuedAt: 'desc' },
  });
  if (current && (await usable(current))) return current;
  const citizen = await prisma.citizen.findFirst({ where: { id: citizenId }, select: { name: true, email: true } });
  if (!citizen) throw new Error('Cidadão não encontrado');
  const issued = await issueCertificate({
    citizenId,
    commonName: citizen.name,
    email: citizen.email || '',
    certificateType: 'CITIZEN',
    createdBy: citizenId,
  });
  await retireOld({ citizenId }, issued.id);
  return issued;
}

/**
 * Chave privada do certificado, para assinar AGORA (nunca devolver ao cliente).
 * Chave no formato antigo é recifrada na hora com a chave mestra do cofre.
 */
export async function loadSigningKey(certificate: { id: string; encryptedPrivateKey: string }): Promise<string> {
  const pem = await decryptPrivateKey(certificate.encryptedPrivateKey);
  if (isLegacyEncrypted(certificate.encryptedPrivateKey)) {
    await prisma.digitalCertificate
      .update({ where: { id: certificate.id }, data: { encryptedPrivateKey: await encryptPrivateKey(pem) } })
      .catch(() => undefined);
  }
  return pem;
}

/** Rotina: recifra as chaves no formato antigo (chave fixa do código). Rodar por município. */
export async function reencryptLegacyKeys(): Promise<{ converted: number; failed: number }> {
  const rows = await prisma.digitalCertificate.findMany({
    where: { NOT: { encryptedPrivateKey: { startsWith: 'v2:' } } },
    select: { id: true, encryptedPrivateKey: true },
    take: 500,
  });
  let converted = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await loadSigningKey(row);
      converted++;
    } catch {
      // chave que não abre (ex.: semente antiga com outra cifra): o certificado não serve para assinar
      await prisma.digitalCertificate
        .update({ where: { id: row.id }, data: { status: 'REVOKED', revokedAt: new Date(), revocationReason: 'KEY_COMPROMISE', isActive: false } })
        .catch(() => undefined);
      failed++;
    }
  }
  return { converted, failed };
}

export async function revokeCertificate(
  serialNumber: string,
  reason: 'UNSPECIFIED' | 'KEY_COMPROMISE' | 'CA_COMPROMISE' | 'AFFILIATION_CHANGED' | 'SUPERSEDED' | 'CESSATION' | 'CERTIFICATE_HOLD',
  revokedBy: string,
  comments?: string
) {
  await prisma.digitalCertificate.updateMany({
    where: { serialNumber },
    data: { status: 'REVOKED', revokedAt: new Date(), revocationReason: reason, isActive: false },
  });
  await prisma.certificateRevocationList.create({
    data: { serialNumber, reason, revokedBy, comments: comments || `Certificado revogado: ${reason}` },
  });
}
