// ============================================================================
// CITIZEN-PERSONAL-DOCUMENTS.TS - DOCUMENTOS PESSOAIS DO CIDADÃO
// ============================================================================

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as path from 'path';
import * as fs from 'fs';
import { createSecureUploadMiddleware, validateUploadedFilesMiddleware } from '../middleware/secure-upload';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';

// ====================== TIPOS E INTERFACES ======================

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  stream: NodeJS.ReadableStream;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  tenantId?: string;
  departmentId?: string;
}

interface Tenant {
  id: string;
  name: string;
  cnpj?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Citizen {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

interface TenantCitizenAuthenticatedRequest {
  user?: User;
  tenant: Tenant;
  citizen: Citizen;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: Record<string, unknown>;
  files?: MulterFile[];
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

// ====================== HELPER FUNCTIONS ======================

function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  if (typeof param === 'string') return param;
  return '';
}

function createErrorResponse(error: string, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    error,
    message,
    details
  };
}

function handleAsyncRoute(
  fn: (req: TenantCitizenAuthenticatedRequest, res: Response) => Promise<Response | void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as TenantCitizenAuthenticatedRequest, res)).catch(next);
  };
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// ====================== FILE HELPER FUNCTIONS ======================

function cleanupTempFiles(files: MulterFile[]): void {
  if (!files || !Array.isArray(files)) return;

  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.warn(`Erro ao limpar arquivo temporário: ${file.path}`, error);
    }
  });
}

