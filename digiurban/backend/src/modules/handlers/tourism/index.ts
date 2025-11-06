/**
 * ============================================================================
 * TURISMO - Index de Handlers
 * ============================================================================
 */

export { TouristAttractionHandler } from './tourist-attraction-handler';
export { LocalBusinessHandler } from './local-business-handler';
export { TourismProgramHandler } from './tourism-program-handler';

/**
 * Registra todos os handlers de turismo
 */
export function registerTourismHandlers() {
  console.log('✅ Tourism handlers registered');
  // Handlers são registrados automaticamente via exports
}
