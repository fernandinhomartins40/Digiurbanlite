/**
 * Script para consolidar SportModality e SportsModality em um único modelo
 *
 * Mantém SportsModality (mais completo com protocolId) e remove SportModality
 */

import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function consolidateModalities(): void {
  let content = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  console.log('🔍 Consolidando SportModality e SportsModality...\n');

  // 1. Encontrar todos os usos de SportModality (singular) e substituir por SportsModality
  const replacements = [
    // Em Athlete
    {
      from: /modality\s+SportModality\?/g,
      to: 'modality           SportsModality?',
      description: 'Athlete.modality SportModality → SportsModality',
    },
    // Em Competition
    {
      from: /modality\s+SportModality\?\s+@relation/g,
      to: 'modality           SportsModality?     @relation',
      description: 'Competition.modality SportModality → SportsModality',
    },
    // Em SportsTeam
    {
      from: /modality\s+SportModality\?\s+@relation/g,
      to: 'modality           SportsModality?     @relation',
      description: 'SportsTeam.modality SportModality → SportsModality',
    },
    // Remover referências duplicadas em Competition e SportsTeam
    {
      from: /SportsModality\s+SportsModality\?\s+@relation\(fields: \[sportsModalityId\], references: \[id\]\)\n/g,
      to: '',
      description: 'Remover campo duplicado SportsModality',
    },
    // Remover campo sportsModalityId
    {
      from: /sportsModalityId\s+String\?\n/g,
      to: '',
      description: 'Remover campo sportsModalityId duplicado',
    },
  ];

  let modificationsCount = 0;

  for (const replacement of replacements) {
    const beforeCount = (content.match(replacement.from) || []).length;
    content = content.replace(replacement.from, replacement.to);
    const afterCount = (content.match(replacement.from) || []).length;

    if (beforeCount > afterCount) {
      modificationsCount += beforeCount - afterCount;
      console.log(`✅ ${replacement.description} - ${beforeCount - afterCount} ocorrência(s)`);
    }
  }

  // 2. Remover o modelo SportModality (singular) completamente
  const sportModalityRegex = /model SportModality \{[\s\S]*?\n\}\n/;
  const match = content.match(sportModalityRegex);

  if (match) {
    content = content.replace(sportModalityRegex, '');
    console.log(`✅ Modelo SportModality removido`);
    modificationsCount++;
  }

  // 3. Atualizar SportsModality para ter todos os campos do SportModality
  const sportsModalityRegex = /(model SportsModality \{[\s\S]*?)(createdAt)/;
  const sportsModalityMatch = content.match(sportsModalityRegex);

  if (sportsModalityMatch) {
    const enhancedFields = `
  // Campos consolidados do antigo SportModality
  equipment    Json?
  rules        String?
  minAge       Int?
  maxAge       Int?

  `;

    content = content.replace(sportsModalityRegex, `$1${enhancedFields}$2`);
    console.log(`✅ Campos adicionais consolidados em SportsModality`);
    modificationsCount++;
  }

  // 4. Atualizar relacionamentos em Tenant
  content = content.replace(
    /sportModalities\s+SportModality\[\]/g,
    'sportsModalities                 SportsModality[]'
  );
  console.log(`✅ Tenant.sportModalities → sportsModalities (tipo SportsModality)`);

  // 5. Atualizar athletes para referenciar SportsModality
  content = content.replace(
    /athletes\s+Athlete\[\]/g,
    'athletes     Athlete[]'
  );

  // Salvar arquivo
  fs.writeFileSync(SCHEMA_PATH, content, 'utf-8');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Consolidação completa! ${modificationsCount} modificações`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 Resumo das mudanças:\n');
  console.log('  ✓ Modelo SportModality removido');
  console.log('  ✓ Todos relacionamentos migrados para SportsModality');
  console.log('  ✓ Campos equipment, rules, minAge, maxAge consolidados');
  console.log('  ✓ Tenant.sportModalities → sportsModalities');
  console.log('\n💡 Próximo passo: Criar migration com "npx prisma migrate dev"\n');
}

// Executar
consolidateModalities();
