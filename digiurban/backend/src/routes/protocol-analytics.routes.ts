import { Router, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import {
  getDashboardOverview,
  getTrends,
  generateCSVReport,
  recalculateMetrics,
  calculateKPIs,
  getBenchmarkComparison,
  PeriodType
} from '../services/protocol-analytics.service';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Middleware: todas as rotas requerem autenticação admin
router.use(adminAuthMiddleware);

// ============================================================================
// VALIDAÇÃO HELPERS
// ============================================================================

function parsePeriodType(value: string | undefined): PeriodType {
  const valid: PeriodType[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
  if (value && valid.includes(value as PeriodType)) return value as PeriodType;
  return 'MONTHLY';
}

// ============================================================================
// GET /api/protocol-analytics/dashboard
// Retorna overview completo do dashboard
// ============================================================================

router.get('/dashboard', async (req: any, res: Response) => {
  try {
    const periodType = parsePeriodType(req.query.periodType as string);
    const departmentId = req.query.departmentId as string | undefined;
    const serviceId = req.query.serviceId as string | undefined;

    const data = await getDashboardOverview(periodType, departmentId, serviceId);

    return res.json(data);
  } catch (error) {
    console.error('Erro no endpoint dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar dashboard' });
  }
});

// ============================================================================
// GET /api/protocol-analytics/trends
// Retorna dados de tendências para gráficos
// ============================================================================

router.get('/trends', async (req: any, res: Response) => {
  try {
    const periodType = parsePeriodType(req.query.periodType as string);
    const months = Math.min(Math.max(parseInt(req.query.months as string) || 6, 1), 24);
    const departmentId = req.query.departmentId as string | undefined;
    const serviceId = req.query.serviceId as string | undefined;

    const data = await getTrends(periodType, months, departmentId, serviceId);

    return res.json(data);
  } catch (error) {
    console.error('Erro no endpoint trends:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar tendências' });
  }
});

// ============================================================================
// GET /api/protocol-analytics/export/csv
// Gera e retorna relatório CSV
// ============================================================================

router.get('/export/csv', async (req: any, res: Response) => {
  try {
    const periodType = parsePeriodType(req.query.periodType as string);
    const departmentId = req.query.departmentId as string | undefined;
    const serviceId = req.query.serviceId as string | undefined;

    const csv = await generateCSVReport(periodType, departmentId, serviceId);

    const filename = `relatorio-analytics-${periodType}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf-8'));

    return res.send('\uFEFF' + csv); // BOM para Excel reconhecer UTF-8
  } catch (error) {
    console.error('Erro no endpoint export/csv:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar relatório CSV' });
  }
});

// ============================================================================
// POST /api/protocol-analytics/recalculate
// Recalcula todas as métricas agregadas
// ============================================================================

router.post('/recalculate', async (req: any, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Apenas ADMIN e SUPER_ADMIN podem recalcular
    if (authReq.user && !['ADMIN', 'SUPER_ADMIN'].includes(authReq.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente para recalcular métricas' });
    }

    const periodType = parsePeriodType(req.body?.periodType as string);

    const result = await recalculateMetrics(periodType);

    return res.json({
      success: true,
      data: {
        periodType,
        bottlenecksFound: result.bottlenecksFound,
        recalculatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro no endpoint recalculate:', error);
    return res.status(500).json({ error: 'Erro interno ao recalcular métricas' });
  }
});

// ============================================================================
// GET /api/protocol-analytics/kpis
// Retorna KPIs calculados em tempo real
// ============================================================================

router.get('/kpis', async (req: any, res: Response) => {
  try {
    const kpis = await calculateKPIs();
    return res.json({ success: true, data: kpis });
  } catch (error) {
    console.error('Erro no endpoint kpis:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar KPIs' });
  }
});

// ============================================================================
// GET /api/protocol-analytics/benchmark/:metric
// Retorna comparativo de benchmark para uma métrica
// ============================================================================

router.get('/benchmark/:metric', async (req: any, res: Response) => {
  try {
    const { metric } = req.params;
    const comparison = await getBenchmarkComparison(metric);

    if (!comparison) {
      return res.json({ success: true, data: null, message: 'Nenhum benchmark disponível para esta métrica' });
    }

    return res.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Erro no endpoint benchmark:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar benchmark' });
  }
});

export default router;
