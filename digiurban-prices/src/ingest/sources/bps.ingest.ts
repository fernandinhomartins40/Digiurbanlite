import * as fs from 'fs';
import { prisma } from '../../models/prisma';
import { getBpsClient } from '../../connectors/bps/bps.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
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
  const { runId, maxFiles = config.bps.maxFilesPerRun } = options;
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

    const effectiveMaxFiles = maxFiles <= 0 ? resources.length : maxFiles;
    const toProcess = resources.slice(0, effectiveMaxFiles);

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
  // Descrição principal é DESCRICAO_CATMAT; pode incluir capacidade e unidade para enriquecer
  const desc = [item.DESCRICAO_CATMAT, item.CAPACIDADE, item.UNIDADE_FORNECIMENTO_CAPACIDADE]
    .filter(Boolean).join(' — ');

  // CSV usa ponto como separador decimal (ex: "0.32")
  const unitPrice = item.PRECO_UNITARIO ? parseFloat(item.PRECO_UNITARIO) : null;
  const totalPrice = item.PRECO_TOTAL ? parseFloat(item.PRECO_TOTAL) : null;
  const quantity = item.QTD_ITENS_COMPRADOS ? parseFloat(item.QTD_ITENS_COMPRADOS) : null;

  const validation = validateLineItem({ description: desc, unitPrice, totalPrice, quantity });
  if (!validation.isValid) return 'skipped';

  // sourceId: ano + código CATMAT + CNPJ comprador
  const sourceId = `bps_${item.ANO_COMPRA}_${item.CODIGO_BR}_${item.CNPJ_INSTITUICAO}`.replace(/[^a-z0-9_]/gi, '_');
  const normalizedDescription = normalizeText(desc);
  const unit = normalizeUnit(item.UNIDADE_MEDIDA ?? item.UNIDADE_FORNECIMENTO);

  // Parsear data da compra: "YYYY-MM-DD HH:mm:ss.mmm" → Date
  let contractDate: Date | null = null;
  if (item.COMPRA) {
    try {
      contractDate = new Date(item.COMPRA.split(' ')[0]);
    } catch { /* ignore */ }
  } else if (item.ANO_COMPRA) {
    contractDate = new Date(`${item.ANO_COMPRA}-01-01`);
  }

  const classification = await classifyCatalog({
    description: desc,
    normalizedDescription,
    catmatCode: item.CODIGO_BR,
    allowDescriptionFallback: false,
  });
  const provenanceHash = buildProvenanceHash({
    source: 'bps',
    sourceId,
    description: desc,
    unitPrice,
    contractDate,
    supplier: item.CNPJ_FORNECEDOR ?? item.FORNECEDOR,
  });

  const confidenceScore = calculateConfidenceScore({ source: 'bps', contractDate, count: 1 });
  const yearMonth = item.ANO_COMPRA
    ? (contractDate
        ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
        : `${item.ANO_COMPRA}-01`)
    : null;

  // Upsert fornecedor
  let supplierId: string | null = null;
  if (item.CNPJ_FORNECEDOR) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: item.CNPJ_FORNECEDOR },
      create: { cnpj: item.CNPJ_FORNECEDOR, name: item.FORNECEDOR ?? '' },
      update: { name: item.FORNECEDOR ?? '' },
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
    catmatCode: classification.catmatCode ?? item.CODIGO_BR ?? null,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'bps',
    sourceId,
    provenanceHash,
    inferredFromObject: false,
    supplierId,
    supplierName: item.FORNECEDOR,
    supplierCnpj: item.CNPJ_FORNECEDOR,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf: item.UF,
    city: item.MUNICIPIO_INSTITUICAO,
    organizationId: orgId,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: item.NOME_INSTITUICAO ?? 'Comprador BPS' });
    return 'updated';
  } else {
    const dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: item.NOME_INSTITUICAO ?? 'Comprador BPS' });
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
    catserCode?: string | null;
    catmatDescription?: string | null;
    source?: string;
    sourceId?: string | null;
    supplierName?: string | null;
    supplierCnpj?: string | null;
    confidenceScore?: number | null;
    classificationScore?: number | null;
    yearMonth?: string | null;
    provenanceHash?: string | null;
    inferredFromObject?: boolean;
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
        catser_code: item.catserCode,
        catmat_description: item.catmatDescription,
        source: item.source ?? 'bps',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        provenance_hash: item.provenanceHash ?? buildProvenanceHash({
          source: item.source ?? 'bps',
          sourceId: item.sourceId ?? item.id,
          description: item.description,
          unitPrice: item.unitPrice,
          contractDate: item.contractDate,
          supplier: item.supplierCnpj ?? item.supplierName,
        }),
        confidence_score: item.confidenceScore ?? 0.90,
        classification_score: item.classificationScore,
        inferred_from_object: item.inferredFromObject ?? false,
        year_month: item.yearMonth,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[BPS Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
