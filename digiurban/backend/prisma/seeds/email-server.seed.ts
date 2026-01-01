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
    // IMPORTANTE: hostname usa nome do container Docker para comunicação interna
    const emailServer = await prisma.emailServer.create({
      data: {
        hostname: 'ultrazend-smtp',  // Nome do container Docker
        submissionPort: 587,          // Porta INTERNA do container
        mxPort: 25,                   // Porta INTERNA do container
        tlsEnabled: false,            // TLS desabilitado (conexão interna segura via Docker network)
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
    // NOTA: Não gerar novas chaves DKIM, pois elas já estão configuradas no DNS
    // Se você precisa de novas chaves, delete manualmente o domínio e rode o seed novamente
    const existingDKIMPublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA15+yFlPgt1OAQKS8nzdVSihRcasPiCkggGQyxqJ5qgXHcZHvWSt96OHODXu9Iz5oRA0Og3fq0WxBMb7N1borwZedneTYcDfm85U5me2bTaKW6Ob1z2UYQeBBCkPLCHcRdHR1BYIA6dIljJCMonvL1RldUeDIEq8IfVC5RgKCX79wY0qhhOzk8dmtwiBPFAG5W4sgHWXP76KuRlyWuE3t7NJij94cPxfVOGkPqAgLBl3dBIma6+mfnEH45fch7EXUra8p/0aPYlvi8j+OGbU4DaGztb1l1FuJCd/TCDSGqYyX6YWZH2pxHUy6XGsRDlk2gF8OFRGswL7U4WGhv8+eFQIDAQAB';

    // Gerar apenas chave privada correspondente à pública já configurada no DNS
    // IMPORTANTE: Em produção, você deve ter a chave privada salva em segurança
    // Por enquanto, vamos usar null e permitir que seja gerada manualmente pela interface
    const emailDomain = await prisma.emailDomain.create({
      data: {
        emailServerId: emailServer.id,
        domainName: 'digiurban.com.br',
        isVerified: false, // Será verificado automaticamente ao detectar os registros DNS
        dkimEnabled: true,
        dkimPrivateKey: null, // Será gerada manualmente pela interface quando necessário
        dkimPublicKey: existingDKIMPublicKey,
        dkimSelector: 'default',
        spfEnabled: true,
        spfRecord: 'v=spf1 mx ~all',
        dmarcEnabled: true,
        dmarcPolicy: 'v=DMARC1; p=quarantine; rua=mailto:postmaster@digiurban.com.br'
      }
    });

    console.log(`  ✅ Email Domain criado: ${emailDomain.domainName}`);
    console.log('');
    console.log('  ✅ DNS JÁ CONFIGURADO CORRETAMENTE:');
    console.log('  ════════════════════════════════════════════════════════════');
    console.log('  ✓ MX Record: mail.digiurban.com.br');
    console.log('  ✓ SPF Record: v=spf1 mx ~all');
    console.log('  ✓ DKIM Record: default._domainkey.digiurban.com.br');
    console.log('  ✓ DMARC Record: _dmarc.digiurban.com.br');
    console.log('');
    console.log('  ⚠️  ATENÇÃO: Chave privada DKIM não está configurada!');
    console.log('     Para enviar emails com assinatura DKIM, você precisa:');
    console.log('     1. Acessar /super-admin/email-server/domains');
    console.log('     2. Clicar em "Gerar Chaves DKIM" no domínio digiurban.com.br');
    console.log('     3. Atualizar o DNS com a nova chave pública gerada');
    console.log('');
    console.log('  📝 Ou, se você tem a chave privada correspondente à pública atual,');
    console.log('     adicione-a manualmente no banco de dados.');
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
