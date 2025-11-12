/**
 * @file tab-controller.interface.ts
 * @description Interface para controllers de abas de módulos
 * @module core/interfaces
 */

import {
  ListFilters,
  ApprovalFilters,
  DashboardFilters,
  ManagementFilters,
  PaginatedResponse,
  ApprovalItem,
  DashboardData,
  EntityConfig,
  ApprovalData,
  ExportOptions,
  ExportResult,
  ImportOptions,
  ImportResult,
  AuditLog,
} from './tab-types.interface';

/**
 * Interface base para todos os controllers de abas
 */
export interface ITabController {
  // ============================================================================
  // ABA DE LISTAGEM
  // ============================================================================

  /**
   * Retorna lista paginada de solicitações/registros
   */
  getListData(filters: ListFilters): Promise<PaginatedResponse>;

  /**
   * Retorna detalhes de uma solicitação específica
   */
  getRequestDetails(id: string): Promise<any>;

  /**
   * Retorna histórico de uma solicitação
   */
  getRequestHistory(id: string): Promise<any[]>;

  /**
   * Adiciona comentário a uma solicitação
   */
  addComment(id: string, comment: string, attachments?: File[]): Promise<void>;

  /**
   * Exporta dados da listagem
   */
  exportList(options: ExportOptions): Promise<ExportResult>;

  // ============================================================================
  // ABA DE APROVAÇÃO
  // ============================================================================

  /**
   * Retorna fila de aprovações pendentes
   */
  getApprovalQueue(filters: ApprovalFilters): Promise<ApprovalItem[]>;

  /**
   * Retorna detalhes para aprovação
   */
  getApprovalDetails(id: string): Promise<ApprovalItem>;

  /**
   * Aprova uma solicitação
   */
  approve(id: string, data: ApprovalData): Promise<void>;

  /**
   * Rejeita uma solicitação
   */
  reject(id: string, data: ApprovalData): Promise<void>;

  /**
   * Solicita correções
   */
  requestCorrection(id: string, data: ApprovalData): Promise<void>;

  /**
   * Encaminha para outro departamento/servidor
   */
  forward(id: string, data: ApprovalData): Promise<void>;

  /**
   * Retorna checklist de aprovação
   */
  getApprovalChecklist(id: string): Promise<any>;

  // ============================================================================
  // ABA DE DASHBOARD
  // ============================================================================

  /**
   * Retorna todos os dados do dashboard
   */
  getDashboardData(filters: DashboardFilters): Promise<DashboardData>;

  /**
   * Retorna apenas KPIs
   */
  getKPIs(filters: DashboardFilters): Promise<DashboardData['kpis']>;

  /**
   * Retorna dados de tendência
   */
  getTrends(filters: DashboardFilters, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<DashboardData['trends']>;

  /**
   * Retorna dados de distribuição
   */
  getDistribution(filters: DashboardFilters, groupBy: string): Promise<DashboardData['distribution']>;

  /**
   * Retorna métricas de performance
   */
  getPerformance(filters: DashboardFilters): Promise<DashboardData['performance']>;

  /**
   * Retorna rankings
   */
  getRankings(filters: DashboardFilters, rankBy: string): Promise<DashboardData['rankings']>;

  /**
   * Exporta dashboard
   */
  exportDashboard(options: ExportOptions): Promise<ExportResult>;

  // ============================================================================
  // ABA DE GERENCIAMENTO
  // ============================================================================

  /**
   * Retorna configuração de entidades gerenciáveis
   */
  getManagementEntities(): Promise<EntityConfig[]>;

  /**
   * Lista registros de uma entidade
   */
  listEntity(entityName: string, filters: ManagementFilters): Promise<PaginatedResponse>;

  /**
   * Cria novo registro
   */
  createEntity(entityName: string, data: any): Promise<any>;

  /**
   * Atualiza registro existente
   */
  updateEntity(entityName: string, id: string, data: any): Promise<any>;

  /**
   * Exclui/desativa registro
   */
  deleteEntity(entityName: string, id: string): Promise<void>;

  /**
   * Importa dados
   */
  importData(options: ImportOptions): Promise<ImportResult>;

  /**
   * Exporta dados de entidade
   */
  exportEntity(entityName: string, options: ExportOptions): Promise<ExportResult>;

  /**
   * Retorna log de auditoria
   */
  getAuditLog(entityName: string, entityId?: string, filters?: any): Promise<AuditLog[]>;

  /**
   * Retorna configurações do módulo
   */
  getModuleConfig(): Promise<any>;

  /**
   * Atualiza configurações do módulo
   */
  updateModuleConfig(config: any): Promise<void>;
}
