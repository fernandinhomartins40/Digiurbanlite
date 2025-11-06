// ============================================================
// AGRICULTURE HANDLERS - Index
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { TechnicalAssistanceHandler } from './technical-assistance-handler';
import { SeedDistributionHandler } from './seed-distribution-handler';
import { SoilAnalysisHandler } from './soil-analysis-handler';
import { FarmerMarketRegistrationHandler } from './farmer-market-handler';
import { RuralProducerHandler } from './rural-producer-handler';

export function registerAgricultureHandlers() {
  // ============================================================
  // HANDLERS ALINHADOS COM MODULE_MAPPING
  // Padrão: SECRETARIA:TIPO_MODULO (ex: AGRICULTURA:CADASTRO_PRODUTOR)
  // ============================================================

  // Cadastro de Produtor Rural
  moduleHandlerRegistry.register(
    'AGRICULTURA:CADASTRO_PRODUTOR',
    new RuralProducerHandler()
  );

  // Assistência Técnica
  moduleHandlerRegistry.register(
    'AGRICULTURA:ASSISTENCIA_TECNICA',
    new TechnicalAssistanceHandler()
  );

  // NOTA: Handlers abaixo não estão em MODULE_MAPPING
  // Manter código mas não registrar (deixar para fase futura)
  // - SeedDistributionHandler (Distribuição de Sementes)
  // - SoilAnalysisHandler (Análise de Solo)
  // - FarmerMarketRegistrationHandler (Feira do Produtor)

  console.log('✅ Agriculture handlers registered (2 active)');
  console.log('   - AGRICULTURA:CADASTRO_PRODUTOR');
  console.log('   - AGRICULTURA:ASSISTENCIA_TECNICA');
}

export {
  RuralProducerHandler,
  TechnicalAssistanceHandler,
  SeedDistributionHandler,
  SoilAnalysisHandler,
  FarmerMarketRegistrationHandler
};
