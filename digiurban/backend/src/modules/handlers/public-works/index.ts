// ============================================================
// PUBLIC WORKS HANDLERS - Index FASE 3
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { PublicWorksAttendanceHandlerPhase3 } from './public-works-attendance-handler-phase3';
import { RoadRepairRequestHandlerPhase3 } from './road-repair-request-handler-phase3';
import { TechnicalInspectionHandlerPhase3 } from './technical-inspection-handler-phase3';
import { PublicWorkRegistrationHandler } from './public-work-registration-handler';
import { WorkInspectionHandlerPhase3 } from './work-inspection-handler-phase3';

export function registerPublicWorksHandlers() {
  // ============================================================
  // FASE 3: OBRAS PÚBLICAS - 5 MÓDULOS
  // ============================================================

  // 1. Atendimentos de Obras
  moduleHandlerRegistry.register(
    'OBRAS:ATENDIMENTOS_OBRAS',
    new PublicWorksAttendanceHandlerPhase3()
  );

  // 2. Solicitação de Reparo de Via
  moduleHandlerRegistry.register(
    'OBRAS:SOLICITACAO_REPARO_VIA',
    new RoadRepairRequestHandlerPhase3()
  );

  // 3. Vistoria Técnica de Obras
  moduleHandlerRegistry.register(
    'OBRAS:VISTORIA_TECNICA_OBRAS',
    new TechnicalInspectionHandlerPhase3()
  );

  // 4. Cadastro de Obra Pública
  moduleHandlerRegistry.register(
    'OBRAS:CADASTRO_OBRA_PUBLICA',
    new PublicWorkRegistrationHandler()
  );

  // 5. Inspeção de Obra
  moduleHandlerRegistry.register(
    'OBRAS:INSPECAO_OBRA',
    new WorkInspectionHandlerPhase3()
  );

  console.log('✅ Public Works handlers registered (5 handlers - FASE 3 COMPLETA)');
  console.log('   - OBRAS:ATENDIMENTOS_OBRAS');
  console.log('   - OBRAS:SOLICITACAO_REPARO_VIA');
  console.log('   - OBRAS:VISTORIA_TECNICA_OBRAS');
  console.log('   - OBRAS:CADASTRO_OBRA_PUBLICA');
  console.log('   - OBRAS:INSPECAO_OBRA');
}

export {
  PublicWorksAttendanceHandlerPhase3,
  RoadRepairRequestHandlerPhase3,
  TechnicalInspectionHandlerPhase3,
  PublicWorkRegistrationHandler,
  WorkInspectionHandlerPhase3
};
