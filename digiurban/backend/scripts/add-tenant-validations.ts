/**
 * Script para adicionar validações de tenant em todos os entity handlers
 *
 * Este script identifica handlers que referenciam IDs de outras entidades
 * e adiciona validações usando validateTenant para garantir segurança multi-tenant
 */

import * as fs from 'fs';
import * as path from 'path';

const ENTITY_HANDLERS_PATH = path.join(__dirname, '..', 'src', 'services', 'entity-handlers.ts');

// Mapeamento de campos de ID para modelos
const ID_TO_MODEL_MAP: Record<string, string> = {
  patientId: 'patient',
  citizenId: 'citizen',
  schoolId: 'school',
  studentId: 'student',
  familyId: 'vulnerableFamily',
  producerId: 'ruralProducer',
  athleteId: 'athlete',
  facilityId: 'sportsFacility',
  unitId: 'housingUnit',
  areaId: 'protectedArea',
  businessId: 'localBusiness',
  guideId: 'tourismGuide',
  attractionId: 'touristAttraction',
  eventId: 'culturalEvent',
  projectId: 'culturalProject',
  teamId: 'sportsTeam',
  campaignId: 'healthCampaign',
  appointmentId: 'healthAppointment',
  healthFacilityId: 'healthFacility',
  doctorId: 'doctor',
  professionalId: 'healthProfessional',
  programId: 'socialProgram',
  centerId: 'socialAssistanceCenter',
  propertyId: 'ruralProperty',
  trainingId: 'ruralTraining',
  workshopId: 'culturalWorkshop',
  groupId: 'artisticGroup',
  competitionId: 'competition',
  tournamentId: 'tournament',
  modalityId: 'sportsModality',
  licenseId: 'environmentalLicense',
  inspectionId: 'environmentalInspection',
  parentId: 'patient', // para relacionamentos hierárquicos
  responsibleId: 'citizen',
};

interface ValidationRule {
  handlerName: string;
  fieldName: string;
  modelName: string;
  isRequired: boolean;
}

/**
 * Analisa o código e identifica onde adicionar validações
 */
function analyzeHandlers(): ValidationRule[] {
  const content = fs.readFileSync(ENTITY_HANDLERS_PATH, 'utf-8');
  const rules: ValidationRule[] = [];

  // Regex para encontrar handlers
  const handlerRegex = /(\w+):\s*async\s*\(ctx\)\s*=>\s*\{([^}]+)\}/g;

  let match;
  while ((match = handlerRegex.exec(content)) !== null) {
    const handlerName = match[1];
    const handlerBody = match[2];

    // Procura por campos de ID sendo usados
    for (const [fieldName, modelName] of Object.entries(ID_TO_MODEL_MAP)) {
      const fieldRegex = new RegExp(`ctx\\.formData\\.${fieldName}`, 'g');
      if (fieldRegex.test(handlerBody)) {
        // Verifica se já tem validação
        const hasValidation = handlerBody.includes(`validateTenant`) && handlerBody.includes(fieldName);

        if (!hasValidation) {
          rules.push({
            handlerName,
            fieldName,
            modelName,
            isRequired: !handlerBody.includes(`${fieldName}?`),
          });
        }
      }
    }
  }

  return rules;
}

/**
 * Gera código de validação para um campo
 */
function generateValidationCode(rule: ValidationRule): string {
  if (rule.isRequired) {
    return `
  // Validar ${rule.fieldName} pertence ao tenant
  if (ctx.formData.${rule.fieldName}) {
    await validateTenant(ctx.tx, '${rule.modelName}', ctx.formData.${rule.fieldName}, ctx.tenantId);
  }`;
  } else {
    return `
  // Validar ${rule.fieldName} pertence ao tenant (opcional)
  if (ctx.formData.${rule.fieldName}) {
    await validateTenant(ctx.tx, '${rule.modelName}', ctx.formData.${rule.fieldName}, ctx.tenantId);
  }`;
  }
}

/**
 * Gera relatório de validações a serem adicionadas
 */
function generateReport(rules: ValidationRule[]): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RELATÓRIO DE VALIDAÇÕES DE TENANT A ADICIONAR');
  console.log('═══════════════════════════════════════════════════════════\n');

  const groupedByHandler = rules.reduce((acc, rule) => {
    if (!acc[rule.handlerName]) {
      acc[rule.handlerName] = [];
    }
    acc[rule.handlerName].push(rule);
    return acc;
  }, {} as Record<string, ValidationRule[]>);

  let totalHandlers = 0;
  let totalValidations = 0;

  for (const [handlerName, handlerRules] of Object.entries(groupedByHandler)) {
    totalHandlers++;
    console.log(`\n📦 ${handlerName}`);
    console.log(`   Validações necessárias: ${handlerRules.length}`);

    for (const rule of handlerRules) {
      totalValidations++;
      const required = rule.isRequired ? '✓ obrigatório' : '○ opcional';
      console.log(`   - ${rule.fieldName} → ${rule.modelName} ${required}`);
    }
  }

  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`Total de handlers: ${totalHandlers}`);
  console.log(`Total de validações: ${totalValidations}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Gerar exemplos de código
  console.log('\n📝 EXEMPLOS DE VALIDAÇÕES A ADICIONAR:\n');

  const sampleHandler = Object.keys(groupedByHandler)[0];
  if (sampleHandler) {
    console.log(`// Exemplo para ${sampleHandler}:`);
    for (const rule of groupedByHandler[sampleHandler]) {
      console.log(generateValidationCode(rule));
    }
  }

  console.log('\n');
}

/**
 * Adiciona import do validateTenant se não existir
 */
function ensureImport(): void {
  let content = fs.readFileSync(ENTITY_HANDLERS_PATH, 'utf-8');

  if (!content.includes('validateTenant,')) {
    content = content.replace(
      /from '\.\/entity-validation-helpers';/,
      `validateTenant,\n} from './entity-validation-helpers';`
    );
    content = content.replace(
      /validateMultipleRelations,/,
      `validateMultipleRelations,\n  validateTenant,`
    );

    fs.writeFileSync(ENTITY_HANDLERS_PATH, content, 'utf-8');
    console.log('✅ Import de validateTenant adicionado');
  } else {
    console.log('ℹ️  Import de validateTenant já existe');
  }
}

// Executar análise
console.log('🔍 Analisando entity handlers...\n');
const rules = analyzeHandlers();

if (rules.length === 0) {
  console.log('✅ Todos os handlers já possuem validações de tenant adequadas!');
} else {
  ensureImport();
  generateReport(rules);

  console.log('\n💡 PRÓXIMOS PASSOS:\n');
  console.log('1. Revisar o relatório acima');
  console.log('2. Adicionar as validações manualmente ou através de outro script');
  console.log('3. Testar cada handler modificado');
  console.log('4. Executar testes de integração\n');
}
