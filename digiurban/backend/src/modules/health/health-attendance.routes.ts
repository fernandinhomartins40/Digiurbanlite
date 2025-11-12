/**
 * @file health-attendance.routes.ts
 * @description Rotas para o módulo de Atendimentos de Saúde
 * @module modules/health
 *
 * EXEMPLO DE IMPLEMENTAÇÃO - Template para outros módulos
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { HealthAttendanceTabService } from './health-attendance-tab.service';
import { HealthAttendanceTabController } from './health-attendance-tab.controller';

const router = Router();
const prisma = new PrismaClient();

// Instancia service e controller
const service = new HealthAttendanceTabService(prisma);
const controller = new HealthAttendanceTabController(service);

// ============================================================================
// ABA DE LISTAGEM
// ============================================================================

/**
 * GET /api/health/attendance/list
 * Lista paginada de atendimentos com filtros
 *
 * Query params:
 * - page: número da página (padrão: 1)
 * - limit: itens por página (padrão: 25)
 * - search: busca textual
 * - status: filtro por status (array)
 * - dateFrom: data inicial
 * - dateTo: data final
 * - orderBy: campo de ordenação
 * - orderDirection: asc ou desc
 */
router.get('/list', controller.handleGetList);

/**
 * GET /api/health/attendance/:id
 * Detalhes de um atendimento específico
 */
router.get('/:id', controller.handleGetDetails);

/**
 * GET /api/health/attendance/:id/history
 * Histórico de alterações do atendimento
 */
