/**
 * ============================================================================
 * SECURE UPLOAD MIDDLEWARE
 * ============================================================================
 * Middleware de segurança para upload de arquivos com validação robusta
 */

import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Response, NextFunction } from 'express';

// Importar validadores
import {
  DocumentConfig,
  getAllowedMimeTypes,
  getAllowedExtensions,
  normalizeDocumentConfigs,
  validateFile
} from '../utils/document-validation';

// Tipos de vírus/malware conhecidos em magic numbers
const MALICIOUS_SIGNATURES = [
  Buffer.from('4D5A', 'hex'), // EXE
  Buffer.from('7F454C46', 'hex'), // ELF
  Buffer.from('213C617263683E', 'hex'), // Archive
];

/**
 * Configuração de segurança
 */
const SECURITY_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB global máximo
  maxFiles: 20,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  blockedExtensions: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
    '.vbs', '.js', '.jar', '.wsf', '.sh', '.app',
    '.deb', '.rpm', '.dmg', '.pkg'
  ]
};

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos
 */
export function sanitizeFilename(filename: string): string {
  // Remover path traversal
  const basename = path.basename(filename);

  // Remover caracteres especiais perigosos, manter apenas alfanuméricos, pontos, hífens e underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limitar tamanho do nome
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    const ext = path.extname(sanitized);
    const name = sanitized.substring(0, maxLength - ext.length);
    return name + ext;
  }

  return sanitized;
}

/**
 * Gera nome único e seguro para arquivo
 */
export function generateSecureFilename(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const sanitizedName = sanitizeFilename(originalName);
  const ext = path.extname(sanitizedName);
  const nameWithoutExt = path.basename(sanitizedName, ext);

  // Formato: timestamp_random_userId_originalname.ext
  const userPart = userId ? `_${userId.substring(0, 8)}` : '';
  return `${timestamp}_${randomBytes}${userPart}_${nameWithoutExt}${ext}`;
}

/**
 * Verifica se o arquivo contém assinaturas maliciosas
 */
export function checkForMaliciousContent(filePath: string): boolean {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const header = fileBuffer.slice(0, 20); // Primeiros 20 bytes

    // Verificar assinaturas conhecidas
    for (const signature of MALICIOUS_SIGNATURES) {
      if (header.slice(0, signature.length).equals(signature)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar conteúdo malicioso:', error);
    return true; // Em caso de erro, considerar suspeito
  }
}

/**
 * Cria diretório seguro com permissões apropriadas
 */
export function createSecureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true,
      mode: 0o750 // rwxr-x--- (owner: rwx, group: r-x, others: ---)
    });
  }
}

/**
 * Configuração de storage seguro
 */
export function createSecureStorage(
  baseDir: string = 'uploads',
  subDir: string = 'documents'
) {
  return multer.diskStorage({
    destination: (req: any, file, cb) => {
      // Criar caminho baseado em data para organização
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      // uploads/documents/2025/01/
      const uploadPath = path.join(
        process.cwd(),
        baseDir,
        subDir,
        String(year),
        month
      );

      createSecureDirectory(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req: any, file, cb) => {
      const userId = req.citizen?.id || req.user?.id;
      const secureFilename = generateSecureFilename(file.originalname, userId);
      cb(null, secureFilename);
    }
  });
}

/**
 * Filtro de arquivo com validação de segurança
 */
export function createSecureFileFilter(documentConfigs?: DocumentConfig[]) {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 1. Verificar extensão bloqueada
    const ext = path.extname(file.originalname).toLowerCase();
    if (SECURITY_CONFIG.blockedExtensions.includes(ext)) {
      cb(new Error(`Extensão bloqueada por motivos de segurança: ${ext}`));
      return;
    }

    // 2. Verificar MIME type na whitelist global
    if (!SECURITY_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`Tipo MIME não permitido: ${file.mimetype}`));
      return;
    }

    // 3. Se houver configurações específicas de documentos, validar contra elas
    if (documentConfigs && documentConfigs.length > 0) {
      const allowedMimeTypes = new Set<string>();
      const allowedExtensions = new Set<string>();

      documentConfigs.forEach(config => {
        getAllowedMimeTypes(config.acceptedFormats).forEach(mime =>
          allowedMimeTypes.add(mime)
        );
        getAllowedExtensions(config.acceptedFormats).forEach(ext =>
          allowedExtensions.add(ext)
        );
      });

      if (!allowedMimeTypes.has(file.mimetype)) {
        cb(new Error(`Tipo de arquivo não aceito pelo serviço: ${file.mimetype}`));
        return;
      }

      if (!allowedExtensions.has(ext)) {
        cb(new Error(`Extensão não aceita pelo serviço: ${ext}`));
        return;
      }
    }

    // 4. Validar nome do arquivo
    const sanitized = sanitizeFilename(file.originalname);
    if (sanitized !== file.originalname) {
      // Nome foi sanitizado, mas permitir (o nome será ajustado no storage)
      console.warn(`Nome de arquivo sanitizado: ${file.originalname} -> ${sanitized}`);
    }

    cb(null, true);
  };
}

