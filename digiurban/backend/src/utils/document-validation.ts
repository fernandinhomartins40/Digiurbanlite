/**
 * ============================================================================
 * DOCUMENT VALIDATION UTILITIES
 * ============================================================================
 * Validação dinâmica de documentos baseada em configurações do serviço
 */

export interface DocumentConfig {
  name: string;
  description?: string;
  required: boolean;
  acceptedFormats: string[];
  allowCameraUpload: boolean;
  maxSizeMB: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

// Mapeamento de extensões para MIME types
const MIME_TYPE_MAP: Record<string, string[]> = {
  'pdf': ['application/pdf'],
  'jpg': ['image/jpeg'],
  'jpeg': ['image/jpeg'],
  'png': ['image/png'],
  'gif': ['image/gif'],
  'doc': ['application/msword'],
  'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'xls': ['application/vnd.ms-excel'],
  'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

// Extensões permitidas por formato
const FORMAT_EXTENSIONS: Record<string, string[]> = {
  'pdf': ['.pdf'],
  'jpg': ['.jpg', '.jpeg'],
  'jpeg': ['.jpg', '.jpeg'],
  'png': ['.png'],
  'gif': ['.gif'],
  'doc': ['.doc'],
  'docx': ['.docx'],
  'xls': ['.xls'],
  'xlsx': ['.xlsx'],
};

/**
 * Obtém os MIME types permitidos baseado nos formatos aceitos
 */
export function getAllowedMimeTypes(acceptedFormats: string[]): string[] {
  const mimeTypes = new Set<string>();

  acceptedFormats.forEach(format => {
    const formatLower = format.toLowerCase();
    const mimes = MIME_TYPE_MAP[formatLower];
    if (mimes) {
      mimes.forEach(mime => mimeTypes.add(mime));
    }
  });

  return Array.from(mimeTypes);
}

/**
 * Obtém as extensões permitidas baseado nos formatos aceitos
 */
export function getAllowedExtensions(acceptedFormats: string[]): string[] {
  const extensions = new Set<string>();

  acceptedFormats.forEach(format => {
    const formatLower = format.toLowerCase();
    const exts = FORMAT_EXTENSIONS[formatLower];
    if (exts) {
      exts.forEach(ext => extensions.add(ext));
    }
  });

  return Array.from(extensions);
}

/**
 * Valida um arquivo baseado na configuração do documento
 */
export function validateFile(
  file: {
    originalname: string;
    mimetype: string;
    size: number;
  },
  documentConfig: DocumentConfig
): ValidationResult {
  // Validar tamanho do arquivo
  const maxSizeBytes = documentConfig.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo ${file.originalname} excede o tamanho máximo de ${documentConfig.maxSizeMB}MB`,
      errorCode: 'FILE_TOO_LARGE'
    };
  }

  // Validar MIME type
  const allowedMimeTypes = getAllowedMimeTypes(documentConfig.acceptedFormats);
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido para ${documentConfig.name}. Formatos aceitos: ${documentConfig.acceptedFormats.join(', ').toUpperCase()}`,
      errorCode: 'INVALID_MIME_TYPE'
    };
  }

  // Validar extensão
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  const allowedExtensions = getAllowedExtensions(documentConfig.acceptedFormats);
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida para ${documentConfig.name}. Extensões aceitas: ${allowedExtensions.join(', ')}`,
      errorCode: 'INVALID_EXTENSION'
    };
  }

  return { valid: true };
}

/**
 * Valida múltiplos arquivos contra uma lista de configurações de documentos
 */
export function validateDocuments(
  files: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    fieldname?: string;
  }>,
  documentConfigs: DocumentConfig[]
): ValidationResult {
  // Validar cada arquivo
  for (const file of files) {
    // Se o arquivo tem um fieldname que corresponde a um documento específico
    const documentConfig = documentConfigs.find(
      config => config.name === file.fieldname ||
               config.name.toLowerCase().replace(/\s+/g, '_') === file.fieldname
    );

    if (documentConfig) {
      const result = validateFile(file, documentConfig);
      if (!result.valid) {
        return result;
      }
    } else {
      // Se não encontrou configuração específica, validar contra os formatos mais permissivos
      const mostPermissiveConfig = documentConfigs.reduce((prev, curr) => {
        return curr.acceptedFormats.length > prev.acceptedFormats.length ? curr : prev;
      }, documentConfigs[0]);

      if (mostPermissiveConfig) {
        const result = validateFile(file, mostPermissiveConfig);
        if (!result.valid) {
          return result;
        }
      }
    }
  }

  // Validar documentos obrigatórios
  const requiredDocs = documentConfigs.filter(config => config.required);
  for (const requiredDoc of requiredDocs) {
    const hasFile = files.some(
      file => file.fieldname === requiredDoc.name ||
              file.fieldname === requiredDoc.name.toLowerCase().replace(/\s+/g, '_')
    );

    if (!hasFile) {
      return {
        valid: false,
        error: `Documento obrigatório faltando: ${requiredDoc.name}`,
        errorCode: 'REQUIRED_DOCUMENT_MISSING'
      };
    }
  }

  return { valid: true };
}

/**
 * Normaliza configurações de documentos do formato do banco para o formato validável
 */
export function normalizeDocumentConfigs(requiredDocuments: any[]): DocumentConfig[] {
  if (!Array.isArray(requiredDocuments)) {
    return [];
  }

  return requiredDocuments.map(doc => {
    if (typeof doc === 'string') {
      // Formato antigo: apenas string
      return {
        name: doc,
        description: '',
        required: false,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        allowCameraUpload: true,
        maxSizeMB: 5
      };
    }

    // Formato novo: objeto completo
    return {
      name: doc.name || doc,
      description: doc.description || '',
      required: doc.required !== undefined ? doc.required : false,
      acceptedFormats: doc.acceptedFormats || ['pdf', 'jpg', 'jpeg', 'png'],
      allowCameraUpload: doc.allowCameraUpload !== undefined ? doc.allowCameraUpload : true,
      maxSizeMB: doc.maxSizeMB || 5
    };
  });
}

/**
 * Gera mensagem de erro amigável para validação de documentos
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.valid) {
    return '';
  }

  return result.error || 'Erro desconhecido na validação do documento';
}

/**
 * Verifica se um formato é considerado uma imagem
 */
export function isImageFormat(format: string): boolean {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif'];
  return imageFormats.includes(format.toLowerCase());
}

/**
 * Verifica se a configuração do documento permite upload por câmera
 */
export function canUseCameraUpload(documentConfig: DocumentConfig): boolean {
  if (!documentConfig.allowCameraUpload) {
    return false;
  }

  // Câmera só deve ser permitida se aceitar formatos de imagem
  return documentConfig.acceptedFormats.some(format => isImageFormat(format));
}

/**
 * Gera filtro de arquivo para input HTML baseado nos formatos aceitos
 */
export function generateAcceptAttribute(acceptedFormats: string[]): string {
  const mimeTypes = getAllowedMimeTypes(acceptedFormats);
  const extensions = getAllowedExtensions(acceptedFormats);

  return [...mimeTypes, ...extensions].join(',');
}
