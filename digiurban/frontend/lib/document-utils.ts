/**
 * ============================================================================
 * DOCUMENT UTILITIES
 * ============================================================================
 * Utilitários para manipulação de documentos no frontend
 */

export interface DocumentConfig {
  name: string;
  description?: string;
  required: boolean;
  acceptedFormats: string[];
  allowCameraUpload: boolean;
  maxSizeMB: number;
}

/**
 * Mapeamento de extensões para MIME types
 */
const MIME_TYPE_MAP: Record<string, string> = {
  'pdf': 'application/pdf',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Obtém o atributo accept do input file baseado nos formatos aceitos
 */
export function getAcceptAttribute(acceptedFormats: string[]): string {
  const mimeTypes = acceptedFormats.map(format => {
    const mime = MIME_TYPE_MAP[format.toLowerCase()];
    return mime || `.${format.toLowerCase()}`;
  });

  return mimeTypes.join(',');
}

/**
 * Valida um arquivo antes do upload
 */
export function validateFile(
  file: File,
  documentConfig: DocumentConfig
): { valid: boolean; error?: string } {
  // Validar tamanho
  const maxSizeBytes = documentConfig.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo excede o tamanho máximo de ${documentConfig.maxSizeMB}MB`
    };
  }

  // Validar tipo
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.') + 1);
  const acceptedFormatsLower = documentConfig.acceptedFormats.map(f => f.toLowerCase());

  if (!acceptedFormatsLower.includes(fileExtension)) {
    return {
      valid: false,
      error: `Formato não permitido. Formatos aceitos: ${documentConfig.acceptedFormats.join(', ').toUpperCase()}`
    };
  }

  // Validar MIME type
  const expectedMimeType = MIME_TYPE_MAP[fileExtension];
  if (expectedMimeType && file.type !== expectedMimeType) {
    // Alguns navegadores podem não definir o MIME type corretamente
    console.warn(`MIME type mismatch: expected ${expectedMimeType}, got ${file.type}`);
  }

  return { valid: true };
}

/**
 * Formata o tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Verifica se um formato é de imagem
 */
export function isImageFormat(format: string): boolean {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif'];
  return imageFormats.includes(format.toLowerCase());
}

/**
 * Verifica se o documento permite uso de câmera
 */
export function canUseCameraUpload(documentConfig: DocumentConfig): boolean {
  if (!documentConfig.allowCameraUpload) {
    return false;
  }

  // Verificar se pelo menos um formato aceito é de imagem
  return documentConfig.acceptedFormats.some(format => isImageFormat(format));
}

/**
 * Gera nome de arquivo seguro
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
}

/**
 * Converte File para base64 (útil para preview)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Comprime imagem se necessário
 */
export async function compressImage(
  file: File,
  maxSizeMB: number,
  quality: number = 0.8
): Promise<File> {
  // Se o arquivo já está dentro do limite, retornar sem modificar
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  // Se não for imagem, retornar sem modificar
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar mantendo proporção se muito grande
        const maxDimension = 2048;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
}

/**
 * Valida múltiplos arquivos
 */
export function validateFiles(
  files: File[],
  documentConfigs: DocumentConfig[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Usar a configuração mais restritiva como padrão
  const defaultConfig = documentConfigs[0] || {
    name: 'Documento',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    allowCameraUpload: true,
    maxSizeMB: 5
  };

  files.forEach((file, index) => {
    const validation = validateFile(file, defaultConfig);
    if (!validation.valid) {
      errors.push(`Arquivo ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Cria preview de arquivo (para imagens)
 */
export async function createFilePreview(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  try {
    const base64 = await fileToBase64(file);
    return base64;
  } catch (error) {
    console.error('Erro ao criar preview:', error);
    return null;
  }
}

/**
 * Baixa arquivo a partir de URL
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formata lista de formatos aceitos para exibição
 */
export function formatAcceptedFormats(formats: string[]): string {
  return formats.map(f => f.toUpperCase()).join(', ');
}

/**
 * Verifica se precisa comprimir arquivo
 */
export function needsCompression(file: File, maxSizeMB: number): boolean {
  return file.size > maxSizeMB * 1024 * 1024 && file.type.startsWith('image/');
}

/**
 * Normaliza configurações de documentos (compatibilidade com formato antigo)
 */
export function normalizeDocumentConfig(doc: any): DocumentConfig {
  if (typeof doc === 'string') {
    return {
      name: doc,
      description: '',
      required: false,
      acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      allowCameraUpload: true,
      maxSizeMB: 5
    };
  }

  return {
    name: doc.name || 'Documento',
    description: doc.description || '',
    required: doc.required !== undefined ? doc.required : false,
    acceptedFormats: doc.acceptedFormats || ['pdf', 'jpg', 'jpeg', 'png'],
    allowCameraUpload: doc.allowCameraUpload !== undefined ? doc.allowCameraUpload : true,
    maxSizeMB: doc.maxSizeMB || 5
  };
}

/**
 * Agrupa documentos por tipo
 */
export function groupDocumentsByType(documents: any[]): Record<string, any[]> {
  return documents.reduce((acc, doc) => {
    const type = doc.documentType || 'Outros';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, any[]>);
}
