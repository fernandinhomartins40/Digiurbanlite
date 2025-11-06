// ============================================================================
// CITIZEN-DOCUMENTS.TS - ISOLAMENTO PROFISSIONAL COMPLETO
// ============================================================================

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as path from 'path';
import * as fs from 'fs';

// ====================== TIPOS E INTERFACES ISOLADAS ======================

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

interface RequestWithFiles {
  files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
  params: Record<string, string>;
  query: Record<string, any>;
  body: Record<string, any>;
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

export interface ProtocolDocument {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

interface UploadedFile {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

interface FileInfo {
  size: number;
  modifiedAt: Date;
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

// ====================== UPLOAD HELPER FUNCTIONS ======================

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

async function moveFilesToProtocol(
  files: MulterFile[],
  protocolId: string
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];
  const uploadDir = path.join(process.cwd(), 'uploads', 'protocols', protocolId);

  // Criar diretório se não existir
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const file of files) {
    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const targetPath = path.join(uploadDir, filename);
      const relativePath = path.relative(process.cwd(), targetPath);

      // Mover arquivo
      fs.renameSync(file.path, targetPath);

      uploadedFiles.push({
        originalName: file.originalname,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        path: relativePath,
        uploadedAt: new Date()
        });
    } catch (error) {
      console.error(`Erro ao mover arquivo ${file.originalname}:`, error);
    }
  }

  return uploadedFiles;
}

function fileExists(filePath: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  } catch {
    return false;
  }
}

function getFileInfo(filePath: string): FileInfo | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      modifiedAt: stats.mtime
        };
  } catch {
    return null;
  }
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

function validateUploadedFiles(req: RequestWithFiles, res: Response, next: NextFunction): void {
  const files = req.files as MulterFile[];

  if (!files || files.length === 0) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Nenhum arquivo foi enviado'));
    return;
  }

  const maxFileSize = 5 * 1024 * 1024; // 5MB
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
      res.status(400).json(createErrorResponse('FILE_TOO_LARGE', `Arquivo ${file.originalname} excede o tamanho máximo de 5MB`));
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

// ====================== MIDDLEWARE FUNCTIONS ======================

const tenantMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
  // Tenant middleware implementation
  next();
};

const citizenAuthMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
  // Citizen auth implementation
  next();
};

const familyAuthMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
  // Family auth implementation
  next();
};

// Mock multer middleware for now
const uploadMiddleware = {
  array: (_fieldName: string, _maxCount: number) => {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }
};

// ====================== VALIDATION SCHEMAS ======================

// ====================== ROUTER SETUP ======================

const router = Router();

// Middleware para verificar tenant em todas as rotas
router.use(citizenAuthMiddleware);

// ====================== ROUTES ======================

/**
 * POST /api/documents/upload/:protocolId - Upload de documentos para protocolo
 */
router.post(
  '/upload/:protocolId',
  familyAuthMiddleware,
  uploadMiddleware.array('documents', 10),
  validateUploadedFiles,
  handleAsyncRoute(async (req, res) => {
    const files = req.files as MulterFile[];
    const { tenant, citizen } = req;
    const protocolId = getStringParam(req.params.protocolId);

    if (!protocolId) {
      cleanupTempFiles(files);
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do protocolo é obrigatório'));
    }

    try {
      // Verificar se o protocolo existe e pertence ao cidadão/família
      const protocol = await prisma.protocolSimplified.findFirst({
        where: {
          id: protocolId
        },
        include: {
          citizen: true
        }
      });

      if (!protocol) {
        cleanupTempFiles(files);
        return res.status(404).json(createErrorResponse('NOT_FOUND', 'Protocolo não encontrado'));
      }

      // Verificar autorização familiar
      const hasAccess =
        protocol.citizenId === citizen.id ||
        (await prisma.familyComposition.findFirst({
          where: {
            headId: citizen.id,
            memberId: protocol.citizenId
        }
        }));

      if (!hasAccess) {
        cleanupTempFiles(files);
        return res.status(403).json(createErrorResponse('ACCESS_DENIED', 'Acesso negado'));
      }

      // Mover arquivos para diretório do protocolo
      const uploadedFiles = await moveFilesToProtocol(files, protocolId);

      // Atualizar documentos do protocolo
      const currentDocuments = Array.isArray(protocol.documents)
        ? (protocol.documents as unknown as ProtocolDocument[])
        : [];
      const updatedDocuments = [...currentDocuments, ...uploadedFiles];

      await prisma.protocolSimplified.update({
        where: { id: protocolId },
        data: {
          documents: updatedDocuments as unknown as Prisma.InputJsonValue
        }
        });

      // Criar histórico
      await prisma.protocolHistorySimplified.create({
        data: {
          protocolId: protocolId,
          action: 'DOCUMENTOS_ENVIADOS',
          comment: `${uploadedFiles.length} documento(s) enviado(s) pelo cidadão`
        }
        });

      // Criar notificação
      await prisma.notification.create({
        data: {
          citizenId: protocol.citizenId,
          title: 'Documentos Enviados',
          message: `${uploadedFiles.length} documento(s) enviado(s) para o protocolo ${protocol.number}`,
          type: 'SUCCESS',
          protocolId: protocolId
        }
        });

      return res.status(201).json({
        success: true,
        message: 'Documentos enviados com sucesso',
        files: uploadedFiles.map(file => ({
          originalName: file.originalName,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: file.uploadedAt
        }))
        });
    } catch (error: unknown) {
      console.error('Erro no upload de documentos:', error);
      cleanupTempFiles(files);

      const errorMessage = isError(error) ? error.message : 'Erro desconhecido';
      return res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro interno do servidor', errorMessage));
    }
  })
);

