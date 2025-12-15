import path from 'path';
import fs from 'fs';

const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');

export const guessMimeFromExtension = (fileName?: string, fallback?: string) => {
  if (!fileName) return fallback || 'application/octet-stream';
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.match(/\.(tif|tiff)$/)) return 'image/tiff';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return fallback || 'application/octet-stream';
};

/**
 * Resolve caminho de arquivo local com estratégia simplificada
 * PADRÃO ÚNICO: /uploads/protocols/{protocolId}/{filename}
 */
export const resolveLocalFilePath = (rawPath: string) => {
  const candidates: string[] = [];

  const add = (p: string | undefined) => {
    if (p && !candidates.includes(p)) candidates.push(p);
  };

  // Se já é caminho absoluto E existe, usar direto
  if (path.isAbsolute(rawPath) && fs.existsSync(rawPath)) {
    return { found: true, filePath: rawPath, tried: [rawPath] };
  }

  // Limpar caminho - remover process.cwd() se estiver duplicado
  let cleaned = rawPath;
  const cwd = process.cwd();

  // CORREÇÃO: Substituir /app/backend/uploads por /app/uploads (migração de path antigo)
  if (cleaned.includes('/app/backend/uploads')) {
    cleaned = cleaned.replace('/app/backend/uploads', '/app/uploads');
  }

  // Se o caminho contém process.cwd() duplicado (ex: /app/backend/app/backend/uploads...)
  if (cleaned.includes(cwd)) {
    // Remover primeira ocorrência de cwd
    cleaned = cleaned.replace(cwd, '');
  }

  // Remover barra inicial se existir
  cleaned = cleaned.startsWith('/') ? cleaned.slice(1) : cleaned;

  // Estratégia 1: Caminho relativo ao diretório de trabalho atual
  add(path.join(process.cwd(), cleaned));

  // Estratégia 2: Caminho relativo ao UPLOAD_BASE_PATH configurado
  add(path.join(UPLOAD_BASE_PATH, cleaned));

  // Estratégia 3: Se original era absoluto, tentar direto
  if (path.isAbsolute(rawPath)) {
    add(rawPath);
  }

  const tried: string[] = [];
  for (const candidate of candidates) {
    if (tried.includes(candidate)) continue;
    tried.push(candidate);
    if (fs.existsSync(candidate)) {
      return { found: true, filePath: candidate, tried };
    }
  }

  return { found: false, tried };
};

export const getUploadBasePath = () => UPLOAD_BASE_PATH;
