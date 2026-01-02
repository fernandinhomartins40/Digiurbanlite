const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
      console.log(`\n   📝 Chave Pública no Banco:`);
      console.log(`   ${domain.dkimPublicKey.substring(0, 100)}...`);
      console.log(`   Tamanho: ${domain.dkimPublicKey.length} caracteres`);
    } else {
      console.log(`   ❌ Chave Pública: NÃO CONFIGURADA`);
    }
  });

  console.log('\n' + '═'.repeat(70));
  console.log('   CHAVE ENCONTRADA NO DNS:');
  console.log('═'.repeat(70));
  const dnsKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA15+yFlPgt1OAQKS8nzdVSihRcasPiCkggGQyxqJ5qgXHcZHvWSt96OHODXu9Iz5oRA0Og3fq0WxBMb7N1borwZedneTYcDfm85U5me2bTaKW6Ob1z2UYQeBBCkPLCHcRdHR1BYIA6dIljJCMonvL1RldUeDIEq8IfVC5RgKCX79wY0qhhOzk8dmtwiBPFAG5W4sgHWXP76KuRlyWuE3t7NJij94cPxfVOGkPqAgLBl3dBIma6+mfnEH45fch7EXUra8p/0aPYlvi8j+OGbU4DaGztb1l1FuJCd/TCDSGqYyX6YWZH2pxHUy6XGsRDlk2gF8OFRGswL7U4WGhv8+eFQIDAQAB';
  console.log(`   ${dnsKey.substring(0, 100)}...`);
  console.log(`   Tamanho: ${dnsKey.length} caracteres`);

  // Comparar
  if (domains.length > 0 && domains[0].dkimPublicKey) {
    const dbKey = domains[0].dkimPublicKey;
    console.log('\n' + '═'.repeat(70));
    if (dbKey === dnsKey) {
      console.log('✅ CHAVES IDÊNTICAS! DNS e Banco de Dados estão sincronizados');
    } else if (dbKey.includes(dnsKey) || dnsKey.includes(dbKey)) {
      console.log('⚠️ As chaves são parcialmente iguais (uma contém a outra)');
    } else {
      console.log('❌ CHAVES DIFERENTES! DNS e Banco de Dados NÃO estão sincronizados');
      console.log(`   Primeiros 50 chars DB: ${dbKey.substring(0, 50)}`);
      console.log(`   Primeiros 50 chars DNS: ${dnsKey.substring(0, 50)}`);
    }
  }

  console.log('═'.repeat(70) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
