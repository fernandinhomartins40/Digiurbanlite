/**
 * Script para padronizar requiredDocuments em todos os seeds
 *
 * ANTES (inconsistente):
 * - requiredDocuments: ['CPF', 'RG']  // Strings soltas
 * - requiredDocuments: [{ id: 'cpf', name: 'CPF' }]  // Sem required explícito
 *
 * DEPOIS (padronizado):
 * - requiredDocuments: [{ id: 'cpf', name: 'CPF', required: true }]
 */

const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '../prisma/seeds/services');

// Função para converter string para objeto padronizado
function stringToDocObject(docString) {
  // Remover espaços e caracteres especiais para criar ID
  const id = docString
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_'); // Substitui espaços por _

  return {
    id: id,
    name: docString,
    required: true
  };
}

// Função para processar um arquivo de seed
function processFile(filePath) {
  console.log(`\n📄 Processando: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modificado = false;

  // Padrão 1: Array de strings ['CPF', 'RG', ...]
  const regex1 = /requiredDocuments:\s*\[((?:'[^']*'|\s*,\s*)+)\]/g;

  content = content.replace(regex1, (match, docs) => {
    // Extrair strings do array
    const strings = docs.match(/'([^']*)'/g);

    if (!strings || strings.length === 0) return match;

    modificado = true;
    console.log(`  ✅ Convertendo array de strings (${strings.length} documentos)`);

    // Converter cada string para objeto
    const objects = strings.map(s => {
      const docName = s.replace(/'/g, '');
      const obj = stringToDocObject(docName);
      return `{ id: '${obj.id}', name: '${obj.name}', required: true }`;
    });

    return `requiredDocuments: [${objects.join(', ')}]`;
  });

  // Padrão 2: Objetos sem required explícito { id: 'cpf', name: 'CPF' }
  const regex2 = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*\}/g;

  content = content.replace(regex2, (match, id, name) => {
    // Verificar se já tem required
    if (!match.includes('required:')) {
      modificado = true;
      console.log(`  ✅ Adicionando required: true para: ${name}`);
      return `{ id: '${id}', name: '${name}', required: true }`;
    }
    return match;
  });

  if (modificado) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Arquivo salvo com correções`);
    return true;
  } else {
    console.log(`  ℹ️  Nenhuma alteração necessária`);
    return false;
  }
}

// Main
console.log('🔧 Iniciando padronização de requiredDocuments...\n');

const files = fs.readdirSync(SEEDS_DIR)
  .filter(f => f.endsWith('.seed.ts'))
  .map(f => path.join(SEEDS_DIR, f));

let totalModificados = 0;

files.forEach(file => {
  if (processFile(file)) {
    totalModificados++;
  }
});

console.log(`\n✅ Concluído! ${totalModificados} arquivo(s) modificado(s) de ${files.length} total`);
