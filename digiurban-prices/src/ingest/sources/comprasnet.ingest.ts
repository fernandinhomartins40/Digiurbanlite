import { prisma } from '../../models/prisma';
import { getComprasnetClient } from '../../connectors/comprasnet/comprasnet.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, calculateUnitPrice, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type { ComprasnetItem, ComprasnetLicitacao } from '../../connectors/comprasnet/comprasnet.types';

export interface ComprasnetIngestOptions {
  sinceDays?: number;
  uf?: string;
  runId?: string;
}

export interface IngestSourceResult {
  ingested: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function runComprasnetIngest(options: ComprasnetIngestOptions = {}): Promise<IngestSourceResult> {
  const { sinceDays = config.ingest.sinceDays, uf, runId } = options;
  const client = getComprasnetClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;
  logger.info('[ComprasNet Ingest] Starting', { sinceDays, uf, runId });

  try {
    const dataMax = new Date();
    const dataMin = new Date();
    dataMin.setDate(dataMin.getDate() - sinceDays);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const licitacoes = await client.fetchAllPages({
      dataAberturaMim: formatDate(dataMin),
      dataAberturaMax: formatDate(dataMax),
      uf,
      pageSize: 50,
    }, 30);

    logger.info('[ComprasNet Ingest] Licitacoes fetched', { count: licitacoes.length });

    for (const licitacao of licitacoes) {
      try {
        const org = await upsertOrganization(licitacao);
        const itens = await client.fetchItensLicitacao(licitacao.id_licitacao);

        for (const item of itens) {
          const result = await processItem(item, licitacao, org.id, osClient);
          if (result === 'ingested') ingested++;
          else if (result === 'updated') updated++;
          else skipped++;
        }
      } catch (err: unknown) {
        logger.warn('[ComprasNet Ingest] Error processing licitacao', {
          error: (err as Error).message,
          id: licitacao.id_licitacao,
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

async function upsertOrganization(l: ComprasnetLicitacao) {
  const cnpj = l.cod_uasg ? `UASG_${l.cod_uasg}` : `ORG_${l.cod_orgao}`;
  return prisma.organization.upsert({
    where: { cnpj },
    create: {
      cnpj,
      name: l.nome_uasg ?? l.nome_orgao,
      shortName: l.nome_orgao,
      uf: l.uf,
      city: l.municipio,
      sphere: 'federal',
    },
    update: { name: l.nome_uasg ?? l.nome_orgao },
  });
}

async function processItem(
  item: ComprasnetItem,
  licitacao: ComprasnetLicitacao,
  orgId: string,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const desc = item.descricao ?? item.descricao_complementar ?? '';
  const unitPrice = item.valor_unitario ?? calculateUnitPrice(item.valor_total, item.quantidade);

  const validation = validateLineItem({
    description: desc,
    unitPrice,
    totalPrice: item.valor_total,
    quantity: item.quantidade,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = `comprasnet_${licitacao.id_licitacao}_${item.id_item}`;
  const normalizedDescription = normalizeText(desc);
  const unit = normalizeUnit(item.unidade);
  const contractDate = licitacao.data_abertura ? new Date(licitacao.data_abertura) : null;

  const confidenceScore = calculateConfidenceScore({ source: 'comprasnet', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: desc,
    normalizedDescription,
    quantity: item.quantidade,
    unit,
    unitPrice,
    totalPrice: item.valor_total,
    calculatedUnitPrice: unitPrice,
    catmatCode: item.codigo_catmat,
    source: 'comprasnet',
    sourceId,
    confidenceScore,
    yearMonth,
    contractDate,
    uf: licitacao.uf,
    city: licitacao.municipio,
    organizationId: orgId,
  };

  if (existing) {
    await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: licitacao.nome_orgao, modality: licitacao.modalidade_compra });
    return 'updated';
  } else {
    const dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: licitacao.nome_orgao, modality: licitacao.modalidade_compra });
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
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        quantity: item.quantity,
        contract_date: item.contractDate?.toISOString(),
        uf: item.uf,
        city: item.city,
        organization_name: item.organizationName,
        catmat_code: item.catmatCode,
        source: item.source ?? 'comprasnet',
        confidence_score: item.confidenceScore ?? 0.95,
        year_month: item.yearMonth,
        modality: item.modality,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[ComprasNet Ingest] OpenSearch index error', { error: (err as Error).message });
  }
}
