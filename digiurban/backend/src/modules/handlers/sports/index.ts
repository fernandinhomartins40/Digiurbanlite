/**
 * ============================================================================
 * ESPORTE - Index de Handlers
 * ============================================================================
 */

export { SportsTeamHandler } from './sports-team-handler';
export { AthleteHandler } from './athlete-handler';
export { CompetitionHandler } from './competition-handler';

/**
 * Registra todos os handlers de esportes
 */
export function registerSportHandlers() {
  console.log('✅ Sport handlers registered');
  // Handlers são registrados automaticamente via exports
}
