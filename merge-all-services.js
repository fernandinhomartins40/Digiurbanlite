const fs = require('fs');
const path = require('path');

// Mapeamento de seções do arquivo original para arquivos modulares
const SECTION_TO_FILE = {
  'HEALTH_SERVICES': {
    file: 'health.seed.ts',
    export: 'healthServices',
    name: 'Saúde'
  },
  'AGRICULTURE_SERVICES': {
    file: 'agriculture.seed.ts',
    export: 'agricultureServices',
    name: 'Agricultura'
  },
  'EDUCATION_SERVICES': {
    file: 'education.seed.ts',
    export: 'educationServices',
    name: 'Educação'
  },
  'SOCIAL_SERVICES': {
    file: 'social.seed.ts',
    export: 'socialServices',
    name: 'Assistência Social'
  },
  'CULTURE_SERVICES': {
    file: 'culture.seed.ts',
    export: 'cultureServices',
    name: 'Cultura'
  },
  'SPORTS_SERVICES': {
    file: 'sports.seed.ts',
    export: 'sportsServices',
    name: 'Esportes'
  },
  'HOUSING_SERVICES': {
    file: 'housing.seed.ts',
    export: 'housingServices',
    name: 'Habitação'
  },
  'ENVIRONMENT_SERVICES': {
    file: 'environment.seed.ts',
    export: 'environmentServices',
    name: 'Meio Ambiente'
  },
  'PUBLIC_WORKS_SERVICES': {
    file: 'public-works.seed.ts',
    export: 'publicWorksServices',
    name: 'Obras Públicas'
  },
  'URBAN_PLANNING_SERVICES': {
    file: 'urban-planning.seed.ts',
    export: 'urbanPlanningServices',
    name: 'Planejamento Urbano'
  },
  'SECURITY_SERVICES': {
    file: 'public-safety.seed.ts',
    export: 'publicSafetyServices',
    name: 'Segurança Pública'
  },
  'PUBLIC_SERVICES': {
    file: 'public-services.seed.ts',
    export: 'publicServices',
    name: 'Serviços Públicos'
  },
  'TOURISM_SERVICES': {
    file: 'tourism.seed.ts',
    export: 'tourismServices',
    name: 'Turismo'
  }
};

function extractSection(content, sectionName) {
  // Encontra a declaração da seção
  const sectionPattern = new RegExp(`const ${sectionName}: ServiceDefinition\\[\\] = \\[`, 'g');
  const match = sectionPattern.exec(content);

  if (!match) {
    return null;
  }

  let startIdx = match.index + match[0].length;
  let braceCount = 1;
  let endIdx = startIdx;

  // Encontra o fechamento do array
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '[') braceCount++;
    if (content[i] === ']') {
      braceCount--;
      if (braceCount === 0) {
        endIdx = i;
        break;
      }
    }
  }

  return content.substring(startIdx, endIdx).trim();
}

function extractIndividualServices(sectionContent) {
  const services = [];
  let currentPos = 0;

  while (currentPos < sectionContent.length) {
    // Procura próximo {
    const startBrace = sectionContent.indexOf('{', currentPos);
    if (startBrace === -1) break;

    // Conta chaves para encontrar o fechamento
    let braceCount = 0;
    let endBrace = startBrace;

    for (let i = startBrace; i < sectionContent.length; i++) {
      if (sectionContent[i] === '{') braceCount++;
      if (sectionContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endBrace = i + 1;
          break;
        }
      }
    }

    const serviceCode = sectionContent.substring(startBrace, endBrace);

    // Extrai o nome do serviço
    const nameMatch = serviceCode.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameMatch) {
      services.push({
        name: nameMatch[1],
        code: serviceCode
      });
    }

    currentPos = endBrace;
  }

  return services;
}

