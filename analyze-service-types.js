const fs = require('fs');
const path = require('path');

function extractServicesWithTypes(content) {
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

          // Extrai nome
          const nameMatch = objContent.match(/name:\s*['"]([^'"]+)['"]/);

          // Extrai serviceType
          const typeMatch = objContent.match(/serviceType:\s*['"]([^'"]+)['"]/);

          // Extrai moduleType
          const moduleMatch = objContent.match(/moduleType:\s*(['"]([^'"]+)['"]|null)/);

          if (nameMatch) {
            services.push({
              name: nameMatch[1],
              serviceType: typeMatch ? typeMatch[1] : 'NÃO DEFINIDO',
              moduleType: moduleMatch ? (moduleMatch[2] || null) : 'NÃO DEFINIDO'
            });
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
    { file: 'health.seed.ts', name: 'Saúde', icon: '🏥' },
    { file: 'education.seed.ts', name: 'Educação', icon: '📚' },
    { file: 'social.seed.ts', name: 'Assistência Social', icon: '🤝' },
    { file: 'agriculture.seed.ts', name: 'Agricultura', icon: '🌾' },
    { file: 'culture.seed.ts', name: 'Cultura', icon: '🎭' },
    { file: 'sports.seed.ts', name: 'Esportes', icon: '⚽' },
    { file: 'housing.seed.ts', name: 'Habitação', icon: '🏘️' },
    { file: 'environment.seed.ts', name: 'Meio Ambiente', icon: '🌳' },
    { file: 'public-works.seed.ts', name: 'Obras Públicas', icon: '🏗️' },
    { file: 'urban-planning.seed.ts', name: 'Planejamento Urbano', icon: '🏙️' },
    { file: 'public-safety.seed.ts', name: 'Segurança Pública', icon: '🚔' },
    { file: 'public-services.seed.ts', name: 'Serviços Públicos', icon: '🛠️' },
    { file: 'tourism.seed.ts', name: 'Turismo', icon: '✈️' },
  ];

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              ANÁLISE DE TIPOS DE SERVIÇOS (COM_DADOS vs INFORMATIVOS)      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log();

  let totalComDados = 0;
  let totalSemDados = 0;
  let totalInformativos = 0;
  let totalGestao = 0;
  let totalNaoDefinido = 0;
  let totalServices = 0;

  const departmentStats = [];

  departments.forEach(dept => {
    const filepath = path.join(seedsDir, dept.file);

    if (!fs.existsSync(filepath)) {
      return;
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    const services = extractServicesWithTypes(content);

    const comDados = services.filter(s => s.serviceType === 'COM_DADOS').length;
    const semDados = services.filter(s => s.serviceType === 'SEM_DADOS').length;
    const informativos = services.filter(s => s.serviceType === 'INFORMATIVO').length;
    const gestao = services.filter(s => s.serviceType === 'GESTÃO' || s.serviceType === 'GESTAO').length;
    const naoDefinido = services.filter(s => s.serviceType === 'NÃO DEFINIDO').length;

    totalComDados += comDados;
    totalSemDados += semDados;
    totalInformativos += informativos;
    totalGestao += gestao;
    totalNaoDefinido += naoDefinido;
    totalServices += services.length;

    departmentStats.push({
      name: dept.name,
      icon: dept.icon,
      total: services.length,
      comDados,
      semDados,
      informativos,
      gestao,
      naoDefinido,
      services
    });

    console.log(`${dept.icon} ${dept.name}`);
    console.log('─'.repeat(80));
    console.log(`  Total de serviços: ${services.length}`);
    console.log(`  ✅ COM_DADOS:      ${comDados} (${((comDados/services.length)*100).toFixed(1)}%)`);
    console.log(`  📄 SEM_DADOS:      ${semDados} (${((semDados/services.length)*100).toFixed(1)}%)`);
    if (informativos > 0) {
      console.log(`  ℹ️  INFORMATIVOS:   ${informativos} (${((informativos/services.length)*100).toFixed(1)}%)`);
    }
    if (gestao > 0) {
      console.log(`  ⚙️  GESTÃO:         ${gestao} (${((gestao/services.length)*100).toFixed(1)}%)`);
    }
    if (naoDefinido > 0) {
      console.log(`  ⚠️  NÃO DEFINIDO:   ${naoDefinido} (${((naoDefinido/services.length)*100).toFixed(1)}%)`);
    }
    console.log();
  });

  console.log('═'.repeat(80));
  console.log('RESUMO GERAL');
  console.log('═'.repeat(80));
  console.log(`Total de serviços: ${totalServices}`);
  console.log();
  console.log(`✅ COM_DADOS:      ${totalComDados} (${((totalComDados/totalServices)*100).toFixed(1)}%)`);
  console.log(`📄 SEM_DADOS:      ${totalSemDados} (${((totalSemDados/totalServices)*100).toFixed(1)}%)`);
  if (totalInformativos > 0) {
    console.log(`ℹ️  INFORMATIVOS:   ${totalInformativos} (${((totalInformativos/totalServices)*100).toFixed(1)}%)`);
  }
  if (totalGestao > 0) {
    console.log(`⚙️  GESTÃO:         ${totalGestao} (${((totalGestao/totalServices)*100).toFixed(1)}%)`);
  }
  if (totalNaoDefinido > 0) {
    console.log(`⚠️  NÃO DEFINIDO:   ${totalNaoDefinido} (${((totalNaoDefinido/totalServices)*100).toFixed(1)}%)`);
  }
  console.log('═'.repeat(80));

  // Estatísticas adicionais
  console.log();
  console.log('📊 ESTATÍSTICAS ADICIONAIS:');
  console.log('─'.repeat(80));

  console.log('\nSecretarias com mais serviços COM_DADOS:');
  const sortedByComDados = [...departmentStats].sort((a, b) => b.comDados - a.comDados);
  sortedByComDados.slice(0, 5).forEach((dept, i) => {
    console.log(`  ${i + 1}. ${dept.icon} ${dept.name}: ${dept.comDados} serviços COM_DADOS`);
  });

  console.log('\nSecretarias com mais serviços INFORMATIVOS:');
  const sortedByInformativos = [...departmentStats].sort((a, b) => b.informativos - a.informativos);
  sortedByInformativos.slice(0, 5).forEach((dept, i) => {
    console.log(`  ${i + 1}. ${dept.icon} ${dept.name}: ${dept.informativos} serviços INFORMATIVOS`);
  });

  // Lista os serviços não definidos se houver
  if (totalNaoDefinido > 0) {
    console.log('\n⚠️  SERVIÇOS SEM TIPO DEFINIDO:');
    console.log('─'.repeat(80));
    departmentStats.forEach(dept => {
      const undefined = dept.services.filter(s => s.serviceType === 'NÃO DEFINIDO');
      if (undefined.length > 0) {
        console.log(`\n${dept.icon} ${dept.name}:`);
        undefined.forEach(s => {
          console.log(`  - ${s.name}`);
        });
      }
    });
  }

  console.log('\n' + '═'.repeat(80));
}

main();
