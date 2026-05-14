import { AiExperience, InferenceRouteKind } from '../types';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

type RouteStats = {
  requests: number;
  avgLatencyMs: number;
  avgFirstTokenLatencyMs: number;
  deterministicResponses: number;
  toolFirstResponses: number;
  webSearchResponses: number;
};

type ModelStats = {
  requests: number;
  avgLatencyMs: number;
};

function nextAverage(current: number, nextValue: number, totalItems: number): number {
  if (totalItems <= 1) {
    return nextValue;
  }

  return Number((((current * (totalItems - 1)) + nextValue) / totalItems).toFixed(2));
}

export class AiObservabilityService {
  private readonly routeStats = new Map<InferenceRouteKind, RouteStats>();

  private readonly modelStats = new Map<string, ModelStats>();

  private totalRequests = 0;

  private toolFirstResponses = 0;

  private deterministicResponses = 0;

  private webSearchResponses = 0;

  private experienceStats: Record<AiExperience, number> = {
    fast: 0,
    contextual: 0,
    quality: 0,
  };

  recordInference(params: {
    routeKind: InferenceRouteKind;
    experience: AiExperience;
    model: string;
    latencyMs: number;
    firstTokenLatencyMs?: number;
    deterministicResponse: boolean;
    toolFirst: boolean;
    webSearch: boolean;
    tenantId?: string;
    userId?: string;
    source?: string;
  }): void {
    this.totalRequests += 1;
    this.experienceStats[params.experience] += 1;

    if (params.toolFirst) {
      this.toolFirstResponses += 1;
    }

    if (params.deterministicResponse) {
      this.deterministicResponses += 1;
    }

    if (params.webSearch) {
      this.webSearchResponses += 1;
    }

    const currentRoute = this.routeStats.get(params.routeKind) || {
      requests: 0,
      avgLatencyMs: 0,
      avgFirstTokenLatencyMs: 0,
      deterministicResponses: 0,
      toolFirstResponses: 0,
      webSearchResponses: 0,
    };
    currentRoute.requests += 1;
    currentRoute.avgLatencyMs = nextAverage(
      currentRoute.avgLatencyMs,
      params.latencyMs,
      currentRoute.requests,
    );
    currentRoute.avgFirstTokenLatencyMs = nextAverage(
      currentRoute.avgFirstTokenLatencyMs,
      params.firstTokenLatencyMs || 0,
      currentRoute.requests,
    );
    currentRoute.deterministicResponses += params.deterministicResponse ? 1 : 0;
    currentRoute.toolFirstResponses += params.toolFirst ? 1 : 0;
    currentRoute.webSearchResponses += params.webSearch ? 1 : 0;
    this.routeStats.set(params.routeKind, currentRoute);

    const currentModel = this.modelStats.get(params.model) || {
      requests: 0,
      avgLatencyMs: 0,
    };
    currentModel.requests += 1;
    currentModel.avgLatencyMs = nextAverage(
      currentModel.avgLatencyMs,
      params.latencyMs,
      currentModel.requests,
    );
    this.modelStats.set(params.model, currentModel);

    void prisma.aiInferenceEvent.create({
      data: {
        tenantId: params.tenantId || 'default',
        userId: params.userId,
        source: params.source,
        routeKind: params.routeKind,
        experience: params.experience,
        model: params.model,
        latencyMs: Math.max(0, Math.trunc(params.latencyMs || 0)),
        firstTokenLatencyMs:
          typeof params.firstTokenLatencyMs === 'number'
            ? Math.max(0, Math.trunc(params.firstTokenLatencyMs))
            : undefined,
        deterministicResponse: params.deterministicResponse,
        toolFirst: params.toolFirst,
        webSearch: params.webSearch,
      },
    }).catch((error) => {
      logger.warn('Failed to persist AI inference event', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  getSnapshot(): Record<string, unknown> {
    return {
      totalRequests: this.totalRequests,
      deterministicResponses: this.deterministicResponses,
      toolFirstResponses: this.toolFirstResponses,
      webSearchResponses: this.webSearchResponses,
      experiences: this.experienceStats,
      routes: Object.fromEntries(this.routeStats.entries()),
      models: Object.fromEntries(this.modelStats.entries()),
    };
  }

  async getPersistentSnapshot(tenantId = 'default'): Promise<Record<string, unknown>> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [total, byRoute, byModel, recentSlow] = await Promise.all([
      prisma.aiInferenceEvent.count({
        where: { tenantId, createdAt: { gte: since } },
      }),
      prisma.aiInferenceEvent.groupBy({
        by: ['routeKind'],
        where: { tenantId, createdAt: { gte: since } },
        _count: { _all: true },
        _avg: { latencyMs: true, firstTokenLatencyMs: true },
      }),
      prisma.aiInferenceEvent.groupBy({
        by: ['model'],
        where: { tenantId, createdAt: { gte: since } },
        _count: { _all: true },
        _avg: { latencyMs: true, firstTokenLatencyMs: true },
      }),
      prisma.aiInferenceEvent.findMany({
        where: { tenantId, createdAt: { gte: since } },
        orderBy: { latencyMs: 'desc' },
        take: 10,
        select: {
          routeKind: true,
          experience: true,
          model: true,
          latencyMs: true,
          firstTokenLatencyMs: true,
          deterministicResponse: true,
          toolFirst: true,
          webSearch: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      window: '24h',
      totalRequests: total,
      routes: byRoute
        .sort((a, b) => b._count._all - a._count._all)
        .map((item) => ({
          routeKind: item.routeKind,
          requests: item._count._all,
          avgLatencyMs: Math.round(item._avg.latencyMs || 0),
          avgFirstTokenLatencyMs: Math.round(item._avg.firstTokenLatencyMs || 0),
        })),
      models: byModel
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 10)
        .map((item) => ({
          model: item.model,
          requests: item._count._all,
          avgLatencyMs: Math.round(item._avg.latencyMs || 0),
          avgFirstTokenLatencyMs: Math.round(item._avg.firstTokenLatencyMs || 0),
        })),
      recentSlow: recentSlow.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}

export const aiObservabilityService = new AiObservabilityService();
