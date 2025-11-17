import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { validateRequest } from '../middleware/validation';
import {
  AuthenticatedRequest,
  
  AdminRouteParams,
  PaginatedRouteResponse,
  SuccessResponse,
  ErrorResponse
        } from '../types';

// FASE 2 - Interfaces para Analytics (Integrações Externas)
interface KPIDefinition {
  id: string;
  name: string;
  metric: string;
  type: 'count' | 'percentage' | 'average' | 'sum';
  query?: string;
  target?: number;
  warning?: number;
  critical?: number;
}

interface FilterOptions {
  type?: string;
  metric?: string;
  entityId?: string;
  periodType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
  endDate?: string;
  department?: string;
}

interface TrendDataPoint {
  period: string;
  metric: string;
  _avg: { value: number };
  _count: { value: number };
}

interface ProcessedTrendData {
  periods: string[];
  metrics: Record<string, Array<{
    period: string;
    value: number;
    count: number;
  }>>;
}

interface ReportDefinition {
  id: string;
  name: string;
  type: string;
  parameters?: Record<string, unknown>;
}

interface ReportParams {
  format?: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  parameters?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

interface BenchmarkData {

  metric: string;
  value: number;
  period: string;
}

interface BenchmarkPosition {
  position: number;
  total: number;
  percentile: number;
  aboveMedian: boolean;
}

interface BenchmarkPercentiles {
  p25?: number;
  p50?: number;
  p75?: number;
}

const router = Router();

// ============================================================================
// ANALYTICS APIs - FASE 6
// ============================================================================

// Schemas de validação
const analyticsFiltersSchema = z.object({
  type: z.string().optional(),
  metric: z.string().optional(),
  entityId: z.string().optional(),
  periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.string().optional()
        });

const dashboardLevelSchema = z.object({
  level: z.enum(['0', '1', '2', '3', '4', '5'])
        });

const reportExecuteSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).optional().default('JSON'),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.date()])).optional(),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional()
        });

const customReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM']),
  category: z.string(),
  config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.object({})])),
  schedule: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  accessLevel: z.number().min(0).max(5)
        });

// ============================================================================
// MÉTRICAS EM TEMPO REAL
// ============================================================================

