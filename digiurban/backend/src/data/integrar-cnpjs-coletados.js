const fs = require('fs');

console.log('🔄 Integrando CNPJs coletados no municipios-brasil.json\n');

// Carregar arquivos
const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));
const cnpjsColetados = JSON.parse(fs.readFileSync('./cnpj-coletados.json', 'utf8'));

console.log(`📂 Total de municípios: ${municipios.length}`);
console.log(`📋 CNPJs coletados: ${Object.keys(cnpjsColetados).length}\n`);

let atualizados = 0;
let erros = 0;

// Integrar CNPJs
municipios.forEach(municipio => {
  const dadosCNPJ = cnpjsColetados[municipio.codigo_ibge];

  if (dadosCNPJ) {
    // Verificar se o município já tem CNPJ diferente
    if (municipio.cnpj && municipio.cnpj !== dadosCNPJ.cnpj) {
      console.log(`⚠️  CONFLITO: ${municipio.nome}-${municipio.uf}`);
      console.log(`   Atual: ${municipio.cnpj}`);
      console.log(`   Novo: ${dadosCNPJ.cnpj}`);
      erros++;
      return;
    }

    // Atualizar CNPJ
    if (!municipio.cnpj) {
      municipio.cnpj = dadosCNPJ.cnpj;
      atualizados++;
      console.log(`✅ ${municipio.nome}-${municipio.uf}: ${dadosCNPJ.cnpj}`);
    }
  }
});

// Salvar arquivo atualizado
fs.writeFileSync(
  './municipios-brasil.json',
  JSON.stringify(municipios, null, 2),
  'utf8'
);

// Estatísticas finais
const totalComCNPJ = municipios.filter(m => m.cnpj).length;
const totalSemCNPJ = municipios.filter(m => !m.cnpj).length;

console.log('\n' + '='.repeat(80));
console.log('✅ INTEGRAÇÃO CONCLUÍDA!');
console.log('='.repeat(80));
console.log(`📊 Estatísticas:`);
console.log(`   • Municípios atualizados: ${atualizados}`);
console.log(`   • Conflitos encontrados: ${erros}`);
console.log(`   • Total com CNPJ: ${totalComCNPJ} (${((totalComCNPJ / municipios.length) * 100).toFixed(2)}%)`);
console.log(`   • Total sem CNPJ: ${totalSemCNPJ} (${((totalSemCNPJ / municipios.length) * 100).toFixed(2)}%)`);
console.log('\n💾 Arquivo atualizado: municipios-brasil.json\n');
