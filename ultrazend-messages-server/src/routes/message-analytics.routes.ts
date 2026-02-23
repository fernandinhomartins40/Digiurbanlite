/**
 * Message Analytics Routes
 *
 * ✅ ETAPA 4: Rotas para analytics usando campos queryable
 *
 * Endpoints:
 * - GET /api/message-analytics/dashboard - Dashboard geral
 * - GET /api/message-analytics/metrics - Métricas por período
 * - GET /api/message-analytics/citizen/:citizenId - Histórico de cidadão
 * - GET /api/message-analytics/export - Exportar CSV
 */

import { Router, Request, Response } from 'express';
import {
  getBotMetrics,
  getCitizenBotHistory,
  getBotDashboard,
  exportBotAnalytics,
} from '../services/message-analytics.service';

const router = Router();

/**
 * GET /api/message-analytics/dashboard
 * Dashboard geral do bot (últimos 30 dias)
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;

    const dashboard = await getBotDashboard(departmentId);

    res.json({
      success: true,
      dashboard,
    });
  } catch (error: any) {
    console.error('[Message Analytics] Erro ao buscar dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dashboard de analytics',
      details: error.message,
    });
  }
});

/**
 * GET /api/message-analytics/metrics
 * Métricas por período customizado
 *
 * Query params:
 * - startDate (ISO string)
 * - endDate (ISO string)
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const metrics = await getBotMetrics(startDate, endDate);

    res.json({
      success: true,
      metrics,
      period: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error: any) {
    console.error('[Message Analytics] Erro ao buscar métricas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar métricas',
      details: error.message,
    });
  }
});

/**
 * GET /api/message-analytics/citizen/:citizenId
 * Histórico de interações de um cidadão com o bot
 */
router.get('/citizen/:citizenId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { citizenId } = req.params;

    if (!citizenId) {
      res.status(400).json({
        success: false,
        error: 'citizenId é obrigatório',
      });
      return;
    }

    const history = await getCitizenBotHistory(citizenId);

    res.json({
      success: true,
      citizenId,
      history,
    });
  } catch (error: any) {
    console.error('[Message Analytics] Erro ao buscar histórico do cidadão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico do cidadão',
      details: error.message,
    });
  }
});

/**
 * GET /api/message-analytics/export
 * Exportar analytics para CSV
 *
 * Query params:
 * - startDate (ISO string)
 * - endDate (ISO string)
 */
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;

    if (!startDateStr || !endDateStr) {
      res.status(400).json({
        success: false,
        error: 'startDate e endDate são obrigatórios',
      });
      return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const csv = await exportBotAnalytics(startDate, endDate);

    // Set headers para download do CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bot-analytics-${startDate.toISOString().split('T')[0]}-${
        endDate.toISOString().split('T')[0]
      }.csv"`
    );

    res.send(csv);
  } catch (error: any) {
    console.error('[Message Analytics] Erro ao exportar CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao exportar analytics',
      details: error.message,
    });
  }
});

/**
 * GET /api/message-analytics/health
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'message-analytics',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
