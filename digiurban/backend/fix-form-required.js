/**
 * Script para remover campos de ID dos arrays 'required' dos formSchemas
 */

const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, 'prisma', 'seeds', 'services-simplified-complete.ts');

console.log('🔧 Corrigindo arrays required...\n');

// Ler arquivo
let content = fs.readFileSync(SEED_FILE, 'utf8');

// Padrões de IDs para remover dos arrays required
const idFieldsToRemove = [
  'citizenId',
  'pacienteId',
  'alunoId',
  'produtorId',
  'beneficiarioId',
  'cidadaoId'
];

let changeCount = 0;

// Processar cada padrão
idFieldsToRemove.forEach(fieldId => {
  // Padrão 1: 'fieldId', (com vírgula)
  const pattern1 = new RegExp(`'${fieldId}',\\s*`, 'g');
  const matches1 = content.match(pattern1);
  if (matches1) {
    content = content.replace(pattern1, '');
    changeCount += matches1.length;
    console.log(`✓ Removido '${fieldId}', - ${matches1.length} ocorrências`);
  }

  // Padrão 2: , 'fieldId'] (último item)
  const pattern2 = new RegExp(`,\\s*'${fieldId}'\\]`, 'g');
  const matches2 = content.match(pattern2);
  if (matches2) {
    content = content.replace(pattern2, ']');
    changeCount += matches2.length;
    console.log(`✓ Removido , '${fieldId}'] - ${matches2.length} ocorrências`);
  }

  // Padrão 3: ['fieldId'] (único item)
  const pattern3 = new RegExp(`\\['${fieldId}'\\]`, 'g');
  const matches3 = content.match(pattern3);
  if (matches3) {
    content = content.replace(pattern3, '[]');
    changeCount += matches3.length;
    console.log(`✓ Removido ['${fieldId}'] - ${matches3.length} ocorrências`);
  }
});

// Escrever arquivo corrigido
fs.writeFileSync(SEED_FILE, content, 'utf8');

console.log(`\n✅ Corrigido! ${changeCount} alterações nos arrays required.`);
console.log(`📄 Arquivo atualizado: ${SEED_FILE}`);
