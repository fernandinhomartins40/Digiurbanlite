/**
 * @file base-tab.controller.ts
 * @description Controller base abstrato para todos os módulos com sistema de abas
 * @module core/base
 */

import { Request, Response } from 'express';
import {
  ITabController,
  ITabService,
  ListFilters,
  ApprovalFilters,
  DashboardFilters,
  ManagementFilters,
  ExportOptions,
  ExportResult,
  ImportOptions,
} from '../interfaces';

/**
 * Controller base abstrato que implementa endpoints padrão para todos os módulos
 */
export abstract class BaseTabController implements ITabController {
  constructor(protected readonly service: ITabService) {}

  // ============================================================================
  // ABA DE LISTAGEM
  // ============================================================================

  async getListData(filters: ListFilters) {
    return this.service.list({ filters });
  }

  async getRequestDetails(id: string) {
    return this.service.findById(id, ['citizen', 'attachments', 'department']);
  }

  async getRequestHistory(id: string) {
    return this.service.getHistory(id);
  }

  async addComment(id: string, comment: string, attachments?: File[]) {
    // TODO: Extrair userId do request
    const userId = 'current-user-id';
    const attachmentPaths = attachments?.map((f) => f.name) || [];
    await this.service.addComment(id, userId, comment, attachmentPaths);
  }

  async exportList(options: ExportOptions) {
    return this.service.exportEntityData(this.service.getEntityName(), options);
  }

  // ============================================================================
  // ABA DE APROVAÇÃO
  // ============================================================================

  async getApprovalQueue(filters: ApprovalFilters) {
    return this.service.getApprovalQueue({ filters });
  }

  async getApprovalDetails(id: string) {
    return this.service.getApprovalDetails(id);
  }

  async approve(id: string, data: any) {
    const userId = 'current-user-id'; // TODO: Extrair do request
    await this.service.processApproval(id, userId, data);
  }

  async reject(id: string, data: any) {
    const userId = 'current-user-id';
    await this.service.processRejection(id, userId, data);
  }

  async requestCorrection(id: string, data: any) {
    const userId = 'current-user-id';
    await this.service.processCorrection(id, userId, data);
  }

  async forward(id: string, data: any) {
    const userId = 'current-user-id';
    await this.service.processForward(id, userId, data);
  }

  async getApprovalChecklist(id: string) {
    return this.service.getChecklist(id);
  }

  // ============================================================================
  // ABA DE DASHBOARD
  // ============================================================================

  async getDashboardData(filters: DashboardFilters) {
    const [kpis, trends, distribution, performance, rankings] = await Promise.all([
      this.service.calculateKPIs({ filters }),
      this.service.getTrendData({ filters }, 'monthly'),
      this.service.getDistributionData({ filters }, 'status'),
      this.service.calculatePerformance({ filters }),
      this.service.generateRankings({ filters }, 'service'),
    ]);

    return {
      kpis,
      trends,
      distribution,
      performance,
      rankings,
    };
  }

  async getKPIs(filters: DashboardFilters) {
    return this.service.calculateKPIs({ filters });
  }

  async getTrends(filters: DashboardFilters, period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    return this.service.getTrendData({ filters }, period);
  }

  async getDistribution(filters: DashboardFilters, groupBy: string) {
    return this.service.getDistributionData({ filters }, groupBy);
  }

  async getPerformance(filters: DashboardFilters) {
    return this.service.calculatePerformance({ filters });
  }

  async getRankings(filters: DashboardFilters, rankBy: string) {
    return this.service.generateRankings({ filters }, rankBy);
  }

  async exportDashboard(options: ExportOptions): Promise<ExportResult> {
    // TODO: Implementar exportação de dashboard
    throw new Error('Dashboard export not implemented');
  }

  // ============================================================================
  // ABA DE GERENCIAMENTO
  // ============================================================================

  async getManagementEntities() {
    return this.service.getManagementEntities();
  }

  async listEntity(entityName: string, filters: ManagementFilters) {
    return this.service.listManagedEntity(entityName, { filters });
  }

