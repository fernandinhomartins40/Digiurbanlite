import { prisma } from '../../models/prisma';
import { getTransparenciaClient } from '../../connectors/transparencia/transparencia.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, validateLineItem } from '../normalizer';
import { inferItemsFromObject } from '../object-itemizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
import { logger } from '../../utils/logger';
import type { TransparenciaContrato } from '../../connectors/transparencia/transparencia.types';
import { TRANSPARENCIA_ORGAOS_PRINCIPAIS } from '../../connectors/transparencia/transparencia.types';

export interface TransparenciaIngestOptions {
  sinceDays?: number;
  runId?: string;
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function runTransparenciaIngest(options: TransparenciaIngestOptions = {}): Promise<IngestSourceResult> {
  const { sinceDays = config.ingest.sinceDays, runId } = options;
  const client = getTransparenciaClient();
  const osClient = getOpenSearchClient();

  let ingested = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  logger.info('[Transparencia Ingest] Starting', { sinceDays, runId, preferBulk: config.transparencia.preferBulkDownload });

  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - sinceDays);
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  try {
    let bulkProcessed = false;

    if (config.transparencia.preferBulkDownload && config.transparencia.bulkZipUrl) {
      try {
        let processed = 0;

        for await (const contrato of client.streamBulkContracts(formatDate(dataInicio), formatDate(dataFim))) {
          processed += 1;

          try {
            const result = await processFetchedContrato(contrato, osClient);
            ingested += result.ingested;
            updated += result.updated;
            skipped += result.skipped;
          } catch (err: unknown) {
            logger.warn('[Transparencia Ingest] Error processing bulk contrato', {
              error: (err as Error).message,
              id: contrato.id,
            });
            errors += 1;
          }
        }

        bulkProcessed = true;
        logger.info('[Transparencia Ingest] Bulk source processed', { processed });
      } catch (err: unknown) {
        logger.warn('[Transparencia Ingest] Bulk source failed, evaluating API fallback', {
          error: (err as Error).message,
        });
      }
    }

    if (!bulkProcessed) {
      if (!config.transparencia.apiKey) {
        logger.info('[Transparencia Ingest] API key not configured and bulk mode unavailable, skipping');
        return { ingested: 0, updated: 0, skipped: 0, errors: 0 };
      }

      const contratos = await client.fetchAllOrgaos(
        formatDate(dataInicio),
        formatDate(dataFim),
        config.transparencia.orgaosPrincipais.length > 0
          ? config.transparencia.orgaosPrincipais
          : TRANSPARENCIA_ORGAOS_PRINCIPAIS,
        config.transparencia.maxPagesPerOrgao,
      );

      logger.info('[Transparencia Ingest] API contratos fetched', { count: contratos.length });

      for (const contrato of contratos) {
        try {
          const result = await processFetchedContrato(contrato, osClient);
          ingested += result.ingested;
          updated += result.updated;
          skipped += result.skipped;
        } catch (err: unknown) {
          logger.warn('[Transparencia Ingest] Error processing contrato', {
            error: (err as Error).message,
            id: contrato.id,
          });
          errors += 1;
        }
      }
    }
  } catch (err: unknown) {
    logger.error('[Transparencia Ingest] Fatal error', { error: (err as Error).message });
    errors += 1;
  }

