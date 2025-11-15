// ============================================================================
// ADMIN-CITIZEN-DOCUMENTS.TS - Rotas de Admin para Documentos Pessoais
// ============================================================================

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requirePermission } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/express-helpers';
import type { AuthenticatedRequest } from '../types';
import * as path from 'path';
import * as fs from 'fs';
import {
  checkGoldEligibility,
  autoPromoteToGold,
  getDocumentStats,
  getDocumentLabel
} from '../services/citizen-verification.service';

const router = Router();

// Apply middleware
router.use(adminAuthMiddleware);

// ============================================================================
// ROTAS
// ============================================================================

/**
 * GET /api/admin/citizen-documents/pending
 * Lista todos os documentos pendentes de aprovação
 */
router.get(
  '/pending',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { page = 1, limit = 20, documentType, citizenName } = authReq.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = {
      status: {
        in: ['PENDING', 'UNDER_REVIEW']
      }
    };

    if (documentType) {
      where.documentType = documentType;
    }

    if (citizenName) {
      where.citizen = {
        name: {
          contains: citizenName as string,
          mode: 'insensitive'
        }
      };
    }

    // Buscar documentos
    const [documents, total] = await Promise.all([
      prisma.citizenDocument.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              verificationStatus: true
            }
          }
        },
        orderBy: { uploadedAt: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.citizenDocument.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          ...doc,
          documentLabel: getDocumentLabel(doc.documentType)
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  })
);

/**
 * GET /api/admin/citizen-documents/citizen/:citizenId
 * Lista todos os documentos de um cidadão específico
 */
router.get(
  '/citizen/:citizenId',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { citizenId } = authReq.params;

    const documents = await prisma.citizenDocument.findMany({
      where: { citizenId },
      orderBy: { uploadedAt: 'desc' }
    });

    // Verificar elegibilidade para GOLD
    const eligibility = await checkGoldEligibility(citizenId);

    res.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          ...doc,
          documentLabel: getDocumentLabel(doc.documentType)
        })),
        eligibility
      }
    });
  })
);

/**
 * GET /api/admin/citizen-documents/:documentId
 * Obtém detalhes de um documento específico
 */
router.get(
  '/:documentId',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { documentId } = authReq.params;

    const document = await prisma.citizenDocument.findUnique({
      where: { id: documentId },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            verificationStatus: true,
            createdAt: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        document: {
          ...document,
          documentLabel: getDocumentLabel(document.documentType)
        }
      }
    });
  })
);

/**
 * GET /api/admin/citizen-documents/:documentId/download
 * Faz download do arquivo do documento
 */
router.get(
  '/:documentId/download',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { documentId } = authReq.params;

    const document = await prisma.citizenDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
      return;
    }

    // Verificar se arquivo existe
    const filePath = path.join(process.cwd(), document.filePath);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
      return;
    }

    // Definir headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');

    // Enviar arquivo
    res.sendFile(filePath);
  })
);

/**
 * PUT /api/admin/citizen-documents/:documentId/approve
 * Aprova um documento
 */
