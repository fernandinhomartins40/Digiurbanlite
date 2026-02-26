import { prisma } from '../../models/prisma';
import { getTransparenciaClient } from '../../connectors/transparencia/transparencia.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type { TransparenciaContrato } from '../../connectors/transparencia/transparencia.types';

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
  const { sinceDays = 90, runId } = options;
  const client = getTransparenciaClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;

  if (!config.transparencia.apiKey) {
    logger.info('[Transparencia Ingest] API key não configurada, pulando');
    return { ingested: 0, updated: 0, skipped: 0, errors: 0 };
  }

  logger.info('[Transparencia Ingest] Starting', { sinceDays, runId });

  try {
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - sinceDays);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const contratos = await client.fetchAllPages({
      dataInicio: formatDate(dataInicio),
      dataFim: formatDate(dataFim),
    }, 20);

    logger.info('[Transparencia Ingest] Contratos fetched', { count: contratos.length });

    for (const contrato of contratos) {
      try {
        const result = await processContrato(contrato, osClient);
        if (result === 'ingested') ingested++;
        else if (result === 'updated') updated++;
        else skipped++;
      } catch (err: unknown) {
        logger.warn('[Transparencia Ingest] Error processing contrato', {
          error: (err as Error).message,
          id: contrato.id,
        });
        errors++;
      }
    }
  } catch (err: unknown) {
    logger.error('[Transparencia Ingest] Fatal error', { error: (err as Error).message });
    errors++;
  }

  logger.info('[Transparencia Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

async function processContrato(
  contrato: TransparenciaContrato,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  // Contratos da Transparência têm objeto (descrição) mas não itemização detalhada
  const desc = contrato.objeto ?? '';
  const validation = validateLineItem({
    description: desc,
    unitPrice: contrato.valorInicial ?? contrato.valorFinal,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = `transparencia_${contrato.id}`;
  const normalizedDescription = normalizeText(desc);
  const contractDate = contrato.dataAssinatura ? new Date(contrato.dataAssinatura) : null;
  const uf = contrato.unidadeGestora?.orgaoVinculado?.municipio?.uf;

  const confidenceScore = calculateConfidenceScore({ source: 'transparencia', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  // Upsert organization
  const orgCnpj = `TRANS_${contrato.unidadeGestora?.codigo ?? contrato.id}`;
  const org = await prisma.organization.upsert({
    where: { cnpj: orgCnpj },
    create: {
      cnpj: orgCnpj,
      name: contrato.unidadeGestora?.nome ?? 'Órgão Federal',
      uf,
      sphere: 'federal',
    },
    update: {},
  });

  const supplierCnpj = contrato.fornecedor?.cnpj ?? null;
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
    unitPrice: contrato.valorInicial ?? contrato.valorFinal,
    totalPrice: contrato.valorFinal ?? contrato.valorInicial,
    source: 'transparencia',
    sourceId,
    supplierId: supplier?.id ?? null,
    supplierName: contrato.fornecedor?.nome,
    supplierCnpj,
    confidenceScore,
    yearMonth,
    contractDate,
    uf,
    organizationId: org.id,
    modality: contrato.modalidade?.descricao,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: org.name });
    return 'updated';
  } else {
    const dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: org.name });
    return 'ingested';
  }
}

async function indexToOpenSearch(
  osClient: ReturnType<typeof getOpenSearchClient>,
  item: {
    id: string;
    description: string;
    normalizedDescription: string;
    unitPrice?: number | null;
    totalPrice?: number | null;
    contractDate?: Date | null;
    uf?: string | null;
    organizationName: string;
    source?: string;
    supplierName?: string | null;
    supplierCnpj?: string | null;
    confidenceScore?: number | null;
    yearMonth?: string | null;
    modality?: string | null;
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
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        contract_date: item.contractDate?.toISOString(),
        uf: item.uf,
        organization_name: item.organizationName,
        source: item.source ?? 'transparencia',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        confidence_score: item.confidenceScore ?? 0.85,
        year_month: item.yearMonth,
        modality: item.modality,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[Transparencia Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
