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

  // Limpar caminho (remover barra inicial se existir)
  const cleaned = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

  // Estratégia 1: Caminho relativo ao diretório de trabalho atual
  add(path.join(process.cwd(), cleaned));

  // Estratégia 2: Caminho relativo ao UPLOAD_BASE_PATH configurado
  add(path.join(UPLOAD_BASE_PATH, cleaned));

  // Estratégia 3: Se for caminho absoluto, usar direto
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
