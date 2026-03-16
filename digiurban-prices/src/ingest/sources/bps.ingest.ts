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
  maxFiles?: number;
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

type CatalogClassification = Awaited<ReturnType<typeof classifyCatalog>>;

export async function runBpsIngest(options: BpsIngestOptions = {}): Promise<IngestSourceResult> {
  const { runId, maxFiles = config.bps.maxFilesPerRun } = options;
  const client = getBpsClient();
  const osClient = getOpenSearchClient();
  const organizationCache = new Map<string, { id: string; name: string }>();
  const supplierCache = new Map<string, string>();
  const classificationCache = new Map<string, CatalogClassification>();

  let ingested = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  logger.info('[BPS Ingest] Starting', { runId, maxFiles });

  try {
    const resources = await client.listResources();
    logger.info('[BPS Ingest] Resources found', { count: resources.length, resources: resources.map((resource) => resource.name) });

    const effectiveMaxFiles = maxFiles <= 0 ? resources.length : maxFiles;
    const toProcess = resources.slice(0, effectiveMaxFiles);

    for (const resource of toProcess) {
      let tmpFile: string | null = null;

      try {
        tmpFile = await client.downloadCsv(resource.url);
        let lineCount = 0;

        for await (const item of client.parseCsvStream(tmpFile)) {
          const result = await processItem(item, osClient, organizationCache, supplierCache, classificationCache);
          if (result === 'ingested') ingested += 1;
          else if (result === 'updated') updated += 1;
          else skipped += 1;
          lineCount += 1;

          if (lineCount % 5000 === 0) {
            logger.info('[BPS Ingest] Progress', { resource: resource.name, lineCount, ingested, updated, skipped });
          }
        }

        logger.info('[BPS Ingest] File processed', { resource: resource.name, lineCount, ingested, updated, skipped });
      } catch (err: unknown) {
        logger.error('[BPS Ingest] Error processing file', {
          error: (err as Error).message,
          resource: resource.name,
        });
        errors += 1;
      } finally {
        if (tmpFile && fs.existsSync(tmpFile)) {
          try {
            fs.unlinkSync(tmpFile);
          } catch {
            // ignore cleanup failure
          }
        }
      }
    }
  } catch (err: unknown) {
    logger.error('[BPS Ingest] Fatal error', { error: (err as Error).message });
    errors += 1;
  }

  logger.info('[BPS Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

async function processItem(
  item: BpsItem,
  osClient: ReturnType<typeof getOpenSearchClient>,
  organizationCache: Map<string, { id: string; name: string }>,
  supplierCache: Map<string, string>,
  classificationCache: Map<string, CatalogClassification>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const description = [item.DESCRICAO_CATMAT, item.CAPACIDADE, item.UNIDADE_FORNECIMENTO_CAPACIDADE]
    .filter(Boolean)
    .join(' - ')
    .trim();

  const unitPrice = parseDecimal(item.PRECO_UNITARIO);
  const totalPrice = parseDecimal(item.PRECO_TOTAL);
  const quantity = parseDecimal(item.QTD_ITENS_COMPRADOS);
  const calculatedTotalPrice = totalPrice ?? (typeof unitPrice === 'number' && typeof quantity === 'number' ? unitPrice * quantity : null);

  const validation = validateLineItem({
    description,
    unitPrice,
    totalPrice: calculatedTotalPrice,
    quantity,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = buildBpsSourceId(item, description, unitPrice, calculatedTotalPrice, quantity);
  const normalizedDescription = normalizeText(description);
  const unit = normalizeUnit(item.UNIDADE_MEDIDA ?? item.UNIDADE_FORNECIMENTO ?? item.UNIDADE_FORNECIMENTO_CAPACIDADE);
  const contractDate = parseBpsDate(item.COMPRA, item.ANO_COMPRA);

  const classificationKey = `${item.CODIGO_BR ?? 'na'}|${normalizedDescription}`;
  let classification = classificationCache.get(classificationKey);
  if (!classification) {
    classification = await classifyCatalog({
      description,
      normalizedDescription,
      catmatCode: item.CODIGO_BR,
      allowDescriptionFallback: true,
    });
    classificationCache.set(classificationKey, classification);
  }

  const supplierDocument = normalizeDocumentNumber(item.CNPJ_FORNECEDOR);
  const supplierName = normalizeNullableText(item.FORNECEDOR);
  const provenanceHash = buildProvenanceHash({
    source: 'bps',
    sourceId,
    description,
    unitPrice,
    contractDate,
    supplier: supplierDocument ?? supplierName,
  });

  const confidenceScore = calculateConfidenceScore({ source: 'bps', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : (item.ANO_COMPRA ? `${item.ANO_COMPRA}-01` : null);

  const organization = await resolveOrganization(item, organizationCache);
  const supplierId = await resolveSupplierId(item, supplierCache, supplierDocument, supplierName);
  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description,
    normalizedDescription,
    quantity,
    unit,
    unitPrice,
    totalPrice: calculatedTotalPrice,
    calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode ?? item.CODIGO_BR ?? null,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'bps',
    sourceId,
    provenanceHash,
    inferredFromObject: false,
    supplierId,
    supplierName,
    supplierCnpj: supplierDocument,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf: normalizeNullableText(item.UF),
    city: normalizeNullableText(item.MUNICIPIO_INSTITUICAO),
    organizationId: organization.id,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: organization.name });
    return 'updated';
  }

  const dbItem = await prisma.lineItem.create({ data });
  await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: organization.name });
  return 'ingested';
}

async function resolveOrganization(
  item: BpsItem,
  cache: Map<string, { id: string; name: string }>,
): Promise<{ id: string; name: string }> {
  const normalizedInstitutionCnpj = normalizeDocumentNumber(item.CNPJ_INSTITUICAO);
  const organizationName = normalizeNullableText(item.NOME_INSTITUICAO) ?? 'Comprador BPS';
  const organizationKey = normalizedInstitutionCnpj ?? `BPS_ORG_${sanitizePart(organizationName)}`;

  const cached = cache.get(organizationKey);
  if (cached) return cached;

  const organization = await prisma.organization.upsert({
    where: { cnpj: organizationKey },
    create: {
      cnpj: organizationKey,
      name: organizationName,
      shortName: organizationName.slice(0, 80),
      uf: normalizeNullableText(item.UF),
      city: normalizeNullableText(item.MUNICIPIO_INSTITUICAO),
      sphere: 'federal',
    },
    update: {
      name: organizationName,
      uf: normalizeNullableText(item.UF),
      city: normalizeNullableText(item.MUNICIPIO_INSTITUICAO),
    },
  });

  const resolved = { id: organization.id, name: organization.name };
  cache.set(organizationKey, resolved);
  return resolved;
}

async function resolveSupplierId(
  item: BpsItem,
  cache: Map<string, string>,
  supplierDocument: string | null,
  supplierName: string | null,
): Promise<string | null> {
  if (!supplierDocument && !supplierName) return null;

  const key = supplierDocument ?? `NAME_${sanitizePart(supplierName)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let supplierId: string | null = null;
  if (supplierDocument) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: supplierDocument },
      create: { cnpj: supplierDocument, name: supplierName ?? supplierDocument },
      update: { name: supplierName ?? supplierDocument },
    });
    supplierId = supplier.id;
  }

  if (supplierId) {
    cache.set(key, supplierId);
  }

  return supplierId;
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
        confidence_score: item.confidenceScore ?? 0.9,
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

function buildBpsSourceId(
  item: BpsItem,
  description: string,
  unitPrice: number | null,
  totalPrice: number | null,
  quantity: number | null,
): string {
  return [
    'bps',
    sanitizePart(item.ANO_COMPRA),
    sanitizePart(item.CODIGO_BR),
    sanitizePart(normalizeDocumentNumber(item.CNPJ_INSTITUICAO)),
    sanitizePart(normalizeDocumentNumber(item.CNPJ_FORNECEDOR)),
    sanitizePart(item.COMPRA),
    sanitizePart(item.INSERCAO),
    sanitizePart(item.MODALIDADE_COMPRA),
    sanitizePart(item.TIPO_COMPRA),
    sanitizePart(quantity),
    sanitizePart(unitPrice),
    sanitizePart(totalPrice),
    sanitizePart(description.slice(0, 80)),
  ]
    .filter(Boolean)
    .join('_');
}

function parseBpsDate(compra?: string, anoCompra?: string): Date | null {
  if (compra) {
    const normalized = compra.split(' ')[0];
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (anoCompra) {
    const parsed = new Date(`${anoCompra}-01-01`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function parseDecimal(value?: string | null): number | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDocumentNumber(value?: string | null): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length > 0 ? digits : null;
}

function normalizeNullableText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sanitizePart(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
