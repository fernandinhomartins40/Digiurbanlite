const https = require('https');
const fs = require('fs');

console.log('🤖 Buscador Automático de CNPJs de Prefeituras\n');
console.log('Usando API pública CNPJá (https://cnpja.com/api)\n');

// Função para buscar CNPJ via API CNPJá
async function buscarCNPJAutomatico(nomeMunicipio, uf) {
  return new Promise((resolve) => {
    // Formatar nome para busca
    const termoBusca = `prefeitura municipal de ${nomeMunicipio} ${uf}`;
    const query = encodeURIComponent(termoBusca);

    // API CNPJá permite buscas gratuitas limitadas
    const url = `https://api.cnpja.com/office?query=${query}`;

    setTimeout(() => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);

            if (result && result.companies && result.companies.length > 0) {
              // Pegar o primeiro resultado (normalmente é a prefeitura)
              const cnpj = result.companies[0].taxId;
              console.log(`✅ ${nomeMunicipio}-${uf}: ${cnpj}`);
              resolve(cnpj);
            } else {
              console.log(`❌ ${nomeMunicipio}-${uf}: Não encontrado`);
              resolve(null);
            }
          } catch (error) {
            console.log(`⚠️  ${nomeMunicipio}-${uf}: Erro ao processar resposta`);
            resolve(null);
          }
        });
      }).on('error', (error) => {
        console.error(`❌ Erro em ${nomeMunicipio}-${uf}:`, error.message);
        resolve(null);
      });
    }, 3000); // 3 segundos entre requisições
  });
}

// Processar municípios
async function processarMunicipios() {
  const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

  console.log(`📊 Total de municípios: ${municipios.length}\n`);

  // Filtrar municípios sem CNPJ
  const semCNPJ = municipios.filter(m => !m.cnpj);
  console.log(`📋 Municípios sem CNPJ: ${semCNPJ.length}\n`);

  // Carregar CNPJs já coletados (se existir)
  let cnpjsColetados = {};
  if (fs.existsSync('./cnpj-automatico.json')) {
    cnpjsColetados = JSON.parse(fs.readFileSync('./cnpj-automatico.json', 'utf8'));
    console.log(`📂 ${Object.keys(cnpjsColetados).length} CNPJs já coletados.\n`);
  }

  // Processar apenas municípios grandes primeiro (>50k habitantes)
  const municipiosPrioritarios = semCNPJ
    .filter(m => !cnpjsColetados[m.codigo_ibge])
    .filter(m => (m.populacao || 0) > 50000)
    .sort((a, b) => (b.populacao || 0) - (a.populacao || 0));

  console.log(`🎯 Processando ${municipiosPrioritarios.length} municípios prioritários (>50k hab.)\n`);

  let processados = 0;
  let encontrados = 0;

  for (const municipio of municipiosPrioritarios) {
    const cnpj = await buscarCNPJAutomatico(municipio.nome, municipio.uf);

    if (cnpj) {
      cnpjsColetados[municipio.codigo_ibge] = {
        cnpj: cnpj,
        nome: municipio.nome,
        uf: municipio.uf,
        populacao: municipio.populacao,
        coletadoEm: new Date().toISOString()
      };
      encontrados++;
    }

    processados++;

    // Salvar a cada 10 municípios
    if (processados % 10 === 0) {
      fs.writeFileSync(
        './cnpj-automatico.json',
        JSON.stringify(cnpjsColetados, null, 2),
        'utf8'
      );
      console.log(`\n💾 Progresso salvo: ${processados}/${municipiosPrioritarios.length} (${encontrados} encontrados)\n`);
    }

    // Pausa para não sobrecarregar a API
    if (processados % 50 === 0) {
      console.log('⏸️  Pausa de 60 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  // Salvar resultado final
  fs.writeFileSync(
    './cnpj-automatico.json',
    JSON.stringify(cnpjsColetados, null, 2),
    'utf8'
  );

  console.log('\n✅ CONCLUÍDO!');
  console.log(`📊 Total processado: ${processados}`);
  console.log(`✅ CNPJs encontrados: ${encontrados}`);
  console.log(`❌ Não encontrados: ${processados - encontrados}`);
  console.log(`📈 Taxa de sucesso: ${((encontrados / processados) * 100).toFixed(2)}%`);
}

processarMunicipios().catch(console.error);
