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

export const resolveLocalFilePath = (rawPath: string) => {
  const candidates: string[] = [];

  // Absoluto
  if (path.isAbsolute(rawPath)) {
    candidates.push(rawPath);
  }

  // Relativo ao base de uploads configurado
  const cleaned = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
  candidates.push(path.join(UPLOAD_BASE_PATH, cleaned));

  // Relativo ao cwd
  candidates.push(path.join(process.cwd(), cleaned));

  // Relativo a backend/ (caso cwd seja raiz do mono)
  candidates.push(path.join(process.cwd(), 'backend', cleaned));

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
