import { Router } from 'express';
import { authenticateAdmin, authenticateCitizen } from '../middleware/auth';
import multer from 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { resolveUploadTenantId, getTenantUploadDir } from '../config/upload';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são aceitos'));
    }
  },
});

/**
 * POST /api/external-documents/upload
 * Upload de documento externo para assinatura (Admin) - rota esperada pelo frontend
 */
router.post('/upload', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { description } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Apenas arquivos PDF são aceitos' });
    }

    // Gerar hash do documento
    const documentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Criar diretório se não existir (Fase B: particionado por tenant)
    const uploadTenantId = resolveUploadTenantId((req as any).tenantId);
    const uploadDir = getTenantUploadDir(uploadTenantId, 'external-docs');
    await fs.mkdir(uploadDir, { recursive: true });

    // Salvar arquivo com nome único
    const uniqueFileName = `${Date.now()}_${userId}_${file.originalname}`;
    const filePath = `uploads/t/${uploadTenantId}/external-docs/${uniqueFileName}`;
    const fullPath = path.join(uploadDir, uniqueFileName);

    await fs.writeFile(fullPath, file.buffer);

    // Criar registro no banco
    const document = await prisma.externalDocument.create({
      data: {
        userId,
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        documentHash,
        description: description || null,
        mimeType: 'application/pdf',
      },
      include: {
        signatures: {
          include: {
            certificate: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Documento enviado com sucesso',
      document,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de documento externo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer upload do documento',
    });
  }
});

/**
 * POST /api/documents/upload-external
 * Upload de documento externo para assinatura (Admin)
 */
router.post('/upload-external', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { description } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Apenas arquivos PDF são aceitos' });
    }

    // Gerar hash do documento
    const documentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Criar diretório se não existir (Fase B: particionado por tenant)
    const uploadTenantId = resolveUploadTenantId((req as any).tenantId);
    const uploadDir = getTenantUploadDir(uploadTenantId, 'external-docs');
    await fs.mkdir(uploadDir, { recursive: true });

    // Salvar arquivo com nome único
    const uniqueFileName = `${Date.now()}_${userId}_${file.originalname}`;
    const filePath = `uploads/t/${uploadTenantId}/external-docs/${uniqueFileName}`;
    const fullPath = path.join(uploadDir, uniqueFileName);

    await fs.writeFile(fullPath, file.buffer);

    // Criar registro no banco
    const document = await prisma.externalDocument.create({
      data: {
        userId,
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        documentHash,
        description: description || null,
        mimeType: 'application/pdf',
      },
      include: {
        signatures: {
          include: {
            certificate: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Documento enviado com sucesso',
      document,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de documento externo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer upload do documento',
    });
  }
});

/**
 * POST /api/documents/upload-external-citizen
 * Upload de documento externo para assinatura (Cidadão)
 */
