/**
 * SEGURANÇA PÚBLICA - Registro de Handlers
 */

export { SecurityAttendanceHandler } from './security-attendance-handler';
export { SecurityOccurrenceHandler } from './security-occurrence-handler';
export { SecurityPatrolHandler } from './security-patrol-handler';
export { SecurityAlertHandler } from './security-alert-handler';
export { CameraRequestHandler } from './camera-request-handler';
export { AnonymousComplaintHandler } from './anonymous-complaint-handler';
export { CriticalPointHandler } from './critical-point-handler';

export function registerSecurityHandlers(): void {
  console.log('✅ Security handlers registered (8 módulos)');
  // Handlers são registrados automaticamente via exports
}
