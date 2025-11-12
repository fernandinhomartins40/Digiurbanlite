const https = require('https');
const fs = require('fs');

console.log('🔍 Buscando CNPJs de prefeituras...\n');

// Função para fazer busca e extrair CNPJ
async function buscarCNPJ(nomeMunicipio, uf) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`CNPJ prefeitura ${nomeMunicipio} ${uf}`);
    const url = `https://www.google.com/search?q=${query}`;

    // Aguardar 2 segundos entre requisições para evitar bloqueio
    setTimeout(() => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // Regex para encontrar CNPJ no formato XX.XXX.XXX/XXXX-XX
          const cnpjMatch = data.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);

          if (cnpjMatch) {
            console.log(`✅ ${nomeMunicipio}-${uf}: ${cnpjMatch[1]}`);
            resolve(cnpjMatch[1]);
          } else {
            console.log(`❌ ${nomeMunicipio}-${uf}: CNPJ não encontrado`);
            resolve(null);
          }
        });
      }).on('error', (error) => {
        console.error(`❌ Erro em ${nomeMunicipio}-${uf}:`, error.message);
        resolve(null);
      });
    }, 2000);
  });
}

// Processar municípios em lotes
async function processarMunicipios() {
  const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

  console.log(`📊 Total de municípios: ${municipios.length}\n`);

  // Filtrar municípios sem CNPJ
  const semCNPJ = municipios.filter(m => !m.cnpj);
  console.log(`📋 Municípios sem CNPJ: ${semCNPJ.length}\n`);

  const resultados = {};
  let processados = 0;
  let encontrados = 0;

  // Processar em lotes de 100 por vez
  const TAMANHO_LOTE = 100;

  for (let i = 0; i < semCNPJ.length; i += TAMANHO_LOTE) {
    const lote = semCNPJ.slice(i, Math.min(i + TAMANHO_LOTE, semCNPJ.length));
    console.log(`\n📦 Processando lote ${Math.floor(i / TAMANHO_LOTE) + 1} (${lote.length} municípios)...\n`);

    for (const municipio of lote) {
      const cnpj = await buscarCNPJ(municipio.nome, municipio.uf);

      if (cnpj) {
        resultados[municipio.codigo_ibge] = cnpj;
        encontrados++;
      }

      processados++;

      if (processados % 10 === 0) {
        console.log(`\n📈 Progresso: ${processados}/${semCNPJ.length} (${encontrados} encontrados)\n`);
      }
    }

    // Salvar resultados parciais a cada lote
    fs.writeFileSync(
      './cnpj-mapeamento-parcial.json',
      JSON.stringify(resultados, null, 2),
      'utf8'
    );

    console.log(`\n💾 Lote salvo! Total encontrados até agora: ${encontrados}\n`);

    // Pausa maior entre lotes (30 segundos)
    if (i + TAMANHO_LOTE < semCNPJ.length) {
      console.log('⏸️  Aguardando 30 segundos antes do próximo lote...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  // Salvar resultado final
  fs.writeFileSync(
    './cnpj-mapeamento-final.json',
    JSON.stringify(resultados, null, 2),
    'utf8'
  );

  console.log('\n✅ CONCLUÍDO!');
  console.log(`📊 Total processado: ${processados}`);
  console.log(`✅ CNPJs encontrados: ${encontrados}`);
  console.log(`❌ Não encontrados: ${processados - encontrados}`);
  console.log(`📈 Taxa de sucesso: ${((encontrados / processados) * 100).toFixed(2)}%`);
}

processarMunicipios().catch(console.error);
