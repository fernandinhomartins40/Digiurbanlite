const fs = require('fs');
const path = require('path');

function extractServiceNames(content) {
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

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
  const seedsDir = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services');

  const departments = [
    { file: 'health.seed.ts', name: '🏥 SAÚDE', icon: '🏥' },
    { file: 'education.seed.ts', name: '📚 EDUCAÇÃO', icon: '📚' },
    { file: 'social.seed.ts', name: '🤝 ASSISTÊNCIA SOCIAL', icon: '🤝' },
    { file: 'agriculture.seed.ts', name: '🌾 AGRICULTURA', icon: '🌾' },
    { file: 'culture.seed.ts', name: '🎭 CULTURA', icon: '🎭' },
    { file: 'sports.seed.ts', name: '⚽ ESPORTES', icon: '⚽' },
    { file: 'housing.seed.ts', name: '🏘️ HABITAÇÃO', icon: '🏘️' },
    { file: 'environment.seed.ts', name: '🌳 MEIO AMBIENTE', icon: '🌳' },
    { file: 'public-works.seed.ts', name: '🏗️ OBRAS PÚBLICAS', icon: '🏗️' },
    { file: 'urban-planning.seed.ts', name: '🏙️ PLANEJAMENTO URBANO', icon: '🏙️' },
    { file: 'public-safety.seed.ts', name: '🚔 SEGURANÇA PÚBLICA', icon: '🚔' },
    { file: 'public-services.seed.ts', name: '🛠️ SERVIÇOS PÚBLICOS', icon: '🛠️' },
    { file: 'tourism.seed.ts', name: '✈️ TURISMO', icon: '✈️' },
  ];

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     LISTA DE SERVIÇOS POR SECRETARIA                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log();

  let totalServices = 0;
  const allServices = [];

  departments.forEach((dept, index) => {
    const filepath = path.join(seedsDir, dept.file);

    if (!fs.existsSync(filepath)) {
      console.log(`${dept.name}`);
      console.log('─'.repeat(80));
      console.log('❌ Arquivo não encontrado');
      console.log();
      return;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const services = extractServiceNames(content);
    totalServices += services.length;

    console.log(`${dept.name}`);
    console.log('─'.repeat(80));
    console.log(`Total: ${services.length} serviços`);
    console.log();

    services.forEach((service, i) => {
      console.log(`  ${String(i + 1).padStart(2, '0')}. ${service}`);
      allServices.push({ dept: dept.name, service });
    });

    console.log();

    if (index < departments.length - 1) {
      console.log();
    }
  });

  console.log('═'.repeat(80));
  console.log(`TOTAL GERAL: ${totalServices} serviços em ${departments.length} secretarias`);
  console.log('═'.repeat(80));
  console.log();

  // Estatísticas
  const stats = departments.map(dept => {
    const filepath = path.join(seedsDir, dept.file);
    if (!fs.existsSync(filepath)) return null;
    const content = fs.readFileSync(filepath, 'utf-8');
    const services = extractServiceNames(content);
    return {
      name: dept.name.replace(/[🏥📚🤝🌾🎭⚽🏘️🌳🏗️🏙️🚔🛠️✈️]/g, '').trim(),
      count: services.length
    };
  }).filter(Boolean);

  console.log('\n📊 ESTATÍSTICAS:');
  console.log('─'.repeat(80));

  stats.sort((a, b) => b.count - a.count);

  console.log('\nRanking por quantidade de serviços:');
  stats.forEach((stat, i) => {
    const bar = '█'.repeat(Math.floor(stat.count / 2));
    console.log(`  ${String(i + 1).padStart(2)}. ${stat.name.padEnd(25)} : ${String(stat.count).padStart(2)} serviços ${bar}`);
  });

  console.log('\n' + '═'.repeat(80));
}

main();
