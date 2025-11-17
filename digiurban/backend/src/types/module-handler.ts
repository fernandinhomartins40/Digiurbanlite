/**
 * Tipos para o sistema de Module Handlers
 */

export interface ModuleAction {
  type: string;           // 'education', 'health', etc
  entity: string;         // 'StudentEnrollment', 'Appointment', etc
  action: string;         // 'create', 'update', 'delete'
  data: any;              // Dados do formulário
  protocol: string;       // Número do protocolo
  serviceId: string;      // ID do serviço
       // ID do tenant
}

export interface ModuleHandlerResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