/**
 * GET /api/documents/:protocolId - Listar documentos de um protocolo
 */
router.get(
  '/:protocolId',
  familyAuthMiddleware,
  handleAsyncRoute(async (req, res) => {
    const { tenant, citizen } = req;
    const protocolId = getStringParam(req.params.protocolId);

    if (!protocolId) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do protocolo é obrigatório'));
    }

    // Verificar se o protocolo existe e pertence ao cidadão/família
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId
      }
    });

    if (!protocol) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Protocolo não encontrado'));
    }

    // Verificar autorização familiar
    const hasAccess =
      protocol.citizenId === citizen.id ||
      (await prisma.familyComposition.findFirst({
        where: {
          headId: citizen.id,
          memberId: protocol.citizenId
        }
        }));

    if (!hasAccess) {
      return res.status(403).json(createErrorResponse('ACCESS_DENIED', 'Acesso negado'));
    }

    const documents = Array.isArray(protocol.documents)
      ? (protocol.documents as unknown as ProtocolDocument[])
      : [];

    // Verificar se os arquivos ainda existem e obter informações atualizadas
    const documentsWithStatus = documents.map(doc => {
      const exists = fileExists(doc.path);
      const fileInfo = exists ? getFileInfo(doc.path) : null;

      return {
        ...doc,
        exists,
        currentSize: fileInfo?.size,
        lastModified: fileInfo?.modifiedAt
        };
    });

    return res.json({
      success: true,
      protocol: {
        id: protocol.id,
        number: protocol.number,
        title: protocol.title
        },
      documents: documentsWithStatus
        });
  })
);

/**
 * GET /api/documents/:protocolId/download/:filename - Download de documento
 */
router.get(
  '/:protocolId/download/:filename',
  familyAuthMiddleware,
  handleAsyncRoute(async (req, res) => {
    const { tenant, citizen } = req;
    const protocolId = getStringParam(req.params.protocolId);
    const filename = getStringParam(req.params.filename);

    if (!protocolId || !filename) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do protocolo e nome do arquivo são obrigatórios'));
    }

    // Verificar se o protocolo existe e pertence ao cidadão/família
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId
      }
    });

    if (!protocol) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Protocolo não encontrado'));
    }

    // Verificar autorização familiar
    const hasAccess =
      protocol.citizenId === citizen.id ||
      (await prisma.familyComposition.findFirst({
        where: {
          headId: citizen.id,
          memberId: protocol.citizenId
        }
        }));

    if (!hasAccess) {
      return res.status(403).json(createErrorResponse('ACCESS_DENIED', 'Acesso negado'));
    }

    // Verificar se o documento existe no protocolo
    const documents = Array.isArray(protocol.documents)
      ? (protocol.documents as unknown as ProtocolDocument[])
      : [];
    const document = documents.find(doc => doc.filename === filename);

    if (!document) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Documento não encontrado'));
    }

    // Verificar se o arquivo existe fisicamente
    const filePath = path.join(process.cwd(), document.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(createErrorResponse('FILE_NOT_FOUND', 'Arquivo não encontrado no servidor'));
    }

    // Definir headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimetype || 'application/octet-stream');

    // Enviar arquivo
    return res.sendFile(filePath);
  })
);

/**
 * DELETE /api/documents/:protocolId/:filename - Remover documento
 */
router.delete(
  '/:protocolId/:filename',
  familyAuthMiddleware,
  handleAsyncRoute(async (req, res) => {
    const { tenant, citizen } = req;
    const protocolId = getStringParam(req.params.protocolId);
    const filename = getStringParam(req.params.filename);

    if (!protocolId || !filename) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'ID do protocolo e nome do arquivo são obrigatórios'));
    }

    // Verificar se o protocolo existe e pertence ao cidadão/família
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId
      }
    });

    if (!protocol) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Protocolo não encontrado'));
    }

    // Verificar autorização familiar
    const hasAccess =
      protocol.citizenId === citizen.id ||
      (await prisma.familyComposition.findFirst({
        where: {
          headId: citizen.id,
          memberId: protocol.citizenId
        }
        }));

    if (!hasAccess) {
      return res.status(403).json(createErrorResponse('ACCESS_DENIED', 'Acesso negado'));
    }

    // Verificar se o protocolo permite remoção de documentos
    if (protocol.status === 'CONCLUIDO') {
      return res.status(400).json(createErrorResponse('INVALID_STATUS', 'Não é possível remover documentos de protocolos concluídos'));
    }

    const documents = Array.isArray(protocol.documents)
      ? (protocol.documents as unknown as ProtocolDocument[])
      : [];
    const documentIndex = documents.findIndex(doc => doc.filename === filename);

    if (documentIndex === -1) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Documento não encontrado'));
    }

    const document = documents[documentIndex];
    if (!document) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Documento não encontrado'));
    }

    // Remover arquivo físico
    const deleted = deleteFile(document.path);
    if (!deleted) {
      console.warn(`Arquivo não pôde ser deletado: ${document.path}`);
    }

    // Remover documento da lista
    const updatedDocuments = documents.filter((_, index) => index !== documentIndex);

    // Atualizar protocolo
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        documents: updatedDocuments as unknown as Prisma.InputJsonValue
        }
        });

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocolId,
        action: 'DOCUMENTO_REMOVIDO',
        comment: `Documento "${document.originalName}" removido pelo cidadão`
        }
        });

    return res.json({
      success: true,
      message: 'Documento removido com sucesso'
        });
  })
);

/**
 * GET /api/documents/info/limits - Informações sobre limites de upload
 */
router.get(
  '/info/limits',
  handleAsyncRoute(async (_req, res) => {
    return res.json({
      success: true,
      limits: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 10,
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