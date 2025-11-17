const fs = require('fs');

console.log('📋 Scripts Disponíveis para Coleta de CNPJs\n');
console.log('='.repeat(80));

const scripts = [
  {
    nome: 'coletar-cnpjs-capitais.js',
    descricao: 'Coleta CNPJs das 27 capitais brasileiras',
    recomendado: '⭐ COMECE POR AQUI!',
    tempo: '5-10 minutos',
    municipios: '27 capitais',
    comando: 'node coletar-cnpjs-capitais.js'
  },
  {
    nome: 'coletar-cnpjs-interativo.js',
    descricao: 'Coleta CNPJs de todos os municípios interativamente',
    recomendado: '✅ Recomendado',
    tempo: '4-5 horas (ou várias sessões)',
    municipios: '5.570 municípios',
    comando: 'node coletar-cnpjs-interativo.js'
  },
  {
    nome: 'integrar-cnpjs-coletados.js',
    descricao: 'Integra CNPJs coletados no arquivo principal',
    recomendado: '✅ Execute após coletar',
    tempo: '< 1 segundo',
    municipios: 'N/A',
    comando: 'node integrar-cnpjs-coletados.js'
  },
  {
    nome: 'validar-cnpjs.js',
    descricao: 'Valida todos os CNPJs e mostra estatísticas',
    recomendado: '✅ Execute periodicamente',
    tempo: '< 5 segundos',
    municipios: 'N/A',
    comando: 'node validar-cnpjs.js'
  },
  {
    nome: 'limpar-cnpjs-invalidos.js',
    descricao: 'Remove CNPJs inválidos do banco de dados',
    recomendado: '⚠️ Execute se validação detectar erros',
    tempo: '< 1 segundo',
    municipios: 'N/A',
    comando: 'node limpar-cnpjs-invalidos.js'
  },
  {
    nome: 'buscar-cnpj-receita.js',
    descricao: 'Helper para busca manual na Receita Federal',
    recomendado: '💡 Use quando Google não encontrar',
    tempo: 'Variável',
    municipios: 'N/A',
    comando: 'node buscar-cnpj-receita.js'
  },
  {
    nome: 'buscar-cnpjs-automatico.js',
    descricao: 'Busca automática via API (experimental)',
    recomendado: '⚠️ Experimental',
    tempo: '8-10 horas',
    municipios: 'Municípios >50k hab.',
    comando: 'node buscar-cnpjs-automatico.js'
  }
];

scripts.forEach((script, i) => {
  console.log(`\n${i + 1}. ${script.nome}`);
  console.log(`   📝 ${script.descricao}`);
  console.log(`   🏷️  ${script.recomendado}`);
  console.log(`   ⏱️  Tempo: ${script.tempo}`);
  if (script.municipios !== 'N/A') {
    console.log(`   🏙️  Municípios: ${script.municipios}`);
  }
  console.log(`   💻 Comando: ${script.comando}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n🚀 FLUXO RECOMENDADO:\n');

console.log('1️⃣  INÍCIO RÁPIDO (10 minutos):');
console.log('   node coletar-cnpjs-capitais.js');
console.log('   node integrar-cnpjs-coletados.js');
console.log('   node validar-cnpjs.js\n');

console.log('2️⃣  COLETA COMPLETA (várias sessões):');
console.log('   node coletar-cnpjs-interativo.js');
console.log('   node integrar-cnpjs-coletados.js');
console.log('   node validar-cnpjs.js\n');

console.log('='.repeat(80));

// Verificar status atual
if (fs.existsSync('./municipios-brasil.json')) {
  const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));
  const comCNPJ = municipios.filter(m => m.cnpj).length;
  const total = municipios.length;
  const percentual = ((comCNPJ / total) * 100).toFixed(2);

  console.log('\n📊 STATUS ATUAL:\n');
  console.log(`   Total de municípios: ${total}`);
  console.log(`   Com CNPJ: ${comCNPJ} (${percentual}%)`);
  console.log(`   Sem CNPJ: ${total - comCNPJ} (${(100 - parseFloat(percentual)).toFixed(2)}%)`);

  const barra = '█'.repeat(Math.floor(parseFloat(percentual)));
  console.log(`\n   Progresso: [${barra.padEnd(100)}] ${percentual}%\n`);
}

// Verificar CNPJs coletados pendentes
if (fs.existsSync('./cnpj-coletados.json')) {
  const cnpjsColetados = JSON.parse(fs.readFileSync('./cnpj-coletados.json', 'utf8'));
  const total = Object.keys(cnpjsColetados).length;

  console.log(`💾 CNPJs COLETADOS (pendentes de integração): ${total}\n`);
  console.log('   Execute: node integrar-cnpjs-coletados.js\n');
}

console.log('='.repeat(80));
console.log('\n📖 Para mais informações, leia: README-CNPJ.md\n');
