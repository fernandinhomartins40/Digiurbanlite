/**
 * ============================================================================
 * DOCUMENT TEMPLATES ROUTES
 * ============================================================================
 */

import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { PrismaClient, UserRole } from '@prisma/client';
import * as documentGenerator from '../services/document-generator.service';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// ============================================================================
// CRUD DE TEMPLATES (ADMIN+)
// ============================================================================

/**
 * GET /api/document-templates
 * Listar todos os templates
 */
router.get('/document-templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { serviceId, documentType, isActive } = req.query;

    const where: any = {};

    if (serviceId) {
      where.OR = [
        { isGlobal: true },
        { serviceIds: { array_contains: [serviceId as string] } }
      ];
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.documentTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        documentType: true,
        outputFormat: true,
        serviceIds: true,
        isGlobal: true,
        isActive: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { generatedDocuments: true }
        }
      }
    });

    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar templates'
    });
  }
});

/**
 * GET /api/document-templates/:id
 * Obter template específico
 */
router.get('/document-templates/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { generatedDocuments: true }
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar template'
    });
  }
});

/**
 * POST /api/document-templates
 * Criar novo template
 */
router.post('/document-templates', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const template = await prisma.documentTemplate.create({
      data: {
        ...req.body,
        createdBy: req.user!.id
      }
    });

    res.json({
      success: true,
      data: template,
      message: 'Template criado com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao criar template'
    });
  }
});

/**
 * PUT /api/document-templates/:id
 * Atualizar template
 */
router.put('/document-templates/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id, createdBy, createdAt, updatedAt, _count, ...updateData } = req.body;

    const template = await prisma.documentTemplate.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: template,
      message: 'Template atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao atualizar template'
    });
  }
});

/**
 * DELETE /api/document-templates/:id
 * Desativar template (soft delete)
 */
router.delete('/document-templates/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const template = await prisma.documentTemplate.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      data: template,
      message: 'Template desativado com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao desativar template'
    });
  }
});

// ============================================================================
// GERAÇÃO DE DOCUMENTOS
// ============================================================================

/**
 * POST /api/protocols/:protocolId/generate-document
 * Gerar documento para protocolo
 */
router.post('/protocols/:protocolId/generate-document', adminAuthMiddleware, requireMinRole(UserRole.USER), async (req, res) => {
  try {
    console.log('=== DEBUG GENERATE DOCUMENT ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('User:', req.user?.id);
    console.log('Headers:', req.headers);

    const { protocolId } = req.params;
    const { templateId, additionalData } = req.body;

    if (!templateId) {
      console.log('❌ templateId ausente no body');
      return res.status(400).json({
        success: false,
        error: 'templateId é obrigatório'
      });
    }

    console.log(`✅ Iniciando geração: templateId=${templateId}, protocolId=${protocolId}`);

    const document = await documentGenerator.generateDocument({
      templateId,
      protocolId,
      generatedBy: req.user!.id,
      additionalData
    });

    res.json({
      success: true,
      data: document,
      message: 'Documento gerado com sucesso'
    });
  } catch (error: any) {
    console.error('❌ Error generating document:', error);
    console.error('Stack:', error.stack);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao gerar documento'
    });
  }
});

/**
 * GET /api/protocols/:protocolId/generated-documents
 * Listar documentos gerados de um protocolo
 */
router.get('/protocols/:protocolId/generated-documents', adminAuthMiddleware, async (req, res) => {
  try {
    const documents = await documentGenerator.getGeneratedDocuments(req.params.protocolId);

    res.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('Error fetching generated documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar documentos'
    });
  }
});

/**
 * GET /api/generated-documents/:id
 * Obter documento gerado específico
 */
router.get('/generated-documents/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const document = await prisma.generatedDocument.findUnique({
      where: { id: req.params.id },
      include: {
        template: true,
        protocol: {
          select: {
            number: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
    }

    res.json({ success: true, data: document });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar documento'
    });
  }
});

/**
 * GET /api/generated-documents/:id/download
 * Download/Visualização de documento gerado
 * Query params: ?inline=true para visualização, sem parâmetro para download
 * NOTA: Usa adminAuthMiddleware para permitir visualização no painel admin
 */
router.get('/generated-documents/:id/download', adminAuthMiddleware, async (req, res) => {
  try {
    const inline = req.query.inline === 'true';

    const document = await prisma.generatedDocument.findUnique({
      where: { id: req.params.id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
    }

    const filePath = path.join(process.cwd(), document.filePath);

    // Verificar se arquivo existe
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Configurar headers - inline para visualização, attachment para download
    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.mimeType);

    // Adicionar headers CORS para permitir visualização
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao baixar documento'
    });
  }
});

/**
 * POST /api/generated-documents/:id/send
 * Enviar documento por email
 */
router.post('/generated-documents/:id/send', authenticateToken, async (req, res) => {
  try {
    const { recipientEmail, recipientName, subject, message } = req.body;

    if (!recipientEmail || !recipientName) {
      return res.status(400).json({
        success: false,
        error: 'recipientEmail e recipientName são obrigatórios'
      });
    }

    await documentGenerator.sendDocumentByEmail({
      documentId: req.params.id,
      recipientEmail,
      recipientName,
      subject,
      message,
      sentBy: req.user!.id
    });

    res.json({
      success: true,
      message: 'Documento enviado com sucesso'
    });
  } catch (error: any) {
    console.error('Error sending document:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao enviar documento'
    });
  }
});

/**
 * GET /api/document-stats
 * Estatísticas de documentos gerados
 */
router.get('/document-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { protocolId } = req.query;

    const stats = await documentGenerator.getDocumentStats(
      protocolId as string | undefined
    );

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar estatísticas'
    });
  }
});

export default router;

