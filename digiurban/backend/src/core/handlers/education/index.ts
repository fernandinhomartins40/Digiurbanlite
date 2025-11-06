/**
 * ============================================================================
 * EDUCAÇÃO - Handlers Core (FASE 3)
 * ============================================================================
 */

export { StudentEnrollmentHandler } from './enrollment-handler';
export { SchoolTransportHandler } from './transport-handler';
export { SchoolMealHandler } from './meal-handler';
export { SchoolMaterialHandler } from './material-handler';
export { StudentTransferHandler } from './transfer-handler';

/**
 * Registra todos os handlers de educação
 */
export function registerEducationHandlers() {
  console.log('✅ Education handlers registered');
  // Handlers são registrados automaticamente via exports
}
