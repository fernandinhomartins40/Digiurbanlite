/**
 * ============================================================================
 * DOCUMENT MAPPING UTILITIES
 * ============================================================================
 * Helpers to sanitize, compare and canonicalize protocol document types.
 */

/**
 * Sanitizes a document id/type.
 */
export function sanitizeDocumentId(id: string): string {
  return id
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function removeFileExtension(value: string): string {
  return value.replace(/\.[a-z0-9]{2,5}$/i, '');
}

function stripUploadPrefixes(value: string): string {
  return value
    .replace(/^\d+(?:-\d+)+-/, '')
    .replace(/^upload[-_]/i, '')
    .replace(/^documento[-_]/i, '');
}

function stripNumericSuffix(value: string): string {
  return value.replace(/(?:_|-)\d{6,}$/g, '');
}

export function normalizeDocumentCandidate(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const basename = trimmed.split(/[\\/]/).pop() || trimmed;
  const withoutExtension = removeFileExtension(basename);
  const withoutPrefix = stripUploadPrefixes(withoutExtension);
  const withoutSuffix = stripNumericSuffix(withoutPrefix);

  return sanitizeDocumentId(withoutSuffix);
}

function compactDocumentCandidate(value: string): string {
  return normalizeDocumentCandidate(value).replace(/_/g, '');
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function similarityScore(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 0;

  return 1 - levenshteinDistance(left, right) / maxLength;
}

/**
 * Returns the best matching required document label for an uploaded value.
 * It handles exact ids, sanitized ids and common filename variants.
 */
export function resolveCanonicalDocumentType(
  uploadedId: string,
  requiredIds: string[]
): string | undefined {
  if (!uploadedId || !Array.isArray(requiredIds) || requiredIds.length === 0) {
    return undefined;
  }

  const normalizedUploaded = normalizeDocumentCandidate(uploadedId);
  const compactUploaded = compactDocumentCandidate(uploadedId);
  if (!normalizedUploaded && !compactUploaded) return undefined;

  let bestMatch: { requiredId: string; score: number } | undefined;

  for (const requiredId of requiredIds) {
    const normalizedRequired = normalizeDocumentCandidate(requiredId);
    const compactRequired = compactDocumentCandidate(requiredId);
    if (!normalizedRequired && !compactRequired) continue;

    if (
      sanitizeDocumentId(uploadedId) === sanitizeDocumentId(requiredId) ||
      normalizedUploaded === normalizedRequired ||
      compactUploaded === compactRequired
    ) {
      return requiredId;
    }

    const prefixMatch =
      normalizedUploaded.startsWith(`${normalizedRequired}_`) ||
      normalizedRequired.startsWith(`${normalizedUploaded}_`) ||
      compactUploaded.startsWith(compactRequired) ||
      compactRequired.startsWith(compactUploaded);

    const score = prefixMatch
      ? 0.99
      : Math.max(
          similarityScore(normalizedUploaded, normalizedRequired),
          similarityScore(compactUploaded, compactRequired)
        );

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { requiredId, score };
    }
  }

  return bestMatch && bestMatch.score >= 0.82 ? bestMatch.requiredId : undefined;
}

/**
 * Checks whether two document types should be considered equivalent.
 */
export function matchDocumentType(uploadedId: string, requiredId: string): boolean {
  return Boolean(resolveCanonicalDocumentType(uploadedId, [requiredId]));
}

/**
 * Validates whether a document id is usable after sanitization.
 */
export function isValidDocumentId(id: string): boolean {
  const sanitized = sanitizeDocumentId(id);
  return sanitized.length > 0 && sanitized !== '_';
}

/**
 * Normalizes an array of document types removing duplicates and invalid items.
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
 * Maps uploaded files to required documents.
 */
export function mapUploadedFilesToDocuments(
  uploadedFiles: { documentId: string; [key: string]: any }[],
  requiredDocuments: { id: string; name: string; required: boolean }[]
): {
  mapped: Map<string, number>;
  unmappedFiles: number[];
  missingRequired: string[];
} {
  const mapped = new Map<string, number>();
  const usedFileIndices = new Set<number>();

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

  const unmappedFiles = uploadedFiles
    .map((_, idx) => idx)
    .filter((idx) => !usedFileIndices.has(idx));

  const missingRequired = requiredDocuments
    .filter((doc) => doc.required && !mapped.has(doc.id || doc.name))
    .map((doc) => doc.id || doc.name);

  return {
    mapped,
    unmappedFiles,
    missingRequired,
  };
}

/**
 * Validates mapping before creating a protocol.
 */
export function validateDocumentMapping(
  uploadedFiles: { documentId: string; name: string }[],
  requiredDocuments: { id: string; name: string; required: boolean }[]
): void {
  const result = mapUploadedFilesToDocuments(uploadedFiles, requiredDocuments);

  if (result.missingRequired.length > 0) {
    throw new Error(`Documentos obrigatorios faltando: ${result.missingRequired.join(', ')}`);
  }

  if (result.unmappedFiles.length > 0) {
    const unmappedNames = result.unmappedFiles.map((idx) => uploadedFiles[idx].name);
    console.warn(
      `Arquivos enviados sem correspondencia nos requiredDocuments: ${unmappedNames.join(', ')}`
    );
  }
}
