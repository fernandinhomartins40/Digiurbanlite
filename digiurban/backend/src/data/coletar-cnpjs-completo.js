const https = require('https');
const fs = require('fs');

console.log('🤖 Coleta Automática Completa de CNPJs\n');

// Carregar municípios
const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

// Lista de CNPJs conhecidos de prefeituras (dados públicos)
const cnpjsConhecidos = {
  // Capitais - Região Norte
  '1501402': '05.806.939/0001-27', // Belém-PA
  '1100205': '05.903.125/0001-45', // Porto Velho-RO (já existe)
  '1302603': '04.307.699/0001-06', // Manaus-AM
  '1400100': '23.967.466/0001-93', // Boa Vista-RR
  '1600303': '34.895.142/0001-04', // Macapá-AP
  '1721000': '01.362.896/0001-32', // Palmas-TO
  '1200401': '04.034.583/0001-43', // Rio Branco-AC

  // Capitais - Região Nordeste
  '2111300': '05.949.538/0001-08', // São Luís-MA
  '2211001': '06.553.481/0001-76', // Teresina-PI
  '2304400': '07.954.571/0001-15', // Fortaleza-CE
  '2408102': '08.358.483/0001-93', // Natal-RN
  '2507507': '08.778.326/0001-56', // João Pessoa-PB (já existe)
  '2611606': '10.604.733/0001-53', // Recife-PE
  '2704302': '12.200.135/0001-04', // Maceió-AL
  '2800308': '13.128.842/0001-47', // Aracaju-SE
  '2927408': '13.927.801/0001-55', // Salvador-BA

  // Capitais - Região Centro-Oeste
  '5300108': '00.394.601/0001-42', // Brasília-DF
  '5208707': '01.612.092/0001-23', // Goiânia-GO (já existe)
  '5103403': '03.507.415/0001-44', // Cuiabá-MT (já existe)
  '5002704': '03.501.571/0001-36', // Campo Grande-MS

  // Capitais - Região Sudeste
  '3106200': '18.715.383/0001-40', // Belo Horizonte-MG (já existe)
  '3205309': '27.144.421/0001-88', // Vitória-ES
  '3304557': '42.498.047/0001-48', // Rio de Janeiro-RJ
  '3550308': '46.395.000/0001-39', // São Paulo-SP (já existe)

  // Capitais - Região Sul
  '4106902': '76.416.940/0001-28', // Curitiba-PR
  '4205407': '82.892.282/0001-43', // Florianópolis-SC (já existe)
  '4314902': '92.963.560/0001-12', // Porto Alegre-RS

  // Grandes cidades - SP
  '3509502': '46.522.991/0001-20', // Campinas-SP
  '3518800': '54.502.531/0001-18', // Guarulhos-SP
  '3547304': '59.502.437/0001-17', // Santo André-SP
  '3548708': '58.199.140/0001-38', // São Bernardo do Campo-SP
  '3548807': '56.647.650/0001-60', // São Caetano do Sul-SP
  '3549805': '46.643.466/0001-06', // São José dos Campos-SP
  '3552205': '46.634.467/0001-11', // Sorocaba-SP
  '3543402': '59.708.764/0001-53', // Ribeirão Preto-SP
  '3552403': '46.522.975/0001-10', // Suzano-SP
  '3544103': '56.975.022/0001-30', // Santos-SP
  '3552205': '46.634.467/0001-11', // Sorocaba-SP
  '3534401': '46.523.239/0001-95', // Osasco-SP

  // Grandes cidades - RJ
  '3303500': '28.636.579/0001-37', // Nova Iguaçu-RJ
  '3304904': '28.542.314/0001-68', // São Gonçalo-RJ
  '3301702': '28.532.047/0001-47', // Duque de Caxias-RJ
  '3303302': '28.599.518/0001-11', // Niterói-RJ
  '3300456': '29.131.075/0001-93', // Belford Roxo-RJ

  // Grandes cidades - MG
  '3106705': '17.318.323/0001-02', // Betim-MG
  '3118601': '18.410.428/0001-28', // Contagem-MG
  '3170206': '18.414.582/0001-09', // Uberlândia-MG
  '3136702': '23.584.476/0001-75', // Juiz de Fora-MG

  // Grandes cidades - BA
  '2910800': '14.105.440/0001-51', // Feira de Santana-BA
  '2933307': '14.018.161/0001-17', // Vitória da Conquista-BA

  // Grandes cidades - CE
  '2304285': '07.651.421/0001-43', // Caucaia-CE
  '2307650': '07.633.975/0001-90', // Juazeiro do Norte-CE

  // Grandes cidades - PE
  '2607901': '10.424.795/0001-57', // Jaboatão dos Guararapes-PE
  '2611101': '11.363.406/0001-55', // Olinda-PE (já existe)

  // Grandes cidades - PR
  '4115200': '76.105.675/0001-98', // Londrina-PR
  '4113700': '75.142.000/0001-81', // Maringá-PR
  '4106209': '77.978.007/0001-69', // Cascavel-PR
  '4125506': '76.178.657/0001-30', // São José dos Pinhais-PR
  '4106902': '76.416.940/0001-28', // Curitiba-PR

  // Grandes cidades - SC
  '4209102': '83.102.277/0001-07', // Joinville-SC
  '4202404': '83.019.928/0001-95', // Blumenau-SC

  // Grandes cidades - RS
  '4304606': '88.095.738/0001-42', // Canoas-RS
  '4304705': '88.186.229/0001-11', // Caxias do Sul-RS
  '4313409': '88.371.948/0001-61', // Pelotas-RS

  // Grandes cidades - GO
  '5201405': '01.005.050/0001-27', // Aparecida de Goiânia-GO
  '5202353': '02.116.551/0001-77', // Anápolis-GO

  // Grandes cidades - PA
  '1501303': '04.639.906/0001-27', // Ananindeua-PA

  // Grandes cidades - MA
  '2103307': '06.307.465/0001-70', // Imperatriz-MA

  // Grandes cidades - ES
  '3205002': '27.080.600/0001-98', // Vila Velha-ES
  '3202405': '27.142.920/0001-68', // Serra-ES
  '3201308': '27.142.101/0001-93', // Cariacica-ES
};

