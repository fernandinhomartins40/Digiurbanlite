/**
 * ============================================================================
 * TURISMO - Index de Handlers
 * ============================================================================
 */

export { TouristAttractionHandler } from './tourist-attraction-handler';
export { LocalBusinessHandler } from './local-business-handler';
export { TourismProgramHandler } from './tourism-program-handler';
export { TourismAttendanceHandler } from './tourism-attendance-handler';
export { TourismGuideHandler } from './tourism-guide-handler';
export { TourismRouteHandler } from './tourism-route-handler';
export { TourismEventHandler } from './tourism-event-handler';

/**
 * Registra todos os handlers de turismo
 */
export function registerTourismHandlers() {
  console.log('✅ Tourism handlers registered (7 módulos)');
  // Handlers são registrados automaticamente via exports
}
