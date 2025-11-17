const fs = require('fs');
const path = require('path');

function checkDepartmentCode(filepath, filename) {
  const content = fs.readFileSync(filepath, 'utf-8');

  // Remove comentários
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  // Encontra o array de exportação
  const exportMatch = cleanContent.match(/export\s+const\s+\w+:\s*ServiceDefinition\[\]\s*=\s*\[/);
  if (!exportMatch) {
    console.log(`⚠️  ${filename}: Não encontrou array de exportação`);
    return;
  }

  const arrayStart = exportMatch.index + exportMatch[0].length;
  let bracketCount = 1;
  let arrayEnd = arrayStart;

  for (let i = arrayStart; i < cleanContent.length; i++) {
    if (cleanContent[i] === '[') bracketCount++;
    if (cleanContent[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  const arrayContent = cleanContent.substring(arrayStart, arrayEnd);

  // Extrai objetos de nível superior
  let depth = 0;
  let objStart = -1;
  let serviceIndex = 0;

  for (let i = 0; i < arrayContent.length; i++) {
    if (arrayContent[i] === '{') {
      if (depth === 0) objStart = i;
      depth++;
    }
    if (arrayContent[i] === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        serviceIndex++;
        const objContent = arrayContent.substring(objStart, i + 1);

        // Extrai nome
        const nameMatch = objContent.match(/name:\s*['"]([^'"]+)['"]/);
        const deptMatch = objContent.match(/departmentCode:\s*['"]([^'"]+)['"]/);

        if (!deptMatch) {
          console.log(`❌ ${filename} - Serviço #${serviceIndex}: "${nameMatch ? nameMatch[1] : 'SEM NOME'}" está SEM departmentCode`);
        }

        objStart = -1;
      }
    }
  }
}

const seedsDir = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services');

const seedFiles = [
  'health.seed.ts',
  'agriculture.seed.ts',
  'education.seed.ts',
  'social.seed.ts',
  'culture.seed.ts',
  'sports.seed.ts',
  'housing.seed.ts',
  'environment.seed.ts',
  'public-works.seed.ts',
  'urban-planning.seed.ts',
  'public-safety.seed.ts',
  'public-services.seed.ts',
  'tourism.seed.ts',
];

console.log('Verificando departmentCode em todos os seeds...\n');

seedFiles.forEach(file => {
  const filepath = path.join(seedsDir, file);
  if (fs.existsSync(filepath)) {
    checkDepartmentCode(filepath, file);
  }
});

console.log('\n✅ Verificação concluída');
