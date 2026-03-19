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
import {
  ensureTemplateAllowedForProtocol,
  getAvailableTemplatesForProtocol,
  validateTemplateInputData,
} from '../services/document-template-policy.service';
import {
  publishGeneratedDocument,
  supersedeGeneratedDocument,
} from '../services/generated-document-lifecycle.service';
import { uploadDocuments } from '../config/upload';
import path from 'path';
import fs from 'fs/promises';

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
        // ✅ ADICIONAR campos necessários para preview
        htmlTemplate: true,
        headerHtml: true,
        footerHtml: true,
        cssStyles: true,
        availableVariables: true,
        inputSchema: true,
        pageSize: true,
        orientation: true,
        margins: true,
        allowedStageTypes: true,
        requiresSignature: true,
        signatureFields: true,
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
router.put('/document-templates/:id', authenticateToken, requireAdmin, async (req, res) => {
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
router.delete('/document-templates/:id', authenticateToken, requireAdmin, async (req, res) => {
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
 * GET /api/protocols/:protocolId/document-templates
 * Listar templates disponíveis para a etapa atual do protocolo
 */
router.get('/protocols/:protocolId/document-templates', adminAuthMiddleware, async (req, res) => {
  try {
    const templates = await getAvailableTemplatesForProtocol(req.params.protocolId);
    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Error fetching protocol templates:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao buscar templates da etapa atual',
    });
  }
});

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
    const { templateId, additionalData, sourceDocumentId } = req.body;
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

    const { context, template } = await ensureTemplateAllowedForProtocol(protocolId, templateId);
    const inputValidation = validateTemplateInputData(template.inputSchema, additionalData);

    if (!inputValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Os dados informados não atendem ao schema do template',
        details: inputValidation.errors,
      });
    }

    let previousVersionId: string | undefined;
    let revisionNumber = 1;

    if (sourceDocumentId) {
      const sourceDocument = await prisma.generatedDocument.findUnique({
        where: { id: sourceDocumentId },
        select: {
          id: true,
          protocolId: true,
          templateId: true,
          revisionNumber: true,
          inputData: true,
        },
      });

      if (!sourceDocument || sourceDocument.protocolId !== protocolId) {
        return res.status(404).json({
          success: false,
          error: 'Documento original da revisão não encontrado',
        });
      }

      previousVersionId = sourceDocument.id;
      revisionNumber = (sourceDocument.revisionNumber || 1) + 1;
    }

    const document = await documentGenerator.generateDocument({
      templateId,
      protocolId,
      generatedBy: userId,
      additionalData: inputValidation.data,
      inputData: inputValidation.data,
      initialStatus: 'PENDING_SIGNATURE',
      sourceStageId: context.currentStage?.id,
      sourceStageName: context.currentStage?.stageName,
      previousVersionId,
      revisionNumber,
    });

    if (previousVersionId) {
      await supersedeGeneratedDocument(previousVersionId);
    }

    console.log(`✅ Documento gerado: ${document.id}`);
    console.log(`ℹ️  Documento criado sem assinatura - necessita assinatura manual`);

    res.json({
      success: true,
      data: {
        ...document,
        fileUrl: `/api/generated-documents/${document.id}/download?inline=true`,
        needsSignature: true, // Indica que precisa assinar manualmente
        certificateAvailable: {
          id: activeCertificate.id,
          serialNumber: activeCertificate.serialNumber,
          commonName: activeCertificate.commonName,
          expiresAt: activeCertificate.expiresAt
        }
      },
      message: 'Documento gerado com sucesso. Utilize o botão "Assinar" para aplicar a assinatura digital.'
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
 * POST /api/generated-documents/:id/revise
 * Criar nova revisão de um documento gerado
 */
router.post('/generated-documents/:id/revise', adminAuthMiddleware, requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const userId = req.user!.id;
    const sourceDocument = await prisma.generatedDocument.findUnique({
      where: { id: req.params.id },
      include: {
        template: {
          select: {
            inputSchema: true,
          }
        }
      }
    });

    if (!sourceDocument) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado',
      });
    }

    const activeCertificate = await prisma.digitalCertificate.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });

    if (!activeCertificate) {
      return res.status(403).json({
        success: false,
        error: 'CERTIFICATE_REQUIRED',
        message: 'É necessário possuir certificado digital ativo para gerar a revisão do documento',
      });
    }

    const mergedInputData = {
      ...((sourceDocument.inputData as Record<string, any> | null) || {}),
      ...((req.body?.additionalData as Record<string, any> | null) || {}),
    };

    const { context, template } = await ensureTemplateAllowedForProtocol(
      sourceDocument.protocolId,
      sourceDocument.templateId
    );
    const inputValidation = validateTemplateInputData(template.inputSchema, mergedInputData);

    if (!inputValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Os dados informados não atendem ao schema do template',
        details: inputValidation.errors,
      });
    }

    const revisedDocument = await documentGenerator.generateDocument({
      templateId: sourceDocument.templateId,
      protocolId: sourceDocument.protocolId,
      generatedBy: userId,
      additionalData: inputValidation.data,
      inputData: inputValidation.data,
      initialStatus: 'PENDING_SIGNATURE',
      sourceStageId: context.currentStage?.id,
      sourceStageName: context.currentStage?.stageName,
      previousVersionId: sourceDocument.id,
      revisionNumber: (sourceDocument.revisionNumber || 1) + 1,
    });

    await supersedeGeneratedDocument(sourceDocument.id);

    return res.json({
      success: true,
      data: {
        ...revisedDocument,
        fileUrl: `/api/generated-documents/${revisedDocument.id}/download?inline=true`,
        needsSignature: true,
        certificateAvailable: {
          id: activeCertificate.id,
          serialNumber: activeCertificate.serialNumber,
          commonName: activeCertificate.commonName,
          expiresAt: activeCertificate.expiresAt
        }
      },
      message: 'Nova revisão gerada com sucesso. Assine a revisão antes de publicar ao cidadão.',
    });
  } catch (error: any) {
    console.error('Error revising generated document:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Erro ao criar revisão do documento',
    });
  }
});