// GET /api/analytics/realtime - KPIs tempo real
router.get(
  '/realtime',
  async (req, res) => {
    try {
      const authReq = req as any;
      const { tenantId } = authReq.user;

      // Métricas em tempo real (últimas 24h)
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const [
        totalProtocols,
        activeProtocols,
        completedToday,
        averageResolutionTime,
        satisfactionScore,
      ] = await Promise.all([
        // Total de protocolos
        prisma.protocolSimplified.count({}),

        // Protocolos ativos
        prisma.protocolSimplified.count({
          where: {
                        status: { in: ['VINCULADO', 'PROGRESSO', 'ATUALIZACAO'] }
        }
        }),

        // Concluídos hoje
        prisma.protocolSimplified.count({
          where: {
                        status: 'CONCLUIDO',
            updatedAt: { gte: yesterday }
        }
        }),

        // Tempo médio de resolução (últimos 30 dias)
        prisma.protocolSimplified.aggregate({
          where: {
                        status: 'CONCLUIDO',
            updatedAt: { gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
        },
          _avg: {
            // Calculado como diferença entre createdAt e updatedAt em horas
          }
        }),

        // Satisfação média - comentado pois model não existe
        Promise.resolve({ _avg: { rating: null } })
      ]);

      // Calcular tempo médio de resolução em horas
      const recentProtocols = await prisma.protocolSimplified.findMany({
        where: {
                    status: 'CONCLUIDO',
          updatedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      const avgResolutionHours =
        recentProtocols.length > 0
          ? recentProtocols.reduce(
              (acc, p) => acc + (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60),
              0
            ) / recentProtocols.length
          : 0;

      return res.json({
        success: true,
        data: {
          kpis: {
            totalProtocols,
            activeProtocols,
            completedToday,
            averageResolutionTime: Math.round(avgResolutionHours * 100) / 100,
            satisfactionScore: satisfactionScore._avg.rating || 0,
            completionRate:
              totalProtocols > 0 ? Math.round((completedToday / totalProtocols) * 100) : 0
        },
          timestamp: new Date().toISOString(),
          period: '24h'
        }
        });
    } catch (error) {
      console.error('Error fetching realtime analytics:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// GET /api/analytics/dashboard/:level - Dashboard por nível
router.get(
  '/dashboard/:level',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const { level } = req.params;
      const userLevel = parseInt(level);

      // Verificar permissões
      if (getUserLevel(authReq.user.role) < userLevel) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado para este nível de dashboard'
        });
      }

      let dashboardData = {};

      switch (userLevel) {
        case 0: // CIDADÃO
          dashboardData = await getCitizenDashboard(authReq.user.id);
          break;
        case 1: // FUNCIONÁRIO
          dashboardData = await getEmployeeDashboard(authReq.user.id);
          break;
        case 2: // COORDENADOR
          dashboardData = await getCoordinatorDashboard(authReq.user.id);
          break;
        case 3: // SECRETÁRIO
          dashboardData = await getManagerDashboard(authReq.user.id);
          break;
        case 4: // PREFEITO
          dashboardData = await getExecutiveDashboard();
          break;
        case 5: // SUPER ADMIN
          dashboardData = await getSuperAdminDashboard();
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Nível de usuário inválido'
        });
      }

      res.json({
        success: true,
        data: dashboardData
        });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// GET /api/analytics/kpis - KPIs principais
router.get(
  '/kpis',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const filters = req.query as FilterOptions;

      // Buscar KPIs do banco
      const kpis = await prisma.kPI.findMany({
        where: {
          isActive: true,
          ...((filters as any).category && { category: (filters as any).category })
        },
        orderBy: { category: 'asc' }
        });

      // Calcular valores atuais dos KPIs
      const kpisWithValues = await Promise.all(
        kpis.map(async kpi => {
          const currentValue = await calculateKPIValue(kpi as any, filters);
          return {
            ...kpi,
            currentValue,
            status: getKPIStatus(currentValue, kpi.target, (kpi as any).warning, (kpi as any).critical),
            trend: await calculateKPITrend(kpi as any)
        };
        })
      );

      res.json({
        success: true,
        data: kpisWithValues
        });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// GET /api/analytics/trends - Análise de tendências
router.get(
  '/trends',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const filters = req.query as FilterOptions;

      const trends = await prisma.analytics.groupBy({
        by: ['period', 'metric'],
        where: {
                    ...(filters.type && { type: filters.type }),
          ...(filters.metric && { metric: filters.metric }),
          ...(filters.periodType && { periodType: filters.periodType })
        },
        _avg: {
          value: true
        },
        _count: {
          value: true
        },
        orderBy: {
          period: 'asc'
        }
        });

      const trendData = processTrendData(trends as any);

      res.json({
        success: true,
        data: trendData
        });
    } catch (error) {
      console.error('Error fetching trends:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// ============================================================================
// RELATÓRIOS
// ============================================================================

// GET /api/reports - Lista de relatórios disponíveis
router.get(
  '/reports',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const userLevel = getUserLevel(authReq.user.role);

      const reports = await prisma.report.findMany({
        where: {
                    isActive: true,
          accessLevel: { lte: userLevel }
        },
        include: {
          executions: {
            take: 1,
            orderBy: { startedAt: 'desc' }
      }
        },
        orderBy: { name: 'asc' }
        });

      res.json({
        success: true,
        data: reports.map(report => ({
          ...report,
          lastExecution: report.executions[0] || null,
          executions: undefined
        }))
        });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// POST /api/reports/:id/execute - Executar relatório
router.post(
  '/reports/:id/execute',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const { id: reportId } = req.params;
      const { format, parameters, filters } = req.body;

      // Verificar se o relatório existe e o usuário tem acesso
      const report = await prisma.report.findFirst({
        where: {
          id: reportId,
          isActive: true,
          accessLevel: { lte: getUserLevel(authReq.user.role) }
        }
        });

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Relatório não encontrado'
        });
      }

      // Criar execução
      const execution = await prisma.reportExecution.create({
        data: {
          reportId,
          format,
          parameters,
          filters,
          status: 'GENERATING',
          executedBy: authReq.user.id
        }
        });

      // Processar relatório em background
      processReportInBackground(execution.id, report, { format, parameters, filters });

      res.json({
        success: true,
        data: {
          executionId: execution.id,
          status: 'GENERATING',
          message: 'Relatório sendo gerado. Você será notificado quando estiver pronto.'
        }
        });
    } catch (error) {
      console.error('Error executing report:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// GET /api/reports/:id/download/:executionId - Download do relatório
router.get(
  '/reports/:id/download/:executionId',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const { id: reportId, executionId } = req.params;

      const execution = await prisma.reportExecution.findFirst({
        where: {
          id: executionId,
          reportId,
          report: {
            accessLevel: { lte: getUserLevel(authReq.user.role) }
        }
        },
        include: {
          report: true
        }
      });

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Relatório não encontrado'
        });
      }

      if (execution.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          error: `Relatório não está pronto. Status: ${execution.status}`
        });
      }

      // Incrementar contador de downloads
      await prisma.reportExecution.update({
        where: { id: executionId },
        data: { downloadCount: { increment: 1 } }
        });

      // Retornar arquivo ou dados dependendo do formato
      if (execution.fileUrl) {
        res.redirect(execution.fileUrl);
      } else {
        res.json({
          success: true,
          data: execution.data,
          format: execution.format
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// POST /api/reports/custom - Criar relatório customizado
router.post(
  '/reports/custom',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const data = req.body;

      // Verificar se o usuário tem permissão para criar relatórios
      if (getUserLevel(authReq.user.role) < 2) {
        return res.status(403).json({
          success: false,
          error: 'Permissão insuficiente para criar relatórios'
        });
      }

      const report = await prisma.report.create({
        data: {
          ...data,
          createdBy: authReq.user.id,
          departments: [], // Will be populated based on user's access
        }
        });

      res.status(201).json({
        success: true,
        data: report
        });
    } catch (error) {
      console.error('Error creating custom report:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// ============================================================================
// COMPARATIVOS E BENCHMARKS
// ============================================================================

// GET /api/analytics/benchmark - Dados de benchmark
router.get(
  '/benchmark',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const { metric, category, region, population } = req.query;

      const benchmarks = await prisma.benchmark.findMany({
        where: {
          ...(metric && { metric: metric as string }),
          ...(category && { category: category as string }),
          ...(region && { region: region as string }),
          ...(population && { population: population as string })
        },
        orderBy: { updatedAt: 'desc' }
        });

      // Buscar valor atual do tenant para comparação
      let tenantValue = null;
      if (metric) {
        const analytics = await prisma.analytics.findFirst({
          where: {
                        metric: metric as string
        },
          orderBy: { createdAt: 'desc' }
        });
        tenantValue = analytics?.value || null;
      }

      res.json({
        success: true,
        data: {
          benchmarks,
          tenantValue,
          comparison: tenantValue ? calculateBenchmarkPosition(tenantValue, benchmarks as any) : null
        }
        });
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getUserLevel(role: string): number {
  const levels = {
    GUEST: 0,
    USER: 1,
    COORDINATOR: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5
        };
  return levels[role as keyof typeof levels] || 0;
}

async function getCitizenDashboard(userId: string) {
  const protocols = await prisma.protocolSimplified.findMany({
    where: { createdBy: userId as any }
      });

  return {
    myProtocols: protocols.length,
    activeProtocols: protocols.filter(p => p.status !== 'CONCLUIDO').length,
    completedProtocols: protocols.filter(p => p.status === 'CONCLUIDO').length,
    averageRating: 0,
    recentProtocols: protocols.slice(-5)
        };
}

async function getEmployeeDashboard(userId: string) {
  // Dashboard para funcionário - implementação simplificada
  return {
    assignedProtocols: 0,
    completedToday: 0,
    pendingProtocols: 0,
    averageRating: 0
        };
}

async function getCoordinatorDashboard(userId: string) {
  // Dashboard para coordenador - implementação simplificada
  return {
    teamPerformance: [],
    departmentKPIs: [],
    workloadDistribution: []
        };
}

async function getManagerDashboard(userId: string) {
  // Dashboard para secretário - implementação simplificada
  return {
    departmentMetrics: [],
    serviceEfficiency: [],
    citizenSatisfaction: 0
        };
}

async function getExecutiveDashboard() {
  // Dashboard executivo - implementação simplificada
  return {
    municipalKPIs: [],
    departmentComparison: [],
    citizenSatisfaction: 0,
    budgetEfficiency: 0
        };
}

async function getSuperAdminDashboard() {
  // Dashboard super admin - implementação simplificada
  return {
    platformMetrics: [],
    tenantPerformance: [],
    revenueAnalytics: []
        };
}

async function calculateKPIValue(kpi: KPIDefinition, filters: FilterOptions): Promise<number> {
  // Implementação simplificada do cálculo de KPI
  return Math.random() * 100;
}

function getKPIStatus(
  value: number,
  target?: number | null,
  warning?: number | null,
  critical?: number | null
): string {
  if (critical && value <= critical) return 'critical';
  if (warning && value <= warning) return 'warning';
  if (target && value >= target) return 'good';
  return 'normal';
}

async function calculateKPITrend(kpi: KPIDefinition): Promise<string> {
  // Implementação simplificada do cálculo de tendência
  return ['up', 'down', 'stable'][Math.floor(Math.random() * 3)];
}

function processTrendData(trends: TrendDataPoint[]): ProcessedTrendData {
  // Processar dados de tendência
  return {
    periods: trends.map(t => t.period),
    metrics: trends.reduce((acc, t) => {
      if (!acc[t.metric]) acc[t.metric] = [];
      acc[t.metric].push({
        period: t.period,
        value: t._avg.value,
        count: t._count.value
        });
      return acc;
    }, {} as Record<string, Array<{ period: string; value: number; count: number; }>>)
        };
}

async function processReportInBackground(executionId: string, report: ReportDefinition, params: ReportParams) {
  // Implementação simplificada do processamento de relatório
  setTimeout(async () => {
    try {
      await prisma.reportExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          data: { message: 'Relatório processado com sucesso', timestamp: new Date() }
        }
        });
    } catch (error) {
      await prisma.reportExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: 'Erro no processamento do relatório'
        }
        });
    }
  }, 5000); // Simula processamento de 5 segundos
}

function calculateBenchmarkPosition(value: number, benchmarks: BenchmarkData[]): BenchmarkPosition | null {
  // Calcular posição do tenant no benchmark
  if (benchmarks.length === 0) return null;

  const latest = benchmarks[0];
  let position = 'average';

  const benchmarkData = latest as any;
  if (benchmarkData.p75 && value >= benchmarkData.p75) position = 'excellent';
  else if (benchmarkData.p50 && value >= benchmarkData.p50) position = 'good';
  else if (benchmarkData.p25 && value >= benchmarkData.p25) position = 'below_average';
  else position = 'poor';

  return {
    position: benchmarks.length,
    total: benchmarks.length,
    percentile: calculatePercentile(value, benchmarkData),
    aboveMedian: benchmarkData.p50 ? value >= benchmarkData.p50 : false
  };
}

function calculatePercentile(value: number, benchmark: BenchmarkPercentiles): number {
  // Cálculo simplificado do percentil
  if (benchmark.p75 && value >= benchmark.p75) return 75;
  if (benchmark.p50 && value >= benchmark.p50) return 50;
  if (benchmark.p25 && value >= benchmark.p25) return 25;
  return 10;
}

export default router;
