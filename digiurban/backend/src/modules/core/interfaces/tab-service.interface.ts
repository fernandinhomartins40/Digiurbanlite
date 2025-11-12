/**
 * @file tab-service.interface.ts
 * @description Interface para services de abas de módulos
 * @module core/interfaces
 */

import {
  ListParams,
  ApprovalParams,
  DashboardParams,
  ManagementParams,
  PaginatedResponse,
  ApprovalItem,
  DashboardData,
  ApprovalData,
  ApprovalConfig,
  EntityConfig,
  ImportOptions,
  ImportResult,
  ExportOptions,
  ExportResult,
  AuditLog,
} from './tab-types.interface';

/**
 * Interface base para todos os services de abas
 */
export interface ITabService {
  // ============================================================================
  // CONFIGURAÇÃO DO MÓDULO
  // ============================================================================

  /**
   * Retorna o nome da entidade principal do módulo
   */
  getEntityName(): string;

  /**
   * Retorna configuração de aprovação (null se não requer)
   */
  getApprovalConfig(): ApprovalConfig | null;

  /**
   * Retorna configuração de entidades gerenciáveis
   */
  getManagementEntities(): EntityConfig[];

  /**
   * Retorna lista de KPIs disponíveis
   */
  getAvailableKPIs(): string[];

  // ============================================================================
  // ABA DE LISTAGEM
  // ============================================================================

  /**
   * Lista registros com paginação e filtros
   */
  list(params: ListParams): Promise<PaginatedResponse>;

  /**
   * Busca registro por ID
   */
  findById(id: string, include?: string[]): Promise<any>;

  /**
   * Retorna histórico de um registro
   */
  getHistory(id: string): Promise<any[]>;

  /**
   * Adiciona comentário
   */
  addComment(id: string, userId: string, comment: string, attachments?: string[]): Promise<void>;

  /**
   * Constrói cláusula WHERE baseada nos filtros
   */
  buildWhereClause(filters: any): any;

  /**
   * Constrói cláusula ORDER BY
   */
  buildOrderByClause(orderBy?: string, direction?: 'asc' | 'desc'): any;

  // ============================================================================
  // ABA DE APROVAÇÃO
  // ============================================================================

  /**
   * Retorna fila de aprovações
   */
  getApprovalQueue(params: ApprovalParams): Promise<ApprovalItem[]>;

  /**
   * Retorna detalhes para aprovação
   */
  getApprovalDetails(id: string): Promise<ApprovalItem>;

  /**
   * Processa aprovação
   */
  processApproval(id: string, userId: string, data: ApprovalData): Promise<void>;

  /**
   * Processa rejeição
   */
  processRejection(id: string, userId: string, data: ApprovalData): Promise<void>;

  /**
   * Processa solicitação de correção
   */
  processCorrection(id: string, userId: string, data: ApprovalData): Promise<void>;

  /**
   * Processa encaminhamento
   */
  processForward(id: string, userId: string, data: ApprovalData): Promise<void>;

  /**
   * Retorna checklist de aprovação
   */
  getChecklist(id: string): Promise<any>;

  /**
   * Valida se pode aprovar (permissões, etapa correta, etc)
   */
  canApprove(id: string, userId: string): Promise<boolean>;

  /**
   * Envia notificações relacionadas à aprovação
   */
  sendApprovalNotifications(id: string, action: string, userId: string): Promise<void>;

  // ============================================================================
  // ABA DE DASHBOARD
  // ============================================================================

  /**
   * Calcula KPIs
   */
  calculateKPIs(params: DashboardParams, kpis?: string[]): Promise<DashboardData['kpis']>;

  /**
   * Retorna dados de tendência
   */
  getTrendData(params: DashboardParams, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<DashboardData['trends']>;

  /**
   * Retorna dados de distribuição
   */
  getDistributionData(params: DashboardParams, groupBy: string): Promise<DashboardData['distribution']>;

  /**
   * Calcula métricas de performance
   */
  calculatePerformance(params: DashboardParams): Promise<DashboardData['performance']>;

  /**
   * Gera rankings
   */
  generateRankings(params: DashboardParams, rankBy: string): Promise<DashboardData['rankings']>;

  /**
   * Compara com período anterior
   */
  compareWithPrevious(current: any, previous: any): { change: number; trend: 'up' | 'down' | 'stable' };

  // ============================================================================
  // ABA DE GERENCIAMENTO
  // ============================================================================

  /**
   * Lista registros de uma entidade gerenciável
   */
  listManagedEntity(entityName: string, params: ManagementParams): Promise<PaginatedResponse>;

  /**
   * Cria registro em entidade gerenciável
   */
  createManagedEntity(entityName: string, data: any, userId: string): Promise<any>;

  /**
   * Atualiza registro em entidade gerenciável
   */
  updateManagedEntity(entityName: string, id: string, data: any, userId: string): Promise<any>;

  /**
   * Exclui registro de entidade gerenciável
   */
  deleteManagedEntity(entityName: string, id: string, userId: string): Promise<void>;

  /**
   * Valida dados antes de criar/atualizar
   */
  validateEntityData(entityName: string, data: any): Promise<{ valid: boolean; errors: any[] }>;

  /**
   * Importa dados de arquivo
   */
  importEntityData(options: ImportOptions, userId: string): Promise<ImportResult>;

  /**
   * Exporta dados de entidade
   */
  exportEntityData(entityName: string, options: ExportOptions): Promise<ExportResult>;

  /**
   * Retorna log de auditoria
   */
  getAuditLog(entityName: string, entityId?: string, filters?: any): Promise<AuditLog[]>;

  /**
   * Registra ação no log de auditoria
   */
  logAction(
    entity: string,
    entityId: string,
    action: 'create' | 'read' | 'update' | 'delete',
    userId: string,
    changes?: any,
  ): Promise<void>;

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  /**
   * Gera número de protocolo
   */
  generateProtocolNumber(): Promise<string>;

  /**
   * Valida permissões do usuário
   */
  checkPermission(userId: string, action: string, resourceId?: string): Promise<boolean>;

  /**
   * Retorna configurações do módulo
   */
  getConfig(): Promise<any>;

  /**
   * Atualiza configurações do módulo
   */
  updateConfig(config: any, userId: string): Promise<void>;
}