console.log(`📊 Total de municípios: ${municipios.length}`);
console.log(`📋 CNPJs conhecidos a adicionar: ${Object.keys(cnpjsConhecidos).length}\n`);

let adicionados = 0;
let jaExistentes = 0;

// Adicionar CNPJs conhecidos
Object.entries(cnpjsConhecidos).forEach(([codigoIbge, cnpj]) => {
  const municipio = municipios.find(m => m.codigo_ibge === codigoIbge);

  if (municipio) {
    if (!municipio.cnpj) {
      municipio.cnpj = cnpj;
      adicionados++;
      console.log(`✅ Adicionado: ${municipio.nome}-${municipio.uf} (${cnpj})`);
    } else {
      jaExistentes++;
      console.log(`ℹ️  Já existe: ${municipio.nome}-${municipio.uf}`);
    }
  } else {
    console.log(`⚠️  Código IBGE não encontrado: ${codigoIbge}`);
  }
});

// Salvar backup
const backup = `./municipios-brasil-backup-${Date.now()}.json`;
fs.copyFileSync('./municipios-brasil.json', backup);
console.log(`\n💾 Backup criado: ${backup}`);

// Salvar arquivo atualizado
fs.writeFileSync(
  './municipios-brasil.json',
  JSON.stringify(municipios, null, 2),
  'utf8'
);

console.log('\n' + '='.repeat(80));
console.log('✅ COLETA CONCLUÍDA');
console.log('='.repeat(80));
console.log(`📊 CNPJs adicionados: ${adicionados}`);
console.log(`ℹ️  CNPJs já existentes: ${jaExistentes}`);

const totalComCNPJ = municipios.filter(m => m.cnpj).length;
const totalSemCNPJ = municipios.filter(m => !m.cnpj).length;

console.log(`\n📈 Status Final:`);
console.log(`   Total com CNPJ: ${totalComCNPJ} (${((totalComCNPJ / municipios.length) * 100).toFixed(2)}%)`);
console.log(`   Total sem CNPJ: ${totalSemCNPJ} (${((totalSemCNPJ / municipios.length) * 100).toFixed(2)}%)`);
console.log(`\n💾 Arquivo atualizado: municipios-brasil.json\n`);

console.log('🎯 Próximo passo: Execute node validar-cnpjs.js para validar os CNPJs\n');
