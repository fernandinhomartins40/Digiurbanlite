// Normalização de texto e dados para itens de licitação

const STOPWORDS_PT = new Set([
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'com', 'por', 'pelo', 'pela', 'pelos', 'pelas',
  'um', 'uma', 'uns', 'umas',
  'o', 'a', 'os', 'as',
  'e', 'ou', 'que', 'se',
  'ao', 'aos', 'ao',
  'tipo', 'item', 'modelo',
]);

// Mapa de abreviações comuns em licitações
const ABBREVIATIONS: Record<string, string> = {
  'pc': 'computador',
  'nb': 'notebook',
  'hd': 'hdd',
  'hdd': 'disco rigido',
  'ssd': 'ssd',
  'ram': 'memoria',
  'gb': 'gb',
  'tb': 'tb',
  'mb': 'mb',
  'un': 'unidade',
  'und': 'unidade',
  'unid': 'unidade',
  'pct': 'pacote',
  'cx': 'caixa',
  'kt': 'kit',
  'mts': 'metros',
  'mts2': 'm2',
  'ger': 'geracao',
  'gen': 'geracao',
};

// Mapa de sinônimos para agrupamento semântico
const SYNONYMS: Record<string, string> = {
  'microcomputador': 'computador',
  'desktop': 'computador',
  'workstation': 'computador',
  'estação de trabalho': 'computador',
  'laptop': 'notebook',
  'microcomputador portátil': 'notebook',
  'computador portátil': 'notebook',
  'impressora multifuncional': 'multifuncional',
  'multifuncional': 'multifuncional',
  'copiadora': 'multifuncional',
  'limpeza e conservação': 'limpeza',
  'limpeza predial': 'limpeza',
  'conservação predial': 'limpeza',
  'papel a4': 'papel a4',
  'papel sulfite': 'papel a4',
  'resma': 'papel a4',
};

export function normalizeText(text: string): string {
  if (!text) return '';

  let normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s./]/g, ' ') // remove chars especiais
    .replace(/\s+/g, ' ')
    .trim();

  // Substituir abreviações
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }

  // Remover stopwords
  const words = normalized.split(' ').filter((w) => !STOPWORDS_PT.has(w) && w.length > 1);
  normalized = words.join(' ');

  // Substituir sinônimos
  for (const [syn, canonical] of Object.entries(SYNONYMS)) {
    if (normalized.includes(syn)) {
      normalized = normalized.replace(syn, canonical);
    }
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

// Normaliza unidade de medida
export function normalizeUnit(unit: string | null | undefined): string | null {
  if (!unit) return null;
  const u = unit.toLowerCase().trim();
  const unitMap: Record<string, string> = {
    'und': 'un', 'unid': 'un', 'unidade': 'un', 'unidades': 'un', 'unit': 'un',
    'pct': 'pct', 'pacote': 'pct', 'pacotes': 'pct',
    'cx': 'cx', 'caixa': 'cx', 'caixas': 'cx',
    'cento': 'ct', 'ct': 'ct',
    'resma': 'resma', 'rm': 'resma',
    'litro': 'l', 'litros': 'l', 'lt': 'l',
    'kg': 'kg', 'quilograma': 'kg', 'quilogramas': 'kg',
    'metro': 'm', 'metros': 'm', 'mts': 'm',
    'm2': 'm2', 'metro quadrado': 'm2', 'm²': 'm2',
    'mes': 'mes', 'mês': 'mes', 'mensal': 'mes',
    'hora': 'h', 'horas': 'h', 'hr': 'h',
    'diaria': 'dia', 'dia': 'dia', 'dias': 'dia',
    'serviço': 'serv', 'servico': 'serv', 'sv': 'serv',
  };
  return unitMap[u] ?? u;
}

// Calcula valor unitário quando não fornecido
export function calculateUnitPrice(
  totalPrice: number | null | undefined,
  quantity: number | null | undefined,
): number | null {
  if (!totalPrice || !quantity || quantity <= 0) return null;
  const unitPrice = totalPrice / quantity;
  // Sanity check: preço unitário deve ser positivo e razoável
  if (unitPrice <= 0 || unitPrice > 1_000_000_000) return null;
  return Math.round(unitPrice * 100) / 100;
}

// Valida registro de item
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateLineItem(item: {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}): ValidationResult {
  if (!item.description || item.description.trim().length < 3) {
    return { isValid: false, reason: 'Descrição inválida ou muito curta' };
  }

  if (item.quantity !== undefined && item.quantity !== null) {
    if (item.quantity <= 0) {
      return { isValid: false, reason: 'Quantidade zero ou negativa' };
    }
  }

  if (item.unitPrice !== undefined && item.unitPrice !== null) {
    if (item.unitPrice <= 0) {
      return { isValid: false, reason: 'Preço unitário zero ou negativo' };
    }
    if (item.unitPrice > 500_000_000) {
      return { isValid: false, reason: 'Preço unitário implausível (>500M)' };
    }
  }

  if (item.totalPrice !== undefined && item.totalPrice !== null) {
    if (item.totalPrice <= 0) {
      return { isValid: false, reason: 'Preço total zero ou negativo' };
    }
  }

  if (!item.unitPrice && !item.totalPrice) {
    return { isValid: false, reason: 'Nenhum valor informado' };
  }

  return { isValid: true };
}
