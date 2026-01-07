/**
 * ============================================================================
 * UPLOAD CONFIGURATION
 * ============================================================================
 * Configuração de upload de arquivos com multer
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Diretório de uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Criar diretório se não existir
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar subdiretórios por tipo de documento
    const uploadPath = path.join(UPLOAD_DIR, 'documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    let ext = path.extname(file.originalname);

    // ✅ CORREÇÃO: Fallback para .jpg se extensão vazia (ex: "blob")
    if (!ext || ext === '.') {
      // Detectar extensão pelo MIME type
      if (file.mimetype.startsWith('image/')) {
        ext = file.mimetype === 'image/png' ? '.png' :
              file.mimetype === 'image/gif' ? '.gif' :
              file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      } else if (file.mimetype === 'application/pdf') {
        ext = '.pdf';
      } else {
        ext = '.jpg'; // Fallback padrão
      }
    }

    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  }
});

// Filtro de arquivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Formatos permitidos
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  // Aceitar qualquer tipo de imagem
  if (file.mimetype.startsWith('image/') || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`MIME type rejeitado: ${file.mimetype} para arquivo ${file.originalname}`);
    cb(new Error(`Formato de arquivo não permitido: ${file.mimetype}`));
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
        });

// Upload múltiplo de documentos
export const uploadDocuments = upload.array('documents', 20); // Máximo 20 arquivos

// Upload único
export const uploadSingle = upload.single('file');

// Função para deletar arquivo
export const deleteFile = (filePath: string): void => {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
  }
};

// ============================================================================
// FASE 1: PADRÃO ÚNICO DE ARMAZENAMENTO
// ============================================================================

/**
 * Obtém URL pública do arquivo no padrão canônico
 * PADRÃO: /uploads/protocols/{protocolId}/{filename}
 */
export const getProtocolFileUrl = (protocolId: string, filename: string): string => {
  return `/uploads/protocols/${protocolId}/${filename}`;
};

/**
 * Obtém caminho físico absoluto do arquivo
 * PADRÃO: {cwd}/uploads/protocols/{protocolId}/{filename}
 */
export const getProtocolFilePath = (protocolId: string, filename: string): string => {
  return path.join(UPLOAD_DIR, 'protocols', protocolId, filename);
};

/**
 * Extrai filename de uma URL completa
 * Ex: "/uploads/protocols/abc123/file.pdf" => "file.pdf"
 */
export const extractFilename = (fileUrl: string): string => {
  return path.basename(fileUrl);
};

/**
 * Cria diretório do protocolo se não existir
 */
export const ensureProtocolDir = (protocolId: string): string => {
  const protocolDir = path.join(UPLOAD_DIR, 'protocols', protocolId);
  if (!fs.existsSync(protocolDir)) {
    fs.mkdirSync(protocolDir, { recursive: true });
  }
  return protocolDir;
};

// ❌ REMOVIDO: getFileUrl() deprecated
// Sistema agora usa APENAS getProtocolFileUrl() - padrão único sem exceções