router.put(
  '/:documentId/approve',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { documentId } = authReq.params;
    const { notes } = authReq.body;
    const adminId = authReq.user.id;

    // 1. Buscar documento
    const document = await prisma.citizenDocument.findUnique({
      where: { id: documentId },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            verificationStatus: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
      return;
    }

    // 2. Verificar se já está aprovado
    if (document.status === 'APPROVED') {
      res.status(400).json({
        success: false,
        error: 'Documento já está aprovado'
      });
      return;
    }

    // 3. Realizar aprovação em transação
    const result = await prisma.$transaction(async (tx) => {
      // 3.1. Aprovar documento
      const approvedDoc = await tx.citizenDocument.update({
        where: { id: documentId },
        data: {
          status: 'APPROVED',
          notes: notes || null,
          updatedAt: new Date()
        }
      });

      // 3.2. Notificar cidadão sobre aprovação do documento
      await tx.notification.create({
        data: {
          citizenId: document.citizenId,
          title: 'Documento Aprovado ✓',
          message: `Seu documento "${getDocumentLabel(document.documentType)}" foi aprovado!`,
          type: 'SUCCESS',
          isRead: false
        }
      });

      // 3.3. Criar log de auditoria
      await tx.auditLog.create({
        data: {
          userId: adminId,
          citizenId: document.citizenId,
          action: 'DOCUMENT_APPROVED',
          resource: 'CITIZEN_DOCUMENT',
          details: {
            documentId,
            documentType: document.documentType,
            citizenName: document.citizen.name,
            notes
          }
        }
      });

      return approvedDoc;
    });

    // 4. Verificar elegibilidade para GOLD (fora da transação para evitar deadlocks)
    const eligibility = await checkGoldEligibility(document.citizenId);
    let promotedToGold = false;
    let promotionMessage = '';

    // 5. Se elegível, promover automaticamente
    if (eligibility.eligible) {
      try {
        const promotion = await autoPromoteToGold(document.citizenId, adminId);
        promotedToGold = promotion.success;
        promotionMessage = promotion.message;
      } catch (error) {
        console.error('Erro ao promover cidadão para GOLD:', error);
        // Não falhar a aprovação do documento por erro na promoção
      }
    }

    res.json({
      success: true,
      message: 'Documento aprovado com sucesso',
      data: {
        document: result,
        promotedToGold,
        promotionMessage,
        eligibility: {
          eligible: eligibility.eligible,
          missingTypes: eligibility.missingTypes,
          reason: eligibility.reason
        }
      }
    });
  })
);

/**
 * PUT /api/admin/citizen-documents/:documentId/reject
 * Rejeita um documento
 */
router.put(
  '/:documentId/reject',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { documentId } = authReq.params;
    const { reason } = authReq.body;
    const adminId = authReq.user.id;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Motivo da rejeição é obrigatório'
      });
      return;
    }

    // 1. Buscar documento
    const document = await prisma.citizenDocument.findUnique({
      where: { id: documentId },
      include: {
        citizen: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
      return;
    }

    // 2. Realizar rejeição em transação
    const result = await prisma.$transaction(async (tx) => {
      // 2.1. Rejeitar documento
      const rejectedDoc = await tx.citizenDocument.update({
        where: { id: documentId },
        data: {
          status: 'REJECTED',
          notes: reason,
          updatedAt: new Date()
        }
      });

      // 2.2. Notificar cidadão sobre rejeição
      await tx.notification.create({
        data: {
          citizenId: document.citizenId,
          title: 'Documento Rejeitado',
          message: `Seu documento "${getDocumentLabel(document.documentType)}" foi rejeitado. Motivo: ${reason}`,
          type: 'ERROR',
          isRead: false
        }
      });

      // 2.3. Criar log de auditoria
      await tx.auditLog.create({
        data: {
          userId: adminId,
          citizenId: document.citizenId,
          action: 'DOCUMENT_REJECTED',
          resource: 'CITIZEN_DOCUMENT',
          details: {
            documentId,
            documentType: document.documentType,
            citizenName: document.citizen.name,
            rejectionReason: reason
          }
        }
      });

      return rejectedDoc;
    });

    res.json({
      success: true,
      message: 'Documento rejeitado com sucesso',
      data: { document: result }
    });
  })
);

/**
 * PUT /api/admin/citizen-documents/:documentId/under-review
 * Marca documento como em análise
 */
router.put(
  '/:documentId/under-review',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { documentId } = authReq.params;
    const adminId = authReq.user.id;

    const document = await prisma.citizenDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
      return;
    }

    const updated = await prisma.citizenDocument.update({
      where: { id: documentId },
      data: {
        status: 'UNDER_REVIEW',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Documento marcado como em análise',
      data: { document: updated }
    });
  })
);

/**
 * GET /api/admin/citizen-documents/stats
 * Obtém estatísticas de documentos
 */
router.get(
  '/stats',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const stats = await getDocumentStats();

    res.json({
      success: true,
      data: { stats }
    });
  })
);

export default router;
