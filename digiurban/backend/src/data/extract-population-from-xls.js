const XLSX = require('xlsx');
const fs = require('fs');

console.log('📊 Processando dados de população do IBGE...\n');

// Ler arquivo XLS
const workbook = XLSX.readFile('./populacao_2024_ibge.xls');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converter para JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ Total de registros no Excel: ${data.length}`);
console.log(`\n📋 Primeiros registros:`);
console.log(data.slice(0, 3));

// Processar dados
const populacaoPorCodigo = {};
let processados = 0;

data.forEach((row, index) => {
  // O arquivo do IBGE tem várias colunas possíveis
  // Vamos tentar identificar as colunas corretas

  if (index === 0) {
    console.log(`\n🔍 Colunas disponíveis:`);
    console.log(Object.keys(row));
  }

  // Tentar diferentes formatos de coluna
  const codigoIbge =
    row['COD. UF'] && row['COD. MUNIC'] ?
      String(row['COD. UF']) + String(row['COD. MUNIC']).padStart(5, '0') :
    row['CÓDIGO'] ? String(row['CÓDIGO']) :
    row['Código'] ? String(row['Código']) :
    row['codigo'] ? String(row['codigo']) :
    row['COD'] ? String(row['COD']) :
    null;

  const populacao =
    row['POPULAÇÃO ESTIMADA'] ? parseInt(String(row['POPULAÇÃO ESTIMADA']).replace(/\D/g, '')) :
    row['População Estimada'] ? parseInt(String(row['População Estimada']).replace(/\D/g, '')) :
    row['populacao'] ? parseInt(String(row['populacao']).replace(/\D/g, '')) :
    row['POPULAÇÃO'] ? parseInt(String(row['POPULAÇÃO']).replace(/\D/g, '')) :
    null;

  if (codigoIbge && populacao && !isNaN(populacao)) {
    populacaoPorCodigo[codigoIbge] = populacao;
    processados++;
  }
});

console.log(`\n✅ ${processados} municípios processados com população`);

// Salvar mapeamento
fs.writeFileSync(
  './populacao-mapeamento.json',
  JSON.stringify(populacaoPorCodigo, null, 2),
  'utf8'
);

console.log('✅ Arquivo populacao-mapeamento.json criado!');

// Mostrar estatísticas
const populacoes = Object.values(populacaoPorCodigo);
const total = populacoes.reduce((a, b) => a + b, 0);
const media = total / populacoes.length;
const max = Math.max(...populacoes);
const min = Math.min(...populacoes);

console.log(`\n📈 Estatísticas:`);
console.log(`   População total do Brasil: ${total.toLocaleString('pt-BR')}`);
console.log(`   Média por município: ${Math.round(media).toLocaleString('pt-BR')}`);
console.log(`   Maior município: ${max.toLocaleString('pt-BR')} habitantes`);
console.log(`   Menor município: ${min.toLocaleString('pt-BR')} habitantes`);

// Mostrar exemplos
console.log(`\n📋 Exemplos de municípios:`);
const exemplos = Object.entries(populacaoPorCodigo).slice(0, 10);
exemplos.forEach(([codigo, pop]) => {
  console.log(`   ${codigo}: ${pop.toLocaleString('pt-BR')} habitantes`);
});
