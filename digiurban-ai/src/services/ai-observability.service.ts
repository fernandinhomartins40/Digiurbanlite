import { AiExperience, InferenceRouteKind } from '../types';

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
}

export const aiObservabilityService = new AiObservabilityService();
