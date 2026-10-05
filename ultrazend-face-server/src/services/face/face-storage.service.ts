/**
 * Fotos da biometria: separadas por município e CIFRADAS no disco (AES-256-GCM).
 *
 * Antes ficavam abertas em /uploads (servidas sem login) e sem cifra. Agora
 * só saem por dentro do backend, para quem tem permissão, e cada acesso é
 * registrado. Arquivos antigos sem cifra continuam legíveis.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), 'uploads', 'face-platform');
const MAGIC = Buffer.from('DUF1');

function mediaKey(): Buffer {
  const base = process.env.FACE_MEDIA_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!base) throw new Error('JWT_SECRET ausente: não é possível cifrar as fotos da biometria');
  return crypto.createHash('sha256').update(`digiurban-face-media:${base}`).digest();
}

function normalizeBase64Image(input: string) {
  const match = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
  }
  return { mimeType: 'image/jpeg', buffer: Buffer.from(input, 'base64') };
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'sem-municipio';
}

export class FaceStorageService {
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = path.resolve(process.env.FACE_PLATFORM_STORAGE_PATH || DEFAULT_STORAGE_ROOT);
  }

  private resolve(relativePath: string) {
    const absolutePath = path.resolve(this.storageRoot, relativePath);
    if (!absolutePath.startsWith(this.storageRoot + path.sep)) {
      throw new Error('Caminho de foto fora da pasta da biometria.');
    }
    return absolutePath;
  }

  public async persistBase64Image(
    tenantId: string,
    category: 'enrollments' | 'events',
    imageBase64: string
  ): Promise<string> {
    const { mimeType, buffer } = normalizeBase64Image(imageBase64);
    const folder = path.join(this.storageRoot, safeSegment(tenantId), category, new Date().toISOString().slice(0, 10));
    const fileName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${extensionFromMimeType(mimeType)}.enc`;
    const absolutePath = path.join(folder, fileName);

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', mediaKey(), iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(absolutePath, Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted]), { mode: 0o600 });

    return path.relative(this.storageRoot, absolutePath).replace(/\\/g, '/');
  }

  public async readImage(relativePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const raw = await fs.readFile(this.resolve(relativePath));
    const name = relativePath.replace(/\.enc$/, '');
    const mimeType = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    if (raw.subarray(0, 4).equals(MAGIC)) {
      const decipher = crypto.createDecipheriv('aes-256-gcm', mediaKey(), raw.subarray(4, 16));
      decipher.setAuthTag(raw.subarray(16, 32));
      return { buffer: Buffer.concat([decipher.update(raw.subarray(32)), decipher.final()]), mimeType };
    }
    return { buffer: raw, mimeType }; // foto antiga, gravada antes da cifra
  }

  public async readImageAsBase64(relativePath: string): Promise<string> {
    const { buffer } = await this.readImage(relativePath);
    return buffer.toString('base64');
  }

  public async deleteRelativePath(relativePath: string | null | undefined): Promise<void> {
    if (!relativePath) return;
    await fs.rm(this.resolve(relativePath), { force: true });
  }
}

export default new FaceStorageService();
