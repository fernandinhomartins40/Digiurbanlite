const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

console.log('🏛️  Coletor de CNPJs - CAPITAIS BRASILEIRAS\n');
console.log('Vamos coletar os CNPJs das 27 capitais primeiro!\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Carregar municípios
const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

// Filtrar apenas capitais sem CNPJ
const capitais = municipios.filter(m => m.capital && !m.cnpj);

console.log(`📊 Capitais sem CNPJ: ${capitais.length}\n`);

// Carregar CNPJs já coletados (se existir)
let cnpjsColetados = {};
if (fs.existsSync('./cnpj-coletados.json')) {
  cnpjsColetados = JSON.parse(fs.readFileSync('./cnpj-coletados.json', 'utf8'));
  console.log(`📂 ${Object.keys(cnpjsColetados).length} CNPJs já coletados.\n`);
}

// Filtrar capitais que ainda não foram coletadas
const capitaisPendentes = capitais.filter(c => !cnpjsColetados[c.codigo_ibge]);

console.log(`🎯 Capitais pendentes: ${capitaisPendentes.length}\n`);

let indiceAtual = 0;
let coletadosNestaSessao = 0;

function abrirGoogle(municipio) {
  const query = encodeURIComponent(`CNPJ prefeitura ${municipio.nome} ${municipio.uf}`);
  const url = `https://www.google.com/search?q=${query}`;

  const comando = process.platform === 'win32' ? `start ${url}` :
                  process.platform === 'darwin' ? `open ${url}` :
                  `xdg-open ${url}`;

  exec(comando);
}

function perguntarCNPJ() {
  if (indiceAtual >= capitaisPendentes.length) {
    finalizarColeta();
    return;
  }

  const capital = capitaisPendentes[indiceAtual];

  console.log('\n' + '='.repeat(80));
  console.log(`🏛️  CAPITAL ${indiceAtual + 1}/${capitaisPendentes.length}`);
  console.log(`🏙️  ${capital.nome} - ${capital.uf}`);
  console.log(`👥 População: ${(capital.populacao || 0).toLocaleString('pt-BR')} habitantes`);
  console.log(`🆔 Código IBGE: ${capital.codigo_ibge}`);
  console.log('='.repeat(80));

  // Abrir Google automaticamente
  abrirGoogle(capital);

  console.log('\n🌐 Abrindo busca no Google...');
  console.log('\nDigite o CNPJ encontrado (formato: XX.XXX.XXX/XXXX-XX)');
  console.log('Ou digite "n" para pular, "s" para salvar e sair, "q" para sair sem salvar\n');

  rl.question('CNPJ: ', (resposta) => {
    resposta = resposta.trim();

    if (resposta.toLowerCase() === 'q') {
      console.log('\n❌ Saindo sem salvar...');
      rl.close();
      return;
    }

    if (resposta.toLowerCase() === 's') {
      finalizarColeta();
      return;
    }

    if (resposta.toLowerCase() === 'n' || resposta === '') {
      console.log('⏭️  Capital pulada.');
      indiceAtual++;
      setTimeout(perguntarCNPJ, 500);
      return;
    }

    // Validar formato CNPJ
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(resposta)) {
      console.log('❌ Formato inválido! Use: XX.XXX.XXX/XXXX-XX');
      setTimeout(perguntarCNPJ, 500);
      return;
    }

    // Salvar CNPJ
    cnpjsColetados[capital.codigo_ibge] = {
      cnpj: resposta,
      nome: capital.nome,
      uf: capital.uf,
      capital: true,
      populacao: capital.populacao,
      coletadoEm: new Date().toISOString()
    };

    coletadosNestaSessao++;
    console.log(`✅ CNPJ da capital salvo! (${coletadosNestaSessao}/${capitaisPendentes.length})`);

    // Salvar automaticamente a cada capital
    salvarProgresso();

    indiceAtual++;
    setTimeout(perguntarCNPJ, 500);
  });
}

function salvarProgresso() {
  fs.writeFileSync(
    './cnpj-coletados.json',
    JSON.stringify(cnpjsColetados, null, 2),
    'utf8'
  );
  console.log('💾 Progresso salvo!');
}

function finalizarColeta() {
  console.log('\n' + '='.repeat(80));
  console.log('🏛️  COLETA DE CAPITAIS FINALIZADA!');
  console.log('='.repeat(80));
  console.log(`📊 Capitais coletadas nesta sessão: ${coletadosNestaSessao}/${capitaisPendentes.length}`);
  console.log(`📂 Total acumulado: ${Object.keys(cnpjsColetados).length}`);

  const totalCapitais = municipios.filter(m => m.capital).length;
  const capitaisComCNPJ = Object.values(cnpjsColetados).filter(c => c.capital).length;

  console.log(`📈 Progresso (capitais): ${capitaisComCNPJ}/${totalCapitais} (${((capitaisComCNPJ / totalCapitais) * 100).toFixed(2)}%)`);

  // Salvar arquivo final
  salvarProgresso();

  console.log('\n💾 Arquivo salvo: cnpj-coletados.json');

  if (capitaisComCNPJ < totalCapitais) {
    console.log(`\n⚠️  Ainda faltam ${totalCapitais - capitaisComCNPJ} capitais!`);
    console.log('   Execute novamente para continuar.\n');
  } else {
    console.log('\n✅ TODAS AS CAPITAIS FORAM COLETADAS!');
    console.log('   Agora você pode:');
    console.log('   1. Integrar os CNPJs: node integrar-cnpjs-coletados.js');
    console.log('   2. Coletar demais municípios: node coletar-cnpjs-interativo.js\n');
  }

  rl.close();
}

// Interceptar Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n⚠️  Ctrl+C detectado! Salvando progresso...');
  finalizarColeta();
});

// Iniciar coleta
if (capitaisPendentes.length === 0) {
  console.log('✅ Todas as capitais já foram coletadas!\n');
  console.log('Execute um dos comandos:');
  console.log('  • node integrar-cnpjs-coletados.js - Para integrar os CNPJs');
  console.log('  • node coletar-cnpjs-interativo.js - Para coletar demais municípios\n');
  rl.close();
} else {
  console.log('🚀 Vamos coletar os CNPJs das capitais!\n');
  console.log('Dica: O Google geralmente mostra o CNPJ logo no topo da busca.\n');
  console.log('Pressione Enter para começar...');
  rl.question('', () => {
    perguntarCNPJ();
  });
}
