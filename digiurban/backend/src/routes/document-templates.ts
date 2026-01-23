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
 * Gerar documento para protocolo com assinatura digital
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
    const userId = req.user!.id;

    if (!templateId) {
      console.log('❌ templateId ausente no body');
      return res.status(400).json({
        success: false,
        error: 'templateId é obrigatório'
      });
    }

    // 1. Verificar se o usuário possui certificado digital ativo
    console.log(`🔐 Verificando certificado digital do usuário ${userId}...`);

    const activeCertificate = await prisma.digitalCertificate.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date() // Não expirado
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });

    // 2. Se não tiver certificado ativo, verificar se há solicitação pendente
    if (!activeCertificate) {
      console.log('⚠️ Usuário não possui certificado digital ativo');

      const pendingRequest = await prisma.certificateRequest.findFirst({
        where: {
          userId,
          status: 'PENDING'
        },
        orderBy: {
          requestedAt: 'desc'
        }
      });

      if (pendingRequest) {
        return res.status(403).json({
          success: false,
          error: 'CERTIFICATE_PENDING',
          message: 'Você possui uma solicitação de certificado digital pendente de aprovação',
          data: {
            requestId: pendingRequest.id,
            requestedAt: pendingRequest.requestedAt,
            needsCertificate: true,
            hasPendingRequest: true
          }
        });
      }

      // 3. Criar solicitação de certificado automaticamente
      console.log('📝 Criando solicitação de certificado digital...');

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Criar solicitação automática
      const certificateRequest = await prisma.certificateRequest.create({
        data: {
          userId,
          commonName: user.name,
          email: user.email,
          certificateType: 'SERVER',
          keySize: 2048,
          status: 'PENDING',
          requestReason: 'Necessário para assinatura de documentos gerados no sistema'
        }
      });

      console.log(`✅ Solicitação de certificado criada: ${certificateRequest.id}`);

      return res.status(403).json({
        success: false,
        error: 'CERTIFICATE_REQUIRED',
        message: 'Certificado digital necessário. Uma solicitação foi criada e precisa ser aprovada pelo prefeito ou secretário',
        data: {
          requestId: certificateRequest.id,
          needsCertificate: true,
          hasPendingRequest: true,
          requestCreated: true
        }
      });
    }

    console.log(`✅ Certificado digital ativo encontrado: ${activeCertificate.serialNumber}`);
    console.log(`✅ Iniciando geração: templateId=${templateId}, protocolId=${protocolId}`);

    // 4. Gerar documento com informações do certificado para marca visual
    const document = await documentGenerator.generateDocument({
      templateId,
      protocolId,
      generatedBy: userId,
      additionalData,
      certificateInfo: {
        serialNumber: activeCertificate.serialNumber,
        commonName: activeCertificate.commonName,
        issuer: activeCertificate.issuerCA,
        issuedAt: activeCertificate.issuedAt,
        expiresAt: activeCertificate.expiresAt,
        thumbprint: activeCertificate.thumbprint
      }
    });

    console.log(`✅ Documento gerado: ${document.id}`);
    console.log(`✅ Marca visual de certificado digital aplicada ao documento`);

    res.json({
      success: true,
      data: {
        ...document,
        certificateUsed: {
          id: activeCertificate.id,
          serialNumber: activeCertificate.serialNumber,
          commonName: activeCertificate.commonName,
          issuer: activeCertificate.issuerCA,
          expiresAt: activeCertificate.expiresAt
        }
      },
      message: 'Documento gerado e certificado digitalmente com sucesso'
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
 * POST /api/generated-documents/send-multiple
 * Enviar múltiplos documentos por email e adicionar aos documentos do cidadão
 */
router.post('/generated-documents/send-multiple', authenticateToken, async (req, res) => {
  try {
    const { documentIds, citizenId, recipientEmail, recipientName, subject, message, protocolNumber } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'documentIds deve ser um array não vazio'
      });
    }

    if (!citizenId || !recipientEmail || !recipientName) {
      return res.status(400).json({
        success: false,
        error: 'citizenId, recipientEmail e recipientName são obrigatórios'
      });
    }

    console.log(`📧 Enviando ${documentIds.length} documentos para ${recipientEmail}...`);

    const results = {
      emailsSent: 0,
      documentsAdded: 0,
      notificationSent: false,
      errors: [] as string[]
    };

    // 1. Buscar todos os documentos
    const documents = await prisma.generatedDocument.findMany({
      where: {
        id: { in: documentIds },
        isActive: true
      },
      include: {
        template: {
          select: {
            name: true,
            documentType: true
          }
        }
      }
    });

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum documento encontrado'
      });
    }

    console.log(`   ✓ Encontrados ${documents.length} documentos`);

    // 2. Enviar cada documento por email
    for (const doc of documents) {
      try {
        await documentGenerator.sendDocumentByEmail({
          documentId: doc.id,
          recipientEmail,
          recipientName,
          subject: subject || `Documento: ${doc.template.name}`,
          message,
          sentBy: req.user!.id
        });
        results.emailsSent++;
        console.log(`   ✓ Email enviado: ${doc.template.name}`);
      } catch (emailError: any) {
        console.error(`   ✗ Erro ao enviar email para ${doc.template.name}:`, emailError.message);
        results.errors.push(`Erro ao enviar ${doc.template.name}: ${emailError.message}`);
      }
    }

    // 3. Adicionar documentos aos documentos do cidadão
    for (const doc of documents) {
      try {
        // Verificar se já existe
        const existingDoc = await prisma.citizenDocument.findFirst({
          where: {
            citizenId,
            sourceDocumentId: doc.id
          }
        });

        if (!existingDoc) {
          await prisma.citizenDocument.create({
            data: {
              citizenId,
              documentType: `Protocolo: ${doc.template.documentType || doc.template.name}`,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileUrl: doc.fileUrl || undefined,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
              sourceType: 'PROTOCOL',
              sourceDocumentId: doc.id,
              notes: message || `Documento gerado a partir do protocolo ${protocolNumber}`,
              isVerified: true,
              verifiedAt: new Date(),
              verifiedBy: req.user!.id
            }
          });
          results.documentsAdded++;
          console.log(`   ✓ Documento adicionado: ${doc.template.name}`);
        } else {
          console.log(`   ⊙ Documento já existe: ${doc.template.name}`);
        }
      } catch (docError: any) {
        console.error(`   ✗ Erro ao adicionar documento ${doc.template.name}:`, docError.message);
        results.errors.push(`Erro ao adicionar ${doc.template.name}: ${docError.message}`);
      }
    }

    // 4. Criar notificação para o cidadão
    try {
      const docList = documents.map(d => d.template.name).join(', ');
      const notificationMessage = message
        ? `${message}\n\nDocumentos: ${docList}`
        : `Você recebeu ${documents.length} documento(s) do protocolo ${protocolNumber}: ${docList}`;

      await prisma.notification.create({
        data: {
          citizenId,
          title: `Novos documentos disponíveis - Protocolo ${protocolNumber}`,
          message: notificationMessage,
          type: 'DOCUMENT',
          isRead: false
        }
      });
      results.notificationSent = true;
      console.log(`   ✓ Notificação criada`);
    } catch (notifError: any) {
      console.error(`   ✗ Erro ao criar notificação:`, notifError.message);
      results.errors.push(`Erro ao criar notificação: ${notifError.message}`);
    }

    console.log(`✅ Processamento concluído:`, results);

    res.json({
      success: true,
      message: `${results.emailsSent} documento(s) enviado(s) por email, ${results.documentsAdded} adicionado(s) aos documentos do cidadão`,
      data: results
    });
  } catch (error: any) {
    console.error('❌ Error sending multiple documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao enviar documentos'
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

