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

// Otimização VPS (docs/PLANO-OTIMIZACAO-VPS.md, A2): o serviço digiurban-prices não está
// no compose nem no CI, mas ESTA ROTA TEM CONSUMIDOR VIVO (frontend/lib/prices-client.ts).
// Sem PRICES_API_URL explícita, responder 503 imediato em vez de pendurar 30 s.
const PRICES_API_URL = process.env.PRICES_API_URL ?? '';
const PRICES_CONFIGURED = PRICES_API_URL.length > 0;
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
  // Otimização VPS (A2): módulo de preços não configurado → falha rápida e explícita.
  if (!PRICES_CONFIGURED) {
    res.status(503).json({
      error: 'Módulo de Pesquisa de Preços indisponível',
      detail: 'O serviço digiurban-prices não está configurado neste ambiente (PRICES_API_URL ausente).',
      code: 'PRICES_SERVICE_NOT_CONFIGURED',
    });
    return;
  }

  try {
    const userId = (req as AuthenticatedRequest).userId;
    const upstream = await pricesClient.request({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      url: path,
      params: req.query,
      data: req.body,
      headers: {
        'x-tenant-id': (req as any).tenantId || 'default', // Fase 4 Multi-Tenant
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
        'x-tenant-id': (req as any).tenantId || 'default', // Fase 4 Multi-Tenant
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
