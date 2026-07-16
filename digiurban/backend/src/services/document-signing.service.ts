import { prisma } from '../lib/prisma';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';


interface SignDocumentInput {
  documentId: string;
  certificateId: string;
  privateKey: string;
  ipAddress: string;
  userAgent: string;
}

export async function signDocument(input: SignDocumentInput) {
  const document = await prisma.generatedDocument.findUnique({
    where: { id: input.documentId },
  });

  const certificate = await prisma.digitalCertificate.findUnique({
    where: { id: input.certificateId },
  });

  if (!document || !certificate) {
    throw new Error('Documento ou certificado não encontrado');
  }

  if (certificate.status !== 'ACTIVE') {
    throw new Error('Certificado inativo ou revogado');
  }

  if (new Date(certificate.expiresAt) < new Date()) {
    throw new Error('Certificado expirado');
  }

  const privateKeyHash = crypto.createHash('sha256').update(input.privateKey).digest('hex');

  if (privateKeyHash !== certificate.privateKeyHash) {
    throw new Error('Chave privada inválida');
  }

  const fileBuffer = await fs.readFile(document.filePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest();

  const privateKeyObj = forge.pki.privateKeyFromPem(input.privateKey);
  const md = forge.md.sha256.create();
  md.update(hash.toString('binary'), 'raw');
  const signature = privateKeyObj.sign(md);
  const signatureBase64 = forge.util.encode64(signature);

  const signatureRecord = await prisma.signature.create({
    data: {
      documentId: input.documentId,
      certificateId: input.certificateId,
      signatureValue: signatureBase64,
      signatureHash: hash.toString('hex'),
      signatureAlgo: 'SHA256withRSA',
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });

  return signatureRecord;
}

export async function verifySignature(signatureId: string) {
  const signature = await prisma.signature.findUnique({
    where: { id: signatureId },
    include: { document: true, externalDocument: true, certificate: true },
  });

  if (!signature) {
    throw new Error('Assinatura não encontrada');
  }

  const isRevoked = await isCertificateRevoked(signature.certificate.serialNumber);
  if (isRevoked) {
    return { valid: false, reason: 'Certificado foi revogado' };
  }

  // Buscar arquivo do documento (gerado ou externo)
  const filePath = signature.document?.filePath || signature.externalDocument?.filePath;
  if (!filePath) {
    return { valid: false, reason: 'Arquivo do documento não encontrado' };
  }

  const fileBuffer = await fs.readFile(filePath);
  const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  if (currentHash !== signature.signatureHash) {
    return { valid: false, reason: 'Documento foi modificado após assinatura' };
  }

  const publicKeyObj = forge.pki.publicKeyFromPem(signature.certificate.publicKey);
  const signatureBytes = forge.util.decode64(signature.signatureValue);

  const md = forge.md.sha256.create();
  md.update(Buffer.from(currentHash, 'hex').toString('binary'), 'raw');

  const verified = publicKeyObj.verify(md.digest().bytes(), signatureBytes);

  if (!verified) {
    return { valid: false, reason: 'Assinatura criptográfica inválida' };
  }

  await prisma.signature.update({
    where: { id: signatureId },
    data: {
      validationCount: { increment: 1 },
      validatedAt: new Date(),
    },
  });

  return {
    valid: true,
    signer: {
      name: signature.certificate.commonName,
      email: signature.certificate.email,
      department: signature.certificate.department,
    },
    signedAt: signature.signedAt,
    certificate: {
      serialNumber: signature.certificate.serialNumber,
      issuedAt: signature.certificate.issuedAt,
      expiresAt: signature.certificate.expiresAt,
    },
  };
}

async function isCertificateRevoked(serialNumber: string): Promise<boolean> {
  const revoked = await prisma.certificateRevocationList.findFirst({
    where: { serialNumber },
  });
  return !!revoked;
}
