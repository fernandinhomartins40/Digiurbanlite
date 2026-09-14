/**
 * Proxy routes for digiurban-flow (internal processes module).
 * Prefix in backend: /api/flow
 */
import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosInstance } from 'axios';
import { SituacaoVinculo } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import logger from '../config/logger.config';
import { AuthenticatedRequest } from '../types/middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Otimização VPS (docs/PLANO-OTIMIZACAO-VPS.md, A2): o serviço digiurban-flow não está no
// compose nem no CI, mas ESTA ROTA TEM CONSUMIDOR VIVO (frontend/lib/flow-client.ts).
// Sem FLOW_API_URL explícita, responder 503 imediato em vez de pendurar 30 s por requisição.
const FLOW_API_URL = process.env.FLOW_API_URL ?? '';
const FLOW_CONFIGURED = FLOW_API_URL.length > 0;
const FLOW_SERVICE_TOKEN = process.env.FLOW_SERVICE_TOKEN ?? '';
const ACTIVE_ASSIGNMENT_STATUSES: SituacaoVinculo[] = [
  SituacaoVinculo.ATIVO,
  SituacaoVinculo.AFASTADO,
  SituacaoVinculo.LICENCA,
];

interface FlowProxyAuthContext {
  userId: string;
  userName: string;
  userRole: string;
  departmentId?: string;
  departmentIds: string[];
  organizationalUnitIds: string[];
  canAccessConfidential: boolean;
}

const flowClient: AxiosInstance = axios.create({
  baseURL: FLOW_API_URL,
  timeout: 30_000,
  headers: {
    'x-digiurban-flow-token': FLOW_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
});

flowClient.interceptors.response.use(
  (res) => res,
  (err) => {
    logger.warn('[FlowProxy] Upstream error', {
      url: err.config?.url,
      status: err.response?.status,
      message: err.message,
    });
    return Promise.reject(err);
  },
);

function isPrivilegedRole(role?: string): boolean {
  const normalizedRole = (role || '').toUpperCase();
  return normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN';
}

function normalizeIdList(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

function normalizeWorkflowStepsPayload(rawSteps: unknown): unknown {
  if (!Array.isArray(rawSteps)) {
    return rawSteps;
  }

  return rawSteps.map((rawStep) => {
    if (!rawStep || typeof rawStep !== 'object') {
      return rawStep;
    }

    const step = rawStep as Record<string, unknown>;
    const organizationalUnitId =
      typeof step.organizationalUnitId === 'string' ? step.organizationalUnitId : '';
    const organizationalUnitName =
      typeof step.organizationalUnitName === 'string' ? step.organizationalUnitName : '';

    return {
      ...step,
      organizationalUnitId,
      organizationalUnitName,
    };
  });
}

function normalizeProxyBody(path: string, method: string, body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  const payload = { ...(body as Record<string, unknown>) };

  if (
    (path === '/workflows/templates' && method === 'POST') ||
    (path.startsWith('/workflows/templates/') && method === 'PUT')
  ) {
    payload.steps = normalizeWorkflowStepsPayload(payload.steps);
  }

  return payload;
}

function normalizeProxyQuery(path: string, query: Request['query']): Record<string, unknown> {
  return { ...(query as Record<string, unknown>) };
}

async function buildFlowProxyAuthContext(req: AuthenticatedRequest): Promise<FlowProxyAuthContext> {
  const userId = req.userId;
  const userRole = req.userRole || req.user?.role || 'USER';
  const userName = req.user?.name || 'Servidor';
  const privileged = isPrivilegedRole(userRole);

  if (!userId) {
    throw new Error('Requisicao sem usuario autenticado');
  }

  if (privileged) {
    const [departments, units] = await Promise.all([
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
      prisma.organizationalUnit.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
    ]);

    const departmentIds = departments.map((department) => department.id);
    const organizationalUnitIds = units.map((unit) => unit.id);

    return {
      userId,
      userName,
      userRole,
      departmentId: req.user?.departmentId || departmentIds[0],
      departmentIds,
      organizationalUnitIds,
      canAccessConfidential: true,
    };
  }

  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      departmentId: true,
      userDepartments: {
        where: { isActive: true },
        select: { departmentId: true },
      },
      assignments: {
        where: {
          situacao: { in: ACTIVE_ASSIGNMENT_STATUSES },
        },
        select: {
          departmentId: true,
          organizationalUnitId: true,
        },
      },
      unidadesResponsavel: {
        select: {
          id: true,
          departmentId: true,
        },
      },
    },
  });

  const departmentIds = normalizeIdList([
    req.user?.departmentId,
    userProfile?.departmentId,
    ...(userProfile?.userDepartments.map((department) => department.departmentId) || []),
    ...(userProfile?.assignments.map((assignment) => assignment.departmentId) || []),
    ...(userProfile?.unidadesResponsavel.map((unit) => unit.departmentId) || []),
  ]);

  const organizationalUnitIds = normalizeIdList([
    ...(userProfile?.assignments.map((assignment) => assignment.organizationalUnitId) || []),
    ...(userProfile?.unidadesResponsavel.map((unit) => unit.id) || []),
  ]);

  return {
    userId,
    userName,
    userRole,
    departmentId: req.user?.departmentId || userProfile?.departmentId || departmentIds[0],
    departmentIds,
    organizationalUnitIds,
    canAccessConfidential: false,
  };
}

