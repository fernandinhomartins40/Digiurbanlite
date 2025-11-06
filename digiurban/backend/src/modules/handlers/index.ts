// ============================================================
// MODULE HANDLERS - Main Index
// ============================================================
// Este arquivo registra todos os handlers de módulos especializados

// FASE 3: Core Handlers (em src/core/handlers)
import { registerEducationHandlers } from '../../core/handlers/education';
import { registerHealthHandlers } from '../../core/handlers/health';
import { registerSocialAssistanceHandlers } from '../../core/handlers/social-assistance';

// FASE 4-7: Module Handlers (em src/modules/handlers)
import { registerCultureHandlers } from './culture';
import { registerSportHandlers } from './sports';
import { registerTourismHandlers } from './tourism';
import { registerPublicWorksHandlers } from './public-works';
import { registerPublicServicesHandlers } from './public-services';
import { registerHousingHandlers } from './housing';

// FASE 6: Handlers Ambientais
import { registerEnvironmentHandlers } from './environment';
import { registerAgricultureHandlers } from './agriculture';
import { registerUrbanPlanningHandlers } from './urban-planning';

// FASE 7: Security (em src/modules/security)
import { registerSecurityHandlers } from '../security';

export function registerAllHandlers() {
  console.log('🔄 Registering all module handlers...');

  // FASE 3: Secretarias Piloto
  registerEducationHandlers();
  registerHealthHandlers();
  registerSocialAssistanceHandlers();

  // FASE 5: Secretarias Culturais
  registerCultureHandlers();
  registerSportHandlers();
  registerTourismHandlers();

  // FASE 4: Secretarias de Infraestrutura
  registerPublicWorksHandlers();
  registerPublicServicesHandlers();
  registerHousingHandlers();

  // FASE 7: Segurança
  registerSecurityHandlers();

  // FASE 6: Secretarias Ambientais
  registerEnvironmentHandlers();
  registerAgricultureHandlers();
  registerUrbanPlanningHandlers();

  console.log('✅ All module handlers registered successfully!');
}
