/**
 * ============================================================================
 * OBRAS PÚBLICAS - Index de Handlers
 * ============================================================================
 */

export { InfrastructureProblemHandler } from './infrastructure-problem-handler';
export { StreetMaintenanceHandler } from './street-maintenance-handler';
export { AccessibilityHandler } from './accessibility-handler';
export { SignageHandler } from './signage-handler';

/**
 * Registra todos os handlers de obras públicas
 */
export function registerPublicWorksHandlers() {
  console.log('✅ Public Works handlers registered');
  // Handlers são registrados automaticamente via exports
}