function buildProxyHeaders(context: FlowProxyAuthContext, tenantId?: string): Record<string, string> {
  return {
    'x-tenant-id': tenantId || 'default', // Fase 4 Multi-Tenant
    'x-user-id': context.userId,
    'x-user-name': context.userName,
    'x-user-role': context.userRole,
    ...(context.departmentId ? { 'x-department-id': context.departmentId } : {}),
    ...(context.departmentIds.length > 0
      ? { 'x-department-ids': context.departmentIds.join(',') }
      : {}),
    ...(context.organizationalUnitIds.length > 0
      ? { 'x-organizational-unit-ids': context.organizationalUnitIds.join(',') }
      : {}),
    'x-access-confidential': context.canAccessConfidential ? '1' : '0',
  };
}

function ensureFlowServiceToken(res: Response): boolean {
  // Otimização VPS (docs/PLANO-OTIMIZACAO-VPS.md, A2): o serviço digiurban-flow não está
  // no compose nem no CI. Sem FLOW_API_URL explícita, falhar AQUI (503 imediato) em vez de
  // deixar o axios pendurar 30 s por requisição contra um host inexistente.
  // Este guard fica no ponto único por onde as 3 chamadas do proxy passam.
  if (!FLOW_CONFIGURED) {
    res.status(503).json({
      error: 'Módulo de Processos Internos indisponível',
      detail: 'O serviço digiurban-flow não está configurado neste ambiente (FLOW_API_URL ausente).',
      code: 'FLOW_SERVICE_NOT_CONFIGURED',
    });
    return false;
  }

  if (FLOW_SERVICE_TOKEN) {
    return true;
  }

  logger.error('[FlowProxy] FLOW_SERVICE_TOKEN is not configured');
  res.status(500).json({ error: 'FLOW_SERVICE_TOKEN nao configurado' });
  return false;
}

router.use(adminAuthMiddleware);

async function proxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  path: string,
): Promise<void> {
  if (!ensureFlowServiceToken(res)) {
    return;
  }

  try {
    const auth = await buildFlowProxyAuthContext(req as AuthenticatedRequest);
    const normalizedBody = normalizeProxyBody(path, req.method.toUpperCase(), req.body);
    const normalizedQuery = normalizeProxyQuery(path, req.query);

    const upstream = await flowClient.request({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      url: path,
      params: normalizedQuery,
      data: normalizedBody,
      headers: buildProxyHeaders(auth, (req as any).tenantId),
    });

    res.status(upstream.status).json(upstream.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
      return;
    }
    next(err);
  }
}

router.get('/health', (_req, res) => {
  if (!ensureFlowServiceToken(res)) {
    return;
  }

  flowClient
    .get('/health')
    .then((response) => res.json(response.data))
    .catch(() => res.status(503).json({ status: 'unavailable' }));
});

