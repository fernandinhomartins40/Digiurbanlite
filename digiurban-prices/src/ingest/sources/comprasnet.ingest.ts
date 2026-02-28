// Conector "ComprasNet/SIASG" — agora usa PNCP /contratos
// A antiga API api.compras.dados.gov.br está offline (404, fev/2026).
// O PNCP disponibiliza todos os contratos federais via /api/consulta/v1/contratos.
// Esta fonte complementa o pncp.ingest.ts (que ingere contratações/editais),
// focando nos *contratos* assinados (resultado efetivo das licitações).

import { prisma } from '../../models/prisma';
import { getPncpClient } from '../../connectors/pncp/pncp.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, validateLineItem } from '../normalizer';
import { inferItemsFromObject } from '../object-itemizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
import { logger } from '../../utils/logger';
import type { PncpContrato } from '../../connectors/pncp/pncp.types';

export interface ComprasnetIngestOptions {
  sinceDays?: number;
  runId?: string;
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function runComprasnetIngest(options: ComprasnetIngestOptions = {}): Promise<IngestSourceResult> {
  const { sinceDays = config.ingest.sinceDays, runId } = options;
  const client = getPncpClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;
  logger.info('[ComprasNet Ingest] Starting (via PNCP /contratos)', { sinceDays, runId });

  try {
    // PNCP /contratos limita a 365 dias por request — usar multi-janela para períodos longos
    const contratos = await client.fetchContratosMultiWindow(sinceDays, 50, config.pncp.maxPagesContratos);

    logger.info('[ComprasNet Ingest] Contratos fetched', { count: contratos.length });

    for (const contrato of contratos) {
      try {
        const result = await processContrato(contrato, osClient);
        if (result === 'ingested') ingested++;
        else if (result === 'updated') updated++;
        else skipped++;
      } catch (err: unknown) {
        logger.warn('[ComprasNet Ingest] Error processing contrato', {
          error: (err as Error).message,
          id: contrato.numeroControlePNCP,
        });
        errors++;
      }
    }
  } catch (err: unknown) {
    logger.error('[ComprasNet Ingest] Fatal error', { error: (err as Error).message });
    errors++;
  }

  logger.info('[ComprasNet Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

async function processContrato(
  contrato: PncpContrato,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = contrato.objetoContrato ?? '';
  const totalPrice = contrato.valorGlobal ?? contrato.valorInicial ?? null;

  // Tentar inferir itens do objeto textual
  const inferredItems = inferItemsFromObject(desc, 5);

  if (inferredItems.length === 0) {
    return processSingleContrato(contrato, desc, null, totalPrice, null, false, osClient);
  }

  // Processar cada item inferido — retornar o último resultado (maioria ingested/skipped)
  let lastResult: 'ingested' | 'updated' | 'skipped' = 'skipped';
  for (let idx = 0; idx < inferredItems.length; idx++) {
    const item = inferredItems[idx];
    const r = await processSingleContrato(contrato, item.description, item.quantity, totalPrice, item.unit, true, osClient, idx + 1);
    if (r !== 'skipped') lastResult = r;
  }
  return lastResult;
}

async function processSingleContrato(
  contrato: PncpContrato,
  desc: string,
  quantity: number | null,
  totalPrice: number | null,
  unit: string | null,
  inferredFromObject: boolean,
  osClient: ReturnType<typeof getOpenSearchClient>,
  inferredIndex?: number,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const unitPrice = totalPrice && quantity && quantity > 0
    ? totalPrice / quantity
    : totalPrice;

  const validation = validateLineItem({ description: desc, unitPrice });
  if (!validation.isValid) return 'skipped';

  const baseId = contrato.numeroControlePNCP ?? contrato.numeroControlePncpCompra ?? `pncp_contrato_${Date.now()}`;
  const sourceId = inferredIndex
    ? `comprasnet_${baseId}_inferred_${inferredIndex}`.replace(/[^a-z0-9_]/gi, '_')
    : `comprasnet_${baseId}`.replace(/[^a-z0-9_]/gi, '_');

  const normalizedDescription = normalizeText(desc);
  const contractDate = contrato.dataAssinatura ? new Date(contrato.dataAssinatura) : null;
  const uf = contrato.unidadeOrgao?.ufSigla ?? null;
  const city = contrato.unidadeOrgao?.municipioNome ?? null;
  const modality = contrato.categoriaProcesso?.nome ?? null;
  const supplierCnpj = contrato.niFornecedor ?? null;
  const supplierName = contrato.nomeRazaoSocialFornecedor ?? contrato.nomeFornecedor ?? null;

  const classification = await classifyCatalog({
    description: desc,
    normalizedDescription,
    allowDescriptionFallback: true,
  });

  const provenanceHash = buildProvenanceHash({
    source: 'comprasnet',
    sourceId,
    description: desc,
    unitPrice,
    contractDate,
    supplier: supplierCnpj ?? supplierName,
  });

  const confidenceScore = calculateConfidenceScore({
    source: 'comprasnet',
    contractDate,
    count: inferredIndex ? 2 : 1,
  });

  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  // Upsert organização
  const orgCnpj = `PNCP_${contrato.orgaoEntidade?.cnpj ?? baseId}`;
  const org = await prisma.organization.upsert({
    where: { cnpj: orgCnpj },
    create: {
      cnpj: orgCnpj,
      name: contrato.unidadeOrgao?.nomeUnidade ?? contrato.orgaoEntidade?.razaoSocial ?? 'Órgão PNCP',
      uf,
      city,
      sphere: 'federal',
    },
    update: {},
  });

  // Upsert fornecedor
  let supplierId: string | null = null;
  if (supplierCnpj) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: supplierCnpj },
      create: { cnpj: supplierCnpj, name: supplierName ?? '' },
      update: { name: supplierName ?? '' },
    });
    supplierId = supplier.id;
  }

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: desc,
    normalizedDescription,
    quantity,
    unit: normalizeUnit(unit ?? 'UN'),
    unitPrice,
    totalPrice,
    calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'comprasnet',
    sourceId,
    provenanceHash,
    inferredFromObject,
    supplierId,
    supplierName,
    supplierCnpj,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf,
    city,
    organizationId: org.id,
    // 'modality' não existe no modelo LineItem — vai apenas para OpenSearch
  };

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
    id: string; description: string; normalizedDescription: string;
    unit?: string | null; unitPrice?: number | null; totalPrice?: number | null;
    quantity?: number | null; contractDate?: Date | null; uf?: string | null;
    city?: string | null; organizationName: string; catmatCode?: string | null;
    catserCode?: string | null; catmatDescription?: string | null;
    source?: string; sourceId?: string | null; supplierName?: string | null;
    supplierCnpj?: string | null; confidenceScore?: number | null;
    classificationScore?: number | null; yearMonth?: string | null;
    modality?: string | null; provenanceHash?: string | null; inferredFromObject?: boolean;
  },
): Promise<void> {
  try {
    await osClient.index({
      index: config.opensearch.indexLineItems,
      id: item.id,
      body: {
        id: item.id, description: item.description, normalized_description: item.normalizedDescription,
        unit: item.unit, unit_price: item.unitPrice, total_price: item.totalPrice,
        quantity: item.quantity, contract_date: item.contractDate?.toISOString(),
        uf: item.uf, city: item.city, organization_name: item.organizationName,
        catmat_code: item.catmatCode, catser_code: item.catserCode,
        catmat_description: item.catmatDescription, source: item.source ?? 'comprasnet',
        supplier_name: item.supplierName, supplier_cnpj: item.supplierCnpj,
        provenance_hash: item.provenanceHash ?? buildProvenanceHash({
          source: item.source ?? 'comprasnet',
          sourceId: item.sourceId ?? item.id,
          description: item.description,
          unitPrice: item.unitPrice,
          contractDate: item.contractDate,
          supplier: item.supplierCnpj ?? item.supplierName,
        }),
        confidence_score: item.confidenceScore ?? 0.95,
        classification_score: item.classificationScore,
        inferred_from_object: item.inferredFromObject ?? false,
        year_month: item.yearMonth, modality: item.modality,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[ComprasNet Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
