// Conector ComprasNet/SIASG Ã¢â‚¬â€ usa dadosabertos.compras.gov.br
// Fontes:
//   1. /modulo-legado/4_consultarItensPregoes Ã¢â‚¬â€ pregÃƒÂµes homologados (preÃƒÂ§o real praticado)
//   2. /modulo-arp/2_consultarARPItem         Ã¢â‚¬â€ itens de Atas de Registro de PreÃƒÂ§o
//
// NÃƒÆ’O usa PNCP Ã¢â‚¬â€ sÃƒÂ£o sistemas distintos.
// - PNCP (pncp.gov.br): contrataÃƒÂ§ÃƒÂµes/editais da Lei 14.133/2021
// - ComprasNet (dadosabertos.compras.gov.br): SIASG, pregÃƒÂµes, ARPs (todos os regimes)

import { prisma } from '../../models/prisma';
import { getComprasnetClient } from '../../connectors/comprasnet/comprasnet.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
import { logger } from '../../utils/logger';
import type { ComprasnetItemPregao, ComprasnetARPItem } from '../../connectors/comprasnet/comprasnet.types';

export interface ComprasnetIngestOptions {
  sinceDays?: number;
  runId?: string;
  skipARP?: boolean;    // pular ATAs (ÃƒÂºtil em testes Ã¢â‚¬â€ endpoint pode ser lento)
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function runComprasnetIngest(options: ComprasnetIngestOptions = {}): Promise<IngestSourceResult> {
  const { sinceDays = config.ingest.sinceDays, runId, skipARP = false } = options;
  const client = getComprasnetClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;
  logger.info('[ComprasNet Ingest] Starting (dadosabertos.compras.gov.br)', { sinceDays, runId });

  // Ã¢â€â‚¬Ã¢â€â‚¬ 1. PregÃƒÂµes homologados Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  try {
    logger.info('[ComprasNet Ingest] Fetching pregoes homologados...');
    const itens = await client.fetchAllPregoes(sinceDays, config.comprasnet.maxPagesPregoes);
    logger.info('[ComprasNet Ingest] Pregoes fetched', { count: itens.length });

    for (const item of itens) {
      try {
        const result = await processPregaoItem(item, osClient);
        if (result === 'ingested') ingested++;
        else if (result === 'updated') updated++;
        else skipped++;
      } catch (err: unknown) {
        logger.warn('[ComprasNet Ingest] Error processing pregao item', {
          error: (err as Error).message,
          id: item.idCompraItem,
        });
        errors++;
      }
    }
  } catch (err: unknown) {
    logger.error('[ComprasNet Ingest] Fatal error (pregoes)', { error: (err as Error).message });
    errors++;
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ 2. Itens de ATAs de Registro de PreÃƒÂ§o Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (!skipARP) {
    try {
      logger.info('[ComprasNet Ingest] Fetching ARP itens...');
      const arpItens = await client.fetchAllARPItens(sinceDays, config.comprasnet.maxPagesArp);
      logger.info('[ComprasNet Ingest] ARP itens fetched', { count: arpItens.length });

      for (const item of arpItens) {
        try {
          const result = await processARPItem(item, osClient);
          if (result === 'ingested') ingested++;
          else if (result === 'updated') updated++;
          else skipped++;
        } catch (err: unknown) {
          logger.warn('[ComprasNet Ingest] Error processing ARP item', {
            error: (err as Error).message,
            ata: item.numeroAtaRegistroPreco,
          });
          errors++;
        }
      }
    } catch (err: unknown) {
      logger.error('[ComprasNet Ingest] Fatal error (ARP)', { error: (err as Error).message });
      errors++;
    }
  }

  logger.info('[ComprasNet Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Processadores individuais Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function processPregaoItem(
  item: ComprasnetItemPregao,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = item.descricaoItem ?? item.descricaoDetalhadaItem ?? '';
  const unitPrice = item.valorHomologadoItem ? parseFloat(item.valorHomologadoItem.replace(',', '.')) : null;
  const quantity = item.quantidadeItem ? parseFloat(item.quantidadeItem.replace(',', '.')) : null;

  const validation = validateLineItem({ description: desc, unitPrice });
  if (!validation.isValid) return 'skipped';
  // Ignorar itens cancelados sem preÃƒÂ§o
  if (item.situacaoItem === 'cancelado' && !unitPrice) return 'skipped';

  const sourceId = `comprasnet_pregao_${item.idCompraItem ?? item.idCompra}_${item.tbVwItensPregaoId?.coItem}`
    .replace(/[^a-z0-9_]/gi, '_');

  const contractDate = item.dtHom ? new Date(item.dtHom) : null;
  const normalizedDescription = normalizeText(desc);

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
    supplier: item.fornecedorVencedor,
  });

