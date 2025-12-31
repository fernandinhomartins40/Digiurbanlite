import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Gera par de chaves DKIM (2048-bit RSA)
 */
function generateDKIMKeys(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Extrair apenas a chave pública (sem headers)
  const publicKeyBase64 = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\n/g, '')
    .trim();

  return {
    privateKey,
    publicKey: publicKeyBase64
  };
}

export async function seedEmailServer() {
  console.log('📧 Seeding Email Server...');

  try {
    // Verificar se já existe um EmailServer
    const existingServer = await prisma.emailServer.findFirst();

    if (existingServer) {
      console.log('  ⏭️  Email Server já existe, pulando seed');
      return;
    }

    // Criar EmailServer padrão
    const emailServer = await prisma.emailServer.create({
      data: {
        hostname: 'mail.digiurban.com.br',
        submissionPort: 587,
        mxPort: 25,
        tlsEnabled: true,
        certPath: null,
        keyPath: null,
        isPremiumService: false,
        isActive: true,
        monthlyPrice: 0,
        maxEmailsPerMonth: 0
      }
    });

    console.log(`  ✅ Email Server criado: ${emailServer.hostname}`);

    // Criar domínio padrão
    const dkimKeys = generateDKIMKeys();
    const emailDomain = await prisma.emailDomain.create({
      data: {
        emailServerId: emailServer.id,
        domainName: 'digiurban.com.br',
        isVerified: false, // Precisa configurar DNS
        dkimEnabled: true,
        dkimPrivateKey: dkimKeys.privateKey,
        dkimPublicKey: dkimKeys.publicKey,
        dkimSelector: 'default',
        spfEnabled: true,
        spfRecord: 'v=spf1 mx ~all',
        dmarcEnabled: true,
        dmarcPolicy: 'v=DMARC1; p=quarantine; rua=mailto:postmaster@digiurban.com.br'
      }
    });

    console.log(`  ✅ Email Domain criado: ${emailDomain.domainName}`);
    console.log('');
    console.log('  📋 CONFIGURAÇÃO DNS NECESSÁRIA:');
    console.log('  ════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  1. Registro MX:');
    console.log('     Tipo: MX');
    console.log('     Nome: @');
    console.log('     Valor: mail.digiurban.com.br');
    console.log('     Prioridade: 10');
    console.log('');
    console.log('  2. Registro SPF:');
    console.log('     Tipo: TXT');
    console.log('     Nome: @');
    console.log('     Valor: v=spf1 mx ~all');
    console.log('');
    console.log('  3. Registro DKIM:');
    console.log('     Tipo: TXT');
    console.log('     Nome: default._domainkey');
    console.log(`     Valor: v=DKIM1; k=rsa; p=${dkimKeys.publicKey}`);
    console.log('');
    console.log('  4. Registro DMARC:');
    console.log('     Tipo: TXT');
    console.log('     Nome: _dmarc');
    console.log('     Valor: v=DMARC1; p=quarantine; rua=mailto:postmaster@digiurban.com.br');
    console.log('');
    console.log('  ⚠️  Após configurar DNS, acesse /super-admin/email-server/domains');
    console.log('     e clique em "Verificar DNS" para ativar o domínio');
    console.log('  ════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('  ❌ Erro ao criar Email Server:', error);
    throw error;
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedEmailServer()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