router.post('/upload-external-citizen', authenticateCitizen, upload.single('file'), async (req, res) => {
  try {
    const citizenId = req.citizen?.id;
    const { description } = req.body;
    const file = req.file;

    if (!citizenId) {
      return res.status(401).json({ success: false, message: 'Cidadão não autenticado' });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Apenas arquivos PDF são aceitos' });
    }

    // Gerar hash do documento
    const documentHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Criar diretório se não existir (Fase B: particionado por tenant)
    const uploadTenantId = resolveUploadTenantId((req as any).tenantId);
    const uploadDir = getTenantUploadDir(uploadTenantId, 'external-docs');
    await fs.mkdir(uploadDir, { recursive: true });

    // Salvar arquivo com nome único
    const uniqueFileName = `${Date.now()}_${citizenId}_${file.originalname}`;
    const filePath = `uploads/t/${uploadTenantId}/external-docs/${uniqueFileName}`;
    const fullPath = path.join(uploadDir, uniqueFileName);

    await fs.writeFile(fullPath, file.buffer);

    // Criar registro no banco
    const document = await prisma.externalDocument.create({
      data: {
        citizenId,
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        documentHash,
        description: description || null,
        mimeType: 'application/pdf',
      },
      include: {
        signatures: {
          include: {
            certificate: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Documento enviado com sucesso',
      document,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de documento externo (cidadão):', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer upload do documento',
    });
  }
});

/**
 * GET /api/documents/external/:id
 * Buscar documento externo por ID
 */
router.get('/external/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.externalDocument.findUnique({
      where: { id },
      include: {
        signatures: {
          include: {
            certificate: {
              select: {
                id: true,
                commonName: true,
                email: true,
                certificateType: true,
                status: true,
              },
            },
          },
          orderBy: { signedAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    res.json({ success: true, document });
  } catch (error: any) {
    console.error('Erro ao buscar documento externo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar documento',
    });
  }
});

/**
 * GET /api/external-documents
 * Listar TODOS os documentos externos (Admin) - para página de assinaturas
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    // Buscar todos os documentos do departamento/secretaria do usuário
    const documents = await prisma.externalDocument.findMany({
      where: {
        isActive: true,
      },
      include: {
        signatures: {
          include: {
            certificate: {
              select: {
                id: true,
                commonName: true,
                email: true,
                certificateType: true,
                status: true,
                serialNumber: true,
              },
            },
          },
          orderBy: { signedAt: 'desc' },
        },
        _count: {
          select: { signatures: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    // Mapear para o formato esperado pelo frontend
    const mappedDocuments = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: `/api/external-documents/${doc.id}/view`,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: doc.uploadedAt,
      status: 'ACTIVE',
      _count: doc._count,
      signatures: doc.signatures.map((sig: any) => ({
        id: sig.id,
        signedAt: sig.signedAt,
        verificationStatus: sig.verificationStatus || 'VALID',
        certificate: {
          id: sig.certificate.id,
          commonName: sig.certificate.commonName,
          email: sig.certificate.email,
          type: sig.certificate.certificateType,
          status: sig.certificate.status,
          serialNumber: sig.certificate.serialNumber,
        },
      })),
    }));

    res.json({ success: true, documents: mappedDocuments });
  } catch (error: any) {
    console.error('Erro ao listar documentos externos:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar documentos',
    });
  }
});

/**
 * GET /api/documents/my-external-documents
 * Listar documentos externos do usuário admin logado
 */
router.get('/my-external-documents', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    const documents = await prisma.externalDocument.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        signatures: {
          include: {
            certificate: {
              select: {
                id: true,
                commonName: true,
                email: true,
                certificateType: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: { signatures: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, documents });
  } catch (error: any) {
    console.error('Erro ao listar documentos externos do admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar documentos',
    });
  }
});

/**
 * GET /api/documents/my-external-documents-citizen
 * Listar documentos externos do cidadão logado
 */
router.get('/my-external-documents-citizen', authenticateCitizen, async (req, res) => {
  try {
    const citizenId = req.citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ success: false, message: 'Cidadão não autenticado' });
    }

    const documents = await prisma.externalDocument.findMany({
      where: {
        citizenId,
        isActive: true,
      },
      include: {
        signatures: {
          include: {
            certificate: {
              select: {
                id: true,
                commonName: true,
                email: true,
                certificateType: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: { signatures: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, documents });
  } catch (error: any) {
    console.error('Erro ao listar documentos externos do cidadão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar documentos',
    });
  }
});

/**
 * GET /api/external-documents/:id/view
 * Visualizar documento externo (serve o PDF inline)
 */
router.get('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.externalDocument.findUnique({
      where: { id },
      select: {
        fileName: true,
        filePath: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    const fullPath = path.join(process.cwd(), document.filePath);

    // Verificar se o arquivo existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado no servidor',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.sendFile(fullPath);
  } catch (error: any) {
    console.error('Erro ao visualizar documento externo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao visualizar documento',
    });
  }
});

/**
 * GET /api/documents/external/:id/download
 * Download de documento externo
 */
router.get('/external/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.externalDocument.findUnique({
      where: { id },
      select: {
        fileName: true,
        filePath: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    const fullPath = path.join(process.cwd(), document.filePath);

    // Verificar se o arquivo existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado no servidor',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.sendFile(fullPath);
  } catch (error: any) {
    console.error('Erro ao fazer download de documento externo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer download do documento',
    });
  }
});

/**
 * DELETE /api/documents/external/:id
 * Deletar documento externo (soft delete)
 */
router.delete('/external/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    // Verificar se o documento pertence ao usuário
    const document = await prisma.externalDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    if (document.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para deletar este documento',
      });
    }

    // Soft delete
    await prisma.externalDocument.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Documento removido com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao deletar documento externo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao deletar documento',
    });
  }
});

export default router;
