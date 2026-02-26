import * as fs from 'fs';
import { prisma } from '../../models/prisma';
import { getBpsClient } from '../../connectors/bps/bps.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type { BpsItem } from '../../connectors/bps/bps.types';

export interface BpsIngestOptions {
  runId?: string;
  maxFiles?: number; // quantos arquivos CSV baixar (para não sobrecarregar na primeira run)
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Organização BPS padrão (Ministério da Saúde)
const BPS_ORG_CNPJ = 'BPS_MS_00394544000185';

export async function runBpsIngest(options: BpsIngestOptions = {}): Promise<IngestSourceResult> {
  const { runId, maxFiles = 2 } = options;
  const client = getBpsClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;
  logger.info('[BPS Ingest] Starting', { runId });

  // Garantir organização padrão BPS
  await prisma.organization.upsert({
    where: { cnpj: BPS_ORG_CNPJ },
    create: {
      cnpj: BPS_ORG_CNPJ,
      name: 'Banco de Preços em Saúde — Ministério da Saúde',
      shortName: 'BPS/MS',
      sphere: 'federal',
    },
    update: {},
  });

  const org = await prisma.organization.findUnique({ where: { cnpj: BPS_ORG_CNPJ } });
  if (!org) return { ingested: 0, updated: 0, skipped: 0, errors: 1 };

  try {
    const resources = await client.listResources();
    logger.info('[BPS Ingest] Resources found', { count: resources.length });

    const toProcess = resources.slice(0, maxFiles);

    for (const resource of toProcess) {
      let tmpFile: string | null = null;
      try {
        tmpFile = await client.downloadCsv(resource.url);
        let lineCount = 0;

        for await (const item of client.parseCsvStream(tmpFile)) {
          const result = await processItem(item, org.id, osClient);
          if (result === 'ingested') ingested++;
          else if (result === 'updated') updated++;
          else skipped++;
          lineCount++;

          // Log de progresso a cada 5k linhas
          if (lineCount % 5000 === 0) {
            logger.info('[BPS Ingest] Progress', { lineCount, ingested, skipped, resource: resource.name });
          }
        }

        logger.info('[BPS Ingest] File processed', { resource: resource.name, lineCount });
      } catch (err: unknown) {
        logger.error('[BPS Ingest] Error processing file', {
          error: (err as Error).message,
          resource: resource.name,
        });
        errors++;
      } finally {
        if (tmpFile && fs.existsSync(tmpFile)) {
          try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
        }
      }
    }
  } catch (err: unknown) {
    logger.error('[BPS Ingest] Fatal error', { error: (err as Error).message });
    errors++;
  }

  logger.info('[BPS Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

async function processItem(
  item: BpsItem,
  orgId: string,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = [item.DESCRICAO_ITEM, item.PRINCIPIO_ATIVO, item.CONCENTRACAO, item.FORMA_FARMACEUTICA]
    .filter(Boolean).join(' — ');

  const unitPrice = item.PRECO_UNITARIO ? parseFloat(item.PRECO_UNITARIO.replace(',', '.')) : null;
  const totalPrice = item.PRECO_TOTAL ? parseFloat(item.PRECO_TOTAL.replace(',', '.')) : null;
  const quantity = item.QUANTIDADE ? parseFloat(item.QUANTIDADE.replace(',', '.')) : null;

  const validation = validateLineItem({ description: desc, unitPrice, totalPrice, quantity });
  if (!validation.isValid) return 'skipped';

  // sourceId: competência + código do item + CNPJ comprador
  const sourceId = `bps_${item.COMPETENCIA}_${item.CODIGO_ITEM}_${item.CNPJ_COMPRADOR}`.replace(/[^a-z0-9_]/gi, '_');
  const normalizedDescription = normalizeText(desc);
  const unit = normalizeUnit(item.UNIDADE_MEDIDA);

  // Parsear data de competência "YYYY-MM" ou "MM/YYYY"
  let contractDate: Date | null = null;
  if (item.COMPETENCIA) {
    try {
      const comp = item.COMPETENCIA.includes('/')
        ? item.COMPETENCIA.split('/').reverse().join('-') + '-01'
        : item.COMPETENCIA + '-01';
      contractDate = new Date(comp);
    } catch { /* ignore */ }
  }

  const confidenceScore = calculateConfidenceScore({ source: 'bps', contractDate, count: 1 });
  const yearMonth = item.COMPETENCIA?.replace('/', '-').substring(0, 7) ?? null;

  // Upsert fornecedor
  let supplierId: string | null = null;
  if (item.CNPJ_FORNECEDOR) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: item.CNPJ_FORNECEDOR },
      create: { cnpj: item.CNPJ_FORNECEDOR, name: item.NOME_FORNECEDOR ?? '' },
      update: { name: item.NOME_FORNECEDOR ?? '' },
    });
    supplierId = supplier.id;
  }

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: desc,
    normalizedDescription,
    quantity,
    unit,
    unitPrice,
    totalPrice,
    calculatedUnitPrice: unitPrice,
    catmatCode: item.CODIGO_ITEM,
    source: 'bps',
    sourceId,
    supplierId,
    supplierName: item.NOME_FORNECEDOR,
    supplierCnpj: item.CNPJ_FORNECEDOR,
    confidenceScore,
    yearMonth,
    contractDate,
    uf: item.UF_COMPRADOR,
    city: item.MUNICIPIO_COMPRADOR,
    organizationId: orgId,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: item.NOME_COMPRADOR ?? 'Comprador BPS' });
    return 'updated';
  } else {
    const dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: item.NOME_COMPRADOR ?? 'Comprador BPS' });
    return 'ingested';
  }
}

async function indexToOpenSearch(
  osClient: ReturnType<typeof getOpenSearchClient>,
  item: {
    id: string;
    description: string;
    normalizedDescription: string;
    unit?: string | null;
    unitPrice?: number | null;
    totalPrice?: number | null;
    quantity?: number | null;
    contractDate?: Date | null;
    uf?: string | null;
    city?: string | null;
    organizationName: string;
    catmatCode?: string | null;
    source?: string;
    supplierName?: string | null;
    supplierCnpj?: string | null;
    confidenceScore?: number | null;
    yearMonth?: string | null;
  },
): Promise<void> {
  try {
    await osClient.index({
      index: config.opensearch.indexLineItems,
      id: item.id,
      body: {
        id: item.id,
        description: item.description,
        normalized_description: item.normalizedDescription,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        quantity: item.quantity,
        contract_date: item.contractDate?.toISOString(),
        uf: item.uf,
        city: item.city,
        organization_name: item.organizationName,
        catmat_code: item.catmatCode,
        source: item.source ?? 'bps',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        confidence_score: item.confidenceScore ?? 0.90,
        year_month: item.yearMonth,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[BPS Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
