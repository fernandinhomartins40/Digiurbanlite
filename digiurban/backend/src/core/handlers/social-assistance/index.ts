import { moduleHandlerRegistry } from '../../module-handler';
import { SocialBenefitRequestHandler } from './benefit-request-handler';
import { SocialProgramEnrollmentHandler } from './program-enrollment-handler';
import { HomeVisitHandler } from './home-visit-handler';
import { DocumentRequestHandler } from './document-request-handler';
import { FamilyRegistrationHandler } from './family-registration-handler';

export function registerSocialAssistanceHandlers() {
  // Benefícios (Cesta Básica, Auxílios)
  moduleHandlerRegistry.register(
    'social_assistance:SocialBenefitRequest',
    new SocialBenefitRequestHandler()
  );

  // Programas Sociais (Bolsa Família, Renda Cidadã, etc)
  moduleHandlerRegistry.register(
    'social_assistance:SocialProgramEnrollment',
    new SocialProgramEnrollmentHandler()
  );

  // Visitas Domiciliares
  moduleHandlerRegistry.register(
    'social_assistance:SocialHomeVisit',
    new HomeVisitHandler()
  );

  // Documentação
  moduleHandlerRegistry.register(
    'social_assistance:DocumentRequest',
    new DocumentRequestHandler()
  );

  // Cadastro Familiar
  moduleHandlerRegistry.register(
    'social_assistance:FamilyRegistration',
    new FamilyRegistrationHandler()
  );

  console.log('✅ Social Assistance handlers registered (5 handlers)');
}

// Exportar handlers para uso direto se necessário
export { SocialBenefitRequestHandler } from './benefit-request-handler';
export { SocialProgramEnrollmentHandler } from './program-enrollment-handler';
export { HomeVisitHandler } from './home-visit-handler';
export { DocumentRequestHandler } from './document-request-handler';
export { FamilyRegistrationHandler } from './family-registration-handler';
