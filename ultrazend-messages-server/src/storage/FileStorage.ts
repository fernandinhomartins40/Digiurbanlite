import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import logger from '../utils/logger';

export interface UploadedFile {
  originalName: string;
  fileName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export class FileStorage {
  private uploadDir: string;
  private baseUrl: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:9001';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB padrão
    this.allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf,audio/mpeg,audio/ogg').split(',');

    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'audio'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'thumbnails'), { recursive: true });
    } catch (error) {
      logger.error('Error creating upload directories', { error });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadedFile> {
    try {
      // Validar tamanho
      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed (${this.maxFileSize} bytes)`);
      }

      // Validar tipo
      if (!this.allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type not allowed: ${file.mimetype}`);
      }

      // Determinar subpasta
      let subfolder = 'documents';
      if (file.mimetype.startsWith('image/')) {
        subfolder = 'images';
      } else if (file.mimetype.startsWith('audio/')) {
        subfolder = 'audio';
      }

      // Gerar nome único
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const filePath = path.join(this.uploadDir, subfolder, fileName);

      // Salvar arquivo
      await fs.writeFile(filePath, file.buffer);

      const result: UploadedFile = {
        originalName: file.originalname,
        fileName,
        path: filePath,
        url: `${this.baseUrl}/uploads/${subfolder}/${fileName}`,
        mimeType: file.mimetype,
        size: file.size,
      };

      // Se for imagem, processar e obter dimensões
      if (file.mimetype.startsWith('image/')) {
        const imageInfo = await this.processImage(filePath);
        result.width = imageInfo.width;
        result.height = imageInfo.height;
      }

      logger.info('File uploaded', {
        fileName,
        mimeType: file.mimetype,
        size: file.size,
      });

      return result;
    } catch (error) {
      logger.error('Error uploading file', { error, fileName: file.originalname });
      throw error;
    }
  }

  private async processImage(filePath: string) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Criar thumbnail
      const thumbnailPath = filePath.replace('/images/', '/thumbnails/');
      await image
        .resize(200, 200, { fit: 'cover' })
        .toFile(thumbnailPath);

      // Otimizar imagem original se for muito grande
      if (metadata.width && metadata.width > 2000) {
        await image
          .resize(2000, null, { withoutEnlargement: true })
          .toFile(filePath + '.tmp');

        await fs.rename(filePath + '.tmp', filePath);
      }

      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      logger.error('Error processing image', { error, filePath });
      return { width: undefined, height: undefined };
    }
  }

  async deleteFile(filePath: string) {
    try {
      await fs.unlink(filePath);

      // Se for imagem, deletar thumbnail também
      if (filePath.includes('/images/')) {
        const thumbnailPath = filePath.replace('/images/', '/thumbnails/');
        try {
          await fs.unlink(thumbnailPath);
        } catch {
          // Thumbnail pode não existir
        }
      }

      logger.info('File deleted', { filePath });
    } catch (error) {
      logger.error('Error deleting file', { error, filePath });
      throw error;
    }
  }

  async getFileInfo(fileName: string) {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      const stats = await fs.stat(filePath);

      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      logger.error('Error getting file info', { error, fileName });
      throw error;
    }
  }

  getThumbnailUrl(imageUrl: string): string {
    return imageUrl.replace('/images/', '/thumbnails/');
  }
}

export default new FileStorage();
