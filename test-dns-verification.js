const dns = require('dns/promises');

// Criar resolver usando Google DNS
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '8.8.4.4']);

async function testDKIM() {
  const domain = 'digiurban.com.br';
  const selector = 'default';
  const dkimDomain = `${selector}._domainkey.${domain}`;

  console.log('\n🔍 Testando DKIM:');
  console.log(`Buscando: ${dkimDomain}`);

  try {
    const txtRecords = await dnsResolver.resolveTxt(dkimDomain);
    console.log('✅ Registros TXT encontrados:');
    txtRecords.forEach((record, index) => {
      const recordString = Array.isArray(record) ? record.join('') : record;
      console.log(`   ${index + 1}. ${recordString}`);
    });

    const dkimRecord = txtRecords
      .flat()
      .find(record => record.startsWith('v=DKIM1'));

    if (dkimRecord) {
      console.log('✅ Registro DKIM válido encontrado!');
      console.log(`   Valor: ${dkimRecord.substring(0, 100)}...`);
    } else {
      console.log('❌ Nenhum registro DKIM válido (que começa com v=DKIM1) foi encontrado');
    }
  } catch (error) {
    console.log(`❌ Erro ao buscar DKIM: ${error.code} - ${error.message}`);
  }
}

async function testDMARC() {
  const domain = 'digiurban.com.br';
  const dmarcDomain = `_dmarc.${domain}`;

  console.log('\n🔍 Testando DMARC:');
  console.log(`Buscando: ${dmarcDomain}`);

  try {
    const txtRecords = await dnsResolver.resolveTxt(dmarcDomain);
    console.log('✅ Registros TXT encontrados:');
    txtRecords.forEach((record, index) => {
      const recordString = Array.isArray(record) ? record.join('') : record;
      console.log(`   ${index + 1}. ${recordString}`);
    });

    const dmarcRecord = txtRecords
      .flat()
      .find(record => record.startsWith('v=DMARC1'));

    if (dmarcRecord) {
      console.log('✅ Registro DMARC válido encontrado!');
      console.log(`   Valor: ${dmarcRecord}`);
    } else {
      console.log('❌ Nenhum registro DMARC válido (que começa com v=DMARC1) foi encontrado');
    }
  } catch (error) {
    console.log(`❌ Erro ao buscar DMARC: ${error.code} - ${error.message}`);
  }
}

async function testSPF() {
  const domain = 'digiurban.com.br';

  console.log('\n🔍 Testando SPF:');
  console.log(`Buscando: ${domain}`);

  try {
    const txtRecords = await dnsResolver.resolveTxt(domain);
    console.log('✅ Registros TXT encontrados:');
    txtRecords.forEach((record, index) => {
      const recordString = Array.isArray(record) ? record.join('') : record;
      console.log(`   ${index + 1}. ${recordString}`);
    });

    const spfRecord = txtRecords
      .flat()
      .find(record => record.startsWith('v=spf1'));

    if (spfRecord) {
      console.log('✅ Registro SPF válido encontrado!');
      console.log(`   Valor: ${spfRecord}`);
    } else {
      console.log('❌ Nenhum registro SPF válido (que começa com v=spf1) foi encontrado');
    }
  } catch (error) {
    console.log(`❌ Erro ao buscar SPF: ${error.code} - ${error.message}`);
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('   TESTE DE VERIFICAÇÃO DNS - DigiUrban');
  console.log('═'.repeat(60));

  await testSPF();
  await testDKIM();
  await testDMARC();

  console.log('\n' + '═'.repeat(60));
  console.log('Teste concluído!');
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
