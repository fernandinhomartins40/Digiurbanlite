import express from 'express';
import path from 'path';
import fs from 'fs';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { UserRole } from '@prisma/client';
import * as documentService from '../services/protocol-document.service';

const router = express.Router();
const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');

const guessMimeFromExtension = (fileName?: string, fallback?: string) => {
  if (!fileName) return fallback || 'application/octet-stream';
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.match(/\.(tif|tiff)$/)) return 'image/tiff';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return fallback || 'application/octet-stream';
};

const resolveLocalFilePath = (rawPath: string) => {
  const candidates: string[] = [];

  // Absoluto
  if (path.isAbsolute(rawPath)) {
    candidates.push(rawPath);
  }

  // Relativo ao base de uploads configurado
  const cleaned = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
  candidates.push(path.join(UPLOAD_BASE_PATH, cleaned));

  // Relativo ao cwd
  candidates.push(path.join(process.cwd(), cleaned));

  // Relativo a backend/ (caso cwd seja raiz do mono)
  candidates.push(path.join(process.cwd(), 'backend', cleaned));

  const tried: string[] = [];
  for (const candidate of candidates) {
    if (tried.includes(candidate)) continue;
    tried.push(candidate);
    if (fs.existsSync(candidate)) {
      return { found: true, filePath: candidate, tried };
    }
  }

  return { found: false, tried };
};

/**
 * POST /api/protocols/:protocolId/documents
 * Criar/Solicitar um novo documento
 */
