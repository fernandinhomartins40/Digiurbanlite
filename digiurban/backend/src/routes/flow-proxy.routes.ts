/**
 * Proxy routes para o módulo digiurban-flow (Processos Internos)
 * O backend do DigiUrban repassa as requisições para o módulo flow,
 * adicionando autenticação e dados do usuário.
 *
 * Prefixo registrado em index.ts: /api/flow
 */
import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosInstance } from 'axios';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import logger from '../config/logger.config';
import { AuthenticatedRequest } from '../types/middleware';

const router = Router();

const FLOW_API_URL = process.env.FLOW_API_URL ?? 'http://digiurban-flow:9003/api/v1';
const FLOW_SERVICE_TOKEN = process.env.FLOW_SERVICE_TOKEN ?? '';

// Cliente HTTP para o módulo flow
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

// Middleware: requer autenticação de admin
router.use(adminAuthMiddleware);

// ─────────────────────────────────────────────
// Proxy genérico — repassa método + body + query + user info
// ─────────────────────────────────────────────

async function proxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  path: string,
): Promise<void> {
  try {
    const auth = req as AuthenticatedRequest;
    const userId = auth.userId;
    const userName = auth.user?.name || 'Servidor';
    const departmentId = auth.user?.departmentId;
    const upstream = await flowClient.request({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      url: path,
      params: req.query,
      data: req.body,
      headers: {
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(userName ? { 'x-user-name': userName } : {}),
        ...(departmentId ? { 'x-department-id': departmentId } : {}),
      },
    });
    res.status(upstream.status).json(upstream.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      next(err);
    }
  }
}

// ─────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────
router.get('/health', (_req, res) => {
  flowClient
    .get('/health')
    .then((r) => res.json(r.data))
    .catch(() => res.status(503).json({ status: 'unavailable' }));
});

// ─────────────────────────────────────────────
// Processos
// ─────────────────────────────────────────────
router.post('/processes', (req, res, next) => proxyRequest(req, res, next, '/processes'));
router.get('/processes', (req, res, next) => proxyRequest(req, res, next, '/processes'));
router.get('/processes/:id', (req, res, next) => proxyRequest(req, res, next, `/processes/${req.params.id}`));
router.patch('/processes/:id', (req, res, next) => proxyRequest(req, res, next, `/processes/${req.params.id}`));
router.delete('/processes/:id', (req, res, next) => proxyRequest(req, res, next, `/processes/${req.params.id}`));

// ─────────────────────────────────────────────
// Tramitação / Despacho
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Documentos
// ─────────────────────────────────────────────
router.post('/processes/:id/documents/generate', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/documents/generate`));
router.get('/processes/:id/documents', (req, res, next) =>
  proxyRequest(req, res, next, `/processes/${req.params.id}/documents`));

// ─────────────────────────────────────────────
// Caixa de Entrada
// ─────────────────────────────────────────────
router.get('/inbox', (req, res, next) => proxyRequest(req, res, next, '/inbox'));
router.get('/inbox/count', (req, res, next) => proxyRequest(req, res, next, '/inbox/count'));

// ─────────────────────────────────────────────
// Workflows
// ─────────────────────────────────────────────
router.post('/workflows/templates', (req, res, next) =>
  proxyRequest(req, res, next, '/workflows/templates'));
router.get('/workflows/templates', (req, res, next) =>
  proxyRequest(req, res, next, '/workflows/templates'));
router.get('/workflows/templates/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/templates/${req.params.id}`));
router.put('/workflows/templates/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/templates/${req.params.id}`));
router.post('/workflows/instances', (req, res, next) =>
  proxyRequest(req, res, next, '/workflows/instances'));
router.post('/workflows/instances/:id/advance', (req, res, next) =>
  proxyRequest(req, res, next, `/workflows/instances/${req.params.id}/advance`));

// ─────────────────────────────────────────────
// Tipos de Processo
// ─────────────────────────────────────────────
router.post('/process-types', (req, res, next) => proxyRequest(req, res, next, '/process-types'));
router.get('/process-types', (req, res, next) => proxyRequest(req, res, next, '/process-types'));
router.get('/process-types/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/process-types/${req.params.id}`));
router.put('/process-types/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/process-types/${req.params.id}`));

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────
router.get('/analytics/dashboard', (req, res, next) =>
  proxyRequest(req, res, next, '/analytics/dashboard'));
router.get('/analytics/sla', (req, res, next) =>
  proxyRequest(req, res, next, '/analytics/sla'));
router.get('/analytics/bottlenecks', (req, res, next) =>
  proxyRequest(req, res, next, '/analytics/bottlenecks'));
router.get('/analytics/export/csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req as AuthenticatedRequest;
    const upstream = await flowClient.request({
      method: 'GET',
      url: '/analytics/export/csv',
      params: req.query,
      headers: {
        ...(auth.userId ? { 'x-user-id': auth.userId } : {}),
      },
      responseType: 'arraybuffer',
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="processos_internos.csv"');
    res.send(Buffer.from(upstream.data));
  } catch (err) {
    next(err);
  }
});

export default router;
