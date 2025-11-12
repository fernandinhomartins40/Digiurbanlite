/**
 * ============================================================================
 * CULTURA - Index de Handlers
 * ============================================================================
 */

export { CulturalSpaceHandler } from './cultural-space-handler';
export { CulturalProjectHandler } from './cultural-project-handler';
export { CulturalEventHandler } from './cultural-event-handler';
export { CulturalWorkshopHandler } from './cultural-workshop-handler';
export { CulturalAttendanceHandler } from './cultural-attendance-handler';
export { CulturalManifestationHandler } from './cultural-manifestation-handler';
export { ArtisticGroupHandler } from './artistic-group-handler';

/**
 * Registra todos os handlers de cultura
 */
export function registerCultureHandlers() {
  console.log('✅ Culture handlers registered (8 módulos)');
  // Handlers são registrados automaticamente via exports
}
