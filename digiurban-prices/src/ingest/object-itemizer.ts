import { normalizeText } from './normalizer';

export interface InferredObjectItem {
  description: string;
  normalizedDescription: string;
  quantity: number | null;
  unit: string | null;
  inferredFromObject: boolean;
}

const SPLIT_PATTERN = /;|\n|\r|\s-\s|,\s(?=[A-ZÀ-Ú0-9])/g;
const STOP_PHRASES = [
  'objeto',
  'contratacao',
  'contratação',
  'prestacao',
  'prestação',
  'servico',
  'serviço',
  'aquisição',
  'aquisicao',
];

export function inferItemsFromObject(objectText: string, maxItems = 6): InferredObjectItem[] {
  if (!objectText || objectText.trim().length < 6) return [];

  const compact = objectText.replace(/\s+/g, ' ').trim();
  const rawParts = compact.split(SPLIT_PATTERN);
  const parts = rawParts
    .map((part) => cleanupDescription(part))
    .filter((part) => part.length >= 8)
    .slice(0, maxItems);

  const candidates = parts.length > 0 ? parts : [cleanupDescription(compact)];
  const unique = Array.from(new Set(candidates)).slice(0, maxItems);

  return unique
    .map((description) => {
      const qtyAndUnit = extractQuantityAndUnit(description);
      return {
        description,
        normalizedDescription: normalizeText(description),
        quantity: qtyAndUnit.quantity,
        unit: qtyAndUnit.unit,
        inferredFromObject: true,
      };
    })
    .filter((item) => item.normalizedDescription.length > 2);
}

function cleanupDescription(value: string): string {
  let cleaned = value
    .replace(/^(\d+[\.\)\-]\s*)/, '')
    .replace(/\s+/g, ' ')
    .trim();

  for (const stopPhrase of STOP_PHRASES) {
    cleaned = cleaned.replace(new RegExp(`^${stopPhrase}\\s+(de|da|do)?\\s*`, 'i'), '').trim();
  }

  if (cleaned.length > 220) {
    cleaned = `${cleaned.slice(0, 220).trim()}...`;
  }
  return cleaned;
}

function extractQuantityAndUnit(text: string): { quantity: number | null; unit: string | null } {
  const match = text.match(
    /(\d{1,6}(?:[.,]\d+)?)\s*(unidades?|un|und|unid|kg|g|l|litros?|m2|m²|m|caixas?|cx|pacotes?|pct|resmas?|meses?|m[eê]s)\b/i,
  );
  if (!match) {
    return { quantity: null, unit: null };
  }

  const quantity = Number.parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  return {
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : null,
    unit,
  };
}

