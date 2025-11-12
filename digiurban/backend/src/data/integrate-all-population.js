const fs = require('fs');

console.log('🔄 Integrando dados de população de TODOS os municípios...\n');

// Carregar dados
const municipios = require('./municipios-brasil.json');
const populacaoMap = require('./populacao-mapeamento.json');

console.log(`📊 Municípios no JSON: ${municipios.length}`);
console.log(`📊 Municípios com população (IBGE): ${Object.keys(populacaoMap).length}\n`);

// Integrar dados
let comPopulacao = 0;
let semPopulacao = 0;
let populacaoAtualizada = 0;
let comCNPJ = 0;

const municipiosAtualizados = municipios.map(mun => {
  const codigo = mun.codigo_ibge;
  const populacaoIBGE = populacaoMap[codigo];

  const dadosAtualizados = {
    ...mun,
    populacao: populacaoIBGE || mun.populacao || null,
  };

  if (dadosAtualizados.populacao) {
    comPopulacao++;
    if (populacaoIBGE && populacaoIBGE !== mun.populacao) {
      populacaoAtualizada++;
    }
  } else {
    semPopulacao++;
  }

  if (dadosAtualizados.cnpj) {
    comCNPJ++;
  }

  return dadosAtualizados;
});

// Salvar
fs.writeFileSync(
  './municipios-brasil.json',
  JSON.stringify(municipiosAtualizados, null, 2),
  'utf8'
);

console.log('✅ JSON atualizado com sucesso!\n');
console.log('📊 Estatísticas:');
console.log(`   Total de municípios: ${municipiosAtualizados.length}`);
console.log(`   Com população: ${comPopulacao} (${((comPopulacao/municipiosAtualizados.length)*100).toFixed(1)}%)`);
console.log(`   População atualizada: ${populacaoAtualizada}`);
console.log(`   Sem população: ${semPopulacao}`);
console.log(`   Com CNPJ: ${comCNPJ}\n`);

// Calcular estatísticas da população
const populacoes = municipiosAtualizados
  .filter(m => m.populacao)
  .map(m => m.populacao);

const total = populacoes.reduce((a, b) => a + b, 0);
const media = total / populacoes.length;
const max = Math.max(...populacoes);
const min = Math.min(...populacoes);

const maior = municipiosAtualizados.find(m => m.populacao === max);
const menor = municipiosAtualizados.find(m => m.populacao === min);

console.log('📈 Estatísticas Populacionais:');
console.log(`   População total do Brasil: ${total.toLocaleString('pt-BR')} habitantes`);
console.log(`   Média por município: ${Math.round(media).toLocaleString('pt-BR')} habitantes`);
console.log(`   Maior município: ${maior.nome} - ${maior.uf} (${max.toLocaleString('pt-BR')} hab.)`);
console.log(`   Menor município: ${menor.nome} - ${menor.uf} (${min.toLocaleString('pt-BR')} hab.)\n`);

// Mostrar exemplos de diferentes tamanhos
console.log('📋 Exemplos de municípios (diferentes portes):\n');

const grandes = municipiosAtualizados
  .filter(m => m.populacao >= 1000000)
  .sort((a, b) => b.populacao - a.populacao)
  .slice(0, 5);

console.log('   🏙️  Grandes Metrópoles (>1M habitantes):');
grandes.forEach(m => {
  console.log(`      ${m.nome} - ${m.uf}: ${m.populacao.toLocaleString('pt-BR')} hab.`);
  if (m.cnpj) console.log(`         CNPJ: ${m.cnpj}`);
});

const medios = municipiosAtualizados
  .filter(m => m.populacao >= 50000 && m.populacao < 100000)
  .slice(0, 5);

console.log('\n   🏘️  Cidades Médias (50k-100k habitantes):');
medios.forEach(m => {
  console.log(`      ${m.nome} - ${m.uf}: ${m.populacao.toLocaleString('pt-BR')} hab.`);
});

const pequenos = municipiosAtualizados
  .filter(m => m.populacao < 10000)
  .slice(0, 5);

console.log('\n   🏡 Municípios Pequenos (<10k habitantes):');
pequenos.forEach(m => {
  console.log(`      ${m.nome} - ${m.uf}: ${m.populacao.toLocaleString('pt-BR')} hab.`);
});

console.log('\n✅ Arquivo municipios-brasil.json atualizado com população de TODOS os municípios!');
console.log('   Agora o formulário terá população para 100% dos municípios brasileiros! 🎉');
