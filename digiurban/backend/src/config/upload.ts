/**
 * ============================================================================
 * UPLOAD CONFIGURATION
 * ============================================================================
 * Configuração de upload de arquivos com multer
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { tryGetTenantContext, DEFAULT_TENANT_ID } from '../lib/tenant-context';
import { isTenantStrict, reportTenantFailSoft } from '../lib/tenant-telemetry';

// Diretório de uploads
// ✅ IMPORTANTE: Usar /app/uploads (compartilhado com ultrazend-smtp via volume)
// ⚠️ FONTE ÚNICA: o express.static (index.ts) e TODOS os endpoints que gravam
// arquivos devem usar ESTE mesmo diretório. Divergir (ex.: gravar em
// UPLOAD_BASE_PATH mas servir de process.cwd()/uploads) faz o arquivo existir
// mas nunca ser servido (404). Por isso é exportado como UPLOAD_BASE_DIR.
export const UPLOAD_BASE_DIR = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
const UPLOAD_DIR = UPLOAD_BASE_DIR;

// Criar diretório se não existir
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============================================================================
// FASE B MULTI-TENANT: PARTICIONAMENTO POR TENANT
// ============================================================================
// Layout novo: uploads/t/{tenantId}/{categoria}/... — o segmento fixo "t/"
// distingue o layout particionado do legado (protocols/, documents/, ...) e
// permite ao gate de leitura (uploads-access.ts) validar o tenant do path
// contra o claim do JWT sem consultar o banco.
// Leituras têm fallback para o layout legado até a migração física
// (scripts/migrate-uploads-tenant.ts) ser executada.

/** Segmento raiz do layout particionado por tenant. */
export const TENANT_UPLOADS_SEGMENT = 't';

/**
 * Resolve o tenant para operações de upload.
 * Ordem: explícito (jobs/scripts com a linha do banco em mãos) → contexto ALS.
 * Transição (até a Fase D/fail-closed): sem contexto → default, com log — a
 * mesma postura fail-soft do restante da base.
 */
export function resolveUploadTenantId(explicitTenantId?: string | null): string {
  if (explicitTenantId) return explicitTenantId;
  const ctx = tryGetTenantContext();
  if (ctx && !ctx.isPlatform && ctx.tenantId) return ctx.tenantId;

  // Fase D: telemetria sempre; TENANT_STRICT lança (arquivo no diretório do
  // município errado é corrupção silenciosa — jobs/plataforma devem passar o
  // tenant explicitamente).
  reportTenantFailSoft('upload-resolver');
  if (isTenantStrict()) {
    throw new Error(
      'TENANT_STRICT: operação de arquivo sem tenant — passe o tenantId explicitamente em jobs/contexto de plataforma.'
    );
  }
  return DEFAULT_TENANT_ID;
}

/** Diretório físico particionado: uploads/t/{tenantId}/{...segments} */
export function getTenantUploadDir(tenantId: string | undefined | null, ...segments: string[]): string {
  return path.join(UPLOAD_DIR, TENANT_UPLOADS_SEGMENT, resolveUploadTenantId(tenantId), ...segments);
}

/** URL pública particionada: /uploads/t/{tenantId}/{...segments} */
export function getTenantUploadUrl(tenantId: string | undefined | null, ...segments: string[]): string {
  return `/uploads/${TENANT_UPLOADS_SEGMENT}/${resolveUploadTenantId(tenantId)}/${segments.join('/')}`;
}

/**
 * Move um arquivo enviado para o destino final.
 * rename falha com EXDEV quando origem e destino estão em volumes/discos
 * diferentes (comum em Docker) — fallback para copy + unlink.
 */
export function moveUploadedFileSync(sourcePath: string, destPath: string): void {
  try {
    fs.renameSync(sourcePath, destPath);
  } catch (error: any) {
    if (error?.code === 'EXDEV') {
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);
      return;
    }
    throw error;
  }
}

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Fase B: staging particionado por tenant — o tenant vem da request
    // (tenantContextMiddleware) ou do contexto ALS via resolveUploadTenantId.
    const tenantId = (req as any).tenantId as string | undefined;
    const uploadPath = getTenantUploadDir(tenantId, 'documents');
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

    let name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');

    // ✅ CORREÇÃO: Se nome é "blob" ou vazio, usar "documento"
    if (!name || name === 'blob' || name.length < 3) {
      name = 'documento';
    }

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
// ✅ CORREÇÃO CRÍTICA: usar .any() ao invés de .array('documents')
// Frontend envia: documents[0][file], documents[1][file], etc
// Multer .array() só aceita: documents[], documents[], etc
export const uploadDocuments = upload.any(); // Aceita qualquer campo

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
// FASE 1: PADRÃO ÚNICO DE ARMAZENAMENTO (agora particionado por tenant)
// ============================================================================

/**
 * Obtém URL pública do arquivo no padrão canônico
 * PADRÃO (Fase B): /uploads/t/{tenantId}/protocols/{protocolId}/{filename}
 */
export const getProtocolFileUrl = (
  protocolId: string,
  filename: string,
  tenantId?: string | null
): string => {
  return getTenantUploadUrl(tenantId, 'protocols', protocolId, filename);
};

/**
 * Obtém caminho físico absoluto do arquivo.
 * PADRÃO (Fase B): {uploads}/t/{tenantId}/protocols/{protocolId}/{filename}
 *
 * COMPAT (até a migração física): se o arquivo não existe no layout novo mas
 * existe no legado ({uploads}/protocols/...), devolve o legado — leituras de
 * arquivos ainda não migrados continuam funcionando.
 */
export const getProtocolFilePath = (
  protocolId: string,
  filename: string,
  tenantId?: string | null
): string => {
  const tenantPath = path.join(
    getTenantUploadDir(tenantId, 'protocols', protocolId),
    filename
  );
  if (fs.existsSync(tenantPath)) return tenantPath;

  const legacyPath = path.join(UPLOAD_DIR, 'protocols', protocolId, filename);
  if (fs.existsSync(legacyPath)) return legacyPath;

  // Nenhum existe (ex.: validação de integridade): reportar o caminho canônico
  return tenantPath;
};

/**
 * Extrai filename de uma URL completa
 * Ex: "/uploads/protocols/abc123/file.pdf" => "file.pdf"
 */
export const extractFilename = (fileUrl: string): string => {
  return path.basename(fileUrl);
};

/**
 * Cria diretório do protocolo se não existir (layout particionado — escritas
 * novas SEMPRE vão para uploads/t/{tenantId}/protocols/).
 */
export const ensureProtocolDir = (protocolId: string, tenantId?: string | null): string => {
  const protocolDir = getTenantUploadDir(tenantId, 'protocols', protocolId);
  if (!fs.existsSync(protocolDir)) {
    fs.mkdirSync(protocolDir, { recursive: true });
  }
  return protocolDir;
};

// ❌ REMOVIDO: getFileUrl() deprecated
// Sistema agora usa APENAS getProtocolFileUrl() - padrão único sem exceções
