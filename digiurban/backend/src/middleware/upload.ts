import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response, NextFunction } from 'express';
import {
  UploadConfig,
  UploadedFile,
  UploadRequest,
  MiddlewareFunction,
  CitizenAuthenticatedRequest
        } from '../types';

// Configuração de tipos permitidos
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configuração do storage com tipos seguros
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const { protocolId } = req.params;

    // Caminho: uploads/protocols/[protocolId]/
    const uploadPath = path.join(
      process.cwd(),
      'uploads',
      'protocols',
      protocolId || 'temp'
    );

    // Criar diretório se não existir
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req: CitizenAuthenticatedRequest, file, cb) => {
    const { citizen } = req;

    // Nome: timestamp_citizenId_originalname com segurança
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const citizenId = citizen?.id || 'anonymous';
    const filename = `${timestamp}_${citizenId}_${sanitizedName}`;

    cb(null, filename);
      }
      });

// Filtro de arquivos com validação de segurança
const fileFilter = (
  req: UploadRequest,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Verificar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    return;
  }

  // Verificar extensão
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
  ];

  if (!allowedExtensions.includes(ext)) {
    cb(new Error(`Extensão de arquivo não permitida: ${ext}`));
    return;
  }

  cb(null, true);
};

// Configuração do multer
export const uploadMiddleware = (multer as any)({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Máximo 10 arquivos por upload
      }
      });

/**
 * Middleware para validar arquivos após upload usando tipos centralizados
 */
export const validateUploadedFiles = (req: UploadRequest, res: Response, next: NextFunction): void | Response => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
  }

  // Verificar se todos os arquivos foram salvos corretamente
  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      return res.status(500).json({
        error: `Erro ao salvar arquivo: ${file.originalname}`
      });
      }
  }

  next();
};

/**
 * Função para limpar arquivos temporários com tipagem segura
 */
export const cleanupTempFiles = (files: UploadedFile[]) => {
  files.forEach(file => {
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Erro ao limpar arquivo temporário:', error);
      }
      });
};

/**
 * Função para mover arquivos para diretório final com tipagem segura
 */
export const moveFilesToProtocol = async (
  files: UploadedFile[],
  protocolId: string
): Promise<
  Array<{
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
    uploadedAt: Date;
  }>
> => {
  const finalPath = path.join(
    process.cwd(),
    'uploads',
    'protocols',
    protocolId
  );

  // Criar diretório se não existir
  fs.mkdirSync(finalPath, { recursive: true });

  const movedFiles = [];

  for (const file of files) {
    if (!file.path) {
      throw new Error(`Caminho do arquivo não encontrado: ${file.originalname}`);
    }

    const newPath = path.join(finalPath, path.basename(file.path));

    try {
      // Mover arquivo
      fs.renameSync(file.path, newPath);

      movedFiles.push({
        originalName: file.originalname,
        filename: path.basename(newPath),
        mimetype: file.mimetype,
        size: file.size,
        path: newPath.replace(process.cwd(), ''), // Caminho relativo
        uploadedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao mover arquivo:', error);
      throw new Error(`Erro ao mover arquivo: ${file.originalname}`);
      }
  }

  return movedFiles;
};

/**
 * Função para deletar arquivo com validação de segurança
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
      }
};

/**
 * Função para verificar se arquivo existe com tipagem segura
 */
export const fileExists = (filePath: string): boolean => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
      }
};

/**
 * Função para obter informações do arquivo com tipagem segura
 */
export const getFileInfo = (
  filePath: string
): {
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  extension: string;
  basename: string;
} | null => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension: path.extname(fullPath),
      basename: path.basename(fullPath)
        };
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
    return null;
      }
};
