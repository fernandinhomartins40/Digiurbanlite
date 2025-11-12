const https = require('https');
const fs = require('fs');

console.log('📊 Baixando dados de população do SIDRA/IBGE...\n');

// API SIDRA - Tabela 6579 - População estimada 2024
// https://apisidra.ibge.gov.br/values/t/6579/n6/all/v/9324/p/last%201

const url = 'https://apisidra.ibge.gov.br/values/t/6579/n6/all/v/9324/p/last%201';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`✅ Recebidos ${json.length} registros`);

      // Processar dados
      const populacaoPorCodigo = {};
      let processados = 0;

      // Pular header (primeiro registro)
      json.slice(1).forEach((row) => {
        const codigo = String(row['D1C']);  // Código do município
        const populacao = parseInt(row['V']);  // Valor (população)

        if (codigo && populacao && !isNaN(populacao) && codigo.length === 7) {
          populacaoPorCodigo[codigo] = populacao;
          processados++;
        }
      });

      console.log(`✅ ${processados} municípios processados`);

      // Salvar
      fs.writeFileSync(
        './populacao-mapeamento.json',
        JSON.stringify(populacaoPorCodigo, null, 2),
        'utf8'
      );

      console.log('✅ Arquivo populacao-mapeamento.json criado!');

      // Estatísticas
      const populacoes = Object.values(populacaoPorCodigo);
      const total = populacoes.reduce((a, b) => a + b, 0);

      console.log(`\n📈 Estatísticas:`);
      console.log(`   Total de municípios: ${processados}`);
      console.log(`   População total: ${total.toLocaleString('pt-BR')} habitantes`);
      console.log(`   Média: ${Math.round(total/processados).toLocaleString('pt-BR')} habitantes/município`);

      // Exemplos
      console.log(`\n📋 Primeiros 10 municípios:`);
      Object.entries(populacaoPorCodigo).slice(0, 10).forEach(([codigo, pop]) => {
        console.log(`   ${codigo}: ${pop.toLocaleString('pt-BR')} habitantes`);
      });

    } catch (error) {
      console.error('❌ Erro ao processar dados:', error.message);
      console.log('Resposta recebida:', data.substring(0, 500));
    }
  });

}).on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});
