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
const AI_PROXY_TIMEOUT_MS = Number.parseInt(process.env.AI_PROXY_TIMEOUT_MS || '150000', 10);
const superAdminOnly = requireMinRole(UserRole.SUPER_ADMIN);

const aiClient: AxiosInstance = axios.create({
  baseURL: AI_API_URL,
  timeout: Number.isFinite(AI_PROXY_TIMEOUT_MS) && AI_PROXY_TIMEOUT_MS > 0 ? AI_PROXY_TIMEOUT_MS : 150_000,
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
      code: error.code,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

function buildProxyHeaders(req: Request): Record<string, string> {
  const auth = req as Partial<AuthenticatedRequest>;
  const userId = auth.userId;
  const userName = auth.user?.name;
  const departmentId = auth.user?.departmentId;
  const tenantHeader = req.headers['x-tenant-id'];
  const tenantId =
    typeof tenantHeader === 'string' && tenantHeader.trim() ? tenantHeader.trim() : 'default';

  return {
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(userName ? { 'x-user-name': userName } : {}),
    ...(departmentId ? { 'x-department-id': departmentId } : {}),
    'x-tenant-id': tenantId,
  };
}

async function proxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  path?: string,
): Promise<void> {
  try {
    const upstream = await aiClient.request({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      url: path || req.path,
      params: req.query,
      data: req.body,
      headers: buildProxyHeaders(req),
    });

    res.status(upstream.status).json(upstream.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
        return;
      }

      if (error.code === 'ECONNABORTED') {
        res.status(504).json({ error: 'Tempo limite ao consultar a IA centralizada' });
        return;
      }

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET'
      ) {
        res.status(503).json({ error: 'IA centralizada indisponivel no momento' });
        return;
      }

      logger.error('[AIProxy] Unexpected Axios error without response', {
        url: path || req.path,
        code: error.code,
        message: error.message,
      });
      return;
    }
    next(error);
  }
}

async function proxyStreamRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  path?: string,
): Promise<void> {
  try {
    const upstream = await aiClient.request<NodeJS.ReadableStream>({
      method: req.method as 'POST',
      url: path || req.path,
      params: req.query,
      data: req.body,
      headers: buildProxyHeaders(req),
      responseType: 'stream',
    });

    res.status(upstream.status);
    const contentType = upstream.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const upstreamStream = upstream.data as any;
    req.on('close', () => {
      if (typeof upstreamStream.destroy === 'function') {
        upstreamStream.destroy();
      }
    });
    upstreamStream.on('error', (error: Error) => {
      logger.error('[AIProxy] Stream forwarding failed', {
        url: path || req.path,
        message: error.message,
      });
      if (!res.writableEnded) {
        if (res.headersSent) {
          res.write(`${JSON.stringify({ type: 'error', error: 'Falha no stream da IA centralizada' })}\n`);
        }
        res.end();
      }
    });
    upstreamStream.pipe(res);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (!res.headersSent) {
          res.status(error.response.status).json({ error: 'Falha no stream da IA centralizada' });
        } else if (!res.writableEnded) {
          res.write(`${JSON.stringify({ type: 'error', error: 'Falha no stream da IA centralizada' })}\n`);
          res.end();
        }
        return;
      }

      if (error.code === 'ECONNABORTED') {
        if (!res.headersSent) {
          res.status(504).json({ error: 'Tempo limite ao consultar a IA centralizada' });
        } else if (!res.writableEnded) {
          res.write(`${JSON.stringify({ type: 'error', error: 'Tempo limite ao consultar a IA centralizada' })}\n`);
          res.end();
        }
        return;
      }

      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET'
      ) {
        if (!res.headersSent) {
          res.status(503).json({ error: 'IA centralizada indisponivel no momento' });
        } else if (!res.writableEnded) {
          res.write(`${JSON.stringify({ type: 'error', error: 'IA centralizada indisponivel no momento' })}\n`);
          res.end();
        }
        return;
      }
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
router.post('/conversations/:id/messages/stream', (req, res, next) =>
  proxyStreamRequest(req, res, next, `/conversations/${req.params.id}/messages/stream`));
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

router.get('/provider/settings', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/provider/settings'));
router.put('/provider/settings', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/provider/settings'));
router.post('/provider/test', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/provider/test'));
router.post('/provider/models', superAdminOnly, (req, res, next) =>
  proxyRequest(req, res, next, '/provider/models'));

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