/**
 * POST /api/generated-documents/:id/publish
 * Publicar documento assinado ao cidadão
 */
router.post('/generated-documents/:id/publish', adminAuthMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário autenticado é obrigatório para publicar documento',
      });
    }

    const publishedDocument = await publishGeneratedDocument({
      documentId: req.params.id,
      publishedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: publishedDocument,
      message: 'Documento publicado ao cidadão com sucesso'
    });
  } catch (error: any) {
    console.error('Error publishing generated document:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Erro ao publicar documento ao cidadão'
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
        signatures: {
          orderBy: { signedAt: 'desc' },
          include: {
            certificate: {
              select: {
                commonName: true,
                email: true
              }
            }
          }
        },
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
router.post('/generated-documents/:id/send', adminAuthMiddleware, async (req, res) => {
  try {
    const { recipientEmail, recipientName, subject, message } = req.body;

    if (!recipientEmail || !recipientName) {
      return res.status(400).json({
        success: false,
        error: 'recipientEmail e recipientName são obrigatórios'
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Usuário autenticado é obrigatório para enviar documento'
      });
    }

    await publishGeneratedDocument({
      documentId: req.params.id,
      publishedBy: req.user.id
    });

    await documentGenerator.sendDocumentByEmail({
      documentId: req.params.id,
      recipientEmail,
      recipientName,
      subject,
      message,
      sentBy: req.user.id
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
 * Aceita arquivos adicionais via multipart/form-data
 */
router.post('/generated-documents/send-multiple', adminAuthMiddleware, uploadDocuments, async (req, res) => {
  try {
    // Parse documentIds como JSON se vier como string (FormData)
    const documentIds = typeof req.body.documentIds === 'string'
      ? JSON.parse(req.body.documentIds)
      : req.body.documentIds;

    const { citizenId, recipientEmail, recipientName, subject, message, protocolNumber } = req.body;

    // Arquivos adicionais enviados pelo frontend
    const additionalFiles = (req.files as Express.Multer.File[]) || [];

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

    const unsignedDocuments = documents.filter(doc => !doc.isSigned || doc.status === 'SUPERSEDED');
    if (unsignedDocuments.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Somente documentos assinados e vigentes podem ser enviados. Documentos inválidos: ${unsignedDocuments.map(doc => doc.fileName).join(', ')}`
      });
    }

    console.log(`   ✓ Encontrados ${documents.length} documentos`);
    if (additionalFiles.length > 0) {
      console.log(`   ✓ ${additionalFiles.length} arquivo(s) adicional(is) enviado(s)`);
    }

    // 2. Enviar email único com todos os documentos + arquivos adicionais como anexos
    try {
      // Preparar anexos dos documentos gerados
      const documentAttachments = documents.map(doc => ({
        filename: doc.fileName,
        path: path.join(process.cwd(), doc.filePath)
      }));

      // Preparar anexos dos arquivos adicionais
      const additionalAttachments = additionalFiles.map(file => ({
        filename: file.originalname,
        path: file.path
      }));

      // Combinar todos os anexos
      const allAttachments = [...documentAttachments, ...additionalAttachments];

      // Enviar email único com todos os anexos
      const nodemailer = require('nodemailer');
      const { getSystemEmail } = require('../utils/email-domain.utils');

      const transporter = nodemailer.createTransport({
        host: 'ultrazend-smtp',
        port: 587,
        secure: false,
        tls: { rejectUnauthorized: false }
      });

      const fromEmail = process.env.SMTP_FROM || await getSystemEmail('noreply');

      const docList = documents.map(d => `• ${d.template.name}`).join('\n');
      const fileList = additionalFiles.map(f => `• ${f.originalname}`).join('\n');
      const totalCount = documents.length + additionalFiles.length;

      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0066cc; color: white; padding: 20px; text-align: center;">
      <h2>Documentos Disponíveis</h2>
    </div>
    <div style="padding: 20px; background: #f9f9f9;">
      <p>Olá <strong>${recipientName}</strong>,</p>
      ${message ? `<p>${message}</p>` : ''}
      <p>Você recebeu <strong>${totalCount} documento(s)</strong> do protocolo <strong>${protocolNumber}</strong>:</p>
      ${documents.length > 0 ? `<p><strong>Documentos Gerados:</strong></p><p style="margin-left: 20px;">${docList}</p>` : ''}
      ${additionalFiles.length > 0 ? `<p><strong>Arquivos Adicionais:</strong></p><p style="margin-left: 20px;">${fileList}</p>` : ''}
      <p>Os documentos estão anexados a este email e também disponíveis na área "Meus Documentos".</p>
      <br>
      <p>Atenciosamente,<br>Equipe de Atendimento</p>
    </div>
  </div>
</body></html>`;

      await transporter.sendMail({
        from: fromEmail,
        to: recipientEmail,
        subject: subject || `Documentos do Protocolo ${protocolNumber}`,
        html: htmlContent,
        attachments: allAttachments
      });

      results.emailsSent = 1;
      console.log(`   ✓ Email enviado com ${totalCount} anexo(s)`);
    } catch (emailError: any) {
      console.error(`   ✗ Erro ao enviar email:`, emailError.message);
      results.errors.push(`Erro ao enviar email: ${emailError.message}`);
    }

    // 3. Publicar documentos assinados ao cidadão
    for (const doc of documents) {
      try {
        await publishGeneratedDocument({
          documentId: doc.id,
          publishedBy: req.user!.id
        });

        await prisma.generatedDocument.update({
          where: { id: doc.id },
          data: {
            wasSent: true,
            sentAt: new Date(),
            sentBy: req.user!.id,
            sentTo: recipientEmail
          }
        });

        results.documentsAdded++;
        console.log(`   ✓ Documento publicado: ${doc.template.name}`);
      } catch (docError: any) {
        console.error(`   ✗ Erro ao publicar documento ${doc.template.name}:`, docError.message);
        results.errors.push(`Erro ao publicar ${doc.template.name}: ${docError.message}`);
      }
    }

    // 3.1. Adicionar arquivos adicionais aos documentos do cidadão
    for (const file of additionalFiles) {
      try {
        const stats = await fs.stat(file.path);
        const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');

        await prisma.citizenDocument.create({
          data: {
            citizenId,
            documentType: `Protocolo: Arquivo Adicional`,
            fileName: file.originalname,
            filePath: relativePath,
            fileSize: stats.size,
            mimeType: file.mimetype,
            status: 'APPROVED',
            sourceType: 'PROTOCOL',
            notes: message || `Arquivo enviado junto com protocolo ${protocolNumber}`,
            isVerified: true,
            verifiedAt: new Date(),
            verifiedBy: req.user!.id,
            reviewedBy: req.user!.id,
            reviewedAt: new Date()
          }
        });
        results.documentsAdded++;
        console.log(`   ✓ Arquivo adicional adicionado: ${file.originalname}`);
      } catch (docError: any) {
        console.error(`   ✗ Erro ao adicionar arquivo ${file.originalname}:`, docError.message);
        results.errors.push(`Erro ao adicionar ${file.originalname}: ${docError.message}`);
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

    const totalFiles = documents.length + additionalFiles.length;
    res.json({
      success: true,
      message: `Email enviado com ${totalFiles} arquivo(s) anexado(s), ${results.documentsAdded} adicionado(s) aos documentos do cidadão`,
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
