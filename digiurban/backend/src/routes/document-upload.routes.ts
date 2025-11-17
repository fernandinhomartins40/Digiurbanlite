/**
 * ============================================================================
 * DOCUMENT UPLOAD ROUTES
 * ============================================================================
 * Rotas integradas de upload de documentos com protocolo
 */

import { Router, Request, Response, NextFunction } from 'express';
import { documentUploadService } from '../services/document-upload.service';
import { documentProcessingService } from '../services/document-processing.service';
import {
  createSecureUploadMiddleware,
  validateUploadedFilesMiddleware
} from '../middleware/secure-upload';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { adminAuthMiddleware } from '../middleware/admin-auth';

const router = Router();

/**
 * POST /api/document-upload/protocol/:protocolId
 * Upload de documentos para protocolo (cidadão)
 */
router.post(
  '/protocol/:protocolId',
  citizenAuthMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    const upload = createSecureUploadMiddleware(undefined, {
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: 10
    });
    upload.array('documents', 10)(req, res, next);
  },
  validateUploadedFilesMiddleware(),
  async (req: any, res: Response) => {
    try {
      const { protocolId } = req.params;
      const files = req.files as Express.Multer.File[];
      const citizen = req.citizen;
      const documentTypes = req.body.documentTypes
        ? JSON.parse(req.body.documentTypes)
        : undefined;

      if (!protocolId) {
        return res.status(400).json({
          success: false,
          error: 'ID do protocolo é obrigatório'
        });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo foi enviado'
        });
      }

      const result = await documentUploadService.uploadDocumentsToProtocol({
        protocolId,
        files,
        uploadedBy: citizen.id,
        documentTypes,
        citizenId: citizen.id
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Falha no upload de documentos',
          errors: result.errors
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Documentos enviados com sucesso',
        protocol: {
          id: result.protocolId,
          number: result.protocolNumber
        },
        uploadedDocuments: result.uploadedDocuments,
        warnings: result.errors
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/document-upload/service/:serviceId/requirements
 * Obtém requisitos de documentos de um serviço
 */
router.get(
  '/service/:serviceId/requirements',
  async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;

      const requirements = await documentUploadService.getServiceDocumentRequirements(serviceId);

      return res.json({
        success: true,
        requirements
      });
    } catch (error) {
      console.error('Erro ao buscar requisitos:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
);

/**
 * GET /api/document-upload/protocol/:protocolId/status
 * Verifica status dos documentos do protocolo
 */
router.get(
  '/protocol/:protocolId/status',
  citizenAuthMiddleware,
  async (req: any, res: Response) => {
    try {
      const { protocolId } = req.params;
      const citizen = req.citizen;

      const status = await documentUploadService.checkProtocolDocumentsComplete(protocolId);

      return res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
);

/**
 * DELETE /api/document-upload/document/:documentId
 * Remove um documento (admin)
 */
router.delete(
  '/document/:documentId',
  adminAuthMiddleware,
  async (req: any, res: Response) => {
    try {
      const { documentId } = req.params;
      const userId = req.userId;

      await documentUploadService.deleteDocument(documentId, userId);

      return res.json({
        success: true,
        message: 'Documento removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
);

/**
 * POST /api/document-upload/process-ocr
 * Processa documento com OCR (admin)
 */
router.post(
  '/process-ocr',
  adminAuthMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    const upload = createSecureUploadMiddleware(undefined, {
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: 1
    });
    upload.single('document')(req, res, next);
  },
  async (req: any, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      const documentType = req.body.documentType;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo foi enviado'
        });
      }

      // Processar documento com OCR
      const result = await documentProcessingService.processDocument(
        file.path,
        documentType
      );

      return res.json({
        success: true,
        ocrResult: result.ocrResult,
        extractedInfo: result.extractedInfo,
        imageQuality: result.imageQuality
      });
    } catch (error) {
      console.error('Erro no processamento OCR:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro no processamento OCR'
      });
    }
  }
);

/**
 * POST /api/document-upload/validate-cpf
 * Valida CPF extraído do documento
 */
router.post(
  '/validate-cpf',
  async (req: Request, res: Response) => {
    try {
      const { cpf } = req.body;

      if (!cpf) {
        return res.status(400).json({
          success: false,
          error: 'CPF é obrigatório'
        });
      }

      const isValid = documentProcessingService.validateCPF(cpf);

      return res.json({
        success: true,
        valid: isValid
      });
    } catch (error) {
      console.error('Erro na validação de CPF:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro na validação'
      });
    }
  }
);

export default router;
