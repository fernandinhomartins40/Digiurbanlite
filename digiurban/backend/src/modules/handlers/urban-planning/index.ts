// ============================================================
// URBAN PLANNING HANDLERS - Index FASE 3
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { UrbanPlanningAttendanceHandler } from './urban-planning-attendance-handler';
import { ProjectApprovalHandler } from './project-approval-handler';
import { BuildingPermitHandlerPhase3 } from './building-permit-handler-phase3';
import { OperatingLicenseHandler } from './operating-license-handler';
import { CertificateRequestHandler } from './certificate-request-handler';
import { IllegalConstructionReportHandler } from './illegal-construction-report-handler';
import { SubdivisionRegistrationHandler } from './subdivision-registration-handler';

export function registerUrbanPlanningHandlers() {
  // ============================================================
  // FASE 3: PLANEJAMENTO URBANO - 7 MÓDULOS
  // ============================================================

  // 1. Atendimentos de Planejamento
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:ATENDIMENTOS_PLANEJAMENTO',
    new UrbanPlanningAttendanceHandler()
  );

  // 2. Aprovação de Projeto Arquitetônico
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:APROVACAO_PROJETO',
    new ProjectApprovalHandler()
  );

  // 3. Alvará de Construção
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:ALVARA_CONSTRUCAO',
    new BuildingPermitHandlerPhase3()
  );

  // 4. Alvará de Funcionamento
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:ALVARA_FUNCIONAMENTO',
    new OperatingLicenseHandler()
  );

  // 5. Solicitação de Certidão
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:SOLICITACAO_CERTIDAO',
    new CertificateRequestHandler()
  );

  // 6. Denúncia de Construção Irregular
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:DENUNCIA_CONSTRUCAO_IRREGULAR',
    new IllegalConstructionReportHandler()
  );

  // 7. Cadastro de Loteamento
  moduleHandlerRegistry.register(
    'PLANEJAMENTO:CADASTRO_LOTEAMENTO',
    new SubdivisionRegistrationHandler()
  );

  console.log('✅ Urban Planning handlers registered (7 handlers - FASE 3 COMPLETA)');
  console.log('   - PLANEJAMENTO:ATENDIMENTOS_PLANEJAMENTO');
  console.log('   - PLANEJAMENTO:APROVACAO_PROJETO');
  console.log('   - PLANEJAMENTO:ALVARA_CONSTRUCAO');
  console.log('   - PLANEJAMENTO:ALVARA_FUNCIONAMENTO');
  console.log('   - PLANEJAMENTO:SOLICITACAO_CERTIDAO');
  console.log('   - PLANEJAMENTO:DENUNCIA_CONSTRUCAO_IRREGULAR');
  console.log('   - PLANEJAMENTO:CADASTRO_LOTEAMENTO');
}

export {
  UrbanPlanningAttendanceHandler,
  ProjectApprovalHandler,
  BuildingPermitHandlerPhase3,
  OperatingLicenseHandler,
  CertificateRequestHandler,
  IllegalConstructionReportHandler,
  SubdivisionRegistrationHandler
};
