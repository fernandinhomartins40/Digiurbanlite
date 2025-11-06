/**
 * ============================================================================
 * CULTURA - Index de Handlers
 * ============================================================================
 */

export { CulturalSpaceHandler } from './cultural-space-handler';
export { CulturalProjectHandler } from './cultural-project-handler';
export { CulturalEventHandler } from './cultural-event-handler';
export { CulturalWorkshopHandler } from './cultural-workshop-handler';

/**
 * Registra todos os handlers de cultura
 */
export function registerCultureHandlers() {
  console.log('✅ Culture handlers registered');
  // Handlers são registrados automaticamente via exports
}
