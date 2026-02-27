import { prisma } from '../../models/prisma';
import { getComprasnetClient } from '../../connectors/comprasnet/comprasnet.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, calculateUnitPrice, validateLineItem } from '../normalizer';
import { inferItemsFromObject } from '../object-itemizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
import { logger } from '../../utils/logger';
import type { ComprasnetContrato, ComprasnetContratoItem } from '../../connectors/comprasnet/comprasnet.types';

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
  const client = getComprasnetClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;
  logger.info('[ComprasNet Ingest] Starting', { sinceDays, runId });

  try {
    const dataMax = new Date();
    const dataMin = new Date();
    dataMin.setDate(dataMin.getDate() - sinceDays);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const contratos = await client.fetchAllPages({
      dataAssinaturaMin: formatDate(dataMin),
      dataAssinaturaMax: formatDate(dataMax),
      pageSize: 500,
    }, 20);

    logger.info('[ComprasNet Ingest] Contratos fetched', { count: contratos.length });

    for (const contrato of contratos) {
      try {
        const org = await upsertOrganization(contrato);
        const itens = await client.fetchItensContrato(contrato.id);

        if (itens.length === 0) {
          // Sem itens detalhados: inferir subitens a partir do objeto textual.
          const inferredItems = inferItemsFromObject(contrato.objeto ?? '', 5);
          if (inferredItems.length === 0) {
            const result = await processContratoAsItem(contrato, org.id, osClient);
            if (result === 'ingested') ingested++;
            else if (result === 'updated') updated++;
            else skipped++;
          } else {
            for (let idx = 0; idx < inferredItems.length; idx++) {
              const result = await processContratoAsItem(contrato, org.id, osClient, inferredItems[idx], idx + 1);
              if (result === 'ingested') ingested++;
              else if (result === 'updated') updated++;
              else skipped++;
            }
          }
        } else {
          for (const item of itens) {
            const result = await processItem(item, contrato, org.id, osClient);
            if (result === 'ingested') ingested++;
            else if (result === 'updated') updated++;
            else skipped++;
          }
        }
      } catch (err: unknown) {
        logger.warn('[ComprasNet Ingest] Error processing contrato', {
          error: (err as Error).message,
          id: contrato.id,
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

async function upsertOrganization(c: ComprasnetContrato) {
  const cnpj = c.unidade_gestora_codigo
    ? `UASG_${c.unidade_gestora_codigo}`
    : `ORG_${c.orgao_codigo ?? 'COMPRASNET'}`;
  return prisma.organization.upsert({
    where: { cnpj },
    create: {
      cnpj,
      name: c.unidade_gestora_nome ?? c.orgao_nome ?? 'Orgao ComprasNet',
      shortName: c.orgao_nome,
      uf: c.uf,
      city: c.municipio,
      sphere: 'federal',
    },
    update: { name: c.unidade_gestora_nome ?? c.orgao_nome ?? 'Orgao ComprasNet' },
  });
}

async function processItem(
  item: ComprasnetContratoItem,
  contrato: ComprasnetContrato,
  orgId: string,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = item.descricao ?? item.descricao_complementar ?? '';
  const unitPrice = item.valor_unitario ?? calculateUnitPrice(item.valor_total, item.quantidade);

  const validation = validateLineItem({ description: desc, unitPrice, totalPrice: item.valor_total, quantity: item.quantidade });
  if (!validation.isValid) return 'skipped';

  const sourceId = `comprasnet_${contrato.id}_${item.id ?? item.numero_item ?? 'i'}`.replace(/[^a-z0-9_]/gi, '_');
  const normalizedDescription = normalizeText(desc);
  const unit = normalizeUnit(item.unidade_medida);
  const contractDate = contrato.data_assinatura ? new Date(contrato.data_assinatura) : null;
  const classification = await classifyCatalog({
    description: desc,
    normalizedDescription,
    catmatCode: item.codigo_catmat,
    allowDescriptionFallback: !item.codigo_catmat,
  });
  const provenanceHash = buildProvenanceHash({
    source: 'comprasnet',
    sourceId,
    description: desc,
    unitPrice,
    contractDate,
    supplier: contrato.fornecedor_cnpj_cpf_idgener ?? contrato.fornecedor_nome,
  });
  const confidenceScore = calculateConfidenceScore({ source: 'comprasnet', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  let supplierId: string | null = null;
  if (contrato.fornecedor_cnpj_cpf_idgener) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: contrato.fornecedor_cnpj_cpf_idgener },
      create: { cnpj: contrato.fornecedor_cnpj_cpf_idgener, name: contrato.fornecedor_nome ?? '' },
      update: { name: contrato.fornecedor_nome ?? '' },
    });
    supplierId = supplier.id;
  }

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });
  const data = {
    description: desc, normalizedDescription, quantity: item.quantidade, unit,
    unitPrice, totalPrice: item.valor_total, calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode ?? item.codigo_catmat ?? null, catserCode: classification.catserCode,
    source: 'comprasnet', sourceId, provenanceHash, inferredFromObject: false,
    catmatDescription: classification.catmatDescription,
    supplierId, supplierName: contrato.fornecedor_nome, supplierCnpj: contrato.fornecedor_cnpj_cpf_idgener,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    confidenceScore, yearMonth, contractDate, uf: contrato.uf, city: contrato.municipio, organizationId: orgId,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: contrato.orgao_nome ?? '', modality: contrato.modalidade });
    return 'updated';
  }
  const dbItem = await prisma.lineItem.create({ data });
  await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: contrato.orgao_nome ?? '', modality: contrato.modalidade });
  return 'ingested';
}

