const fs = require('fs');
const path = require('path');

/**
 * Conta corretamente apenas serviços de nível superior
 * Ignora campos internos dos formulários
 */

function countTopLevelServices(content) {
  // Remove comentários para não contar nada dentro deles
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  // Encontra todos os arrays de serviços: const XXX_SERVICES: ServiceDefinition[] = [
  const arrayPattern = /const\s+\w+_SERVICES:\s*ServiceDefinition\[\]\s*=\s*\[/g;
  const arrays = [];
  let match;

  while ((match = arrayPattern.exec(cleanContent)) !== null) {
    arrays.push({
      start: match.index + match[0].length,
      name: match[0].match(/const\s+(\w+_SERVICES)/)[1]
    });
  }

  const services = [];

  // Para cada array, extrai os objetos de nível superior
  arrays.forEach(array => {
    let pos = array.start;
    let bracketCount = 1; // Já estamos dentro do [
    let arrayEnd = pos;

    // Encontra o fim do array
    for (let i = pos; i < cleanContent.length; i++) {
      if (cleanContent[i] === '[') bracketCount++;
      if (cleanContent[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          arrayEnd = i;
          break;
        }
      }
    }

    const arrayContent = cleanContent.substring(pos, arrayEnd);

    // Agora conta objetos de nível superior (depth = 1)
    let depth = 0;
    let objStart = -1;

    for (let i = 0; i < arrayContent.length; i++) {
      if (arrayContent[i] === '{') {
        if (depth === 0) {
          objStart = i;
        }
        depth++;
      }
      if (arrayContent[i] === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          // Encontramos um objeto de nível superior
          const objContent = arrayContent.substring(objStart, i + 1);

          // Extrai o nome do serviço (primeira ocorrência de name: no nível superior)
          const nameMatch = objContent.match(/name:\s*['"]([^'"]+)['"]/);
          if (nameMatch) {
            services.push({
              section: array.name,
              name: nameMatch[1]
            });
          }

          objStart = -1;
        }
      }
    }
  });

  return services;
}

function countServicesInModularFiles(seedsDir) {
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

  const allServices = [];
  const byFile = {};

  seedFiles.forEach(file => {
    const filepath = path.join(seedsDir, file);
    if (!fs.existsSync(filepath)) {
      byFile[file] = 0;
      return;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

    // Encontra o array de exportação
    const exportMatch = cleanContent.match(/export\s+const\s+\w+:\s*ServiceDefinition\[\]\s*=\s*\[/);
    if (!exportMatch) {
      byFile[file] = 0;
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

    // Conta objetos de nível superior
    let depth = 0;
    let count = 0;
    let objStart = -1;

    for (let i = 0; i < arrayContent.length; i++) {
      if (arrayContent[i] === '{') {
        if (depth === 0) objStart = i;
        depth++;
      }
      if (arrayContent[i] === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          count++;
          const objContent = arrayContent.substring(objStart, i + 1);
          const nameMatch = objContent.match(/name:\s*['"]([^'"]+)['"]/);
          if (nameMatch) {
            allServices.push({
              file: file,
              name: nameMatch[1]
            });
          }
          objStart = -1;
        }
      }
    }

    byFile[file] = count;
  });

  return { allServices, byFile };
}

function main() {
  console.log('================================================================================');
  console.log('CONTAGEM CORRETA DE SERVIÇOS (apenas nível superior)');
  console.log('================================================================================\n');

  // 1. Conta no arquivo original
  const originalFile = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services-simplified-complete.ts');
  const originalContent = fs.readFileSync(originalFile, 'utf-8');
  const originalServices = countTopLevelServices(originalContent);

  console.log('ARQUIVO ORIGINAL (services-simplified-complete.ts):');
  console.log(`  Total de serviços: ${originalServices.length}`);

  // Agrupa por seção
  const bySection = {};
  originalServices.forEach(s => {
    if (!bySection[s.section]) bySection[s.section] = [];
    bySection[s.section].push(s.name);
  });

  console.log('\n  Por seção:');
  Object.keys(bySection).sort().forEach(section => {
    console.log(`    ${section}: ${bySection[section].length} serviços`);
  });

  // 2. Conta nos seeds modulares
  const seedsDir = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services');
  const modular = countServicesInModularFiles(seedsDir);

  console.log('\n\nSEEDS MODULARES:');
  console.log(`  Total de serviços: ${modular.allServices.length}`);

  console.log('\n  Por arquivo:');
  const fileNames = {
    'health.seed.ts': 'Saúde',
    'agriculture.seed.ts': 'Agricultura',
    'education.seed.ts': 'Educação',
    'social.seed.ts': 'Assistência Social',
    'culture.seed.ts': 'Cultura',
    'sports.seed.ts': 'Esportes',
    'housing.seed.ts': 'Habitação',
    'environment.seed.ts': 'Meio Ambiente',
    'public-works.seed.ts': 'Obras Públicas',
    'urban-planning.seed.ts': 'Planejamento Urbano',
    'public-safety.seed.ts': 'Segurança Pública',
    'public-services.seed.ts': 'Serviços Públicos',
    'tourism.seed.ts': 'Turismo',
  };

  Object.keys(modular.byFile).sort().forEach(file => {
    const name = fileNames[file] || file;
    console.log(`    ${name}: ${modular.byFile[file]} serviços`);
  });

  // 3. Verifica duplicações
  const modularNames = modular.allServices.map(s => s.name);
  const uniqueModular = [...new Set(modularNames)];

  if (modularNames.length !== uniqueModular.length) {
    console.log('\n\n⚠️  DUPLICAÇÕES ENCONTRADAS NOS SEEDS MODULARES:');
    const duplicates = modularNames.filter((name, index) => modularNames.indexOf(name) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    uniqueDuplicates.forEach(name => {
      const count = modularNames.filter(n => n === name).length;
      console.log(`  - "${name}" aparece ${count}x`);
    });
  } else {
    console.log('\n\n✅ Nenhuma duplicação nos seeds modulares');
  }

  // 4. Comparação
  console.log('\n\n================================================================================');
  console.log('COMPARAÇÃO');
  console.log('================================================================================');
  console.log(`Arquivo original: ${originalServices.length} serviços`);
  console.log(`Seeds modulares:  ${modular.allServices.length} serviços`);

  const diff = modular.allServices.length - originalServices.length;
  if (diff > 0) {
    console.log(`\n⚠️  Seeds modulares têm ${diff} serviços A MAIS que o original`);
  } else if (diff < 0) {
    console.log(`\n❌ Seeds modulares têm ${Math.abs(diff)} serviços A MENOS que o original`);
  } else {
    console.log('\n✅ Seeds modulares têm EXATAMENTE a mesma quantidade do original!');
  }

  console.log('================================================================================\n');
}

main();
