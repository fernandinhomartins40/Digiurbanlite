/**
 * Proxy routes para o módulo digiurban-prices
 * O backend do DigiUrban repassa as requisições para o módulo de preços,
 * adicionando autenticação interna.
 *
 * Prefixo registrado em index.ts: /api/prices
 */
import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosInstance } from 'axios';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import logger from '../config/logger.config';
import { AuthenticatedRequest } from '../types/middleware';

const router = Router();

const PRICES_API_URL = process.env.PRICES_API_URL ?? 'http://digiurban-prices:9002/api/v1';
const PRICES_API_KEY = process.env.DIGIURBAN_API_KEY ?? '';

// Cliente HTTP para o módulo de preços
const pricesClient: AxiosInstance = axios.create({
  baseURL: PRICES_API_URL,
  timeout: 30_000,
  headers: {
    'x-digiurban-key': PRICES_API_KEY,
    'Content-Type': 'application/json',
  },
});

pricesClient.interceptors.response.use(
  (res) => res,
  (err) => {
    logger.warn('[PricesProxy] Upstream error', {
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
// Proxy genérico — repassa método + body + query
// ─────────────────────────────────────────────

async function proxyRequest(
  req: Request,
  res: Response,
  next: NextFunction,
  path: string,
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const upstream = await pricesClient.request({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      url: path,
      params: req.query,
      data: req.body,
      headers: {
        ...(userId ? { 'x-user-id': userId } : {}),
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

// GET /api/prices/health
router.get('/health', (_req, res) => {
  pricesClient
    .get('/health')
    .then((r) => res.json(r.data))
    .catch(() => res.status(503).json({ status: 'unavailable' }));
});

// POST /api/prices/search
router.post('/search', (req, res, next) => proxyRequest(req, res, next, '/search'));

// POST /api/prices/search/batch
router.post('/search/batch', (req, res, next) =>
  proxyRequest(req, res, next, '/search/batch'),
);

// POST /api/prices/reports/price-research
router.post('/reports/price-research', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const upstream = await pricesClient.request({
      method: 'POST',
      url: '/reports/price-research',
      data: req.body,
      headers: {
        ...(userId ? { 'x-user-id': userId } : {}),
      },
      responseType: 'stream',
    });
    res.setHeader('Content-Type', upstream.headers['content-type'] ?? 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      upstream.headers['content-disposition'] ?? 'attachment; filename="pesquisa_precos.pdf"',
    );
    if (upstream.headers['x-audit-id']) {
      res.setHeader('X-Audit-Id', upstream.headers['x-audit-id']);
    }
    upstream.data.pipe(res);
  } catch (err) {
    next(err);
  }
});

// GET /api/prices/audits
router.get('/audits', (req, res, next) => proxyRequest(req, res, next, '/audits'));

// GET /api/prices/ingest/status
router.get('/ingest/status', (req, res, next) =>
  proxyRequest(req, res, next, '/ingest/status'),
);

// POST /api/prices/ingest/run
router.post('/ingest/run', (req, res, next) =>
  proxyRequest(req, res, next, '/ingest/run'),
);

// GET /api/prices/catmat/search
router.get('/catmat/search', (req, res, next) =>
  proxyRequest(req, res, next, '/catmat/search'),
);

// POST /api/prices/catmat/sync
router.post('/catmat/sync', (req, res, next) =>
  proxyRequest(req, res, next, '/catmat/sync'),
);

// GET /api/prices/suppliers/map
router.get('/suppliers/map', (req, res, next) =>
  proxyRequest(req, res, next, '/suppliers/map'),
);

// GET /api/prices/coverage
router.get('/coverage', (req, res, next) =>
  proxyRequest(req, res, next, '/coverage'),
);

export default router;
