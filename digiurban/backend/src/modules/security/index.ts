/**
 * Módulo de Segurança Pública - FASE 7
 *
 * Handlers especializados para serviços de segurança pública:
 * - Boletins de ocorrência
 * - Solicitações de patrulha/ronda
 * - Solicitações de câmeras/monitoramento
 * - Denúncias anônimas
 */

export { PoliceReportHandler } from './police-report-handler';
export { PatrolRequestHandler } from './patrol-request-handler';
export { CameraRequestHandler } from './camera-request-handler';
export { AnonymousTipHandler } from './anonymous-tip-handler';

// Registrar handlers no sistema
import { PoliceReportHandler } from './police-report-handler';
import { PatrolRequestHandler } from './patrol-request-handler';
import { CameraRequestHandler } from './camera-request-handler';
import { AnonymousTipHandler } from './anonymous-tip-handler';

export function registerSecurityHandlers() {
  console.log('✅ Security handlers registered');
  // Handlers são registrados automaticamente via exports
  // (PoliceReportHandler, PatrolRequestHandler, CameraRequestHandler, AnonymousTipHandler)
}