router.post(
  '/:protocolId/documents',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { documentType, isRequired } = req.body;

      const document = await documentService.createProtocolDocument({
        protocolId,
        documentType,
        isRequired: isRequired ?? true
        });

      return res.status(201).json({
        success: true,
        data: document
        });
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents
 * Listar todos os documentos de um protocolo
 */
router.get(
  '/:protocolId/documents',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const documents = await documentService.getProtocolDocuments(protocolId);

      return res.json({
        success: true,
        data: documents
        });
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar documentos',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents/:documentId
 * Obter um documento específico
 */
router.get(
  '/:protocolId/documents/:documentId',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const document = await documentService.getDocumentById(documentId);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Documento não encontrado'
        });
      }

      return res.json({
        success: true,
        data: document
        });
    } catch (error) {
      console.error('Erro ao obter documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao obter documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/documents/:documentId/upload
 * Fazer upload de um documento
 */
router.put(
  '/:protocolId/documents/:documentId/upload',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { documentId } = req.params;
      const { fileName, fileUrl, fileSize, mimeType } = req.body;

      if (!fileName || !fileUrl || !fileSize || !mimeType) {
        return res.status(400).json({
          success: false,
          error: 'Dados do arquivo incompletos'
        });
      }

      const document = await documentService.uploadDocument(documentId, {
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        uploadedBy: authReq.userId
        });

      return res.json({
        success: true,
        data: document
        });
    } catch (error) {
      console.error('Erro ao fazer upload de documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload de documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/documents/:documentId/approve
 * Aprovar um documento
 */
router.put(
  '/:protocolId/documents/:documentId/approve',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { documentId } = req.params;

      const document = await documentService.approveDocument(
        documentId,
        authReq.userId
      );

      return res.json({
        success: true,
        data: document
        });
    } catch (error) {
      console.error('Erro ao aprovar documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao aprovar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/documents/:documentId/reject
 * Rejeitar um documento
 */
router.put(
  '/:protocolId/documents/:documentId/reject',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { documentId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          error: 'Motivo da rejeição é obrigatório'
        });
      }

      const document = await documentService.rejectDocument(
        documentId,
        authReq.userId,
        rejectionReason
      );

      return res.json({
        success: true,
        data: document
        });
    } catch (error) {
      console.error('Erro ao rejeitar documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao rejeitar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * PUT /api/protocols/:protocolId/documents/:documentId/review
 * Marcar documento como em análise
 */
router.put(
  '/:protocolId/documents/:documentId/review',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const document = await documentService.markDocumentUnderReview(
        documentId
      );

      return res.json({
        success: true,
        data: document
        });
    } catch (error) {
      console.error('Erro ao marcar documento em análise:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar documento em análise',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents/check-required
 * Verificar documentos obrigatórios
 */
router.get(
  '/:protocolId/documents/check-required',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const check = await documentService.checkRequiredDocuments(protocolId);

      return res.json({
        success: true,
        data: check
        });
    } catch (error) {
      console.error('Erro ao verificar documentos obrigatórios:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar documentos obrigatórios',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents/check-approved
 * Verificar se todos documentos estão aprovados
 */
router.get(
  '/:protocolId/documents/check-approved',
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { protocolId } = req.params;

      const check = await documentService.checkAllDocumentsApproved(protocolId);

      return res.json({
        success: true,
        data: check
        });
    } catch (error) {
      console.error('Erro ao verificar documentos aprovados:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar documentos aprovados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents/:documentId/download
 * Download/Visualização de um documento
 * Query params: ?inline=true para visualização, sem parâmetro para download
 * NOTA: Rota pública para permitir visualização em <img> e <iframe>
 */
router.get(
  '/:protocolId/documents/:documentId/download',
  async (req, res) => {
    try {
      const { protocolId, documentId } = req.params;
      const inline = req.query.inline === 'true';

      console.log(`\n[DOWNLOAD] ProtocolId: ${protocolId}, DocumentId: ${documentId}, Inline: ${inline}`);

      // Tentar buscar documento do banco
      let document: any = await documentService.getDocumentById(documentId);

      // Se nÇœo encontrou e Ç¸ um documento legacy, buscar dos documentos legacy do protocolo
      if (!document && documentId.startsWith('legacy_')) {
        console.log(`[DOWNLOAD] Documento legacy detectado, buscando do protocolo...`);
        const allDocs = await documentService.getProtocolDocuments(protocolId);
        const foundDoc = allDocs.find(doc => doc.id === documentId);
        if (foundDoc) {
          document = foundDoc;
        }
      }

      if (!document) {
        console.log(`[DOWNLOAD] Documento nÇœo encontrado: ${documentId}`);
        return res.status(404).json({
          success: false,
          error: 'Documento nÇœo encontrado'
        });
      }

      console.log(`[DOWNLOAD] Documento encontrado: ${document.fileName}, fileUrl: ${document.fileUrl}`);

      if (!document.fileUrl) {
        console.log(`[DOWNLOAD] Arquivo nÇœo disponÇðvel para documento: ${documentId}`);
        return res.status(404).json({
          success: false,
          error: 'Arquivo nÇœo disponÇðvel'
        });
      }

      // Se fileUrl Ç¸ um caminho local
      if (!document.fileUrl.startsWith('http')) {
        const resolution = resolveLocalFilePath(document.fileUrl);

        if (!resolution.found) {
          console.log(`[DOWNLOAD] Arquivo nÇœo existe nas tentativas: ${resolution.tried.join(' | ')}`);
          return res.status(404).json({
            success: false,
            error: 'Arquivo nÇœo encontrado no servidor',
            tried: resolution.tried
          });
        }

        const filePath = (resolution as any).filePath;
        const mimeType = document.mimeType || guessMimeFromExtension(document.fileName, 'application/octet-stream');

        console.log(`[DOWNLOAD] Arquivo existe, enviando... MimeType: ${mimeType}, Caminho: ${filePath}`);

        // Configurar headers - inline para visualizaÇõÇœo, attachment para download
        const disposition = inline ? 'inline' : 'attachment';
        res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName || 'documento'}"`);
        res.setHeader('Content-Type', mimeType);

        // Adicionar headers CORS para permitir visualizaÇõÇœo
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // Stream do arquivo
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        // Se Ç¸ URL externa, redirecionar
        console.log(`[DOWNLOAD] Redirecionando para URL externa: ${document.fileUrl}`);
        return res.redirect(document.fileUrl);
      }
    } catch (error) {
      console.error('[DOWNLOAD] Erro ao fazer download do documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer download do documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

/**
 * DELETE /api/protocols/:protocolId/documents/:documentId
 * Deletar um documento
 */
router.delete(
  '/:protocolId/documents/:documentId',
  requireRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { documentId } = req.params;

      await documentService.deleteDocument(documentId);

      return res.json({
        success: true,
        message: 'Documento deletado com sucesso'
        });
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
  }
);

export default router;


