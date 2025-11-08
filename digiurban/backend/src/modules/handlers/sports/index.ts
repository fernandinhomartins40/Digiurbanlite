/**
 * ============================================================================
 * ESPORTE - Index de Handlers
 * ============================================================================
 */

export { SportsTeamHandler } from './sports-team-handler';
export { AthleteHandler } from './athlete-handler';
export { CompetitionHandler } from './competition-handler';
export { SportsAttendanceHandler } from './sports-attendance-handler';
export { SportsSchoolHandler } from './sports-school-handler';
export { SportsReservationHandler } from './sports-reservation-handler';
export { SportsModalityHandler } from './sports-modality-handler';
export { SportsTournamentHandler } from './sports-tournament-handler';

/**
 * Registra todos os handlers de esportes
 */
export function registerSportHandlers() {
  console.log('✅ Sport handlers registered (8 módulos)');
  // Handlers são registrados automaticamente via exports
}
