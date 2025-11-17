const fs = require('fs');
const path = require('path');

// Lê o arquivo original e extrai os nomes dos serviços
const originalFile = fs.readFileSync(
  path.join(__dirname, 'digiurban/backend/prisma/seeds/services-simplified-complete.ts'),
  'utf8'
);

// Regex para extrair nome e departmentCode
const serviceRegex = /name:\s*'([^']+)',\s*description:.*?departmentCode:\s*'([^']+)'/gs;

const originalServices = {};
let match;

while ((match = serviceRegex.exec(originalFile)) !== null) {
  const name = match[1];
  const dept = match[2];

  if (!originalServices[dept]) {
    originalServices[dept] = [];
  }
  originalServices[dept].push(name);
}

// Mapeamento de arquivos modulares
const modularFiles = {
  'SAUDE': 'health.seed.ts',
  'EDUCACAO': 'education.seed.ts',
  'ASSISTENCIA_SOCIAL': 'social.seed.ts',
  'AGRICULTURA': 'agriculture.seed.ts',
  'CULTURA': 'culture.seed.ts',
  'ESPORTES': 'sports.seed.ts',
  'HABITACAO': 'housing.seed.ts',
  'MEIO_AMBIENTE': 'environment.seed.ts',
  'OBRAS_PUBLICAS': 'public-works.seed.ts',
  'PLANEJAMENTO': 'urban-planning.seed.ts',
  'SEGURANCA': 'public-safety.seed.ts',
  'SERVICOS_PUBLICOS': 'public-services.seed.ts',
  'TURISMO': 'tourism.seed.ts',
  'OBRAS': 'public-works.seed.ts'
};

const modularServices = {};

// Lê cada arquivo modular
for (const [dept, filename] of Object.entries(modularFiles)) {
  const filePath = path.join(__dirname, 'digiurban/backend/prisma/seeds/services', filename);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const nameRegex = /name:\s*'([^']+)'/g;
    const services = [];

    let nameMatch;
    while ((nameMatch = nameRegex.exec(content)) !== null) {
      services.push(nameMatch[1]);
    }

    modularServices[dept] = services;
  }
}

// Mapear nomes de departamentos
const deptNames = {
  'SAUDE': 'Saúde',
  'EDUCACAO': 'Educação',
  'ASSISTENCIA_SOCIAL': 'Assistência Social',
  'AGRICULTURA': 'Agricultura',
  'CULTURA': 'Cultura',
  'ESPORTES': 'Esportes',
  'HABITACAO': 'Habitação',
  'MEIO_AMBIENTE': 'Meio Ambiente',
  'OBRAS_PUBLICAS': 'Obras Públicas',
  'PLANEJAMENTO': 'Planejamento Urbano',
  'SEGURANCA': 'Segurança Pública',
  'SERVICOS_PUBLICOS': 'Serviços Públicos',
  'TURISMO': 'Turismo',
  'OBRAS': 'Obras Públicas'
};

// Gerar relatório
console.log('===============================================');
console.log('RELATÓRIO DE COMPARAÇÃO DE SERVIÇOS');
console.log('===============================================\n');

let totalOriginal = 0;
let totalModular = 0;
let totalFaltando = 0;

for (const dept of Object.keys(originalServices).sort()) {
  const deptName = deptNames[dept] || dept;
  const original = originalServices[dept] || [];
  const modular = modularServices[dept] || [];

  totalOriginal += original.length;
  totalModular += modular.length;

  // Encontrar serviços faltantes
  const missing = original.filter(name => !modular.includes(name));
  totalFaltando += missing.length;

  console.log(`\n## ${deptName.toUpperCase()}`);
  console.log(`-`.repeat(50));
  console.log(`Total no arquivo original: ${original.length}`);
  console.log(`Total no seed modular: ${modular.length}`);
  console.log(`Serviços faltando: ${missing.length}`);

  if (missing.length > 0) {
    console.log(`\nServiços que estão faltando:`);
    missing.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
  } else {
    console.log(`✓ Todos os serviços estão presentes no seed modular`);
  }
}

console.log('\n\n===============================================');
console.log('RESUMO GERAL');
console.log('===============================================');
console.log(`Total de serviços no arquivo original: ${totalOriginal}`);
console.log(`Total de serviços nos seeds modulares: ${totalModular}`);
console.log(`Total de serviços faltando: ${totalFaltando}`);
console.log(`Percentual de completude: ${((totalModular / totalOriginal) * 100).toFixed(2)}%`);
console.log('===============================================\n');
