/**
 * Rotas de documentos do processo (geração PDF + upload)
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import * as documentService from '../services/document.service';
import { config } from '../config/config';

const router = Router();
router.use(authMiddleware);

// Configuração do Multer
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    const processId = req.params.id as string;
    const dir = path.join(config.uploadDir, 'flow', processId);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `anexo_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
});

// ============================================================================
// SCHEMAS
// ============================================================================

const generateDocSchema = z.object({
  templateName: z.enum(['despacho', 'memorando', 'oficio', 'capa-processo']),
  additionalData: z.record(z.unknown()).optional(),
});

// ============================================================================
// POST /processes/:id/documents/generate — Gerar PDF via Playwright
// ============================================================================

router.post('/:id/documents/generate', async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const body = generateDocSchema.parse(req.body);

    const document = await documentService.generateFlowDocument({
      processId: req.params.id as string,
      templateName: body.templateName,
      generatedBy: auth.userId!,
      generatedByName: auth.userName || 'Servidor',
      additionalData: body.additionalData,
    });

    res.status(201).json(document);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// GET /processes/:id/documents — Listar documentos
// ============================================================================

router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const documents = await documentService.listProcessDocuments(req.params.id as string);
    res.json(documents);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ============================================================================
// POST /processes/:id/documents/upload — Anexar documento
// ============================================================================

router.post('/:id/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const auth = req as AuthenticatedRequest;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Arquivo não fornecido' });
      return;
    }

    const documentType = req.body.documentType || 'anexo';
    const name = req.body.name || file.originalname;

    const document = await documentService.createDocumentRecord({
      processId: req.params.id as string,
      documentType,
      name,
      fileName: file.filename,
      filePath: `/uploads/flow/${req.params.id as string}/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      generatedBy: auth.userId!,
    });

    res.status(201).json(document);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
