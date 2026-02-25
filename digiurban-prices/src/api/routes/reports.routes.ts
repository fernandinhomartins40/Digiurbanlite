import { Router, Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import { searchPrices } from '../../services/search.service';
import { generatePriceReport } from '../../services/report.service';
import { recordSearchAudit } from '../../services/audit.service';
import { reportRateLimiter } from '../middlewares/rate-limit.middleware';
import { logger } from '../../utils/logger';

const router = Router();

// POST /api/v1/reports/price-research
router.post(
  '/reports/price-research',
  reportRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        query,
        filters = {},
        period,
        format = 'pdf',
      } = req.body as {
        query: string;
        filters?: Record<string, unknown>;
        period?: { from?: string; to?: string };
        format?: 'pdf' | 'html';
      };

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'query deve ter pelo menos 2 caracteres' });
        return;
      }

      if (!['pdf', 'html'].includes(format)) {
        res.status(400).json({ error: 'format deve ser "pdf" ou "html"' });
        return;
      }

      // Busca com mais resultados para o relatório
      const searchResult = await searchPrices(query.trim(), filters, period, 1, 50);

      const report = await generatePriceReport({
        query: query.trim(),
        searchResult,
        format: format as 'pdf' | 'html',
      });

      // Registrar auditoria
      const userId = req.headers['x-user-id'] as string | undefined;
      recordSearchAudit(searchResult, {
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        filters,
        period,
        reportGenerated: true,
      }).catch((err) => logger.warn('[Report] Audit error', { err }));

      // Enviar arquivo
      const contentType = format === 'pdf' ? 'application/pdf' : 'text/html; charset=utf-8';
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.fileName}"`,
      );
      res.setHeader('X-Audit-Id', report.auditId);

      const stream = fs.createReadStream(report.filePath);
      stream.on('end', () => {
        // Limpar arquivo temporário após envio
        try {
          fs.unlinkSync(report.filePath);
        } catch {
          // ignorar
        }
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
