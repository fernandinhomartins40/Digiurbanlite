import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as os from 'os';
import { searchPrices } from '../../services/search.service';
import { parseUploadedFile, runBatchSearch, cleanupTempFile } from '../../services/batch-search.service';
import { recordSearchAudit } from '../../services/audit.service';
import { searchRateLimiter, batchRateLimiter } from '../middlewares/rate-limit.middleware';
import { logger } from '../../utils/logger';

const router = Router();

// Configurar multer para upload de arquivos batch
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV, XLSX ou JSON são aceitos.'));
    }
  },
});

// POST /api/v1/search — busca por item (texto livre)
router.post('/search', searchRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      query,
      filters = {},
      period,
      page = 1,
      page_size: pageSize = 20,
    } = req.body as {
      query: string;
      filters?: Record<string, unknown>;
      period?: { from?: string; to?: string };
      page?: number;
      page_size?: number;
    };

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({ error: 'query deve ter pelo menos 2 caracteres' });
      return;
    }

    const result = await searchPrices(
      query.trim(),
      filters,
      period,
      Math.max(1, page),
      Math.min(50, Math.max(1, pageSize)),
    );

    // Registrar auditoria (não aguarda para não atrasar resposta)
    const userId = req.headers['x-user-id'] as string | undefined;
    recordSearchAudit(result, {
      userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      filters,
      period,
    }).catch((err) => logger.warn('[Search] Audit error', { err }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/search/batch — busca por lista (multipart CSV/XLSX ou JSON body)
router.post(
  '/search/batch',
  batchRateLimiter,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    let tempFilePath: string | undefined;

    try {
      const { filters = {}, period } = req.body as {
        filters?: Record<string, unknown>;
        period?: { from?: string; to?: string };
      };

      let items: { item: string; quantity?: number; unit?: string }[] = [];

      if (req.file) {
        // Upload via multipart
        tempFilePath = req.file.path;
        items = parseUploadedFile(req.file.path, req.file.mimetype);
      } else if (req.body.items) {
        // JSON body
        const rawItems = typeof req.body.items === 'string'
          ? JSON.parse(req.body.items)
          : req.body.items;

        if (!Array.isArray(rawItems)) {
          res.status(400).json({ error: 'items deve ser um array' });
          return;
        }

        items = rawItems.map((i: unknown) => {
          if (typeof i === 'string') return { item: i };
          const obj = i as Record<string, unknown>;
          return {
            item: String(obj.item ?? obj.descricao ?? obj.description ?? ''),
            quantity: obj.quantity ? Number(obj.quantity) : undefined,
            unit: obj.unit ? String(obj.unit) : undefined,
          };
        }).filter((i) => i.item.trim().length > 0);
      } else {
        res.status(400).json({ error: 'Envie um arquivo (file) ou um JSON com campo items[]' });
        return;
      }

      if (items.length === 0) {
        res.status(400).json({ error: 'Nenhum item válido encontrado no arquivo ou lista' });
        return;
      }

      const result = await runBatchSearch(items, filters, period);

      res.json(result);
    } catch (err) {
      next(err);
    } finally {
      if (tempFilePath) cleanupTempFile(tempFilePath);
    }
  },
);

export default router;
