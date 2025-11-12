// ============================================================
// AGRICULTURE HANDLERS - Index
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { TechnicalAssistanceHandler } from './technical-assistance-handler';
import { SeedDistributionHandler } from './seed-distribution-handler';
import { SoilAnalysisHandler } from './soil-analysis-handler';
import { FarmerMarketRegistrationHandler } from './farmer-market-handler';
import { RuralProducerHandler } from './rural-producer-handler';
import { AgricultureAttendanceHandler } from './agriculture-attendance-handler';
import { RuralTrainingEnrollmentHandler } from './rural-course-handler';
import { RuralProgramEnrollmentHandler } from './rural-program-handler';
import { RuralPropertyHandler } from './rural-property-handler';

export function registerAgricultureHandlers() {
  // ============================================================
  // HANDLERS ALINHADOS COM MODULE_MAPPING - FASE 1 COMPLETA
  // Padrão: SECRETARIA:TIPO_MODULO (ex: AGRICULTURA:CADASTRO_PRODUTOR)
  // ============================================================

  // 1. Cadastro de Produtor Rural
  moduleHandlerRegistry.register(
    'AGRICULTURA:CADASTRO_PRODUTOR',
    new RuralProducerHandler()
  );

  // 2. Assistência Técnica
  moduleHandlerRegistry.register(
    'AGRICULTURA:ASSISTENCIA_TECNICA',
    new TechnicalAssistanceHandler()
  );

  // 3. Atendimentos Agricultura
  moduleHandlerRegistry.register(
    'AGRICULTURA:ATENDIMENTOS_AGRICULTURA',
    new AgricultureAttendanceHandler()
  );

  // 4. Inscrição em Curso Rural
  moduleHandlerRegistry.register(
    'AGRICULTURA:INSCRICAO_CURSO_RURAL',
    new RuralTrainingEnrollmentHandler()
  );

  // 5. Inscrição em Programa Rural
  moduleHandlerRegistry.register(
    'AGRICULTURA:INSCRICAO_PROGRAMA_RURAL',
    new RuralProgramEnrollmentHandler()
  );

  // 6. Cadastro de Propriedade Rural
  moduleHandlerRegistry.register(
    'AGRICULTURA:CADASTRO_PROPRIEDADE_RURAL',
    new RuralPropertyHandler()
  );

  console.log('✅ Agriculture handlers registered (6 handlers - FASE 1 COMPLETA)');
  console.log('   - AGRICULTURA:CADASTRO_PRODUTOR');
  console.log('   - AGRICULTURA:ASSISTENCIA_TECNICA');
  console.log('   - AGRICULTURA:ATENDIMENTOS_AGRICULTURA');
  console.log('   - AGRICULTURA:INSCRICAO_CURSO_RURAL');
  console.log('   - AGRICULTURA:INSCRICAO_PROGRAMA_RURAL');
  console.log('   - AGRICULTURA:CADASTRO_PROPRIEDADE_RURAL');
}

export {
  RuralProducerHandler,
  TechnicalAssistanceHandler,
  AgricultureAttendanceHandler,
  RuralTrainingEnrollmentHandler,
  RuralProgramEnrollmentHandler,
  RuralPropertyHandler,
  // Handlers futuros (não registrados)
  SeedDistributionHandler,
  SoilAnalysisHandler,
  FarmerMarketRegistrationHandler
};
