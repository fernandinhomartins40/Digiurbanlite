const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:postgres@localhost:5433/digiurban_lite'
});

async function main() {
  console.log('═'.repeat(70));
  console.log('   VERIFICAÇÃO DE CHAVE DKIM NO BANCO DE DADOS');
  console.log('═'.repeat(70) + '\n');

  const domains = await prisma.emailDomain.findMany({
    select: {
      id: true,
      domainName: true,
      dkimSelector: true,
      dkimPublicKey: true,
      dkimPrivateKey: true,
      dkimEnabled: true,
      isVerified: true
    }
  });

  if (domains.length === 0) {
    console.log('❌ Nenhum domínio encontrado no banco de dados\n');
    return;
  }

  domains.forEach((domain, index) => {
    console.log(`\n📧 Domínio ${index + 1}: ${domain.domainName}`);
    console.log(`   Selector: ${domain.dkimSelector || 'não configurado'}`);
    console.log(`   DKIM Habilitado: ${domain.dkimEnabled ? '✅' : '❌'}`);
    console.log(`   Verificado: ${domain.isVerified ? '✅' : '❌'}`);

    if (domain.dkimPublicKey) {
      console.log(`   Chave Pública (primeiros 100 chars):`);
      console.log(`   ${domain.dkimPublicKey.substring(0, 100)}...`);
      console.log(`   Tamanho total: ${domain.dkimPublicKey.length} caracteres`);
    } else {
      console.log(`   ❌ Chave Pública: NÃO CONFIGURADA`);
    }

    if (domain.dkimPrivateKey) {
      console.log(`   ✅ Chave Privada: Configurada (${domain.dkimPrivateKey.length} chars)`);
    } else {
      console.log(`   ❌ Chave Privada: NÃO CONFIGURADA`);
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log('   CHAVE ENCONTRADA NO DNS:');
  console.log('═'.repeat(70));
  console.log('MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA15+yFlPgt1OAQKS8nzdVSihRcasPiCkggGQyxqJ5qgXHcZHvWSt96OHODXu9Iz5oRA0Og3fq0WxBMb7N1borwZedneTYcDfm85U5me2bTaKW6Ob1z2UYQeBBCkPLCHcRdHR1BYIA6dIljJCMonvL1RldUeDIEq8IfVC5RgKCX79wY0qhhOzk8dmtwiBPFAG5W4sgHWXP76KuRlyWuE3t7NJij94cPxfVOGkPqAgLBl3dBIma6+mfnEH45fch7EXUra8p/0aPYlvi8j+OGbU4DaGztb1l1FuJCd/TCDSGqYyX6YWZH2pxHUy6XGsRDlk2gF8OFRGswL7U4WGhv8+eFQIDAQAB');
  console.log('\n' + '═'.repeat(70) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