  logger.info('[Transparencia Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

async function processFetchedContrato(
  contrato: TransparenciaContrato,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<{ ingested: number; updated: number; skipped: number }> {
  const inferredItems = inferItemsFromObject(contrato.objeto ?? '', 4);

  if (inferredItems.length === 0) {
    const result = await processContrato(contrato, osClient);
    return {
      ingested: result === 'ingested' ? 1 : 0,
      updated: result === 'updated' ? 1 : 0,
      skipped: result === 'skipped' ? 1 : 0,
    };
  }

  let ingested = 0;
  let updated = 0;
  let skipped = 0;

  for (let idx = 0; idx < inferredItems.length; idx += 1) {
    const result = await processContrato(contrato, osClient, inferredItems[idx], idx + 1);
    if (result === 'ingested') ingested += 1;
    else if (result === 'updated') updated += 1;
    else skipped += 1;
  }

  return { ingested, updated, skipped };
}

async function processContrato(
  contrato: TransparenciaContrato,
  osClient: ReturnType<typeof getOpenSearchClient>,
  inferred?: { description: string; quantity: number | null; unit: string | null },
  inferredIndex?: number,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = inferred?.description ?? contrato.objeto ?? '';
  const quantity = inferred?.quantity ?? null;
  const totalPrice = contrato.valorInicialCompra ?? contrato.valorFinalCompra ?? null;
  const unitPrice = totalPrice && quantity && quantity > 0
    ? totalPrice / quantity
    : totalPrice;

  const validation = validateLineItem({
    description: desc,
    unitPrice,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = inferredIndex
    ? `transparencia_${contrato.id}_inferred_${inferredIndex}`
    : `transparencia_${contrato.id}`;
  const normalizedDescription = normalizeText(desc);
  const referenceDate = contrato.dataAssinatura ?? contrato.dataPublicacaoDOU ?? contrato.dataInicioVigencia ?? null;
  const contractDate = referenceDate ? new Date(referenceDate) : null;
  const uf: string | undefined = undefined;

  const cnpjRaw = contrato.fornecedor?.cnpjFormatado ?? null;
  const supplierCnpj = cnpjRaw ? cnpjRaw.replace(/[.\-\/]/g, '') : null;

  const classification = await classifyCatalog({
    description: desc,
    normalizedDescription,
    typeHint: 'service',
    allowDescriptionFallback: true,
  });
  const provenanceHash = buildProvenanceHash({
    source: 'transparencia',
    sourceId,
    description: desc,
    unitPrice,
    contractDate,
    supplier: supplierCnpj ?? contrato.fornecedor?.nome,
  });

  const confidenceScore = calculateConfidenceScore({ source: 'transparencia', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  const orgCnpj = `TRANS_${contrato.unidadeGestora?.codigo ?? contrato.id}`;
  const org = await prisma.organization.upsert({
    where: { cnpj: orgCnpj },
    create: {
      cnpj: orgCnpj,
      name: contrato.unidadeGestora?.nome ?? 'Orgao Federal',
      uf,
      sphere: 'federal',
    },
    update: {},
  });

  let supplier: { id: string } | null = null;
  if (supplierCnpj) {
    supplier = await prisma.supplier.upsert({
      where: { cnpj: supplierCnpj },
      create: { cnpj: supplierCnpj, name: contrato.fornecedor?.nome ?? '' },
      update: { name: contrato.fornecedor?.nome ?? '' },
    });
  }

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: desc,
    normalizedDescription,
    quantity,
    unit: normalizeUnit(inferred?.unit),
    unitPrice,
    totalPrice: totalPrice ?? null,
    catmatCode: classification.catmatCode,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'transparencia',
    sourceId,
    provenanceHash,
    inferredFromObject: Boolean(inferredIndex),
    supplierId: supplier?.id ?? null,
    supplierName: contrato.fornecedor?.nome,
    supplierCnpj,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf,
    organizationId: org.id,
  };

  const modality = contrato.modalidadeCompra ?? null;

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: org.name, modality });
    return 'updated';
  }

  const dbItem = await prisma.lineItem.create({ data });
  await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: org.name, modality });
  return 'ingested';
}

async function indexToOpenSearch(
  osClient: ReturnType<typeof getOpenSearchClient>,
  item: {
    id: string;
    description: string;
    normalizedDescription: string;
    quantity?: number | null;
    unit?: string | null;
    unitPrice?: number | null;
    totalPrice?: number | null;
    contractDate?: Date | null;
    uf?: string | null;
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
    modality?: string | null;
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
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        contract_date: item.contractDate?.toISOString(),
        uf: item.uf,
        organization_name: item.organizationName,
        catmat_code: item.catmatCode,
        catser_code: item.catserCode,
        catmat_description: item.catmatDescription,
        source: item.source ?? 'transparencia',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        provenance_hash: item.provenanceHash ?? buildProvenanceHash({
          source: item.source ?? 'transparencia',
          sourceId: item.sourceId ?? item.id,
          description: item.description,
          unitPrice: item.unitPrice,
          contractDate: item.contractDate,
          supplier: item.supplierCnpj ?? item.supplierName,
        }),
        confidence_score: item.confidenceScore ?? 0.85,
        classification_score: item.classificationScore,
        inferred_from_object: item.inferredFromObject ?? false,
        year_month: item.yearMonth,
        modality: item.modality,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[Transparencia Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
