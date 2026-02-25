import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { batchSearchPrices, BatchSearchItem } from './search.service';
import { SearchFilters, SearchPeriod } from '../search_index/opensearch.queries';
import { logger } from '../utils/logger';

export interface ParsedBatchItem {
  item: string;
  quantity?: number;
  unit?: string;
}

// Parseia CSV ou XLSX e retorna lista de itens
export function parseUploadedFile(filePath: string, mimetype: string): ParsedBatchItem[] {
  try {
    let workbook: XLSX.WorkBook;

    if (mimetype === 'text/csv' || filePath.endsWith('.csv')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      workbook = XLSX.read(content, { type: 'string' });
    } else {
      workbook = XLSX.readFile(filePath);
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rows.length === 0) return [];

    // Detecção automática de colunas (case-insensitive)
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);

    const itemCol = keys.find((k) =>
      ['item', 'descricao', 'descrição', 'objeto', 'produto', 'servico', 'serviço', 'material'].includes(
        k.toLowerCase().trim(),
      ),
    ) ?? keys[0];

    const qtyCol = keys.find((k) =>
      ['quantidade', 'qtd', 'qtde', 'quantity', 'qty'].includes(k.toLowerCase().trim()),
    );

    const unitCol = keys.find((k) =>
      ['unidade', 'unit', 'und', 'un', 'medida'].includes(k.toLowerCase().trim()),
    );

    const parsed: ParsedBatchItem[] = [];
    for (const row of rows) {
      const itemValue = String(row[itemCol] ?? '').trim();
      if (!itemValue) continue;

      const qty = qtyCol ? parseFloat(String(row[qtyCol] ?? '0')) : undefined;
      const unit = unitCol ? String(row[unitCol] ?? '').trim() || undefined : undefined;

      parsed.push({
        item: itemValue,
        quantity: qty && !isNaN(qty) && qty > 0 ? qty : undefined,
        unit: unit || undefined,
      });
    }
    return parsed;
  } catch (err) {
    logger.error('[BatchSearch] Error parsing file', { error: (err as Error).message, filePath });
    throw new Error(`Erro ao processar arquivo: ${(err as Error).message}`);
  }
}

// Executa busca em lote a partir de lista de itens
export async function runBatchSearch(
  items: BatchSearchItem[],
  filters: SearchFilters = {},
  period?: SearchPeriod,
) {
  if (items.length === 0) throw new Error('Lista de itens vazia');
  if (items.length > 100) throw new Error('Máximo 100 itens por busca em lote');

  return batchSearchPrices(items, filters, period);
}

// Limpa arquivo temporário após processamento
export function cleanupTempFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignorar erros de cleanup
  }
}
