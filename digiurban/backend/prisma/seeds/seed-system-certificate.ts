/**
 * ============================================================================
 * SEED: CERTIFICADO DIGITAL DO SISTEMA
 * ============================================================================
 * Cria um certificado digital do sistema para assinatura automática de documentos
 */

import { PrismaClient } from '@prisma/client';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Criando certificado digital do sistema...');

  // Verificar se já existe certificado do sistema
  const existing = await prisma.digitalCertificate.findFirst({
    where: {
      userId: null,
      citizenId: null,
      status: 'ACTIVE'
    }
  });

  if (existing) {
    console.log('✅ Certificado do sistema já existe');
    console.log(`   → Serial: ${existing.serialNumber}`);
    console.log(`   → CN: ${existing.commonName}`);
    console.log(`   → Válido até: ${existing.expiresAt.toLocaleDateString('pt-BR')}`);
    return;
  }

  // Gerar par de chaves RSA 2048 bits
  console.log('   → Gerando par de chaves RSA 2048 bits...');
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

  // Calcular hash da chave privada
  const privateKeyHash = crypto.createHash('sha256').update(privateKeyPem).digest('hex');

  // Criptografar chave privada com AES-256-GCM
  const encryptionKey = process.env.CERTIFICATE_ENCRYPTION_KEY || 'default-key-change-in-production';
  const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const iv = Buffer.from(certificateId.substring(0, 16));

  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey.padEnd(32, '0').substring(0, 32)),
    iv
  );

  let encryptedPrivateKey = cipher.update(privateKeyPem, 'utf8', 'base64');
  encryptedPrivateKey += cipher.final('base64');

  // Gerar número de série único
  const serialNumber = `SYS-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  // Criar certificado X.509
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = serialNumber;

  const now = new Date();
  cert.validity.notBefore = now;
  cert.validity.notAfter = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()); // 2 anos

  const attrs = [
    { name: 'commonName', value: 'Sistema DigiUrban' },
    { name: 'organizationName', value: 'Prefeitura Municipal' },
    { name: 'organizationalUnitName', value: 'Departamento de TI' },
    { name: 'emailAddress', value: 'sistema@digiurban.gov.br' }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Auto-assinar o certificado
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Salvar no banco de dados
  const certificate = await prisma.digitalCertificate.create({
    data: {
      id: certificateId,
      userId: null, // Certificado do sistema
      citizenId: null,
      certificateType: 'A3', // Tipo A3 (maior segurança)
      serialNumber,
      commonName: 'Sistema DigiUrban',
      email: 'sistema@digiurban.gov.br',
      organization: 'Prefeitura Municipal',
      department: 'Departamento de TI',
      publicKey: publicKeyPem,
      privateKeyHash,
      encryptedPrivateKey,
      keySize: 2048,
      issuedAt: now,
      expiresAt: cert.validity.notAfter,
      status: 'ACTIVE',
      isActive: true,
      issuerCA: 'CA-MUNICIPAL-SYSTEM',
      thumbprint: crypto.createHash('sha256').update(publicKeyPem).digest('hex')
    }
  });

  console.log('✅ Certificado do sistema criado com sucesso!');
  console.log(`   → ID: ${certificate.id}`);
  console.log(`   → Serial: ${certificate.serialNumber}`);
  console.log(`   → CN: ${certificate.commonName}`);
  console.log(`   → Email: ${certificate.email}`);
  console.log(`   → Emitido em: ${certificate.issuedAt.toLocaleDateString('pt-BR')}`);
  console.log(`   → Válido até: ${certificate.expiresAt.toLocaleDateString('pt-BR')}`);
  console.log(`   → Thumbprint: ${certificate.thumbprint.substring(0, 32)}...`);
  console.log('');
  console.log('📝 Este certificado será usado para assinatura automática de documentos');
  console.log('   que possuam placeholder de assinatura no template.');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar certificado do sistema:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
