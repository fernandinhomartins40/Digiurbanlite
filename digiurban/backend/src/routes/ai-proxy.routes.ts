import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosInstance } from 'axios';
import { UserRole } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { requireMinRole } from '../middleware/admin-auth';
import internalAuthMiddleware from '../middleware/internal-auth';
import logger from '../config/logger.config';
import { AuthenticatedRequest } from '../types/middleware';

const router = Router();

const AI_API_URL = process.env.AI_API_URL ?? 'http://digiurban-ai:9004/api/v1';
const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN ?? '';
const superAdminOnly = requireMinRole(UserRole.SUPER_ADMIN);

const aiClient: AxiosInstance = axios.create({
  baseURL: AI_API_URL,
  timeout: 120_000,
  headers: {
    'x-digiurban-ai-token': AI_SERVICE_TOKEN,
    'Content-Type': 'application/json',
  },
});

aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.warn('[AIProxy] Upstream error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

async function proxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  path?: string,
): Promise<void> {
  try {
    const auth = req as Partial<AuthenticatedRequest>;
    const userId = auth.userId;
    const userName = auth.user?.name;
    const departmentId = auth.user?.departmentId;
    const tenantHeader = req.headers['x-tenant-id'];
    const tenantId =
      typeof tenantHeader === 'string' && tenantHeader.trim() ? tenantHeader.trim() : 'default';

    const upstream = await aiClient.request({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      url: path || req.path,
      params: req.query,
      data: req.body,
      headers: {
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(userName ? { 'x-user-name': userName } : {}),
        ...(departmentId ? { 'x-department-id': departmentId } : {}),
        'x-tenant-id': tenantId,
      },
    });

    res.status(upstream.status).json(upstream.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
      return;
    }
    next(error);
  }
}

// Health route sem autenticação (monitoramento)
router.get('/health', (_req, res) => {
  aiClient
    .get('/health')
    .then((response) => res.json(response.data))
    .catch(() => res.status(503).json({ status: 'unavailable' }));
});

// API pública de municípios (chave própria x-api-key)
router.post('/public/chat/completions', (req, res, next) =>
  proxyRequest(req, res, next, '/public/chat/completions'));

// API interna de serviços/módulos (token interno)
router.post('/internal/chat/completions', internalAuthMiddleware, (req, res, next) =>
  proxyRequest(req, res, next, '/internal/chat/completions'));

// Rotas administrativas (exigem autenticação admin)
router.use(adminAuthMiddleware);

router.get('/conversations', (req, res, next) => proxyRequest(req, res, next, '/conversations'));
router.post('/conversations', (req, res, next) => proxyRequest(req, res, next, '/conversations'));
router.get('/conversations/:id', (req, res, next) =>
  proxyRequest(req, res, next, `/conversations/${req.params.id}`));
router.post('/conversations/:id/messages', (req, res, next) =>
  proxyRequest(req, res, next, `/conversations/${req.params.id}/messages`));
router.post('/chat/completions', (req, res, next) =>
  proxyRequest(req, res, next, '/chat/completions'));
router.get('/usage/summary', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/usage/summary'));

router.get('/knowledge/sources', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/knowledge/sources'));
router.post('/knowledge/sources', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/knowledge/sources'));
router.put('/knowledge/sources/:id', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, `/knowledge/sources/${req.params.id}`));
router.post('/knowledge/sources/:id/ingest', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, `/knowledge/sources/${req.params.id}/ingest`));
router.post('/knowledge/bootstrap/system', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/knowledge/bootstrap/system'));
router.get('/knowledge/search', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/knowledge/search'));

router.get('/tokens/plans', superAdminOnly, (req, res, next) => proxyRequest(req, res, next, '/tokens/plans'));
router.post('/tokens/plans', superAdminOnly, (req, res, next) => proxyRequest(req, res, next, '/tokens/plans'));
router.put('/tokens/plans/:id', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, `/tokens/plans/${req.params.id}`));
router.get('/tokens/keys', superAdminOnly, (req, res, next) => proxyRequest(req, res, next, '/tokens/keys'));
router.post('/tokens/keys', superAdminOnly, (req, res, next) => proxyRequest(req, res, next, '/tokens/keys'));
router.post('/tokens/keys/:id/revoke', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, `/tokens/keys/${req.params.id}/revoke`));
router.get('/tokens/usage', superAdminOnly, (req, res, next) => proxyRequest(req, res, next, '/tokens/usage'));

export default router;
