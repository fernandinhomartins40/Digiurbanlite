/**
 * Conferência PÚBLICA de documentos (sem login) — uma página só para tudo:
 * documento do protocolo (código VAL-...), documento assinado e documento do
 * processo interno (código da assinatura XXXX-XXXX-XXXX-XXXX, também no QR).
 *
 * Mostra só o que é público: tipo, número, quem assinou (nome e papel),
 * quando, se cada assinatura confere e se aquela versão foi substituída. O
 * nome do cidadão sai abreviado; processo sigiloso não mostra o assunto.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { verifyPublicCode, verifyUploadedFile } from '../services/signing/signature.service';
import { verifyLegacyInternalPublic } from '../services/internal-process/internal-process-extras.service';

const router = Router();

// conferência é pública: limita tentativas para ninguém varrer códigos
router.use(rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Envie o arquivo em PDF'));
  },
});

async function lookup(code: string) {
  const clean = String(code || '').trim().slice(0, 40);
  if (!clean) return null;
  return (await verifyPublicCode(clean)) || (await verifyLegacyInternalPublic(clean));
}

/** GET /api/public/validate/code/:code — conferir pelo código ou QR */
router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const result = await lookup(req.params.code);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Código não encontrado. Confira se digitou certo.' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[conferência pública]', error);
    res.status(500).json({ success: false, message: 'Não foi possível conferir agora. Tente de novo.' });
  }
});

/** Compatibilidade: endereço antigo dos documentos do protocolo */
router.get('/document/:code', async (req: Request, res: Response) => {
  try {
    const result = await lookup(req.params.code);
    if (!result) return res.status(404).json({ success: false, valid: false, message: 'Documento não encontrado.' });
    res.json({ success: true, valid: result.status === 'VALID', data: result });
  } catch (error) {
    console.error('[conferência pública]', error);
    res.status(500).json({ success: false, message: 'Não foi possível conferir agora.' });
  }
});

/** POST /api/public/validate/verify-integrity — o PDF que eu tenho é o original? */
router.post('/verify-integrity', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const code = String(req.body?.validationCode || req.body?.code || '');
    if (!code || !req.file) return res.status(400).json({ success: false, message: 'Informe o código e envie o PDF.' });
    const result = await verifyUploadedFile(code, req.file.buffer);
    if (!result) return res.status(404).json({ success: false, message: 'Código não encontrado.' });
    res.json({
      success: true,
      valid: result.fileMatches,
      message: result.fileMatches
        ? 'O arquivo é o mesmo que a prefeitura emitiu.'
        : 'Este arquivo NÃO é igual ao emitido (pode ter sido alterado ou ser de outra versão).',
      data: result,
    });
  } catch (error) {
    console.error('[conferência pública]', error);
    res.status(500).json({ success: false, message: 'Não foi possível conferir o arquivo.' });
  }
});

export default router;
