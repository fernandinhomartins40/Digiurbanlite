/**
 * Pesquisa de preços (servidores). Ver services/prices/.
 * Substitui o proxy do antigo digiurban-prices (desligado em 2026-05-12).
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { describeCode, itemsOfFamily, searchCatalog } from '../services/prices/catalog.service';
import { lastHealth } from '../services/prices/health.service';
import {
  PriceActor,
  PriceResearchError,
  SOURCE_LABELS,
  addItem,
  addManualQuote,
  createResearch,
  decideQuote,
  deleteItem,
  deleteQuote,
  deleteResearch,
  generateDocument,
  getResearch,
  listResearches,
  quoteAttachment,
  startSearch,
  updateItem,
  updateResearch,
} from '../services/prices/price-research.service';

const router = Router();
router.use(adminAuthMiddleware as any);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

const actorOf = (req: Request): PriceActor => {
  const user = (req as any).user as { id: string; role: string; name: string };
  return { id: user.id, role: user.role, name: user.name };
};

const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error: any) {
      if (error instanceof PriceResearchError) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      if (error?.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ success: false, error: 'Arquivo maior que 10 MB.' });
        return;
      }
      console.error('[pesquisa-precos]', error);
      res.status(500).json({ success: false, error: 'Não foi possível concluir agora. Tente de novo.' });
    }
  };

/** PDF, PNG ou JPG conferidos pelos primeiros bytes (não pela extensão) */
function fileKind(buffer: Buffer): string | null {
  if (buffer.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf';
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString('latin1') === 'PNG') return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

// ─── catálogo e fontes ────────────────────────────────────────────────────

router.get('/health', handle(async (_req, res) => {
  res.json({ success: true, data: { health: await lastHealth(), sources: SOURCE_LABELS } });
}));

router.get('/catalog', handle(async (req, res) => {
  const kind = req.query.kind === 'SERVICO' ? 'SERVICO' : req.query.kind === 'MATERIAL' ? 'MATERIAL' : undefined;
  res.json({ success: true, data: { items: await searchCatalog(String(req.query.q || ''), kind) } });
}));

router.get('/catalog/families/:pdm/items', handle(async (req, res) => {
  const pdm = Number(req.params.pdm);
  if (!Number.isInteger(pdm) || pdm <= 0) throw new PriceResearchError('Família inválida.');
  res.json({ success: true, data: { items: await itemsOfFamily(pdm, String(req.query.q || '')) } });
}));

router.get('/catalog/code/:kind/:code', handle(async (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code) || code <= 0) throw new PriceResearchError('Código inválido.');
  const item = await describeCode(req.params.kind === 'SERVICO' ? 'SERVICO' : 'MATERIAL', code);
  if (!item) throw new PriceResearchError('Código não encontrado no catálogo.', 404);
  res.json({ success: true, data: { item } });
}));

// ─── pesquisas ────────────────────────────────────────────────────────────

router.get('/researches', handle(async (req, res) => {
  res.json({
    success: true,
    data: { items: await listResearches(actorOf(req), { processId: req.query.processId ? String(req.query.processId) : undefined, search: req.query.search ? String(req.query.search) : undefined }) },
  });
}));

router.post('/researches', handle(async (req, res) => {
  res.status(201).json({ success: true, data: { research: await createResearch(actorOf(req), req.body || {}) } });
}));

router.get('/researches/:id', handle(async (req, res) => {
  res.json({ success: true, data: { research: await getResearch(actorOf(req), req.params.id) } });
}));

router.put('/researches/:id', handle(async (req, res) => {
  res.json({ success: true, data: { research: await updateResearch(actorOf(req), req.params.id, req.body || {}) } });
}));

router.delete('/researches/:id', handle(async (req, res) => {
  await deleteResearch(actorOf(req), req.params.id);
  res.json({ success: true });
}));

router.post('/researches/:id/items', handle(async (req, res) => {
  res.status(201).json({ success: true, data: { item: await addItem(actorOf(req), req.params.id, req.body || {}) } });
}));

router.post('/researches/:id/document', handle(async (req, res) => {
  res.status(201).json({ success: true, data: await generateDocument(actorOf(req), req.params.id) });
}));

/** Planilha da pesquisa (Excel abre com acento por causa do BOM) */
router.get('/researches/:id/export.csv', handle(async (req, res) => {
  const research = await getResearch(actorOf(req), req.params.id);
  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const money = (value: number | null | undefined) => (value === null || value === undefined ? '' : value.toFixed(4).replace('.', ','));
  const lines = [['Item', 'Descrição do item', 'Fonte', 'Órgão/fornecedor', 'Cidade/UF', 'Data', 'Unidade', 'Preço unitário', 'Preço por unidade de comparação', 'No cálculo', 'Motivo', 'Link'].map(cell).join(';')];
  for (const item of research.items) {
    for (const quote of item.quotes) {
      lines.push([
        item.position, item.description, SOURCE_LABELS[quote.source] || quote.source, quote.buyer || quote.supplier,
        [quote.buyerCity, quote.buyerUf].filter(Boolean).join('/'), quote.date ? new Date(quote.date).toLocaleDateString('pt-BR') : '',
        [quote.unitLabel, quote.capacity ? `${quote.capacity} ${quote.measureUnit || ''}` : ''].filter(Boolean).join(' '),
        money(quote.unitPrice), money(quote.basePrice), quote.included ? 'sim' : 'não', quote.excludedReason, quote.sourceUrl,
      ].map(cell).join(';'));
    }
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pesquisa-precos-${research.id}.csv"`);
  res.send('﻿' + lines.join('\r\n'));
}));

// ─── itens e preços ───────────────────────────────────────────────────────

router.put('/items/:itemId', handle(async (req, res) => {
  res.json({ success: true, data: { item: await updateItem(actorOf(req), req.params.itemId, req.body || {}) } });
}));

router.delete('/items/:itemId', handle(async (req, res) => {
  await deleteItem(actorOf(req), req.params.itemId);
  res.json({ success: true });
}));

router.post('/items/:itemId/search', handle(async (req, res) => {
  res.status(202).json({ success: true, data: { item: await startSearch(actorOf(req), req.params.itemId) } });
}));

router.post('/items/:itemId/quotes', upload.single('file'), handle(async (req, res) => {
  const file = (req as any).file as { buffer: Buffer; originalname: string } | undefined;
  let attachment;
  if (file) {
    const mimetype = fileKind(file.buffer);
    if (!mimetype) throw new PriceResearchError('Envie a cotação ou a nota em PDF, PNG ou JPG.');
    attachment = { buffer: file.buffer, originalname: file.originalname, mimetype };
  }
  res.status(201).json({ success: true, data: { quote: await addManualQuote(actorOf(req), req.params.itemId, req.body || {}, attachment) } });
}));

router.put('/quotes/:quoteId', handle(async (req, res) => {
  res.json({ success: true, data: { quote: await decideQuote(actorOf(req), req.params.quoteId, req.body || {}) } });
}));

router.delete('/quotes/:quoteId', handle(async (req, res) => {
  await deleteQuote(actorOf(req), req.params.quoteId);
  res.json({ success: true });
}));

router.get('/quotes/:quoteId/file', handle(async (req, res) => {
  const { filePath, fileName } = await quoteAttachment(actorOf(req), req.params.quoteId);
  res.download(filePath, fileName);
}));

export default router;
