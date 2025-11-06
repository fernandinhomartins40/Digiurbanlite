const fs = require('fs');
const path = require('path');

// Mapeamento de código_uf para UF e região
const estadosMap = {
  11: { uf: 'RO', regiao: 'Norte', nome: 'Rondônia' },
  12: { uf: 'AC', regiao: 'Norte', nome: 'Acre' },
  13: { uf: 'AM', regiao: 'Norte', nome: 'Amazonas' },
  14: { uf: 'RR', regiao: 'Norte', nome: 'Roraima' },
  15: { uf: 'PA', regiao: 'Norte', nome: 'Pará' },
  16: { uf: 'AP', regiao: 'Norte', nome: 'Amapá' },
  17: { uf: 'TO', regiao: 'Norte', nome: 'Tocantins' },
  21: { uf: 'MA', regiao: 'Nordeste', nome: 'Maranhão' },
  22: { uf: 'PI', regiao: 'Nordeste', nome: 'Piauí' },
  23: { uf: 'CE', regiao: 'Nordeste', nome: 'Ceará' },
  24: { uf: 'RN', regiao: 'Nordeste', nome: 'Rio Grande do Norte' },
  25: { uf: 'PB', regiao: 'Nordeste', nome: 'Paraíba' },
  26: { uf: 'PE', regiao: 'Nordeste', nome: 'Pernambuco' },
  27: { uf: 'AL', regiao: 'Nordeste', nome: 'Alagoas' },
  28: { uf: 'SE', regiao: 'Nordeste', nome: 'Sergipe' },
  29: { uf: 'BA', regiao: 'Nordeste', nome: 'Bahia' },
  31: { uf: 'MG', regiao: 'Sudeste', nome: 'Minas Gerais' },
  32: { uf: 'ES', regiao: 'Sudeste', nome: 'Espírito Santo' },
  33: { uf: 'RJ', regiao: 'Sudeste', nome: 'Rio de Janeiro' },
  35: { uf: 'SP', regiao: 'Sudeste', nome: 'São Paulo' },
  41: { uf: 'PR', regiao: 'Sul', nome: 'Paraná' },
  42: { uf: 'SC', regiao: 'Sul', nome: 'Santa Catarina' },
  43: { uf: 'RS', regiao: 'Sul', nome: 'Rio Grande do Sul' },
  50: { uf: 'MS', regiao: 'Centro-Oeste', nome: 'Mato Grosso do Sul' },
  51: { uf: 'MT', regiao: 'Centro-Oeste', nome: 'Mato Grosso' },
  52: { uf: 'GO', regiao: 'Centro-Oeste', nome: 'Goiás' },
  53: { uf: 'DF', regiao: 'Centro-Oeste', nome: 'Distrito Federal' },
};

// Carregar municípios
const municipiosCompleto = require('./municipios-brasil-completo.json');

// Processar e adicionar UF e região
const municipiosProcessados = municipiosCompleto.map(mun => {
  const estado = estadosMap[mun.codigo_uf];

  return {
    codigo_ibge: String(mun.codigo_ibge),
    nome: mun.nome,
    uf: estado.uf,
    regiao: estado.regiao,
    populacao: null, // Será preenchido posteriormente se necessário
    capital: mun.capital === 1,
    latitude: mun.latitude,
    longitude: mun.longitude,
    ddd: mun.ddd,
  };
});

// Salvar arquivo processado
fs.writeFileSync(
  path.join(__dirname, 'municipios-brasil.json'),
  JSON.stringify(municipiosProcessados, null, 2),
  'utf8'
);

console.log(`✅ Processados ${municipiosProcessados.length} municípios!`);
console.log(`📁 Arquivo salvo em: municipios-brasil.json`);

// Estatísticas por região
const estatisticas = municipiosProcessados.reduce((acc, mun) => {
  if (!acc[mun.regiao]) {
    acc[mun.regiao] = 0;
  }
  acc[mun.regiao]++;
  return acc;
}, {});

console.log('\n📊 Municípios por região:');
Object.entries(estatisticas)
  .sort((a, b) => b[1] - a[1])
  .forEach(([regiao, total]) => {
    console.log(`  ${regiao}: ${total}`);
  });

// Estatísticas por UF
const estatisticasUF = municipiosProcessados.reduce((acc, mun) => {
  if (!acc[mun.uf]) {
    acc[mun.uf] = 0;
  }
  acc[mun.uf]++;
  return acc;
}, {});

console.log('\n📊 Top 10 estados com mais municípios:');
Object.entries(estatisticasUF)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([uf, total]) => {
    console.log(`  ${uf}: ${total}`);
  });
