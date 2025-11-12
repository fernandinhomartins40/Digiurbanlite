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
    const ext = path.extname(file.originalname);
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
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
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

// Função para obter URL pública do arquivo
export const getFileUrl = (filename: string): string => {
  return `/uploads/documents/${filename}`;
};
