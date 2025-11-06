const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

console.log('🔍 Coletor Interativo de CNPJs de Prefeituras\n');
console.log('Este script vai abrir o Google para cada município e você cola o CNPJ encontrado.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Carregar municípios
const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));
const semCNPJ = municipios.filter(m => !m.cnpj);

// Carregar CNPJs já coletados (se existir)
let cnpjsColetados = {};
if (fs.existsSync('./cnpj-coletados.json')) {
  cnpjsColetados = JSON.parse(fs.readFileSync('./cnpj-coletados.json', 'utf8'));
  console.log(`📂 ${Object.keys(cnpjsColetados).length} CNPJs já coletados anteriormente.\n`);
}

// Ordenar por população (maiores primeiro)
const municipiosOrdenados = semCNPJ
  .filter(m => !cnpjsColetados[m.codigo_ibge])
  .sort((a, b) => (b.populacao || 0) - (a.populacao || 0));

console.log(`📊 Total de municípios para coletar: ${municipiosOrdenados.length}\n`);

let indiceAtual = 0;
let coletadosNestaSessao = 0;

function abrirGoogle(municipio) {
  const query = encodeURIComponent(`CNPJ prefeitura ${municipio.nome} ${municipio.uf}`);
  const url = `https://www.google.com/search?q=${query}`;

  // Abrir no navegador padrão
  const comando = process.platform === 'win32' ? `start ${url}` :
                  process.platform === 'darwin' ? `open ${url}` :
                  `xdg-open ${url}`;

  exec(comando);
}

function perguntarCNPJ() {
  if (indiceAtual >= municipiosOrdenados.length) {
    finalizarColeta();
    return;
  }

  const municipio = municipiosOrdenados[indiceAtual];

  console.log('\n' + '='.repeat(80));
  console.log(`📍 Município ${indiceAtual + 1}/${municipiosOrdenados.length}`);
  console.log(`🏙️  ${municipio.nome} - ${municipio.uf}`);
  console.log(`👥 População: ${(municipio.populacao || 0).toLocaleString('pt-BR')} habitantes`);
  console.log(`🆔 Código IBGE: ${municipio.codigo_ibge}`);
  console.log('='.repeat(80));

  // Abrir Google automaticamente
  abrirGoogle(municipio);

  console.log('\n🌐 Abrindo busca no Google...');
  console.log('\nDigite o CNPJ encontrado (formato: XX.XXX.XXX/XXXX-XX)');
  console.log('Ou digite:');
  console.log('  - "n" para pular este município');
  console.log('  - "s" para salvar e sair');
  console.log('  - "q" para sair sem salvar\n');

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
      console.log('⏭️  Município pulado.');
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
    cnpjsColetados[municipio.codigo_ibge] = {
      cnpj: resposta,
      nome: municipio.nome,
      uf: municipio.uf,
      coletadoEm: new Date().toISOString()
    };

    coletadosNestaSessao++;
    console.log(`✅ CNPJ salvo! (${coletadosNestaSessao} nesta sessão)`);

    // Salvar automaticamente a cada 5 CNPJs
    if (coletadosNestaSessao % 5 === 0) {
      salvarProgresso();
    }

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
  console.log('💾 Progresso salvo automaticamente!');
}

function finalizarColeta() {
  console.log('\n' + '='.repeat(80));
  console.log('✅ COLETA FINALIZADA!');
  console.log('='.repeat(80));
  console.log(`📊 Total coletado nesta sessão: ${coletadosNestaSessao}`);
  console.log(`📂 Total acumulado: ${Object.keys(cnpjsColetados).length}`);
  console.log(`📈 Progresso: ${Object.keys(cnpjsColetados).length}/${semCNPJ.length} (${((Object.keys(cnpjsColetados).length / semCNPJ.length) * 100).toFixed(2)}%)`);

  // Salvar arquivo final
  salvarProgresso();

  console.log('\n💾 Arquivo salvo: cnpj-coletados.json');
  console.log('\n💡 Para continuar depois, execute este script novamente.');
  console.log('   Ele vai retomar de onde parou!\n');

  rl.close();
}

// Interceptar Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n⚠️  Ctrl+C detectado! Salvando progresso...');
  finalizarColeta();
});

// Iniciar coleta
console.log('Pressione Enter para começar...');
rl.question('', () => {
  perguntarCNPJ();
});
