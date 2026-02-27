import { createHash } from 'crypto';

export function buildProvenanceHash(input: {
  source: string;
  sourceId?: string | null;
  description: string;
  unitPrice?: number | null;
  contractDate?: Date | string | null;
  supplier?: string | null;
}): string {
  const contractDateIso = input.contractDate instanceof Date
    ? input.contractDate.toISOString()
    : input.contractDate ?? '';
  const payload = [
    input.source,
    input.sourceId ?? '',
    input.description.trim().toLowerCase(),
    input.unitPrice ?? '',
    contractDateIso,
    input.supplier ?? '',
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}