  async createEntity(entityName: string, data: any) {
    const userId = 'current-user-id';
    return this.service.createManagedEntity(entityName, data, userId);
  }

  async updateEntity(entityName: string, id: string, data: any) {
    const userId = 'current-user-id';
    return this.service.updateManagedEntity(entityName, id, data, userId);
  }

  async deleteEntity(entityName: string, id: string) {
    const userId = 'current-user-id';
    await this.service.deleteManagedEntity(entityName, id, userId);
  }

  async importData(options: ImportOptions) {
    const userId = 'current-user-id';
    return this.service.importEntityData(options, userId);
  }

  async exportEntity(entityName: string, options: ExportOptions) {
    return this.service.exportEntityData(entityName, options);
  }

  async getAuditLog(entityName: string, entityId?: string, filters?: any) {
    return this.service.getAuditLog(entityName, entityId, filters);
  }

  async getModuleConfig() {
    return this.service.getConfig();
  }

  async updateModuleConfig(config: any) {
    const userId = 'current-user-id';
    await this.service.updateConfig(config, userId);
  }

  // ============================================================================
  // MÉTODOS EXPRESS (HTTP)
  // ============================================================================

  /**
   * Wrapper para Express: GET /list
   */
  handleGetList = async (req: Request, res: Response) => {
    try {
      const filters: ListFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        search: req.query.search as string,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        orderBy: req.query.orderBy as string,
        orderDirection: (req.query.orderDirection as 'asc' | 'desc') || 'desc',
        departmentId: req.query.departmentId as string,
        citizenId: req.query.citizenId as string,
      };

      const result = await this.getListData(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: GET /:id
   */
  handleGetDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.getRequestDetails(id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: GET /approvals
   */
  handleGetApprovals = async (req: Request, res: Response) => {
    try {
      const filters: ApprovalFilters = {
        search: req.query.search as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        priority: req.query.priority as any,
        assignedTo: req.query.assignedTo as string,
        pendingOnly: req.query.pendingOnly === 'true',
      };

      const result = await this.getApprovalQueue(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: POST /:id/approve
   */
  handleApprove = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.approve(id, req.body);
      res.json({ success: true, message: 'Solicitação aprovada com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: POST /:id/reject
   */
  handleReject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.reject(id, req.body);
      res.json({ success: true, message: 'Solicitação rejeitada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: GET /dashboard
   */
  handleGetDashboard = async (req: Request, res: Response) => {
    try {
      const filters: DashboardFilters = {
        dateFrom: req.query.dateFrom as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        dateTo: req.query.dateTo as string || new Date().toISOString(),
        departmentId: req.query.departmentId as string,
        compareWithPrevious: req.query.compareWithPrevious === 'true',
      };

      const result = await this.getDashboardData(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: GET /management/entities
   */
  handleGetManagementEntities = async (req: Request, res: Response) => {
    try {
      const result = await this.getManagementEntities();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: GET /management/:entity
   */
  handleListEntity = async (req: Request, res: Response) => {
    try {
      const { entity } = req.params;
      const filters: ManagementFilters = {
        entityType: entity,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        search: req.query.search as string,
        orderBy: req.query.orderBy as string,
        orderDirection: (req.query.orderDirection as 'asc' | 'desc') || 'desc',
        includeInactive: req.query.includeInactive === 'true',
      };

      const result = await this.listEntity(entity, filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: POST /management/:entity
   */
  handleCreateEntity = async (req: Request, res: Response) => {
    try {
      const { entity } = req.params;
      const result = await this.createEntity(entity, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: PUT /management/:entity/:id
   */
  handleUpdateEntity = async (req: Request, res: Response) => {
    try {
      const { entity, id } = req.params;
      const result = await this.updateEntity(entity, id, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Wrapper para Express: DELETE /management/:entity/:id
   */
  handleDeleteEntity = async (req: Request, res: Response) => {
    try {
      const { entity, id } = req.params;
      await this.deleteEntity(entity, id);
      res.json({ success: true, message: 'Registro excluído com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
