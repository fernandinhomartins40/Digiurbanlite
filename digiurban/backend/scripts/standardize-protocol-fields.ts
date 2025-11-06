/**
 * Script para padronizar campos protocol → protocolId no schema.prisma
 * Converte "protocol String @unique" para "protocolId + relation"
 */

import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');

// Modelos que precisam ser convertidos (baseado na auditoria)
const MODELS_TO_CONVERT = [
  'CulturalAttendance',
  'SportsAttendance',
  'HealthAttendance',
  'HousingAttendance',
  'SecurityOccurrence',
  'SecurityAttendance',
  'TourismAttendance',
  'EnvironmentalComplaint',
  'EnvironmentalAttendance',
  'TechnicalAssistance',
  'AgricultureAttendance',
  'HousingApplication',
  'LandRegularization',
  'RentAssistance',
  'SocialAssistanceAttendance',
  'WorkInspection',
  'PublicWorksAttendance',
  'RoadRepairRequest',
  'TechnicalInspection',
  'UrbanPlanningAttendance',
];

function convertProtocolField(content: string): string {
  let result = content;
  let conversions = 0;

  for (const modelName of MODELS_TO_CONVERT) {
    // Regex para encontrar o modelo e seu campo protocol
    const modelRegex = new RegExp(
      `(model ${modelName} \\{[\\s\\S]*?)protocol\\s+String\\s+@unique([\\s\\S]*?)(\\n\\s*@@|\\n})`,
      'gm'
    );

    result = result.replace(modelRegex, (match, before, after, ending) => {
      // Verifica se já foi convertido
      if (before.includes('protocolId')) {
        console.log(`⏭️  ${modelName}: já convertido`);
        return match;
      }

      conversions++;
      console.log(`✅ Convertendo ${modelName}...`);

      // Remove o campo protocol antigo e adiciona protocolId + relation
      const replacement =
        `${before}protocolId String? @unique${after}` +
        `\n  protocol ProtocolSimplified? @relation("${modelName}Protocol", fields: [protocolId], references: [id])` +
        `${ending}`;

      return replacement;
    });
  }

  return result;
}

function applyStandardization() {
  console.log('🔧 Iniciando padronização de campos protocol no schema.prisma...\n');

  // Ler schema
  const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Criar backup
  const backupPath = SCHEMA_PATH + '.before-protocol-standardization';
  fs.writeFileSync(backupPath, content, 'utf-8');
  console.log(`📦 Backup criado em: ${backupPath}\n`);

  // Aplicar conversões
  const newContent = convertProtocolField(content);

  // Salvar
  fs.writeFileSync(SCHEMA_PATH, newContent, 'utf-8');

  console.log('\n✅ Padronização concluída!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Revisar as mudanças no schema.prisma');
  console.log('2. Executar: npx prisma format');
  console.log('3. Executar: npx prisma migrate dev --name standardize_protocol_fields');
  console.log('4. Verificar se a migration foi gerada corretamente');
}

// Executar
applyStandardization();
