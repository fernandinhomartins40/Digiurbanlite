import express from 'express';
import fs from 'fs';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { requireRole } from '../middleware/auth';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { AuthenticatedRequest } from '../types';
import { UserRole } from '@prisma/client';
import * as documentService from '../services/protocol-document.service';
import { getProtocolFilePath, extractFilename } from '../config/upload';
import { prisma } from '../lib/prisma';
import { assertProtocolAccess, canAccessProtocol } from '../services/protocol-access.service';

const router = express.Router();

/**
 * O servidor só vê/analisa documentos de protocolos que ele pode acessar
 * (mesma regra da tela do protocolo). Antes só o download conferia isso:
 * qualquer servidor do município aprovava, recusava ou baixava versões
 * de documentos pessoais de qualquer protocolo.
 */
const protocolAccess: express.RequestHandler = async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user as any;
    await assertProtocolAccess(
      { id: user?.id, role: user?.role, departmentId: user?.departmentId },
      req.params.protocolId
    );
    next();
  } catch (error: any) {
    res.status(error?.statusCode || 500).json({
      success: false,
      error: error?.statusCode ? error.message : 'Erro ao verificar acesso ao protocolo'
    });
  }
};

/** O documento do endereço precisa ser deste protocolo */
const documentOfProtocol: express.RequestHandler = async (req, res, next) => {
  try {
    const document = await prisma.protocolDocument.findUnique({
      where: { id: req.params.documentId },
      select: { protocolId: true }
    });
    if (!document || document.protocolId !== req.params.protocolId) {
      res.status(404).json({ success: false, error: 'Documento não encontrado' });
      return;
    }
    next();
  } catch (error) {
    sendError(res, error, 'Erro ao carregar documento');
  }
};

function sendError(res: express.Response, error: unknown, fallback: string) {
  if (error instanceof documentService.DocumentActionError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }
  console.error(`${fallback}:`, error);
  return res.status(500).json({
    success: false,
    error: fallback,
    details: error instanceof Error ? error.message : 'Erro desconhecido'
  });
}

/**
 * Auth híbrida para download de documento: aceita cookie de servidor (admin)
 * OU cookie de cidadão. A checagem de posse/escopo é feita na rota.
 * (A rota era PÚBLICA — qualquer pessoa com a URL baixava documentos pessoais.)
 */
const hybridDownloadAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const hasCitizenToken = !!(req as any).cookies?.digiurban_citizen_token;
  if (hasCitizenToken) {
    return citizenAuthMiddleware(req, res, next);
  }
  return adminAuthMiddleware(req, res, next);
};

/**
 * Função inline para detectar MIME type baseado na extensão do arquivo
 * (Movida de document-path.ts após simplificação)
 */
const guessMimeFromExtension = (fileName?: string, fallback = 'application/octet-stream'): string => {
  if (!fileName) return fallback;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.match(/\.(zip|rar|7z)$/)) return 'application/zip';
  return fallback;
};

/**
 * POST /api/protocols/:protocolId/documents
 * Criar/Solicitar um novo documento
 */
