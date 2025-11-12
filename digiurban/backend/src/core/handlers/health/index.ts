/**
 * ============================================================================
 * SAÚDE - Handlers Core (FASE 2)
 * ============================================================================
 *
 * Total de serviços: 11 módulos COM_DADOS
 * Sistema: Registry automático
 */

import { registerHandler } from '../../../modules/handlers/registry';
import { MedicalAppointmentHandler } from './appointment-handler';
import { VaccinationHandler } from './vaccination-handler';
import { MedicationDispenseHandler } from './medication-handler';
import { MedicalExamHandler } from './exam-handler';
import { HealthProgramEnrollmentHandler } from './program-enrollment-handler';
import { HomeCareHandler } from './home-care-handler';
import { TFDHandler } from './tfd-handler';
import { PatientTransportHandler } from './patient-transport-handler';
import { PatientRegistrationHandler } from './patient-registration-handler';
import { ACSHandler } from './acs-handler';

export function registerHealthHandlers() {
  console.log('📦 Registering Health handlers...');

  // 1. ATENDIMENTOS_SAUDE
  registerHandler(
    'ATENDIMENTOS_SAUDE',
    new MedicalAppointmentHandler()
  );

  // 2. AGENDAMENTOS_MEDICOS
  registerHandler(
    'AGENDAMENTOS_MEDICOS',
    new MedicalAppointmentHandler()
  );

  // 3. CONTROLE_MEDICAMENTOS
  registerHandler(
    'CONTROLE_MEDICAMENTOS',
    new MedicationDispenseHandler()
  );

  // 4. CAMPANHAS_SAUDE
  registerHandler(
    'CAMPANHAS_SAUDE',
    new HealthProgramEnrollmentHandler()
  );

  // 5. PROGRAMAS_SAUDE
  registerHandler(
    'PROGRAMAS_SAUDE',
    new HealthProgramEnrollmentHandler()
  );

  // 6. EXAMES
  registerHandler(
    'EXAMES',
    new MedicalExamHandler()
  );

  // 7. VACINACAO
  registerHandler(
    'VACINACAO',
    new VaccinationHandler()
  );

  // 8. ATENDIMENTO_DOMICILIAR
  registerHandler(
    'ATENDIMENTO_DOMICILIAR',
    new HomeCareHandler()
  );

  // 9. ENCAMINHAMENTOS_TFD
  registerHandler(
    'ENCAMINHAMENTOS_TFD',
    new TFDHandler()
  );

  // 10. TRANSPORTE_PACIENTES
  registerHandler(
    'TRANSPORTE_PACIENTES',
    new PatientTransportHandler()
  );

  // 11. CADASTRO_PACIENTE
  registerHandler(
    'CADASTRO_PACIENTE',
    new PatientRegistrationHandler()
  );

  // 12. GESTAO_ACS
  registerHandler(
    'GESTAO_ACS',
    new ACSHandler()
  );

  console.log('✅ Health handlers registered (12 handlers)');
}

// Exportar handlers para uso direto se necessário
export { MedicalAppointmentHandler as AppointmentHandler } from './appointment-handler';
export { VaccinationHandler } from './vaccination-handler';
export { MedicationDispenseHandler as MedicationHandler } from './medication-handler';
export { MedicalExamHandler as ExamHandler } from './exam-handler';
export { HealthProgramEnrollmentHandler } from './program-enrollment-handler';
export { HomeCareHandler } from './home-care-handler';