router.get('/:id/history', async (req, res) => {
  try {
    const history = await controller.getRequestHistory(req.params.id);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/attendance/:id/comments
 * Adiciona comentário ao atendimento
 *
 * Body:
 * - comment: string
 * - attachments: string[] (opcional)
 */
router.post('/:id/comments', async (req, res) => {
  try {
    await controller.addComment(
      req.params.id,
      req.body.comment,
      req.body.attachments,
    );
    res.json({ success: true, message: 'Comentário adicionado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/attendance/export
 * Exporta lista de atendimentos
 *
 * Query params:
 * - format: pdf, excel, csv
 * - filters: objeto com filtros (mesmos da listagem)
 */
router.get('/export', async (req, res) => {
  try {
    const result = await controller.exportList(req.query as any);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ABA DE DASHBOARD
// ============================================================================

/**
 * GET /api/health/attendance/dashboard
 * Retorna todos os dados do dashboard
 *
 * Query params:
 * - dateFrom: data inicial (padrão: 30 dias atrás)
 * - dateTo: data final (padrão: hoje)
 * - departmentId: filtrar por departamento (opcional)
 */
router.get('/dashboard', controller.handleGetDashboard);

/**
 * GET /api/health/attendance/dashboard/kpis
 * Retorna apenas os KPIs
 */
router.get('/dashboard/kpis', async (req, res) => {
  try {
    const filters = {
      dateFrom:
        (req.query.dateFrom as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: (req.query.dateTo as string) || new Date().toISOString(),
      departmentId: req.query.departmentId as string,
    };

    const kpis = await controller.getKPIs(filters);
    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/attendance/dashboard/trends
 * Retorna dados de tendência temporal
 *
 * Query params:
 * - period: daily, weekly, monthly, yearly
 */
router.get('/dashboard/trends', async (req, res) => {
  try {
    const filters = {
      dateFrom:
        (req.query.dateFrom as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: (req.query.dateTo as string) || new Date().toISOString(),
    };

    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';

    const trends = await controller.getTrends(filters, period);
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/attendance/dashboard/distribution
 * Retorna dados de distribuição
 *
 * Query params:
 * - groupBy: status, type, unit (campo de agrupamento)
 */
router.get('/dashboard/distribution', async (req, res) => {
  try {
    const filters = {
      dateFrom:
        (req.query.dateFrom as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: (req.query.dateTo as string) || new Date().toISOString(),
    };

    const groupBy = (req.query.groupBy as string) || 'status';

    const distribution = await controller.getDistribution(filters, groupBy);
    res.json(distribution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/attendance/dashboard/performance
 * Retorna métricas de performance
 */
router.get('/dashboard/performance', async (req, res) => {
  try {
    const filters = {
      dateFrom:
        (req.query.dateFrom as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: (req.query.dateTo as string) || new Date().toISOString(),
    };

    const performance = await controller.getPerformance(filters);
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ABA DE GERENCIAMENTO
// ============================================================================

/**
 * GET /api/health/attendance/management/entities
 * Lista todas as entidades gerenciáveis do módulo
 */
router.get('/management/entities', controller.handleGetManagementEntities);

/**
 * GET /api/health/attendance/management/:entity
 * Lista registros de uma entidade gerenciável
 *
 * Params:
 * - entity: patient, healthUnit
 *
 * Query params:
 * - page: número da página
 * - limit: itens por página
 * - search: busca
 * - includeInactive: incluir inativos
 */
router.get('/management/:entity', controller.handleListEntity);

/**
 * POST /api/health/attendance/management/:entity
 * Cria novo registro em entidade gerenciável
 *
 * Params:
 * - entity: patient, healthUnit
 *
 * Body: dados da entidade
 */
router.post('/management/:entity', controller.handleCreateEntity);

/**
 * PUT /api/health/attendance/management/:entity/:id
 * Atualiza registro de entidade gerenciável
 *
 * Params:
 * - entity: patient, healthUnit
 * - id: ID do registro
 *
 * Body: dados da entidade
 */
router.put('/management/:entity/:id', controller.handleUpdateEntity);

/**
 * DELETE /api/health/attendance/management/:entity/:id
 * Exclui (soft delete) registro de entidade gerenciável
 *
 * Params:
 * - entity: patient, healthUnit
 * - id: ID do registro
 */
router.delete('/management/:entity/:id', controller.handleDeleteEntity);

/**
 * GET /api/health/attendance/management/:entity/export
 * Exporta dados de uma entidade
 *
 * Query params:
 * - format: pdf, excel, csv
 */
router.get('/management/:entity/export', async (req, res) => {
  try {
    const { entity } = req.params;
    const result = await controller.exportEntity(entity, req.query as any);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/health/attendance/management/import
 * Importa dados em massa
 *
 * Body:
 * - entity: string
 * - file: File
 * - validateOnly: boolean (opcional)
 */
router.post('/management/import', async (req, res) => {
  try {
    const result = await controller.importData(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/attendance/management/audit
 * Log de auditoria
 *
 * Query params:
 * - entity: filtrar por entidade
 * - entityId: filtrar por ID específico
 * - dateFrom: data inicial
 * - dateTo: data final
 */
router.get('/management/audit', async (req, res) => {
  try {
    const { entity, entityId } = req.query;
    const filters = {
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    };

    const audit = await controller.getAuditLog(
      entity as string,
      entityId as string,
      filters,
    );
    res.json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health/attendance/management/config
 * Retorna configurações do módulo
 */
router.get('/management/config', async (req, res) => {
  try {
    const config = await controller.getModuleConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/health/attendance/management/config
 * Atualiza configurações do módulo
 *
 * Body: objeto de configuração
 */
router.put('/management/config', async (req, res) => {
  try {
    await controller.updateModuleConfig(req.body);
    res.json({ success: true, message: 'Configuração atualizada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS CUSTOMIZADOS (ESPECÍFICOS DESTE MÓDULO)
// ============================================================================

/**
 * GET /api/health/attendance/stats/by-unit
 * Estatísticas agrupadas por unidade de saúde
 */
router.get('/stats/by-unit', controller.handleGetStatsByUnit);

/**
 * GET /api/health/attendance/stats/top-patients
 * Pacientes com mais atendimentos
 *
 * Query params:
 * - limit: número de pacientes (padrão: 10)
 * - dateFrom: data inicial
 * - dateTo: data final
 */
router.get('/stats/top-patients', controller.handleGetTopPatients);

/**
 * GET /api/health/attendance/reports/satisfaction
 * Relatório de satisfação
 *
 * Query params:
 * - dateFrom: data inicial
 * - dateTo: data final
 * - unitId: filtrar por unidade (opcional)
 */
router.get('/reports/satisfaction', controller.handleGetSatisfactionReport);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
