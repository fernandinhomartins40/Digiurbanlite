const fs = require('fs');
const https = require('https');

// Carregar nosso JSON atual
const municipiosAtual = require('./municipios-brasil.json');
const municipiosIBGE = require('./municipios-ibge-completo.json');

console.log(`📊 Municípios atual: ${municipiosAtual.length}`);
console.log(`📊 Municípios IBGE: ${municipiosIBGE.length}`);

// Criar mapa de municípios IBGE por código
const ibgeMap = {};
municipiosIBGE.forEach(mun => {
  ibgeMap[String(mun.id)] = mun;
});

// Dados de população estimada 2024 (principais capitais e grandes cidades)
const populacaoEstimada2024 = {
  '3550308': 11451245,  // São Paulo
  '3304557': 6211223,   // Rio de Janeiro
  '2927408': 2418005,   // Salvador
  '5300108': 2817381,   // Brasília
  '2304400': 2428708,   // Fortaleza
  '3106200': 2315560,   // Belo Horizonte
  '1302603': 2063547,   // Manaus
  '4106902': 1773733,   // Curitiba
  '2611606': 1488920,   // Recife
  '1100205': 460413,    // Porto Velho
  '5208707': 1302001,   // Goiânia
  '2111300': 870028,    // São Luís
  '1501402': 1303389,   // Belém
  '2800308': 641523,    // Aracaju
  '2704302': 932748,    // Maceió
  '2507507': 646599,    // João Pessoa
  '2211001': 814439,    // Teresina
  '1200401': 336038,    // Rio Branco
  '2408102': 751805,    // Natal
  '5002704': 738810,    // Campo Grande
  '2927408': 2418005,   // Salvador
  '4205407': 433355,    // Florianópolis
  '1721000': 228332,    // Palmas
  '1600303': 407621,    // Macapá
  '1400100': 284313,    // Boa Vista
  '5103403': 599314,    // Cuiabá
  '1100205': 460413,    // Porto Velho
};

// CNPJs de algumas prefeituras principais (exemplo - dados públicos)
const cnpjsPrefeituras = {
  '3550308': '46.395.000/0001-39',  // São Paulo
  '3304557': '42.498.047/0001-48',  // Rio de Janeiro
  '2927408': '13.927.801/0001-04',  // Salvador
  '5300108': '00.394.601/0001-42',  // Brasília
  '2304400': '07.954.571/0001-24',  // Fortaleza
  '3106200': '18.715.383/0001-40',  // Belo Horizonte
  '1302603': '04.307.699/0001-00',  // Manaus
  '4106902': '76.016.889/0001-52',  // Curitiba
  '2611606': '10.604.733/0001-50',  // Recife
  '1100205': '05.903.125/0001-45',  // Porto Velho
  '5208707': '01.612.092/0001-23',  // Goiânia
};

// Enriquecer dados
let enriquecidos = 0;
const municipiosEnriquecidos = municipiosAtual.map(mun => {
  const codigoIbge = mun.codigo_ibge;
  const munIBGE = ibgeMap[codigoIbge];

  const enriquecido = {
    ...mun,
    // Adicionar população estimada se disponível
    populacao: populacaoEstimada2024[codigoIbge] || mun.populacao || null,
    // Adicionar CNPJ se disponível
    cnpj: cnpjsPrefeituras[codigoIbge] || null,
    // Manter dados IBGE originais
    nome_completo: munIBGE ? munIBGE.nome : mun.nome,
  };

  if (enriquecido.populacao || enriquecido.cnpj) {
    enriquecidos++;
  }

  return enriquecido;
});

console.log(`✅ ${enriquecidos} municípios enriquecidos com dados adicionais`);

// Salvar JSON enriquecido
fs.writeFileSync(
  './municipios-brasil-enriquecido.json',
  JSON.stringify(municipiosEnriquecidos, null, 2),
  'utf8'
);

console.log('✅ Arquivo municipios-brasil-enriquecido.json criado com sucesso!');
console.log(`\nEstatísticas:`);
console.log(`- Total de municípios: ${municipiosEnriquecidos.length}`);
console.log(`- Com população: ${municipiosEnriquecidos.filter(m => m.populacao).length}`);
console.log(`- Com CNPJ: ${municipiosEnriquecidos.filter(m => m.cnpj).length}`);

// Exemplo de municípios enriquecidos
console.log(`\n📋 Exemplos de municípios enriquecidos:`);
const exemplos = municipiosEnriquecidos.filter(m => m.populacao || m.cnpj).slice(0, 5);
exemplos.forEach(m => {
  console.log(`\n${m.nome} - ${m.uf}`);
  console.log(`  Código IBGE: ${m.codigo_ibge}`);
  if (m.populacao) console.log(`  População: ${m.populacao.toLocaleString('pt-BR')}`);
  if (m.cnpj) console.log(`  CNPJ: ${m.cnpj}`);
});
