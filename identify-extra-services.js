const fs = require('fs');
const path = require('path');

function extractServiceNames(content) {
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  // Encontra arrays de serviços
  const arrayPattern = /(const\s+\w+_SERVICES|export\s+const\s+\w+):\s*ServiceDefinition\[\]\s*=\s*\[/g;
  const arrays = [];
  let match;

  while ((match = arrayPattern.exec(cleanContent)) !== null) {
    arrays.push(match.index + match[0].length);
  }

  const services = [];

  arrays.forEach(arrayStart => {
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

    for (let i = 0; i < arrayContent.length; i++) {
      if (arrayContent[i] === '{') {
        if (depth === 0) objStart = i;
        depth++;
      }
      if (arrayContent[i] === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const objContent = arrayContent.substring(objStart, i + 1);
          const nameMatch = objContent.match(/name:\s*['"]([^'"]+)['"]/);
          if (nameMatch) {
            services.push(nameMatch[1]);
          }
          objStart = -1;
        }
      }
    }
  });

  return services;
}

function main() {
  // Lê arquivo original
  const originalFile = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services-simplified-complete.ts');
  const originalContent = fs.readFileSync(originalFile, 'utf-8');
  const originalServices = extractServiceNames(originalContent);
  const originalSet = new Set(originalServices);

  console.log(`Serviços no arquivo original: ${originalServices.length}`);
  console.log(`Serviços únicos no arquivo original: ${originalSet.size}\n`);

  // Lê todos os seeds modulares
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

  const modularServices = [];
  const byFile = {};

  seedFiles.forEach(file => {
    const filepath = path.join(seedsDir, file);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8');
      const services = extractServiceNames(content);
      byFile[file] = services;
      modularServices.push(...services);
    }
  });

  console.log(`Serviços nos seeds modulares: ${modularServices.length}`);
  console.log(`Serviços únicos nos seeds modulares: ${new Set(modularServices).size}\n`);

  // Identifica duplicações nos modulares
  const modularCounts = {};
  modularServices.forEach(name => {
    modularCounts[name] = (modularCounts[name] || 0) + 1;
  });

  const duplicates = Object.entries(modularCounts).filter(([name, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log('================================================================================');
    console.log('DUPLICAÇÕES NOS SEEDS MODULARES');
    console.log('================================================================================\n');

    duplicates.forEach(([name, count]) => {
      console.log(`"${name}" aparece ${count}x em:`);

      seedFiles.forEach(file => {
        if (byFile[file] && byFile[file].includes(name)) {
          const occurrences = byFile[file].filter(s => s === name).length;
          if (occurrences > 0) {
            console.log(`  - ${file}: ${occurrences}x`);
          }
        }
      });
      console.log();
    });
  }

  // Identifica serviços que estão nos modulares mas NÃO no original
  const extras = modularServices.filter(name => !originalSet.has(name));
  const uniqueExtras = [...new Set(extras)];

  if (uniqueExtras.length > 0) {
    console.log('================================================================================');
    console.log('SERVIÇOS EXTRAS (estão nos modulares mas NÃO no original)');
    console.log('================================================================================\n');

    console.log(`Total de extras: ${uniqueExtras.length}\n`);

    uniqueExtras.forEach((name, i) => {
      console.log(`${i + 1}. "${name}"`);

      seedFiles.forEach(file => {
        if (byFile[file] && byFile[file].includes(name)) {
          console.log(`   → ${file}`);
        }
      });
    });
  }

  // Identifica serviços que estão no original mas NÃO nos modulares
  const modularSet = new Set(modularServices);
  const missing = [...originalSet].filter(name => !modularSet.has(name));

  if (missing.length > 0) {
    console.log('\n================================================================================');
    console.log('SERVIÇOS FALTANTES (estão no original mas NÃO nos modulares)');
    console.log('================================================================================\n');

    console.log(`Total faltando: ${missing.length}\n`);

    missing.forEach((name, i) => {
      console.log(`${i + 1}. "${name}"`);
    });
  }

  console.log('\n================================================================================');
  console.log('RESUMO');
  console.log('================================================================================');
  console.log(`Original: ${originalSet.size} serviços únicos`);
  console.log(`Modulares: ${modularServices.length} serviços (${new Set(modularServices).size} únicos)`);
  console.log(`Duplicações nos modulares: ${duplicates.length}`);
  console.log(`Serviços extras: ${uniqueExtras.length}`);
  console.log(`Serviços faltantes: ${missing.length}`);
  console.log('================================================================================\n');
}

main();
