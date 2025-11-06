import { moduleHandlerRegistry } from '../../module-handler';
import { MedicalAppointmentHandler } from './appointment-handler';
import { VaccinationHandler } from './vaccination-handler';
import { MedicationDispenseHandler } from './medication-handler';
import { MedicalExamHandler } from './exam-handler';
import { HealthProgramEnrollmentHandler } from './program-enrollment-handler';
import { HomeCareHandler } from './home-care-handler';

export function registerHealthHandlers() {
  // Consultas Médicas
  moduleHandlerRegistry.register(
    'health:MedicalAppointment',
    new MedicalAppointmentHandler()
  );

  // Vacinação
  moduleHandlerRegistry.register(
    'health:VaccinationRecord',
    new VaccinationHandler()
  );

  // Medicamentos
  moduleHandlerRegistry.register(
    'health:MedicationDispense',
    new MedicationDispenseHandler()
  );

  // Exames
  moduleHandlerRegistry.register(
    'health:MedicalExam',
    new MedicalExamHandler()
  );

  // Programas de Saúde (Hiperdia, Gestante, etc)
  moduleHandlerRegistry.register(
    'health:CampaignEnrollment',
    new HealthProgramEnrollmentHandler()
  );

  // Atendimento Domiciliar
  moduleHandlerRegistry.register(
    'health:HomeCare',
    new HomeCareHandler()
  );

  console.log('✅ Health handlers registered (6 handlers)');
}

// Exportar handlers para uso direto se necessário
export { MedicalAppointmentHandler as AppointmentHandler } from './appointment-handler';
export { VaccinationHandler } from './vaccination-handler';
export { MedicationDispenseHandler as MedicationHandler } from './medication-handler';
export { MedicalExamHandler as ExamHandler } from './exam-handler';
export { HealthProgramEnrollmentHandler } from './program-enrollment-handler';
export { HomeCareHandler } from './home-care-handler';
