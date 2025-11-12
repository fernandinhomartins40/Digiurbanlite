// ============================================================
// PUBLIC SERVICES HANDLERS - Index FASE 3
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { PublicServiceAttendanceHandlerPhase3 } from './public-service-attendance-handler-phase3';
import { PublicLightingRequestHandler } from './public-lighting-request-handler';
import { UrbanCleaningRequestHandler } from './urban-cleaning-request-handler';
import { SpecialCollectionRequestHandler } from './special-collection-request-handler';
import { WeedingRequestHandlerPhase3 } from './weeding-request-handler-phase3';
import { DrainageUnblockRequestHandler } from './drainage-unblock-request-handler';
import { TreePruningRequestHandlerPhase3 } from './tree-pruning-request-handler-phase3';

export function registerPublicServicesHandlers() {
  // ============================================================
  // FASE 3: SERVIÇOS PÚBLICOS - 7 MÓDULOS
  // ============================================================

  // 1. Atendimentos de Serviços Públicos
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:ATENDIMENTOS_SERVICOS_PUBLICOS',
    new PublicServiceAttendanceHandlerPhase3()
  );

  // 2. Iluminação Pública
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:ILUMINACAO_PUBLICA',
    new PublicLightingRequestHandler()
  );

  // 3. Limpeza Urbana
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:LIMPEZA_URBANA',
    new UrbanCleaningRequestHandler()
  );

  // 4. Coleta Especial
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:COLETA_ESPECIAL',
    new SpecialCollectionRequestHandler()
  );

  // 5. Solicitação de Capina
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:SOLICITACAO_CAPINA',
    new WeedingRequestHandlerPhase3()
  );

  // 6. Solicitação de Desobstrução
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:SOLICITACAO_DESOBSTRUCAO',
    new DrainageUnblockRequestHandler()
  );

  // 7. Solicitação de Poda
  moduleHandlerRegistry.register(
    'SERVICOS_PUBLICOS:SOLICITACAO_PODA',
    new TreePruningRequestHandlerPhase3()
  );

  console.log('✅ Public Services handlers registered (7 handlers - FASE 3 COMPLETA)');
  console.log('   - SERVICOS_PUBLICOS:ATENDIMENTOS_SERVICOS_PUBLICOS');
  console.log('   - SERVICOS_PUBLICOS:ILUMINACAO_PUBLICA');
  console.log('   - SERVICOS_PUBLICOS:LIMPEZA_URBANA');
  console.log('   - SERVICOS_PUBLICOS:COLETA_ESPECIAL');
  console.log('   - SERVICOS_PUBLICOS:SOLICITACAO_CAPINA');
  console.log('   - SERVICOS_PUBLICOS:SOLICITACAO_DESOBSTRUCAO');
  console.log('   - SERVICOS_PUBLICOS:SOLICITACAO_PODA');
}

export {
  PublicServiceAttendanceHandlerPhase3,
  PublicLightingRequestHandler,
  UrbanCleaningRequestHandler,
  SpecialCollectionRequestHandler,
  WeedingRequestHandlerPhase3,
  DrainageUnblockRequestHandler,
  TreePruningRequestHandlerPhase3
};
