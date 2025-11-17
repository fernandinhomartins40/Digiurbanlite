/**
 * Script para corrigir validações em entity-handlers.ts
 * Remove CPFs fake e adiciona validações padronizadas
 */

import fs from 'fs';
import path from 'path';

const ENTITY_HANDLERS_PATH = path.join(__dirname, '../src/services/entity-handlers.ts');

// Padrões a serem removidos/corrigidos
const FAKE_CPF_PATTERNS = [
  /\|\| '000\.000\.000-00'/g,
  /: ctx\.formData\.\w+ \|\| '000\.000\.000-00'/g,
];

// Substituições específicas para cada handler problemático
const SPECIFIC_FIXES = [
  {
    // HealthAppointment
    find: `patientCpf: ctx.formData.patientCpf || '000.000.000-00',`,
    replace: `patientCpf: validateCPF(ctx.formData.patientCpf, 'CPF do paciente'),`,
  },
  {
    // MedicationDispense
    find: `patientCpf: ctx.formData.patientCpf || '000.000.000-00',`,
    replace: `patientCpf: validateCPF(ctx.formData.patientCpf, 'CPF do paciente'),`,
  },
  {
    // HealthExam
    find: `patientCpf: ctx.formData.patientCpf || '000.000.000-00',`,
    replace: `patientCpf: validateCPF(ctx.formData.patientCpf, 'CPF do paciente'),`,
  },
  {
    // HealthTransportRequest
    find: `patientCpf: ctx.formData.patientCpf || '000.000.000-00',`,
    replace: `patientCpf: validateCPF(ctx.formData.patientCpf, 'CPF do paciente'),`,
  },
  {
    // Patient - caso especial
    find: `cpf: ctx.formData.cpf || ctx.formData.patientCpf || '000.000.000-00',`,
    replace: `cpf: validateCPF(ctx.formData.cpf || ctx.formData.patientCpf, 'CPF'),`,
  },
  {
    // CommunityHealthAgent
    find: `cpf: ctx.formData.cpf || '000.000.000-00',`,
    replace: `cpf: validateCPF(ctx.formData.cpf, 'CPF'),`,
  },
  {
    // EducationAttendance
    find: `citizenCpf: ctx.formData.citizenCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `citizenCpf: validateCPF(ctx.formData.citizenCpf || ctx.formData.cpf, 'CPF do cidadão'),`,
  },
  {
    // SocialAssistanceAttendance
    find: `citizenCpf: ctx.formData.citizenCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `citizenCpf: validateCPF(ctx.formData.citizenCpf || ctx.formData.cpf, 'CPF do cidadão'),`,
  },
  {
    // RuralProducer
    find: `producerCpf: ctx.formData.producerCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `producerCpf: validateCPF(ctx.formData.producerCpf || ctx.formData.cpf, 'CPF do produtor'),`,
  },
  {
    // AgricultureAttendance
    find: `producerCpf: ctx.formData.producerCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `producerCpf: validateCPF(ctx.formData.producerCpf || ctx.formData.cpf, 'CPF do produtor'),`,
  },
  {
    // CulturalAttendance
    find: `cpf: ctx.formData.cpf || '000.000.000-00',`,
    replace: `cpf: validateCPF(ctx.formData.cpf, 'CPF'),`,
  },
  {
    // SportsAttendance
    find: `cpf: ctx.formData.cpf || '000.000.000-00',`,
    replace: `cpf: validateCPF(ctx.formData.cpf, 'CPF'),`,
  },
  {
    // Athlete
    find: `cpf: ctx.formData.cpf || '000.000.000-00',`,
    replace: `cpf: validateCPF(ctx.formData.cpf, 'CPF do atleta'),`,
  },
  {
    // EnvironmentalAttendance
    find: `citizenCPF: ctx.formData.citizenCPF || ctx.formData.citizenCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `citizenCPF: validateCPF(ctx.formData.citizenCPF || ctx.formData.citizenCpf || ctx.formData.cpf, 'CPF do cidadão'),`,
  },
  {
    // HousingAttendance
    find: `applicantCpf: ctx.formData.applicantCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `applicantCpf: validateCPF(ctx.formData.applicantCpf || ctx.formData.cpf, 'CPF do solicitante'),`,
  },
  {
    // HousingApplication
    find: `applicantCpf: ctx.formData.applicantCpf || ctx.formData.ownerCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `applicantCpf: validateCPF(ctx.formData.applicantCpf || ctx.formData.ownerCpf || ctx.formData.cpf, 'CPF do solicitante'),`,
  },
  {
    // LandRegularization
    find: `applicantCpf: ctx.formData.applicantCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `applicantCpf: validateCPF(ctx.formData.applicantCpf || ctx.formData.cpf, 'CPF do solicitante'),`,
  },
  {
    // HousingRegistration
    find: `familyHeadCPF: ctx.formData.familyHeadCPF || ctx.formData.citizenCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `familyHeadCPF: validateCPF(ctx.formData.familyHeadCPF || ctx.formData.citizenCpf || ctx.formData.cpf, 'CPF do chefe de família'),`,
  },
  {
    // PublicWorksAttendance
    find: `applicantCpf: ctx.formData.applicantCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `applicantCpf: validateCPF(ctx.formData.applicantCpf || ctx.formData.cpf, 'CPF do solicitante'),`,
  },
  {
    // UrbanPlanningAttendance
    find: `applicantCpf: ctx.formData.applicantCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `applicantCpf: validateCPF(ctx.formData.applicantCpf || ctx.formData.cpf, 'CPF do solicitante'),`,
  },
  {
    // SecurityAttendance
    find: `applicantCpfCnpj: ctx.formData.applicantCpfCnpj || ctx.formData.cpf || ctx.formData.cnpj || '000.000.000-00',`,
    replace: `applicantCpfCnpj: ctx.formData.applicantCpfCnpj || ctx.formData.cpf || ctx.formData.cnpj,`,
  },
  {
    // PublicServiceAttendance
    find: `applicantCpfCnpj: ctx.formData.applicantCpfCnpj || ctx.formData.applicantCpf || ctx.formData.cpf || '000.000.000-00',`,
    replace: `applicantCpfCnpj: ctx.formData.applicantCpfCnpj || ctx.formData.applicantCpf || ctx.formData.cpf,`,
  },
];

function applyFixes() {
  console.log('🔧 Iniciando correções em entity-handlers.ts...');

  let content = fs.readFileSync(ENTITY_HANDLERS_PATH, 'utf-8');

  // Aplicar cada correção específica
  let fixCount = 0;
  for (const fix of SPECIFIC_FIXES) {
    if (content.includes(fix.find)) {
      content = content.replace(fix.find, fix.replace);
      fixCount++;
      console.log(`✅ Aplicada correção ${fixCount}: ${fix.find.substring(0, 50)}...`);
    }
  }

  // Salvar arquivo
  fs.writeFileSync(ENTITY_HANDLERS_PATH, content, 'utf-8');

  console.log(`\n✅ Total de correções aplicadas: ${fixCount}`);
  console.log('✅ Arquivo atualizado com sucesso!');
}

// Executar
applyFixes();
