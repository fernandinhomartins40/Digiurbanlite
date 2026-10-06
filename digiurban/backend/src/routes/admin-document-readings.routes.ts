/**
 * /api/admin/document-readings — resultado da leitura automática dos documentos
 * para a tela do servidor (aviso; quem decide é o servidor).
 */

import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { getReadings, kickDocReading, ReadingSource } from '../services/doc-reading/doc-reading.service';

const router = Router();
router.use(adminAuthMiddleware as any);

const SOURCES: ReadingSource[] = ['CITIZEN_DOCUMENT', 'PROTOCOL_DOCUMENT'];

router.get('/', async (req, res) => {
  try {
    const source = String(req.query.source || '') as ReadingSource;
    if (!SOURCES.includes(source)) return res.status(400).json({ error: 'Origem inválida' });
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[A-Za-z0-9_-]{6,64}$/.test(id));
    const readings = await getReadings(source, ids);
    // documento ainda sem leitura: pede para ler logo
    if (readings.length < ids.length) kickDocReading();
    res.json({ success: true, readings });
  } catch (error) {
    console.error('[document-readings]', error);
    res.status(500).json({ error: 'Erro ao carregar a leitura dos documentos' });
  }
});

export default router;
