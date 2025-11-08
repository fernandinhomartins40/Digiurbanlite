/**
 * ============================================================================
 * ASSISTÊNCIA SOCIAL - Handlers Core (FASE 2)
 * ============================================================================
 *
 * Total de serviços: 9 módulos COM_DADOS
 * Sistema: Registry automático
 */

import { registerHandler } from '../../../modules/handlers/registry';
import { SocialBenefitRequestHandler } from './benefit-request-handler';
import { SocialProgramEnrollmentHandler } from './program-enrollment-handler';
import { HomeVisitHandler } from './home-visit-handler';
import { DocumentRequestHandler } from './document-request-handler';
import { FamilyRegistrationHandler } from './family-registration-handler';
import { SocialAttendanceHandler } from './attendance-handler';
import { SocialAppointmentHandler } from './appointment-handler';
import { SocialEquipmentHandler } from './equipment-handler';

export function registerSocialAssistanceHandlers() {
  console.log('📦 Registering Social Assistance handlers...');

  // 1. ATENDIMENTOS_ASSISTENCIA_SOCIAL
  registerHandler(
    'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    new SocialAttendanceHandler()
  );

  // 2. CADASTRO_UNICO (CadÚnico)
  registerHandler(
    'CADASTRO_UNICO',
    new FamilyRegistrationHandler()
  );

  // 3. SOLICITACAO_BENEFICIO
  registerHandler(
    'SOLICITACAO_BENEFICIO',
    new SocialBenefitRequestHandler()
  );

  // 4. ENTREGA_EMERGENCIAL
  registerHandler(
    'ENTREGA_EMERGENCIAL',
    new SocialBenefitRequestHandler()
  );

  // 5. INSCRICAO_GRUPO_OFICINA
  registerHandler(
    'INSCRICAO_GRUPO_OFICINA',
    new SocialProgramEnrollmentHandler()
  );

  // 6. VISITAS_DOMICILIARES
  registerHandler(
    'VISITAS_DOMICILIARES',
    new HomeVisitHandler()
  );

  // 7. INSCRICAO_PROGRAMA_SOCIAL
  registerHandler(
    'INSCRICAO_PROGRAMA_SOCIAL',
    new SocialProgramEnrollmentHandler()
  );

  // 8. AGENDAMENTO_ATENDIMENTO_SOCIAL
  registerHandler(
    'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    new SocialAppointmentHandler()
  );

  // 9. GESTAO_CRAS_CREAS
  registerHandler(
    'GESTAO_CRAS_CREAS',
    new SocialEquipmentHandler()
  );

  // Handler de Documentos
  registerHandler(
    'SOLICITACAO_DOCUMENTO_SOCIAL',
    new DocumentRequestHandler()
  );

  console.log('✅ Social Assistance handlers registered (10 handlers)');
}

// Exportar handlers para uso direto se necessário
export { SocialBenefitRequestHandler } from './benefit-request-handler';
export { SocialProgramEnrollmentHandler } from './program-enrollment-handler';
export { HomeVisitHandler } from './home-visit-handler';
export { DocumentRequestHandler } from './document-request-handler';
export { FamilyRegistrationHandler } from './family-registration-handler';
