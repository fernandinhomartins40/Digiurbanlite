import { AiApiKey, AiApiPlan, AiApiKeyStatus, AiPlanType } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import prisma from '../utils/prisma';

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

function parseAllowedIps(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export class ApiKeyService {
  async listPlans(tenantId: string): Promise<AiApiPlan[]> {
    return prisma.aiApiPlan.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(params: {
    tenantId: string;
    name: string;
    planType?: AiPlanType;
    requestLimitPerMinute?: number;
    monthlyBudgetTokens?: number;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    isActive?: boolean;
  }): Promise<AiApiPlan> {
    return prisma.aiApiPlan.create({
      data: {
        tenantId: params.tenantId,
        name: params.name,
        planType: params.planType ?? AiPlanType.MUNICIPALITY,
        requestLimitPerMinute: params.requestLimitPerMinute ?? 60,
        monthlyBudgetTokens: params.monthlyBudgetTokens ?? 1_000_000,
        inputTokenLimit: params.inputTokenLimit ?? 500_000,
        outputTokenLimit: params.outputTokenLimit ?? 500_000,
        isActive: params.isActive ?? true,
      },
    });
  }

  async updatePlan(params: {
    tenantId: string;
    planId: string;
    payload: Partial<{
      name: string;
      requestLimitPerMinute: number;
      monthlyBudgetTokens: number;
      inputTokenLimit: number;
      outputTokenLimit: number;
      isActive: boolean;
    }>;
  }): Promise<AiApiPlan> {
    const current = await prisma.aiApiPlan.findFirst({
      where: { id: params.planId, tenantId: params.tenantId },
    });

    if (!current) {
      throw new Error('API plan not found');
    }

    return prisma.aiApiPlan.update({
      where: { id: params.planId },
      data: params.payload,
    });
  }

  async listApiKeys(tenantId: string): Promise<AiApiKey[]> {
    return prisma.aiApiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(params: {
    tenantId: string;
    planId: string;
    name: string;
    createdBy?: string;
    expiresAt?: Date | null;
    allowedIps?: string[];
  }): Promise<{
    key: AiApiKey;
    rawKey: string;
  }> {
    const plan = await prisma.aiApiPlan.findFirst({
      where: { id: params.planId, tenantId: params.tenantId, isActive: true },
    });

    if (!plan) {
      throw new Error('Active API plan not found');
    }

    const randomPart = randomBytes(28).toString('base64url');
    const rawKey = `duai_${params.tenantId.slice(0, 8)}_${randomPart}`;
    const keyPrefix = rawKey.slice(0, 18);
    const keyHash = hashKey(rawKey);

    const key = await prisma.aiApiKey.create({
      data: {
        tenantId: params.tenantId,
        planId: params.planId,
        name: params.name,
        keyPrefix,
        keyHash,
        createdBy: params.createdBy,
        expiresAt: params.expiresAt ?? undefined,
        allowedIps: params.allowedIps && params.allowedIps.length ? params.allowedIps : undefined,
      },
    });

    return { key, rawKey };
  }

  async revokeApiKey(params: { tenantId: string; keyId: string }): Promise<AiApiKey> {
    const current = await prisma.aiApiKey.findFirst({
      where: { id: params.keyId, tenantId: params.tenantId },
    });

    if (!current) {
      throw new Error('API key not found');
    }

    return prisma.aiApiKey.update({
      where: { id: params.keyId },
      data: { status: AiApiKeyStatus.REVOKED },
    });
  }

  async authenticatePublicKey(params: {
    rawKey: string;
    ipAddress?: string;
  }): Promise<{
    apiKey: AiApiKey;
    plan: AiApiPlan;
  }> {
    const keyHash = hashKey(params.rawKey);
    const record = await prisma.aiApiKey.findUnique({
      where: { keyHash },
      include: { plan: true },
    });

    if (!record) {
      throw new Error('Invalid API key');
    }

    if (record.status !== AiApiKeyStatus.ACTIVE) {
      throw new Error('API key is not active');
    }

    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      await prisma.aiApiKey.update({
        where: { id: record.id },
        data: { status: AiApiKeyStatus.EXPIRED },
      });
      throw new Error('API key expired');
    }

    const allowedIps = parseAllowedIps(record.allowedIps);
    if (allowedIps.length && params.ipAddress && !allowedIps.includes(params.ipAddress)) {
      throw new Error('IP address is not allowed for this API key');
    }

    if (!record.plan || !record.plan.isActive) {
      throw new Error('API plan is not active');
    }

    await this.enforceRequestRate(record.id, record.plan.requestLimitPerMinute);
    await this.enforceMonthlyBudget(record.plan.id, record.plan.monthlyBudgetTokens);

    await prisma.aiApiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      apiKey: record,
      plan: record.plan,
    };
  }

  async recordUsage(params: {
    tenantId: string;
    planId?: string;
    apiKeyId?: string;
    conversationId?: string;
    userId?: string;
    source: string;
    model?: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostCents?: number;
  }): Promise<void> {
    await prisma.aiTokenUsage.create({
      data: {
        tenantId: params.tenantId,
        planId: params.planId,
        apiKeyId: params.apiKeyId,
        conversationId: params.conversationId,
        userId: params.userId,
        source: params.source,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        totalTokens: params.totalTokens,
        estimatedCostCents: params.estimatedCostCents ?? 0,
      },
    });
  }

  async getUsageSummary(params: {
    tenantId: string;
    from?: Date;
    to?: Date;
    apiKeyId?: string;
  }): Promise<{
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCostCents: number;
    totalRequests: number;
  }> {
    const from = params.from ?? startOfCurrentMonth();
    const to = params.to ?? new Date();

    const rows = await prisma.aiTokenUsage.findMany({
      where: {
        tenantId: params.tenantId,
        createdAt: {
          gte: from,
          lte: to,
        },
        ...(params.apiKeyId ? { apiKeyId: params.apiKeyId } : {}),
      },
      select: {
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
        estimatedCostCents: true,
      },
    });

    return rows.reduce(
      (acc, row) => {
        acc.totalRequests += 1;
        acc.totalTokens += row.totalTokens;
        acc.totalInputTokens += row.inputTokens;
        acc.totalOutputTokens += row.outputTokens;
        acc.estimatedCostCents += row.estimatedCostCents;
        return acc;
      },
      {
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostCents: 0,
        totalRequests: 0,
      },
    );
  }

  private async enforceRequestRate(apiKeyId: string, maxPerMinute: number): Promise<void> {
    const windowStart = new Date(Date.now() - 60_000);
    const currentCount = await prisma.aiTokenUsage.count({
      where: {
        apiKeyId,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (currentCount >= maxPerMinute) {
      throw new Error('Rate limit exceeded for this API key');
    }
  }

  private async enforceMonthlyBudget(planId: string, monthlyBudgetTokens: number): Promise<void> {
    const monthStart = startOfCurrentMonth();
    const rows = await prisma.aiTokenUsage.aggregate({
      _sum: { totalTokens: true },
      where: {
        planId,
        createdAt: {
          gte: monthStart,
        },
      },
    });

    const consumed = rows._sum.totalTokens ?? 0;
    if (consumed >= monthlyBudgetTokens) {
      throw new Error('Monthly token budget exceeded for this plan');
    }
  }
}

export const apiKeyService = new ApiKeyService();
