const { exec } = require('child_process');
const readline = require('readline');

console.log('🔍 Buscador de CNPJ na Receita Federal\n');
console.log('Este script abre o site da Receita Federal para buscar CNPJs manualmente.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function abrirReceitaFederal(nomeMunicipio, uf) {
  // URL do site de consulta da Receita Federal
  const url = 'https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp';

  const comando = process.platform === 'win32' ? `start ${url}` :
                  process.platform === 'darwin' ? `open ${url}` :
                  `xdg-open ${url}`;

  exec(comando);

  console.log('\n' + '='.repeat(80));
  console.log('📍 Buscando CNPJ de:', nomeMunicipio, '-', uf);
  console.log('='.repeat(80));
  console.log('\n🌐 Abrindo site da Receita Federal...\n');
  console.log('📋 Instruções:');
  console.log('   1. No site, digite na busca: "PREFEITURA MUNICIPAL DE ' + nomeMunicipio.toUpperCase() + '"');
  console.log('   2. Copie o CNPJ encontrado');
  console.log('   3. Cole aqui no formato: XX.XXX.XXX/XXXX-XX');
  console.log('\n' + '='.repeat(80) + '\n');
}

function perguntarMunicipio() {
  rl.question('Digite o nome do município (ou "q" para sair): ', (nome) => {
    if (nome.toLowerCase() === 'q' || nome === '') {
      console.log('\n👋 Até logo!\n');
      rl.close();
      return;
    }

    rl.question('Digite a UF: ', (uf) => {
      if (uf === '') {
        console.log('❌ UF é obrigatória!');
        perguntarMunicipio();
        return;
      }

      abrirReceitaFederal(nome, uf.toUpperCase());

      rl.question('\nCNPJ encontrado (ou Enter para buscar outro município): ', (cnpj) => {
        if (cnpj.trim() !== '') {
          const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
          if (cnpjRegex.test(cnpj)) {
            console.log(`\n✅ CNPJ válido: ${cnpj}`);
            console.log(`📋 ${nome}-${uf.toUpperCase()}: ${cnpj}\n`);
          } else {
            console.log('\n❌ Formato inválido! Use: XX.XXX.XXX/XXXX-XX\n');
          }
        }

        console.log('\n' + '-'.repeat(80) + '\n');
        perguntarMunicipio();
      });
    });
  });
}

console.log('🚀 Iniciando buscador...\n');
console.log('💡 Dica: Este script é útil quando o Google não mostra o CNPJ automaticamente.\n');
perguntarMunicipio();