async function processContratoAsItem(
  contrato: ComprasnetContrato,
  orgId: string,
  osClient: ReturnType<typeof getOpenSearchClient>,
  inferred?: { description: string; quantity: number | null; unit: string | null },
  inferredIndex?: number,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = inferred?.description ?? contrato.objeto ?? '';
  const quantity = inferred?.quantity ?? 1;
  const totalPrice = contrato.valor_global ?? contrato.valor_inicial ?? null;
  const unitPrice = totalPrice && quantity > 0 ? totalPrice / quantity : totalPrice;
  const validation = validateLineItem({ description: desc, unitPrice });
  if (!validation.isValid) return 'skipped';

  const sourceId = inferredIndex
    ? `comprasnet_contrato_${contrato.id}_inferred_${inferredIndex}`
    : `comprasnet_contrato_${contrato.id}`;
  const normalizedDescription = normalizeText(desc);
  const contractDate = contrato.data_assinatura ? new Date(contrato.data_assinatura) : null;
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
    supplier: contrato.fornecedor_cnpj_cpf_idgener ?? contrato.fornecedor_nome,
  });
  const confidenceScore = calculateConfidenceScore({ source: 'comprasnet', contractDate, count: inferredIndex ? 2 : 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  let supplierId: string | null = null;
  if (contrato.fornecedor_cnpj_cpf_idgener) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: contrato.fornecedor_cnpj_cpf_idgener },
      create: { cnpj: contrato.fornecedor_cnpj_cpf_idgener, name: contrato.fornecedor_nome ?? '' },
      update: { name: contrato.fornecedor_nome ?? '' },
    });
    supplierId = supplier.id;
  }

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });
  const data = {
    description: desc, normalizedDescription, quantity, unit: normalizeUnit(inferred?.unit ?? 'UN'),
    unitPrice, totalPrice, calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode, catserCode: classification.catserCode, catmatDescription: classification.catmatDescription,
    source: 'comprasnet', sourceId, provenanceHash, inferredFromObject: Boolean(inferredIndex),
    supplierId, supplierName: contrato.fornecedor_nome, supplierCnpj: contrato.fornecedor_cnpj_cpf_idgener,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    confidenceScore, yearMonth, contractDate, uf: contrato.uf, city: contrato.municipio, organizationId: orgId,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: contrato.orgao_nome ?? '', modality: contrato.modalidade });
    return 'updated';
  }
  const dbItem = await prisma.lineItem.create({ data });
  await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: contrato.orgao_nome ?? '', modality: contrato.modalidade });
  return 'ingested';
}

async function indexToOpenSearch(
  osClient: ReturnType<typeof getOpenSearchClient>,
  item: {
    id: string; description: string; normalizedDescription: string;
    unit?: string | null; unitPrice?: number | null; totalPrice?: number | null;
    quantity?: number | null; contractDate?: Date | null; uf?: string | null;
    city?: string | null; organizationName: string; catmatCode?: string | null;
    catserCode?: string | null;
    catmatDescription?: string | null;
    source?: string; sourceId?: string | null; supplierName?: string | null; supplierCnpj?: string | null;
    confidenceScore?: number | null; classificationScore?: number | null; yearMonth?: string | null; modality?: string | null;
    provenanceHash?: string | null; inferredFromObject?: boolean;
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
        catmat_code: item.catmatCode, catser_code: item.catserCode, catmat_description: item.catmatDescription, source: item.source ?? 'comprasnet',
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