/**
 * Middleware para validação pós-upload
 */
export function validateUploadedFilesMiddleware(
  documentConfigs?: DocumentConfig[]
) {
  return async (req: any, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado',
        errorCode: 'NO_FILES'
      });
    }

    try {
      // 1. Verificar cada arquivo individualmente
      for (const file of files) {
        // Verificar se o arquivo foi salvo
        if (!fs.existsSync(file.path)) {
          throw new Error(`Arquivo não foi salvo corretamente: ${file.originalname}`);
        }

        // Verificar conteúdo malicioso
        if (checkForMaliciousContent(file.path)) {
          // Deletar arquivo imediatamente
          fs.unlinkSync(file.path);
          throw new Error(`Arquivo suspeito detectado: ${file.originalname}`);
        }

        // Validar tamanho real do arquivo
        const stats = fs.statSync(file.path);
        if (stats.size !== file.size) {
          console.warn(`Tamanho de arquivo inconsistente: ${file.originalname}`);
        }

        // Se houver configurações específicas, validar contra elas
        if (documentConfigs && documentConfigs.length > 0) {
          const normalizedConfigs = normalizeDocumentConfigs(documentConfigs);

          // Usar a configuração mais permissiva como fallback
          const config = normalizedConfigs[0];
          if (config) {
            const validation = validateFile(file, config);
            if (!validation.valid) {
              // Deletar arquivo
              fs.unlinkSync(file.path);
              throw new Error(validation.error);
            }
          }
        }
      }

      // 2. Verificar total de arquivos
      if (files.length > SECURITY_CONFIG.maxFiles) {
        // Limpar todos os arquivos
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        return res.status(400).json({
          error: `Máximo de ${SECURITY_CONFIG.maxFiles} arquivos permitidos`,
          errorCode: 'TOO_MANY_FILES'
        });
      }

      next();
    } catch (error) {
      // Limpar arquivos em caso de erro
      files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupError) {
          console.error('Erro ao limpar arquivo:', cleanupError);
        }
      });

      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Erro na validação dos arquivos',
        errorCode: 'VALIDATION_ERROR'
      });
    }
  };
}

/**
 * Cria middleware de upload seguro
 */
export function createSecureUploadMiddleware(
  documentConfigs?: DocumentConfig[],
  options?: {
    maxFileSize?: number;
    maxFiles?: number;
  }
) {
  const storage = createSecureStorage();
  const fileFilter = createSecureFileFilter(documentConfigs);

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: options?.maxFileSize || SECURITY_CONFIG.maxFileSize,
      files: options?.maxFiles || SECURITY_CONFIG.maxFiles,
      fieldSize: 10 * 1024 * 1024, // 10MB para campos
    }
  });
}

/**
 * Deleta arquivo com segurança
 */
export function secureDeleteFile(filePath: string): boolean {
  try {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    // Verificar que o arquivo está dentro do diretório de uploads
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fullPath.startsWith(uploadsDir)) {
      console.error('Tentativa de deletar arquivo fora do diretório de uploads:', fullPath);
      return false;
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

/**
 * Move arquivo com segurança
 */
export function secureMoveFile(
  sourcePath: string,
  targetPath: string
): boolean {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const fullSourcePath = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.join(process.cwd(), sourcePath);
    const fullTargetPath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(process.cwd(), targetPath);

    // Verificar que ambos os caminhos estão dentro de uploads
    if (!fullSourcePath.startsWith(uploadsDir) || !fullTargetPath.startsWith(uploadsDir)) {
      console.error('Tentativa de mover arquivo fora do diretório de uploads');
      return false;
    }

    // Criar diretório de destino se não existir
    const targetDir = path.dirname(fullTargetPath);
    createSecureDirectory(targetDir);

    // Mover arquivo
    fs.renameSync(fullSourcePath, fullTargetPath);
    return true;
  } catch (error) {
    console.error('Erro ao mover arquivo:', error);
    return false;
  }
}

export default {
  createSecureUploadMiddleware,
  validateUploadedFilesMiddleware,
  sanitizeFilename,
  generateSecureFilename,
  checkForMaliciousContent,
  createSecureDirectory,
  secureDeleteFile,
  secureMoveFile,
  SECURITY_CONFIG
};
