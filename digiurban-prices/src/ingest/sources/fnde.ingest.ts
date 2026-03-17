import { prisma } from '../../models/prisma';
import { getFndeClient } from '../../connectors/fnde/fnde.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
import { logger } from '../../utils/logger';
import type { FndeContrato } from '../../connectors/fnde/fnde.types';

export interface FndeIngestOptions {
  runId?: string;
  sinceDays?: number;
  uf?: string;
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

const FNDE_ORG_CNPJ = 'FNDE_00378257000181';

export async function runFndeIngest(options: FndeIngestOptions = {}): Promise<IngestSourceResult> {
  const { runId, sinceDays = config.ingest.sinceDays, uf } = options;
  const client = getFndeClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;
  logger.info('[FNDE Ingest] Starting', { runId });

  if (!(await client.ping())) {
    logger.info('[FNDE Ingest] Source unavailable, skipping without touching persistence');
    return { ingested: 0, updated: 0, skipped: 0, errors: 0 };
  }

  // Organização padrão FNDE
  await prisma.organization.upsert({
    where: { cnpj: FNDE_ORG_CNPJ },
    create: {
      cnpj: FNDE_ORG_CNPJ,
      name: 'Fundo Nacional de Desenvolvimento da Educação — FNDE',
      shortName: 'FNDE',
      sphere: 'federal',
    },
    update: {},
  });

  const org = await prisma.organization.findUnique({ where: { cnpj: FNDE_ORG_CNPJ } });
  if (!org) return { ingested: 0, updated: 0, skipped: 0, errors: 1 };

  try {
    const currentYear = new Date().getFullYear();
    const anoInicio = currentYear - Math.ceil(sinceDays / 365);

    const contratos = await client.fetchContratosAlimentacao({
      uf,
      anoInicio,
      anoFim: currentYear,
      pageSize: 50,
    });

    logger.info('[FNDE Ingest] Contratos fetched', { count: contratos.length });

    for (const contrato of contratos) {
      try {
        const result = await processContrato(contrato, org.id, osClient);
        if (result === 'ingested') ingested++;
        else if (result === 'updated') updated++;
        else skipped++;
      } catch (err: unknown) {
        logger.warn('[FNDE Ingest] Error processing contrato', {
          error: (err as Error).message,
          id: contrato.id,
        });
        errors++;
      }
    }
  } catch (err: unknown) {
    logger.error('[FNDE Ingest] Fatal error', { error: (err as Error).message });
    errors++;
  }

  logger.info('[FNDE Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

async function processContrato(
  contrato: FndeContrato,
  orgId: string,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = contrato.descricaoItem ?? contrato.objeto ?? '';
  const unitPrice = contrato.valorUnitario ?? (
    contrato.valor && contrato.quantidade && contrato.quantidade > 0
      ? contrato.valor / contrato.quantidade
      : null
  );

  const validation = validateLineItem({
    description: desc,
    unitPrice,
    totalPrice: contrato.valor ?? contrato.valorTotal,
    quantity: contrato.quantidade,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = `fnde_${contrato.id ?? contrato.numero ?? `${desc.slice(0, 20)}_${contrato.cnpjEntidade}`}`.replace(/[^a-z0-9_]/gi, '_');
  const normalizedDescription = normalizeText(desc);
  const unit = normalizeUnit(contrato.unidadeMedida);
  const contractDate = contrato.dataAssinatura ? new Date(contrato.dataAssinatura) : null;
  const classification = await classifyCatalog({
    description: desc,
    normalizedDescription,
    catmatCode: contrato.codigoCatmat,
    allowDescriptionFallback: !contrato.codigoCatmat,
  });
  const provenanceHash = buildProvenanceHash({
    source: 'fnde',
    sourceId,
    description: desc,
    unitPrice,
    contractDate,
    supplier: contrato.cnpjFornecedor ?? contrato.nomeFornecedor,
  });

  const confidenceScore = calculateConfidenceScore({ source: 'fnde', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  let supplierId: string | null = null;
  if (contrato.cnpjFornecedor) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: contrato.cnpjFornecedor },
      create: { cnpj: contrato.cnpjFornecedor, name: contrato.nomeFornecedor ?? '' },
      update: { name: contrato.nomeFornecedor ?? '' },
    });
    supplierId = supplier.id;
  }

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: desc,
    normalizedDescription,
    quantity: contrato.quantidade,
    unit,
    unitPrice,
    totalPrice: contrato.valor ?? contrato.valorTotal,
    calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode ?? contrato.codigoCatmat ?? null,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'fnde',
    sourceId,
    provenanceHash,
    inferredFromObject: false,
    supplierId,
    supplierName: contrato.nomeFornecedor,
    supplierCnpj: contrato.cnpjFornecedor,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf: contrato.uf,
    city: contrato.municipio,
    organizationId: orgId,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: contrato.nomeEntidade ?? 'FNDE' });
    return 'updated';
  } else {
    const dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: contrato.nomeEntidade ?? 'FNDE' });
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
        source: item.source ?? 'fnde',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        provenance_hash: item.provenanceHash ?? buildProvenanceHash({
          source: item.source ?? 'fnde',
          sourceId: item.sourceId ?? item.id,
          description: item.description,
          unitPrice: item.unitPrice,
          contractDate: item.contractDate,
          supplier: item.supplierCnpj ?? item.supplierName,
        }),
        confidence_score: item.confidenceScore ?? 0.80,
        classification_score: item.classificationScore,
        inferred_from_object: item.inferredFromObject ?? false,
        year_month: item.yearMonth,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[FNDE Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
