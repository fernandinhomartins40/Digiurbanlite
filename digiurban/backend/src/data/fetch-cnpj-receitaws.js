const https = require('https');
const fs = require('fs');

console.log('🔍 Buscando CNPJs de prefeituras via ReceitaWS API...\n');

// Função para buscar CNPJ de uma prefeitura
async function buscarCNPJPrefeitura(nomeMunicipio, uf, codigoIbge) {
  return new Promise((resolve) => {
    // Formatar nome para busca (remover acentos e caracteres especiais)
    const nomeFormatado = nomeMunicipio
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '');

    // Tentar padrões comuns de CNPJ de prefeituras
    // Prefeituras geralmente têm CNPJs que começam com códigos específicos por estado
    const prefixosPorEstado = {
      'AC': ['04', '84'], 'AL': ['12', '24'], 'AP': ['25', '34'],
      'AM': ['04', '24'], 'BA': ['13', '14'], 'CE': ['07', '23'],
      'DF': ['00', '03'], 'ES': ['27', '31'], 'GO': ['01', '02'],
      'MA': ['06', '16'], 'MT': ['03', '15'], 'MS': ['15', '03'],
      'MG': ['18', '17'], 'PA': ['04', '05'], 'PB': ['08', '09'],
      'PR': ['76', '78'], 'PE': ['10', '11'], 'PI': ['06', '07'],
      'RJ': ['28', '29'], 'RN': ['08', '12'], 'RS': ['87', '88'],
      'RO': ['04', '63'], 'RR': ['04', '25'], 'SC': ['82', '83'],
      'SP': ['45', '46'], 'SE': ['13', '14'], 'TO': ['25', '01']
    };

    console.log(`📍 Buscando: ${nomeMunicipio}-${uf} (${codigoIbge})`);

    // Por enquanto, retornar null e marcar para busca manual
    resolve(null);
  });
}

// Processar municípios
async function processarMunicipios() {
  const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

  console.log(`📊 Total de municípios: ${municipios.length}\n`);

  // Filtrar municípios sem CNPJ
  const semCNPJ = municipios.filter(m => !m.cnpj);
  console.log(`📋 Municípios sem CNPJ: ${semCNPJ.length}\n`);

  // Criar arquivo CSV para facilitar busca manual posterior
  const csvLines = ['codigo_ibge,nome,uf,populacao,busca_google'];

  for (const municipio of semCNPJ) {
    const buscaGoogle = `CNPJ prefeitura ${municipio.nome} ${municipio.uf}`;
    csvLines.push(`${municipio.codigo_ibge},"${municipio.nome}",${municipio.uf},${municipio.populacao},"${buscaGoogle}"`);
  }

  fs.writeFileSync(
    './municipios-sem-cnpj.csv',
    csvLines.join('\n'),
    'utf8'
  );

  console.log('✅ Arquivo CSV criado: municipios-sem-cnpj.csv');
  console.log('📝 Este arquivo pode ser usado para busca assistida de CNPJs\n');

  // Mostrar municípios prioritários (capitais e cidades grandes)
  const prioritarios = semCNPJ
    .filter(m => m.capital || m.populacao > 100000)
    .sort((a, b) => b.populacao - a.populacao);

  console.log(`\n🎯 Municípios prioritários sem CNPJ (${prioritarios.length}):\n`);

  prioritarios.slice(0, 20).forEach((m, i) => {
    console.log(`${i + 1}. ${m.nome}-${m.uf} (${m.populacao.toLocaleString('pt-BR')} hab.)`);
  });

  console.log('\n💡 Sugestão: Podemos criar um script interativo que abre o navegador');
  console.log('   para cada município e você cola o CNPJ encontrado.');
}

processarMunicipios().catch(console.error);
