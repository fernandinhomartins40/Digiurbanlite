const fs = require('fs');

console.log('🧹 Limpando CNPJs inválidos...\n');

// Função para validar CNPJ
function validarCNPJ(cnpj) {
  if (!cnpj) return false;

  // Remover formatação
  cnpj = cnpj.replace(/[^\d]/g, '');

  // Verificar se tem 14 dígitos
  if (cnpj.length !== 14) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validar dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;

  return true;
}

// Carregar municípios
const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

console.log(`📊 Total de municípios: ${municipios.length}\n`);

let removidos = 0;
let mantidos = 0;

const cnpjsRemovidos = [];

// Limpar CNPJs inválidos
municipios.forEach(municipio => {
  if (municipio.cnpj) {
    if (validarCNPJ(municipio.cnpj)) {
      mantidos++;
      console.log(`✅ Mantido: ${municipio.nome}-${municipio.uf} (${municipio.cnpj})`);
    } else {
      removidos++;
      cnpjsRemovidos.push({
        municipio: `${municipio.nome}-${municipio.uf}`,
        cnpj: municipio.cnpj
      });
      console.log(`❌ Removido: ${municipio.nome}-${municipio.uf} (${municipio.cnpj})`);
      municipio.cnpj = null;
    }
  }
});

// Salvar backup
const backup = `./municipios-brasil-backup-${Date.now()}.json`;
fs.copyFileSync('./municipios-brasil.json', backup);
console.log(`\n💾 Backup criado: ${backup}`);

// Salvar arquivo limpo
fs.writeFileSync(
  './municipios-brasil.json',
  JSON.stringify(municipios, null, 2),
  'utf8'
);

console.log('\n' + '='.repeat(80));
console.log('✅ LIMPEZA CONCLUÍDA');
console.log('='.repeat(80));
console.log(`📊 CNPJs mantidos: ${mantidos}`);
console.log(`❌ CNPJs removidos: ${removidos}`);
console.log(`\n💾 Arquivo atualizado: municipios-brasil.json\n`);

if (cnpjsRemovidos.length > 0) {
  console.log('📋 CNPJs removidos salvos em: cnpjs-removidos.json\n');
  fs.writeFileSync(
    './cnpjs-removidos.json',
    JSON.stringify(cnpjsRemovidos, null, 2),
    'utf8'
  );
}
