/**
 * ============================================================================
 * DOCUMENT MAPPING UTILITIES - FASE 3
 * ============================================================================
 *
 * Funções para sanitização e mapeamento robusto de documentTypes
 */

/**
 * Sanitiza um documentId/documentType
 * Remove espaços, converte para maiúsculas, remove caracteres especiais
 *
 * @example
 * sanitizeDocumentId("  RG  ") => "RG"
 * sanitizeDocumentId("CPF do Responsável") => "CPF_DO_RESPONSAVEL"
 * sanitizeDocumentId("rg-frente") => "RG_FRENTE"
 */
export function sanitizeDocumentId(id: string): string {
  return id
    .trim()
    .toUpperCase()
    .normalize('NFD') // Decompor acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^A-Z0-9]/g, '_') // Substituir não alfanuméricos por _
    .replace(/_+/g, '_') // Múltiplos underscores → único
    .replace(/^_|_$/g, ''); // Remover underscores no início/fim
}

/**
 * Verifica se dois documentTypes são equivalentes
 * Usa comparação exata após sanitização
 *
 * @example
 * matchDocumentType("RG", "rg") => true
 * matchDocumentType("CPF", "CPF  ") => true
 * matchDocumentType("RG Frente", "rg-frente") => true
 * matchDocumentType("RG", "CPF") => false
 */
export function matchDocumentType(uploadedId: string, requiredId: string): boolean {
  return sanitizeDocumentId(uploadedId) === sanitizeDocumentId(requiredId);
}

/**
 * Valida se um documentId é válido (não vazio após sanitização)
 */
export function isValidDocumentId(id: string): boolean {
  const sanitized = sanitizeDocumentId(id);
  return sanitized.length > 0 && sanitized !== '_';
}

/**
 * Normaliza um array de documentTypes
 * Remove duplicatas e documentos inválidos
 */
export function normalizeDocumentTypes(documentTypes: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const docType of documentTypes) {
    if (!isValidDocumentId(docType)) {
      continue;
    }

    const sanitized = sanitizeDocumentId(docType);

    if (!seen.has(sanitized)) {
      seen.add(sanitized);
      normalized.push(sanitized);
    }
  }

  return normalized;
}

/**
 * Mapeia arquivos enviados para documentos requeridos
 * Retorna mapeamento exato e arquivos não mapeados
 */
export function mapUploadedFilesToDocuments(
  uploadedFiles: { documentId: string; [key: string]: any }[],
  requiredDocuments: { id: string; name: string; required: boolean }[]
): {
  mapped: Map<string, number>; // requiredDocId => uploadedFileIndex
  unmappedFiles: number[]; // Índices de arquivos sem match
  missingRequired: string[]; // IDs de documentos obrigatórios faltando
} {
  const mapped = new Map<string, number>();
  const usedFileIndices = new Set<number>();

  // Tentar mapear cada documento requerido
  for (const reqDoc of requiredDocuments) {
    const reqId = reqDoc.id || reqDoc.name;

    const fileIndex = uploadedFiles.findIndex((file, idx) => {
      if (usedFileIndices.has(idx)) return false;
      return matchDocumentType(file.documentId, reqId);
    });

    if (fileIndex !== -1) {
      mapped.set(reqId, fileIndex);
      usedFileIndices.add(fileIndex);
    }
  }

  // Arquivos não mapeados
  const unmappedFiles = uploadedFiles
    .map((_, idx) => idx)
    .filter(idx => !usedFileIndices.has(idx));

  // Documentos obrigatórios faltando
  const missingRequired = requiredDocuments
    .filter(doc => doc.required && !mapped.has(doc.id || doc.name))
    .map(doc => doc.id || doc.name);

  return {
    mapped,
    unmappedFiles,
    missingRequired
  };
}

/**
 * Valida mapeamento antes de criar protocolo
 * Lança erro se houver documentos obrigatórios faltando
 */
export function validateDocumentMapping(
  uploadedFiles: { documentId: string; name: string }[],
  requiredDocuments: { id: string; name: string; required: boolean }[]
): void {
  const result = mapUploadedFilesToDocuments(uploadedFiles, requiredDocuments);

  if (result.missingRequired.length > 0) {
    throw new Error(
      `Documentos obrigatórios faltando: ${result.missingRequired.join(', ')}`
    );
  }

  if (result.unmappedFiles.length > 0) {
    const unmappedNames = result.unmappedFiles.map(idx => uploadedFiles[idx].name);
    console.warn(
      `⚠️  Arquivos enviados sem correspondência nos requiredDocuments: ${unmappedNames.join(', ')}`
    );
    console.warn('   Estes arquivos serão ignorados.');
  }
}