router.post(
  '/:protocolId/documents',
  adminAuthMiddleware,
  requireMinRole(UserRole.USER),
  protocolAccess,
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
  protocolAccess,
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
 * GET /api/protocols/:protocolId/documents/check-required
 * Verificar documentos obrigatórios
 */
router.get(
  '/:protocolId/documents/check-required',
  adminAuthMiddleware,
  protocolAccess,
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
  protocolAccess,
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

// ============================================================================
// FASE 2: ROTAS DE AUDITORIA E INTEGRIDADE
// ============================================================================

/**
 * GET /api/protocols/:protocolId/documents/audit
 * Auditoria de integridade dos documentos de um protocolo
 */
router.get(
  '/:protocolId/documents/audit',
  adminAuthMiddleware,
  requireMinRole(UserRole.MANAGER),
  protocolAccess,
  async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { validateProtocolIntegrity } = await import('../services/document-integrity.service');

      const result = await validateProtocolIntegrity(protocolId);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro na auditoria de documentos:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao auditar documentos',
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
  protocolAccess,
  documentOfProtocol,
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
  requireMinRole(UserRole.USER),
  protocolAccess,
  documentOfProtocol,
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
      return sendError(res, error, 'Erro ao fazer upload de documento');
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
  protocolAccess,
  documentOfProtocol,
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
      return sendError(res, error, 'Erro ao aprovar documento');
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
  protocolAccess,
  documentOfProtocol,
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
      return sendError(res, error, 'Erro ao rejeitar documento');
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
  protocolAccess,
  documentOfProtocol,
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
      return sendError(res, error, 'Erro ao marcar documento em análise');
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents/:documentId/download
 * Download/Visualização de um documento
 * Query params: ?inline=true para visualização, sem parâmetro para download
 * NOTA: Rota pública para permitir visualização em <img> e <iframe>
 * ✅ FASE 1: Simplificado com padrão único de armazenamento
 */
router.get(
  '/:protocolId/documents/:documentId/download',
  hybridDownloadAuth,
  async (req, res) => {
    try {
      const { protocolId, documentId } = req.params;
      const inline = req.query.inline === 'true';

      // Buscar documento
      const document = await documentService.getDocumentById(documentId);

      if (!document || document.protocolId !== protocolId) {
        return res.status(404).json({
          success: false,
          error: 'Documento não encontrado'
        });
      }

      // ✅ ESCOPO: cidadão só baixa documento do PRÓPRIO protocolo; servidor
      // segue a regra de acesso por role (atribuição/departamento).
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: document.protocolId },
        select: {
          citizenId: true,
          departmentId: true,
          assignedUserId: true,
          currentAssignedUserId: true
        }
      });

      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocolo não encontrado'
        });
      }

      const citizenId = (req as any).citizen?.id;
      const adminUser = (req as AuthenticatedRequest).user;

      const allowed = citizenId
        ? protocol.citizenId === citizenId
        : adminUser
          ? canAccessProtocol(
              { id: adminUser.id, role: adminUser.role, departmentId: adminUser.departmentId },
              protocol
            )
          : false;

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar este documento'
        });
      }

      if (!document.fileUrl) {
        return res.status(404).json({
          success: false,
          error: 'Arquivo não disponível'
        });
      }

      // Se fileUrl é uma URL externa
      if (document.fileUrl.startsWith('http')) {
        return res.redirect(document.fileUrl);
      }

      // ✅ FASE 1: Caminho local - usar padrão único
      const filename = extractFilename(document.fileUrl);
      const filePath = getProtocolFilePath(document.protocolId, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Arquivo não encontrado no servidor'
        });
      }

      const mimeType = document.mimeType || guessMimeFromExtension(document.fileName || undefined, 'application/octet-stream');

      // Configurar headers - inline para visualização, attachment para download
      const disposition = inline ? 'inline' : 'attachment';
      res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName || 'documento'}"`);
      res.setHeader('Content-Type', mimeType);

      // Stream do arquivo
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('[DOWNLOAD] Erro ao fazer download do documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer download do documento'
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
  // adminAuthMiddleware faltava: sem ele req.user nunca era populado e o
  // requireRole respondia 401 sempre — a rota estava inoperante.
  adminAuthMiddleware,
  requireRole(UserRole.ADMIN),
  protocolAccess,
  documentOfProtocol,
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

/**
 * GET /api/protocols/:protocolId/documents/:documentId/integrity
 * Verifica integridade de um documento específico
 */
router.get(
  '/:protocolId/documents/:documentId/integrity',
  adminAuthMiddleware,
  protocolAccess,
  documentOfProtocol,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { validateDocumentIntegrity } = await import('../services/document-integrity.service');

      const result = await validateDocumentIntegrity(documentId);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao verificar integridade:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar integridade',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * POST /api/protocols/:protocolId/documents/:documentId/reconcile
 * Reconcilia um documento com estado inconsistente
 */
router.post(
  '/:protocolId/documents/:documentId/reconcile',
  adminAuthMiddleware,
  requireMinRole(UserRole.MANAGER),
  protocolAccess,
  documentOfProtocol,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { reconcileDocument } = await import('../services/document-integrity.service');

      const result = await reconcileDocument(documentId);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao reconciliar documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao reconciliar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * GET /api/admin/documents/audit/all
 * Auditoria global de todos os documentos do sistema
 * ADMIN only
 */
router.get(
  '/admin/documents/audit/all',
  adminAuthMiddleware,
  requireMinRole(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { auditAllDocuments } = await import('../services/document-integrity.service');

      const result = await auditAllDocuments();

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro na auditoria global:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao executar auditoria global',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

// ============================================================================
// FASE 5: VERSIONAMENTO DE DOCUMENTOS
// ============================================================================

/**
 * GET /api/protocols/:protocolId/documents/:documentId/versions
 * Lista todas as versões de um documento (envios anteriores + o atual).
 * Antes navegava por previousDocId, que apontava para o próprio documento
 * depois de um reenvio: a busca entrava em laço infinito.
 */
router.get(
  '/:protocolId/documents/:documentId/versions',
  adminAuthMiddleware,
  protocolAccess,
  documentOfProtocol,
  async (req, res) => {
    try {
      const result = await documentService.getDocumentVersions(req.params.documentId);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Documento não encontrado' });
      }

      return res.json({
        success: true,
        data: {
          totalVersions: result.versions.length,
          currentVersion: result.current.version,
          versions: result.versions.map((v: any) => ({
            id: v.id,
            version: v.version,
            fileName: v.fileName,
            fileSize: v.fileSize,
            mimeType: v.mimeType,
            status: v.status,
            uploadedAt: v.uploadedAt,
            uploadedBy: v.uploadedBy,
            validatedAt: v.validatedAt,
            validatedBy: v.validatedBy,
            rejectedAt: v.rejectedAt,
            rejectionReason: v.rejectionReason,
            isCurrent: v.isCurrent
          }))
        }
      });
    } catch (error) {
      return sendError(res, error, 'Erro ao listar versões do documento');
    }
  }
);

/**
 * GET /api/protocols/:protocolId/documents/:documentId/version/:versionId/download
 * Download de uma versão específica do documento
 */
router.get(
  '/:protocolId/documents/:documentId/version/:versionId/download',
  adminAuthMiddleware,
  protocolAccess,
  documentOfProtocol,
  async (req, res) => {
    try {
      const { protocolId, documentId, versionId } = req.params;
      const inline = req.query.inline === 'true';

      const document = await documentService.getDocumentVersionFile(documentId, versionId);

      if (!document) {
        return res.status(404).json({ success: false, error: 'Versão do documento não encontrada' });
      }

      if (!document.fileUrl) {
        return res.status(404).json({ success: false, error: 'Arquivo não disponível para esta versão' });
      }

      if (document.fileUrl.startsWith('http')) {
        return res.redirect(document.fileUrl);
      }

      const filename = extractFilename(document.fileUrl);
      const filePath = getProtocolFilePath(protocolId, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'Arquivo físico não encontrado para esta versão' });
      }

      const mimeType = document.mimeType || guessMimeFromExtension(document.fileName || undefined, 'application/octet-stream');
      const disposition = inline ? 'inline' : 'attachment';
      res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName || 'documento'} (v${document.version})"`);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('X-Document-Version', document.version.toString());

      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      return sendError(res, error, 'Erro ao fazer download da versão');
    }
  }
);

/**
 * POST /api/protocols/:protocolId/documents/:documentId/restore-version
 * Volta um envio anterior como atual (o atual vai para o histórico)
 * Body: { versionId: string }
 */
router.post(
  '/:protocolId/documents/:documentId/restore-version',
  adminAuthMiddleware,
  requireMinRole(UserRole.MANAGER),
  protocolAccess,
  documentOfProtocol,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { versionId } = req.body;

      if (!versionId) {
        return res.status(400).json({ success: false, error: 'versionId é obrigatório' });
      }

      const { restored, restoredFromVersion } = await documentService.restoreDocumentVersion(
        req.params.documentId,
        versionId,
        authReq.userId
      );

      return res.json({
        success: true,
        data: restored,
        message: `Documento restaurado para versão ${restoredFromVersion}`
      });
    } catch (error) {
      return sendError(res, error, 'Erro ao restaurar versão');
    }
  }
);

export default router;