function getExistingServiceNames(filepath) {
  if (!fs.existsSync(filepath)) {
    return [];
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const nameRegex = /name:\s*['"]([^'"]+)['"]/g;
  const names = [];
  let match;

  while ((match = nameRegex.exec(content)) !== null) {
    names.push(match[1]);
  }

  return names;
}

function addServicesToFile(filepath, newServices, exportName) {
  if (!fs.existsSync(filepath)) {
    console.log(`  ❌ Arquivo não existe: ${filepath}`);
    return 0;
  }

  const content = fs.readFileSync(filepath, 'utf-8');

  // Encontra o array de exportação
  const exportPattern = new RegExp(`export const ${exportName}: ServiceDefinition\\[\\] = \\[`);
  const match = exportPattern.exec(content);

  if (!match) {
    console.log(`  ❌ Não encontrado array de exportação: ${exportName}`);
    return 0;
  }

  const arrayStart = match.index + match[0].length;

  // Encontra o fechamento do array
  let braceCount = 1;
  let arrayEnd = arrayStart;

  for (let i = arrayStart; i < content.length; i++) {
    if (content[i] === '[') braceCount++;
    if (content[i] === ']') {
      braceCount--;
      if (braceCount === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  // Prepara conteúdo antes e depois
  let beforeArray = content.substring(0, arrayEnd).trimEnd();
  const afterArray = content.substring(arrayEnd);

  // Adiciona vírgula se necessário
  if (!beforeArray.endsWith('[')) {
    beforeArray += ',';
  }

  // Formata os novos serviços com indentação
  const newServicesFormatted = newServices.map(service => {
    const lines = service.code.split('\n');
    return lines.map(line => line.trim() ? '  ' + line : line).join('\n');
  }).join(',\n');

  // Monta o conteúdo final
  const finalContent = beforeArray + '\n' + newServicesFormatted + '\n' + afterArray;

  // Salva
  fs.writeFileSync(filepath, finalContent, 'utf-8');

  return newServices.length;
}

function main() {
  const sourceFile = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services-simplified-complete.ts');
  const seedsDir = path.join(__dirname, 'digiurban', 'backend', 'prisma', 'seeds', 'services');

  console.log('================================================================================');
  console.log('ADICIONANDO SERVIÇOS FALTANTES AOS SEEDS MODULARES');
  console.log('================================================================================\n');

  // Lê o arquivo fonte
  const sourceContent = fs.readFileSync(sourceFile, 'utf-8');

  let totalAdded = 0;
  const results = [];

  // Para cada seção
  for (const [sectionName, info] of Object.entries(SECTION_TO_FILE)) {
    // Extrai serviços da seção
    const sectionContent = extractSection(sourceContent, sectionName);

    if (!sectionContent) {
      console.log(`⚠️  ${info.name}: Seção ${sectionName} não encontrada no arquivo original`);
      continue;
    }

    const sourceServices = extractIndividualServices(sectionContent);

    // Lê serviços existentes no arquivo modular
    const filepath = path.join(seedsDir, info.file);
    const existingNames = getExistingServiceNames(filepath);

    // Identifica serviços faltantes
    const missingServices = sourceServices.filter(s => !existingNames.includes(s.name));

    if (missingServices.length > 0) {
      const added = addServicesToFile(filepath, missingServices, info.export);
      totalAdded += added;

      results.push({
        name: info.name,
        before: existingNames.length,
        added: added,
        after: existingNames.length + added,
        total: sourceServices.length
      });

      console.log(`✅ ${info.name}: ${added} serviços adicionados (${existingNames.length} → ${existingNames.length + added}/${sourceServices.length})`);
    } else {
      console.log(`✓  ${info.name}: Já completo (${existingNames.length}/${sourceServices.length})`);
    }
  }

  console.log('\n================================================================================');
  console.log('RESUMO');
  console.log('================================================================================');
  console.log(`Total de serviços adicionados: ${totalAdded}`);

  if (results.length > 0) {
    console.log('\nDetalhamento:');
    results.forEach(r => {
      console.log(`  ${r.name}: ${r.before} → ${r.after}/${r.total} (+${r.added})`);
    });
  }

  console.log('================================================================================\n');
}

main();
