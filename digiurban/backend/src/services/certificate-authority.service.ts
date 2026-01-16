import { PrismaClient } from '@prisma/client';
import * as forge from 'node-forge';

const prisma = new PrismaClient();

interface IssueCertificateInput {
  userId: string;
  commonName: string;
  email: string;
  department?: string;
  certificateType: 'SERVER' | 'CITIZEN' | 'SYSTEM';
  validityYears?: number;
}

export async function issueServerCertificate(input: IssueCertificateInput) {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = generateSerialNumber();

  const now = new Date();
  cert.validity.notBefore = now;
  cert.validity.notAfter = new Date(now.getTime() + (input.validityYears || 2) * 365 * 24 * 60 * 60 * 1000);

  cert.setSubject([
    { name: 'commonName', value: input.commonName },
    { name: 'emailAddress', value: input.email },
    { name: 'organizationName', value: 'Prefeitura Municipal' },
    { name: 'organizationalUnitName', value: input.department || 'Departamento' },
    { name: 'countryName', value: 'BR' },
  ]);

  const caPrivateKey = loadCAPrivateKey();
  const caCert = loadCACertificate();
  cert.setIssuer(caCert.subject.attributes);

  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, nonRepudiation: true, keyEncipherment: true },
    { name: 'extKeyUsage', clientAuth: true, emailProtection: true },
  ]);

  cert.sign(caPrivateKey, forge.md.sha256.create());

  const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certPem = forge.pki.certificateToPem(cert);

  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const md = forge.md.sha256.create();
  md.update(der);
  const thumbprint = md.digest().toHex();

  const privateKeyHash = forge.md.sha256.create().update(privateKeyPem).digest().toHex();

  const certificate = await prisma.digitalCertificate.create({
    data: {
      userId: input.userId,
      certificateType: input.certificateType,
      serialNumber: cert.serialNumber,
      commonName: input.commonName,
      email: input.email,
      department: input.department,
      publicKey: publicKeyPem,
      privateKeyHash,
      issuedAt: cert.validity.notBefore,
      expiresAt: cert.validity.notAfter,
      issuerCA: 'CA-MUNICIPAL-001',
      certificateChain: certPem + '\n' + forge.pki.certificateToPem(caCert),
      thumbprint,
      createdBy: input.userId,
    },
  });

  return {
    certificate,
    privateKey: privateKeyPem,
    publicKey: publicKeyPem,
    certPem,
    thumbprint,
  };
}

function generateSerialNumber(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.floor(Math.random() * 0xFFFFFF).toString(16);
  return (timestamp + random).padStart(32, '0');
}

function loadCAPrivateKey(): forge.pki.PrivateKey {
  const pem = process.env.CA_PRIVATE_KEY || generateDefaultCAKey();
  return forge.pki.privateKeyFromPem(pem);
}

function loadCACertificate(): forge.pki.Certificate {
  const pem = process.env.CA_CERTIFICATE || generateDefaultCACert();
  return forge.pki.certificateFromPem(pem);
}

function generateDefaultCAKey(): string {
  const keys = forge.pki.rsa.generateKeyPair(4096);
  return forge.pki.privateKeyToPem(keys.privateKey);
}

function generateDefaultCACert(): string {
  const keys = forge.pki.rsa.generateKeyPair(4096);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

  const attrs = [
    { name: 'commonName', value: 'CA Municipal Root' },
    { name: 'organizationName', value: 'Prefeitura Municipal' },
    { name: 'countryName', value: 'BR' },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([{ name: 'basicConstraints', cA: true }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return forge.pki.certificateToPem(cert);
}

export async function revokeCertificate(serialNumber: string, reason: string, revokedBy: string) {
  await prisma.digitalCertificate.updateMany({
    where: { serialNumber },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revocationReason: reason as any,
    },
  });

  await prisma.certificateRevocationList.create({
    data: {
      serialNumber,
      reason: reason as any,
      revokedBy,
    },
  });
}