  const confidenceScore = calculateConfidenceScore({ source: 'comprasnet', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  const orgCnpj = `SIASG_${item.tbVwItensPregaoId?.coUasg ?? item.idCompra ?? 'unknown'}`;
  const org = await prisma.organization.upsert({
    where: { cnpj: orgCnpj },
    create: { cnpj: orgCnpj, name: `UASG ${item.tbVwItensPregaoId?.coUasg ?? 'ComprasNet'}`, sphere: 'federal' },
    update: {},
  });

  const data = {
    description: desc,
    normalizedDescription,
    quantity,
    unit: normalizeUnit(item.unidadeFornecimento ?? 'UN'),
    unitPrice,
    totalPrice: unitPrice && quantity ? unitPrice * quantity : null,
    calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'comprasnet',
    sourceId,
    provenanceHash,
    inferredFromObject: false,
    supplierId: null as string | null,
    supplierName: item.fornecedorVencedor ?? null,
    supplierCnpj: null as string | null,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf: null as string | null,
    city: null as string | null,
    organizationId: org.id,
  };

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });
  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: org.name, modality: 'PregÃƒÂ£o' });
    return 'updated';
  }
  const dbItem = await prisma.lineItem.create({ data });
  await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: org.name, modality: 'PregÃƒÂ£o' });
  return 'ingested';
}

async function processARPItem(
  item: ComprasnetARPItem,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = item.descricaoItem ?? '';
  const unitPrice = item.valorUnitario ?? null;
  const quantity = item.quantidade ?? null;

  const validation = validateLineItem({ description: desc, unitPrice });
  if (!validation.isValid) return 'skipped';

  const sourceId = `comprasnet_arp_${item.numeroControlePncpAta ?? item.numeroAtaRegistroPreco}_${item.codigoItem}`
    .replace(/[^a-z0-9_]/gi, '_');

  const contractDate = item.dataVigenciaInicial ? new Date(item.dataVigenciaInicial) : null;
  const normalizedDescription = normalizeText(desc);

  const classification = await classifyCatalog({
    description: desc,
    normalizedDescription,
    catmatCode: item.tipoItem === 'M' ? item.codigoItem : undefined,
    allowDescriptionFallback: true,
  });

  const provenanceHash = buildProvenanceHash({
    source: 'comprasnet',
    sourceId,
    description: desc,
    unitPrice,
    contractDate,
    supplier: item.niFornecedor ?? item.nomeFornecedor,
  });

  const confidenceScore = calculateConfidenceScore({ source: 'comprasnet', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  const orgCnpj = `SIASG_ARP_${item.codigoUnidadeGerenciadora ?? 'unknown'}`;
  const org = await prisma.organization.upsert({
    where: { cnpj: orgCnpj },
    create: {
      cnpj: orgCnpj,
      name: item.nomeUnidadeGerenciadora ?? `UG ${item.codigoUnidadeGerenciadora ?? 'ComprasNet'}`,
      uf: item.uf ?? null,
      city: item.municipio ?? null,
      sphere: 'federal',
    },
    update: {},
  });

  let supplierId: string | null = null;
  if (item.niFornecedor) {
    const supplier = await prisma.supplier.upsert({
      where: { cnpj: item.niFornecedor },
      create: { cnpj: item.niFornecedor, name: item.nomeFornecedor ?? '' },
      update: { name: item.nomeFornecedor ?? '' },
    });
    supplierId = supplier.id;
  }

  const data = {
    description: desc,
    normalizedDescription,
    quantity,
    unit: normalizeUnit(item.unidadeMedida ?? 'UN'),
    unitPrice,
    totalPrice: item.valorTotal ?? null,
    calculatedUnitPrice: unitPrice,
    catmatCode: classification.catmatCode ?? (item.tipoItem === 'M' ? item.codigoItem ?? null : null),
    catserCode: classification.catserCode ?? (item.tipoItem === 'S' ? item.codigoItem ?? null : null),
    catmatDescription: classification.catmatDescription,
    source: 'comprasnet',
    sourceId,
    provenanceHash,
    inferredFromObject: false,
    supplierId,
    supplierName: item.nomeFornecedor ?? null,
    supplierCnpj: item.niFornecedor ?? null,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf: item.uf ?? null,
    city: item.municipio ?? null,
    organizationId: org.id,
  };

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });
  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: org.name, modality: 'Ata de Registro de PreÃƒÂ§o' });
    return 'updated';
  }
  const dbItem = await prisma.lineItem.create({ data });
  await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: org.name, modality: 'Ata de Registro de PreÃƒÂ§o' });
  return 'ingested';
}

// Ã¢â€â‚¬Ã¢â€â‚¬ OpenSearch indexing Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
        confidence_score: item.confidenceScore ?? 0.92,
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
