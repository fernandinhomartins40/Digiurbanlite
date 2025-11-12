/**
 * Script para remover campos de ID dos formSchemas
 * Remove apenas linhas com: citizenId, pacienteId, alunoId, produtorId, beneficiarioId
 * Mantém tudo mais intacto
 */

const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, 'prisma', 'seeds', 'services-simplified-complete.ts');

console.log('🔧 Corrigindo formSchemas...\n');

// Ler arquivo
const content = fs.readFileSync(SEED_FILE, 'utf8');
const lines = content.split('\n');

// Padrões a remover (linhas que definem campos de ID)
const ID_FIELD_PATTERNS = [
  /citizenId:\s*\{[^}]*\},?\s*$/,
  /pacienteId:\s*\{[^}]*\},?\s*$/,
  /alunoId:\s*\{[^}]*\},?\s*$/,
  /produtorId:\s*\{[^}]*\},?\s*$/,
  /beneficiarioId:\s*\{[^}]*\},?\s*$/,
  /cidadaoId:\s*\{[^}]*\},?\s*$/,
];

let removedCount = 0;
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let shouldRemove = false;

  // Verificar se a linha contém algum padrão de ID
  for (const pattern of ID_FIELD_PATTERNS) {
    if (pattern.test(line)) {
      shouldRemove = true;
      removedCount++;
      console.log(`❌ Linha ${i + 1}: ${line.trim()}`);
      break;
    }
  }

  if (!shouldRemove) {
    newLines.push(line);
  }
}

// Escrever arquivo corrigido
fs.writeFileSync(SEED_FILE, newLines.join('\n'), 'utf8');

console.log(`\n✅ Corrigido! ${removedCount} linhas removidas.`);
console.log(`📄 Arquivo atualizado: ${SEED_FILE}`);
