const fs = require('fs');

console.log('🔍 Validador de CNPJs\n');

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

// Função para formatar CNPJ
function formatarCNPJ(cnpj) {
  if (!cnpj) return null;
  cnpj = cnpj.replace(/[^\d]/g, '');
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Validar arquivo de municípios
function validarMunicipios() {
  const municipios = JSON.parse(fs.readFileSync('./municipios-brasil.json', 'utf8'));

  console.log(`📊 Total de municípios: ${municipios.length}\n`);

  const comCNPJ = municipios.filter(m => m.cnpj);
  const semCNPJ = municipios.filter(m => !m.cnpj);

  console.log(`✅ Com CNPJ: ${comCNPJ.length} (${((comCNPJ.length / municipios.length) * 100).toFixed(2)}%)`);
  console.log(`❌ Sem CNPJ: ${semCNPJ.length} (${((semCNPJ.length / municipios.length) * 100).toFixed(2)}%)\n`);

  // Validar CNPJs
  let validos = 0;
  let invalidos = 0;
  let duplicados = new Map();
  let formatacaoIncorreta = [];

  comCNPJ.forEach(municipio => {
    // Verificar formato
    const formatoCorreto = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(municipio.cnpj);
    if (!formatoCorreto) {
      formatacaoIncorreta.push({
        municipio: `${municipio.nome}-${municipio.uf}`,
        cnpj: municipio.cnpj
      });
    }

    // Validar CNPJ
    if (validarCNPJ(municipio.cnpj)) {
      validos++;

      // Verificar duplicatas
      const cnpjLimpo = municipio.cnpj.replace(/[^\d]/g, '');
      if (duplicados.has(cnpjLimpo)) {
        duplicados.get(cnpjLimpo).push(`${municipio.nome}-${municipio.uf}`);
      } else {
        duplicados.set(cnpjLimpo, [`${municipio.nome}-${municipio.uf}`]);
      }
    } else {
      invalidos++;
      console.log(`❌ CNPJ INVÁLIDO: ${municipio.nome}-${municipio.uf} (${municipio.cnpj})`);
    }
  });

  console.log('\n📋 Validação de CNPJs:');
  console.log(`   ✅ Válidos: ${validos}`);
  console.log(`   ❌ Inválidos: ${invalidos}`);

  // Mostrar formatação incorreta
  if (formatacaoIncorreta.length > 0) {
    console.log(`\n⚠️  Formatação incorreta (${formatacaoIncorreta.length}):`);
    formatacaoIncorreta.forEach(({ municipio, cnpj }) => {
      console.log(`   ${municipio}: ${cnpj}`);
    });
  }

  // Mostrar duplicatas
  const cnpjsDuplicados = Array.from(duplicados.entries()).filter(([_, municipios]) => municipios.length > 1);

  if (cnpjsDuplicados.length > 0) {
    console.log(`\n⚠️  CNPJs duplicados (${cnpjsDuplicados.length}):`);
    cnpjsDuplicados.forEach(([cnpj, municipios]) => {
      console.log(`\n   CNPJ: ${formatarCNPJ(cnpj)}`);
      municipios.forEach(m => console.log(`      - ${m}`));
    });
  } else {
    console.log('\n✅ Nenhum CNPJ duplicado encontrado');
  }

  // Estatísticas por estado
  console.log('\n📊 Cobertura por Estado:\n');

  const porEstado = {};
  municipios.forEach(m => {
    if (!porEstado[m.uf]) {
      porEstado[m.uf] = { total: 0, comCNPJ: 0 };
    }
    porEstado[m.uf].total++;
    if (m.cnpj) porEstado[m.uf].comCNPJ++;
  });

  Object.entries(porEstado)
    .sort((a, b) => (b[1].comCNPJ / b[1].total) - (a[1].comCNPJ / a[1].total))
    .forEach(([uf, dados]) => {
      const percentual = ((dados.comCNPJ / dados.total) * 100).toFixed(2);
      const barra = '█'.repeat(Math.floor(percentual / 2));
      console.log(`   ${uf}: ${barra.padEnd(50)} ${dados.comCNPJ}/${dados.total} (${percentual}%)`);
    });

  // Maiores municípios sem CNPJ
  console.log('\n🎯 Maiores municípios sem CNPJ (Top 20):\n');

  semCNPJ
    .sort((a, b) => (b.populacao || 0) - (a.populacao || 0))
    .slice(0, 20)
    .forEach((m, i) => {
      const pop = (m.populacao || 0).toLocaleString('pt-BR');
      console.log(`   ${(i + 1).toString().padStart(2)}. ${m.nome}-${m.uf} (${pop} hab.)${m.capital ? ' [CAPITAL]' : ''}`);
    });

  console.log('\n');
}

// Validar arquivo de CNPJs coletados
function validarArquivoColetados() {
  if (!fs.existsSync('./cnpj-coletados.json')) {
    console.log('⚠️  Arquivo cnpj-coletados.json não encontrado\n');
    return;
  }

  const cnpjsColetados = JSON.parse(fs.readFileSync('./cnpj-coletados.json', 'utf8'));
  const total = Object.keys(cnpjsColetados).length;

  console.log(`\n📂 CNPJs Coletados: ${total}\n`);

  let validos = 0;
  let invalidos = 0;

  Object.entries(cnpjsColetados).forEach(([codigo, dados]) => {
    if (validarCNPJ(dados.cnpj)) {
      validos++;
    } else {
      invalidos++;
      console.log(`❌ INVÁLIDO: ${dados.nome}-${dados.uf} (${dados.cnpj})`);
    }
  });

  console.log(`✅ Válidos: ${validos}`);
  console.log(`❌ Inválidos: ${invalidos}\n`);
}

// Executar validações
console.log('=' .repeat(80));
console.log('VALIDAÇÃO DO ARQUIVO PRINCIPAL');
console.log('='.repeat(80) + '\n');

validarMunicipios();

console.log('\n' + '='.repeat(80));
console.log('VALIDAÇÃO DO ARQUIVO DE CNPJs COLETADOS');
console.log('='.repeat(80));

validarArquivoColetados();
