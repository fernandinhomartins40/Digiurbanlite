/**
 * Script para adicionar índices de performance ao schema Prisma
 *
 * Adiciona índices compostos em modelos pesados para melhorar performance
 * de queries frequentes relacionadas a protocolos e módulos
 */

import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Modelos que devem receber índices de performance
const MODELS_TO_INDEX = [
  // Saúde (modelos com alto volume)
  'HealthAttendance',
  'HealthAppointment',
  'Patient',
  'MedicalRecord',
  'Vaccination',
  'MedicationDispense',

  // Educação (modelos com alto volume)
  'Student',
  'StudentEnrollment',
  'AttendanceRecord',
  'GradeRecord',
  'School',

  // Assistência Social
  'SocialAssistanceAttendance',
  'VulnerableFamily',
  'BenefitRequest',
  'SocialProgramEnrollment',

  // Agricultura
  'RuralProducer',
  'RuralProperty',
  'TechnicalAssistance',

  // Cultura
  'CulturalAttendance',
  'CulturalEvent',
  'CulturalProject',

  // Esportes
  'SportsAttendance',
  'Athlete',
  'Competition',
  'SportsSchoolEnrollment',

  // Habitação
  'HousingAttendance',
  'HousingApplication',
  'HousingUnit',

  // Meio Ambiente
  'EnvironmentalAttendance',
  'EnvironmentalLicense',
  'EnvironmentalComplaint',

  // Obras Públicas
  'PublicWorksAttendance',
  'RoadRepairRequest',

  // Planejamento Urbano
  'UrbanPlanningAttendance',
  'ProjectApproval',
  'BuildingPermit',

  // Segurança Pública
  'SecurityAttendance',
  'SecurityOccurrence',

  // Serviços Públicos
  'PublicServiceAttendance',
  'StreetLighting',

  // Turismo
  'TourismAttendance',
  'LocalBusiness',
  'TouristAttraction',

  // Core (protocolos)
  'ProtocolSimplified',
  'ProtocolStage',
  'ProtocolInteraction',
  'ProtocolDocument',
  'ProtocolPending',
];

// Índices padrão a serem adicionados se o modelo tiver os campos
const STANDARD_INDEXES = [
  // Índice em protocolId (se existir)
  {
    condition: (modelContent: string) => modelContent.includes('protocolId') && !modelContent.includes('@@index([protocolId])'),
    index: '  @@index([protocolId])',
  },
  // Índice composto tenantId + status (se existir)
  {
    condition: (modelContent: string) =>
      modelContent.includes('tenantId') &&
      modelContent.includes('status') &&
      !modelContent.includes('@@index([tenantId, status])'),
    index: '  @@index([tenantId, status])',
  },
  // Índice composto tenantId + createdAt (se existir)
  {
    condition: (modelContent: string) =>
      modelContent.includes('tenantId') &&
      modelContent.includes('createdAt') &&
      !modelContent.includes('@@index([tenantId, createdAt])'),
    index: '  @@index([tenantId, createdAt])',
  },
  // Índice composto tenantId + moduleType + status (se existir)
  {
    condition: (modelContent: string) =>
      modelContent.includes('tenantId') &&
      modelContent.includes('moduleType') &&
      modelContent.includes('status') &&
      !modelContent.includes('@@index([tenantId, moduleType, status])'),
    index: '  @@index([tenantId, moduleType, status])',
  },
];

function addIndexesToModel(modelContent: string, modelName: string): { content: string; added: number } {
  let modifiedContent = modelContent;
  let addedCount = 0;

  // Encontrar onde inserir os índices (antes do último "}")
  const lines = modifiedContent.split('\n');
  const lastBraceIndex = lines.length - 1;

  const indexesToAdd: string[] = [];

  for (const indexConfig of STANDARD_INDEXES) {
    if (indexConfig.condition(modifiedContent)) {
      indexesToAdd.push(indexConfig.index);
      addedCount++;
    }
  }

  if (indexesToAdd.length > 0) {
    // Inserir índices antes do último }
    lines.splice(lastBraceIndex, 0, ...indexesToAdd);
    modifiedContent = lines.join('\n');
  }

  return { content: modifiedContent, added: addedCount };
}

function processSchema(): void {
  let content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  let totalIndexesAdded = 0;
  const modelsModified: string[] = [];

  console.log('🔍 Analisando schema Prisma...\n');

  for (const modelName of MODELS_TO_INDEX) {
    // Encontrar o modelo no schema
    const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?\\n\\})`, 'g');
    const match = modelRegex.exec(content);

    if (!match) {
      console.log(`⚠️  Modelo ${modelName} não encontrado no schema`);
      continue;
    }

    const originalModel = match[1];
    const { content: modifiedModel, added } = addIndexesToModel(originalModel, modelName);

    if (added > 0) {
      content = content.replace(originalModel, modifiedModel);
      totalIndexesAdded += added;
      modelsModified.push(modelName);
      console.log(`✅ ${modelName} - ${added} índice(s) adicionado(s)`);
    } else {
      console.log(`ℹ️  ${modelName} - já possui todos os índices necessários`);
    }
  }

  // Salvar schema modificado
  fs.writeFileSync(SCHEMA_PATH, content, 'utf-8');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ✅ ${totalIndexesAdded} índices adicionados em ${modelsModified.length} modelos`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (modelsModified.length > 0) {
    console.log('📋 Modelos modificados:');
    for (const model of modelsModified) {
      console.log(`   - ${model}`);
    }
    console.log('\n💡 Próximo passo: Execute "npx prisma migrate dev" para criar a migration\n');
  }
}

// Executar
console.log('⚡ Adicionando índices de performance...\n');
processSchema();
