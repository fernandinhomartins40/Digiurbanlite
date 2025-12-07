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

  const add = (p: string | undefined) => {
    if (p && !candidates.includes(p)) candidates.push(p);
  };

  // Absoluto original
  if (path.isAbsolute(rawPath)) add(rawPath);

  const cleaned = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

  // Relativo ao base configurado / cwd / backend
  add(path.join(UPLOAD_BASE_PATH, cleaned));
  add(path.join(process.cwd(), cleaned));
  add(path.join(process.cwd(), 'backend', cleaned));

  // Legado: caminhos salvos como /app/backend/uploads/...
  if (rawPath.includes('/backend/uploads/')) {
    const relativeAfterUploads = rawPath.split('/backend/uploads/')[1];
    add(path.join('/app/uploads', relativeAfterUploads));
    add(path.join(UPLOAD_BASE_PATH, relativeAfterUploads));
    add(path.join(process.cwd(), 'uploads', relativeAfterUploads));
  }

  // Legado: caminhos absolutos começando em /app/backend/uploads
  if (rawPath.startsWith('/app/backend/uploads')) {
    const after = rawPath.replace('/app/backend/uploads', '').replace(/^\/+/, '');
    add(path.join('/app/backend/uploads', after));
    add(path.join('/app/uploads', after));
    add(path.join(UPLOAD_BASE_PATH, after));
    add(path.join(process.cwd(), 'uploads', after));
  }

  // Heurística: buscar pelo basename no diretório uploads/documents
  const baseName = path.basename(rawPath);
  add(path.join(process.cwd(), 'uploads', baseName));
  add(path.join(process.cwd(), 'uploads', 'documents', baseName));

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