router.post('/processes', (req, res, next) => proxyRequest(req, res, next, '/processes'));
router.get('/processes', (req, res, next) => proxyRequest(req, res, next, '/processes'));
router.get('/processes/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}`));
router.patch('/processes/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}`));
router.delete('/processes/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}`));

router.post('/processes/:id/dispatch', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/dispatch`));
router.post('/processes/:id/return', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/return`));
router.post('/processes/:id/reassign', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/reassign`));
router.post('/processes/:id/conclude', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/conclude`));
router.post('/processes/:id/archive', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/archive`));

router.post('/processes/:id/documents/generate', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/documents/generate`));
router.get('/processes/:id/documents', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/documents`));
router.post('/processes/:id/documents/upload', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/documents/upload`));

router.get('/inbox', (req, res, next) => proxyRequest(req, res, next, '/inbox'));
router.get('/inbox/count', (req, res, next) => proxyRequest(req, res, next, '/inbox/count'));
router.post('/inbox/read-all', (req, res, next) => proxyRequest(req, res, next, '/inbox/read-all'));

router.post('/workflows/templates', (req, res, next) =>
  proxyRequest(req, res, next, '/workflows/templates'));
router.get('/workflows/templates', (req, res, next) =>
  proxyRequest(req, res, next, '/workflows/templates'));
router.get('/workflows/templates/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/templates/${req.params.id}`));
router.put('/workflows/templates/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/templates/${req.params.id}`));
router.delete('/workflows/templates/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/templates/${req.params.id}`));
router.post('/workflows/instances', (req, res, next) =>
  proxyRequest(req, res, next, '/workflows/instances'));
router.post('/workflows/instances/:id/advance', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/instances/${req.params.id}/advance`));

router.post('/process-types', (req, res, next) => proxyRequest(req, res, next, '/process-types'));
router.get('/process-types', (req, res, next) => proxyRequest(req, res, next, '/process-types'));
router.get('/process-types/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/process-types/${req.params.id}`));
router.put('/process-types/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/process-types/${req.params.id}`));

router.get('/processes/:id/comments', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/comments`));
router.post('/processes/:id/comments', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/comments`));
router.patch('/comments/:commentId', (req, res, next) =>
  proxyRequest(req, res, next, `/comments/${req.params.commentId}`));
router.delete('/comments/:commentId', (req, res, next) =>
  proxyRequest(req, res, next, `/comments/${req.params.commentId}`));

router.get('/processes/:id/signatures', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/signatures`));
router.post('/processes/:id/signatures', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/signatures`));
router.post('/signatures/:signatureId/confirm', (req, res, next) =>
  proxyRequest(req, res, next, `/signatures/${req.params.signatureId}/confirm`));
router.post('/signatures/:signatureId/reject', (req, res, next) =>
  proxyRequest(req, res, next, `/signatures/${req.params.signatureId}/reject`));
router.post('/dispatches/:dispatchId/read', (req, res, next) =>
  proxyRequest(req, res, next, `/dispatches/${req.params.dispatchId}/read`));

router.get('/analytics/dashboard', (req, res, next) =>
  proxyRequest(req, res, next, '/analytics/dashboard'));
router.get('/analytics/sla', (req, res, next) => proxyRequest(req, res, next, '/analytics/sla'));
router.get('/analytics/bottlenecks', (req, res, next) =>
  proxyRequest(req, res, next, '/analytics/bottlenecks'));

router.get('/analytics/export/csv', async (req: Request, res: Response, next: NextFunction) => {
  if (!ensureFlowServiceToken(res)) {
    return;
  }

  try {
    const auth = await buildFlowProxyAuthContext(req as AuthenticatedRequest);
    const normalizedQuery = normalizeProxyQuery('/analytics/export/csv', req.query);

    const upstream = await flowClient.request({
      method: 'GET',
      url: '/analytics/export/csv',
      params: normalizedQuery,
      headers: buildProxyHeaders(auth, (req as any).tenantId),
      responseType: 'arraybuffer',
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="processos_internos.csv"');
    res.send(Buffer.from(upstream.data));
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
      return;
    }
    next(err);
  }
});

export default router;
