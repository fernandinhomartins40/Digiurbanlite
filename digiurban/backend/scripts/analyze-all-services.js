/**
 * Script para analisar TODOS os serviços e gerar relatório completo
 */

const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '../prisma/seeds/services');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Extrair todos os serviços
  const services = [];

  // Regex para encontrar objetos de serviço
  const serviceRegex = /{\s*name:\s*'([^']+)'[\s\S]*?requiredDocuments:\s*(\[[^\]]+\])/g;

  let match;
  while ((match = serviceRegex.exec(content)) !== null) {
    const serviceName = match[1];
    const requiredDocsStr = match[2];

    services.push({
      name: serviceName,
      requiredDocs: requiredDocsStr,
      file: fileName
    });
  }

  return services;
}

function analyzeRequiredDocs(docsStr) {
  const issues = [];

  // Problema 1: Array de strings sem objetos
  if (docsStr.includes("'") && !docsStr.includes('id:')) {
    issues.push('❌ Array de strings (sem id/required)');
  }

  // Problema 2: Objetos sem required explícito
  if (docsStr.includes('id:') && docsStr.includes('name:') && !docsStr.includes('required:')) {
    issues.push('⚠️  Objetos sem campo required explícito');
  }

  // Problema 3: IDs genéricos ou mal nomeados
  if (docsStr.includes("id: 'cpf'") || docsStr.includes("id: 'rg'")) {
    // OK - documentos comuns
  } else if (docsStr.match(/id: '[a-z_]+'/)) {
    // Verificar se ID está em snake_case
    const ids = docsStr.match(/id: '([^']+)'/g);
    if (ids) {
      ids.forEach(id => {
        const idValue = id.match(/id: '([^']+)'/)[1];
        if (idValue.includes(' ') || idValue !== idValue.toLowerCase()) {
          issues.push(`🔴 ID inválido: ${idValue} (deve ser snake_case)`);
        }
      });
    }
  }

  return issues;
}

console.log('🔍 ANÁLISE COMPLETA DE TODOS OS SERVIÇOS\n');
console.log('='.repeat(80));

const files = fs.readdirSync(SEEDS_DIR)
  .filter(f => f.endsWith('.seed.ts'))
  .map(f => path.join(SEEDS_DIR, f));

let totalServices = 0;
let totalWithIssues = 0;
const issuesByType = {};

files.forEach(file => {
  const services = analyzeFile(file);
  totalServices += services.length;

  console.log(`\n📄 ${path.basename(file)} - ${services.length} serviços`);

  services.forEach(service => {
    const issues = analyzeRequiredDocs(service.requiredDocs);

    if (issues.length > 0) {
      totalWithIssues++;
      console.log(`  ⚠️  ${service.name}`);
      issues.forEach(issue => {
        console.log(`      ${issue}`);
        issuesByType[issue] = (issuesByType[issue] || 0) + 1;
      });
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log('\n📊 RESUMO GERAL:');
console.log(`   Total de serviços analisados: ${totalServices}`);
console.log(`   Serviços com problemas: ${totalWithIssues}`);
console.log(`   Serviços corretos: ${totalServices - totalWithIssues}`);

console.log('\n📈 PROBLEMAS POR TIPO:');
Object.entries(issuesByType).forEach(([issue, count]) => {
  console.log(`   ${issue}: ${count}`);
});

console.log('\n' + '='.repeat(80));
