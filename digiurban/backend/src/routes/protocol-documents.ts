import express from 'express';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { UserRole } from '@prisma/client';
import * as documentService from '../services/protocol-document.service';

const router = express.Router();

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