async function moveFileToCitizenDocuments(
  file: MulterFile,
  citizenId: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'uploads', 'citizens', citizenId, 'documents');

  // Criar diretório se não existir
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.originalname}`;
  const targetPath = path.join(uploadDir, filename);
  const relativePath = path.relative(process.cwd(), targetPath);

  // Mover arquivo
  fs.renameSync(file.path, targetPath);

  return relativePath;
}

function deleteFile(filePath: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function validateUploadedFiles(req: Request, res: Response, next: NextFunction): void {
  const files = (req as any).files as MulterFile[];

  if (!files || files.length === 0) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Nenhum arquivo foi enviado'));
    return;
  }

  const maxFileSize = 10 * 1024 * 1024; // 10MB para documentos pessoais
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  for (const file of files) {
    if (file.size > maxFileSize) {
      cleanupTempFiles(files);
      res.status(400).json(createErrorResponse('FILE_TOO_LARGE', `Arquivo ${file.originalname} excede o tamanho máximo de 10MB`));
      return;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      cleanupTempFiles(files);
      res.status(400).json(createErrorResponse('INVALID_FILE_TYPE', `Tipo de arquivo não permitido: ${file.mimetype}`));
      return;
    }
  }

  next();
}

// ====================== MIDDLEWARE ======================

// Upload middleware para documentos pessoais
const uploadMiddleware = createSecureUploadMiddleware(undefined, {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
});

// ====================== ROUTER SETUP ======================

const router = Router();

// Middleware para verificar autenticação em todas as rotas
router.use(citizenAuthMiddleware as any);

// ====================== ROUTES ======================

/**
 * GET /api/citizen/personal-documents - Listar documentos pessoais do cidadão
 */
router.get(
  '/',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;

    try {
      const documents = await prisma.citizenDocument.findMany({
        where: {
          citizenId: citizen.id
        },
        orderBy: {
          uploadedAt: 'desc'
        }
      });

      return res.json({
        success: true,
        documents: documents.map(doc => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: doc.status,
          notes: doc.notes,
          uploadedAt: doc.uploadedAt,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }))
      });
    } catch (error: unknown) {
      console.error('Erro ao listar documentos:', error);
      const errorMessage = isError(error) ? error.message : 'Erro desconhecido';
      return res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro ao listar documentos', errorMessage));
    }
  })
);

/**
 * POST /api/citizen/personal-documents/upload - Upload de documento pessoal
 */
router.post(
  '/upload',
  uploadMiddleware.array('documents', 5),
  validateUploadedFiles,
  handleAsyncRoute(async (req, res) => {
    const files = req.files as MulterFile[];
    const { citizen } = req;
    const { documentType, notes } = req.body as { documentType?: string; notes?: string };

    if (!documentType) {
      cleanupTempFiles(files);
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Tipo de documento é obrigatório'));
    }

    try {
      const uploadedDocuments = [];

      for (const file of files) {
        // Mover arquivo para diretório do cidadão
        const filePath = await moveFileToCitizenDocuments(file, citizen.id);

        // Criar registro no banco de dados
        const document = await prisma.citizenDocument.create({
          data: {
            citizenId: citizen.id,
            documentType,
            fileName: file.originalname,
            filePath,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: 'PENDING',
            notes: notes || null
          }
        });

        uploadedDocuments.push(document);
      }

      // Criar notificação
      await prisma.notification.create({
        data: {
          citizenId: citizen.id,
          title: 'Documentos Enviados',
          message: `${uploadedDocuments.length} documento(s) pessoal(is) enviado(s) com sucesso`,
          type: 'SUCCESS'
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Documentos enviados com sucesso',
        documents: uploadedDocuments.map(doc => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: doc.status,
          uploadedAt: doc.uploadedAt
        }))
      });
    } catch (error: unknown) {
      console.error('Erro no upload de documentos:', error);
      cleanupTempFiles(files);

      const errorMessage = isError(error) ? error.message : 'Erro desconhecido';
      return res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro ao fazer upload de documentos', errorMessage));
    }
  })
);

/**
 * GET /api/citizen/personal-documents/:documentId/download - Download de documento
 */
router.get(
  '/:documentId/download',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;
    const documentId = getStringParam(req.params.documentId);

    if (!documentId) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do documento é obrigatório'));
    }

    try {
      // Buscar documento
      const document = await prisma.citizenDocument.findFirst({
        where: {
          id: documentId,
          citizenId: citizen.id
        }
      });

      if (!document) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', 'Documento não encontrado'));
      }

      // Verificar se o arquivo existe fisicamente
      const filePath = path.join(process.cwd(), document.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json(createErrorResponse('FILE_NOT_FOUND', 'Arquivo não encontrado no servidor'));
      }

      // Definir headers CORS e content-type
      const origin = (req as any).headers?.origin || (req as any).get?.('origin') || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');

      // Se for download via query param, forçar download, senão inline para preview
      const forceDownload = req.query.download === 'true';
      if (forceDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
      }

      // Enviar arquivo
      return res.sendFile(filePath);
    } catch (error: unknown) {
      console.error('Erro ao fazer download:', error);
      const errorMessage = isError(error) ? error.message : 'Erro desconhecido';
      return res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro ao fazer download', errorMessage));
    }
  })
);

/**
 * DELETE /api/citizen/personal-documents/:documentId - Remover documento
 */
router.delete(
  '/:documentId',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;
    const documentId = getStringParam(req.params.documentId);

    if (!documentId) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do documento é obrigatório'));
    }

    try {
      // Buscar documento
      const document = await prisma.citizenDocument.findFirst({
        where: {
          id: documentId,
          citizenId: citizen.id
        }
      });

      if (!document) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', 'Documento não encontrado'));
      }

      // Não permitir remoção de documentos aprovados
      if (document.status === 'APPROVED') {
        return res.status(400).json(createErrorResponse('INVALID_STATUS', 'Não é possível remover documentos aprovados'));
      }

      // Remover arquivo físico
      const deleted = deleteFile(document.filePath);
      if (!deleted) {
        console.warn(`Arquivo não pôde ser deletado: ${document.filePath}`);
      }

      // Remover registro do banco
      await prisma.citizenDocument.delete({
        where: { id: documentId }
      });

      return res.json({
        success: true,
        message: 'Documento removido com sucesso'
      });
    } catch (error: unknown) {
      console.error('Erro ao remover documento:', error);
      const errorMessage = isError(error) ? error.message : 'Erro desconhecido';
      return res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro ao remover documento', errorMessage));
    }
  })
);

/**
 * PATCH /api/citizen/personal-documents/:documentId - Atualizar documento
 */
router.patch(
  '/:documentId',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;
    const documentId = getStringParam(req.params.documentId);
    const { documentType, notes } = req.body as { documentType?: string; notes?: string };

    if (!documentId) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do documento é obrigatório'));
    }

    try {
      // Buscar documento
      const document = await prisma.citizenDocument.findFirst({
        where: {
          id: documentId,
          citizenId: citizen.id
        }
      });

      if (!document) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', 'Documento não encontrado'));
      }

      // Atualizar documento
      const updatedDocument = await prisma.citizenDocument.update({
        where: { id: documentId },
        data: {
          ...(documentType && { documentType }),
          ...(notes !== undefined && { notes })
        }
      });

      return res.json({
        success: true,
        message: 'Documento atualizado com sucesso',
        document: {
          id: updatedDocument.id,
          documentType: updatedDocument.documentType,
          fileName: updatedDocument.fileName,
          status: updatedDocument.status,
          notes: updatedDocument.notes,
          updatedAt: updatedDocument.updatedAt
        }
      });
    } catch (error: unknown) {
      console.error('Erro ao atualizar documento:', error);
      const errorMessage = isError(error) ? error.message : 'Erro desconhecido';
      return res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro ao atualizar documento', errorMessage));
    }
  })
);

/**
 * GET /api/citizen/personal-documents/info/limits - Informações sobre limites
 */
router.get(
  '/info/limits',
  handleAsyncRoute(async (_req, res) => {
    return res.json({
      success: true,
      limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        allowedExtensions: [
          '.pdf',
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
        ]
      }
    });
  })
);

export default router;
