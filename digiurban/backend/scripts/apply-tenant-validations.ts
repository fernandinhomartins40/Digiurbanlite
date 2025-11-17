/**
 * Script para aplicar automaticamente validações de tenant em entity handlers
 */

import * as fs from 'fs';
import * as path from 'path';

const ENTITY_HANDLERS_PATH = path.join(__dirname, '..', 'src', 'services', 'entity-handlers.ts');

// Mapeamento de campos para modelos
const VALIDATIONS_MAP: Record<string, Array<{ field: string; model: string }>> = {
  Vaccination: [{ field: 'patientId', model: 'patient' }],
  Student: [{ field: 'schoolId', model: 'school' }],
  DisciplinaryRecord: [
    { field: 'schoolId', model: 'school' },
    { field: 'studentId', model: 'student' },
  ],
  SchoolDocument: [{ field: 'studentId', model: 'student' }],
  StudentTransfer: [{ field: 'studentId', model: 'student' }],
  AttendanceRecord: [
    { field: 'schoolId', model: 'school' },
    { field: 'studentId', model: 'student' },
  ],
  GradeRecord: [
    { field: 'schoolId', model: 'school' },
    { field: 'studentId', model: 'student' },
  ],
  SchoolManagement: [{ field: 'schoolId', model: 'school' }],
  SchoolMeal: [{ field: 'schoolId', model: 'school' }],
  SocialAssistanceAttendance: [{ field: 'citizenId', model: 'citizen' }],
  VulnerableFamily: [{ field: 'citizenId', model: 'citizen' }],
  BenefitRequest: [{ field: 'familyId', model: 'vulnerableFamily' }],
  EmergencyDelivery: [{ field: 'citizenId', model: 'citizen' }],
  SocialGroupEnrollment: [{ field: 'citizenId', model: 'citizen' }],
  HomeVisit: [{ field: 'familyId', model: 'vulnerableFamily' }],
  SocialProgramEnrollment: [{ field: 'citizenId', model: 'citizen' }],
  SocialAppointment: [{ field: 'citizenId', model: 'citizen' }],
  CulturalAttendance: [{ field: 'citizenId', model: 'citizen' }],
  CulturalWorkshopEnrollment: [{ field: 'workshopId', model: 'culturalWorkshop' }],
  SportsAttendance: [{ field: 'citizenId', model: 'citizen' }],
  SportsSchoolEnrollment: [{ field: 'schoolId', model: 'school' }],
  CompetitionEnrollment: [{ field: 'competitionId', model: 'competition' }],
  TournamentEnrollment: [{ field: 'tournamentId', model: 'tournament' }],
  HousingRegistration: [{ field: 'programId', model: 'socialProgram' }],
  TourismAttendance: [{ field: 'citizenId', model: 'citizen' }],
  TreePruningRequest: [{ field: 'citizenId', model: 'citizen' }],
  SpecialCollection: [{ field: 'citizenId', model: 'citizen' }],
  WeedingRequest: [{ field: 'citizenId', model: 'citizen' }],
  DrainageRequest: [{ field: 'citizenId', model: 'citizen' }],
};

function applyValidations(): void {
  let content = fs.readFileSync(ENTITY_HANDLERS_PATH, 'utf-8');
  let modificationsCount = 0;

  for (const [handlerName, validations] of Object.entries(VALIDATIONS_MAP)) {
    // Encontrar o handler
    const handlerRegex = new RegExp(
      `(${handlerName}:\\s*async\\s*\\(ctx\\)\\s*=>\\s*\\{)([\\s\\S]*?)(\\n\\s*return\\s+ctx\\.tx)`,
      'g'
    );

    const match = handlerRegex.exec(content);
    if (!match) {
      console.log(`⚠️  Handler ${handlerName} não encontrado`);
      continue;
    }

    const handlerStart = match[1];
    const handlerBody = match[2];
    const returnStatement = match[3];

    // Verificar se já tem validações
    if (handlerBody.includes('validateTenant')) {
      console.log(`ℹ️  ${handlerName} já possui validações`);
      continue;
    }

    // Gerar código de validações
    let validationCode = '\n    // Validações de tenant para relacionamentos\n';
    for (const { field, model } of validations) {
      validationCode += `    if (ctx.formData.${field}) {\n`;
      validationCode += `      await validateTenant(ctx.tx, '${model}', ctx.formData.${field}, ctx.tenantId);\n`;
      validationCode += `    }\n`;
    }

    // Inserir validações logo após a abertura do handler
    const newHandlerBody = handlerStart + validationCode + handlerBody + returnStatement;

    content = content.replace(handlerRegex, newHandlerBody);
    modificationsCount++;

    console.log(`✅ ${handlerName} - ${validations.length} validação(ões) adicionada(s)`);
  }

  // Salvar arquivo
  fs.writeFileSync(ENTITY_HANDLERS_PATH, content, 'utf-8');

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  ✅ ${modificationsCount} handlers modificados com sucesso!`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
}

// Executar
console.log('🔧 Aplicando validações de tenant...\n');
applyValidations();
