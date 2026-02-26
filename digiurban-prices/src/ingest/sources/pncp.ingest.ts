import { prisma } from '../../models/prisma';
import { getPncpClient } from '../../connectors/pncp/pncp.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, calculateUnitPrice, validateLineItem } from '../normalizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';
import type { PncpContratacao, PncpItem } from '../../connectors/pncp/pncp.types';

export interface PncpIngestOptions {
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

export async function runPncpIngest(options: PncpIngestOptions = {}): Promise<IngestSourceResult> {
  const { sinceDays = config.ingest.sinceDays, uf, runId } = options;
  const client = getPncpClient();
  const osClient = getOpenSearchClient();

  let ingested = 0, updated = 0, skipped = 0, errors = 0;

  logger.info('[PNCP Ingest] Starting', { sinceDays, uf, runId });

  try {
    const contratacoes = await client.fetchAllPages(
      (page) => client.fetchContratacoes({ sinceDays, uf, page }),
      50,
    );

    logger.info('[PNCP Ingest] Contratacoes fetched', { count: contratacoes.length });

    for (const contratacao of contratacoes) {
      try {
        const org = await upsertOrganization(contratacao);
        const itens = await client.fetchItensContratacao(
          contratacao.orgaoEntidade.cnpj,
          contratacao.anoCompra ?? 0,
          contratacao.sequencialCompra ?? 0,
        );

        for (const item of itens ?? []) {
          const result = await processLineItem(item, contratacao, org.id, osClient);
          if (result === 'ingested') ingested++;
          else if (result === 'updated') updated++;
          else if (result === 'skipped') skipped++;
        }
      } catch (err: unknown) {
        logger.warn('[PNCP Ingest] Error processing contratacao', {
          error: (err as Error).message,
          pncpId: contratacao.numeroControlePNCP,
        });
        errors++;
      }
    }

    // Contratos (fornecedores)
    const contratos = await client.fetchAllPages(
      (page) => client.fetchContratos({ sinceDays, uf, page }),
      20,
    );

    logger.info('[PNCP Ingest] Contratos fetched', { count: contratos.length });

    for (const contrato of contratos) {
      try {
        const org = await upsertOrganizationFromContrato(contrato);
        const supplier = contrato.niFornecedor
          ? await upsertSupplier(contrato.niFornecedor, contrato.nomeFornecedor ?? '', contrato.tipoPessoa)
          : null;

        if (contrato.itens?.length) {
          for (const item of contrato.itens) {
            const result = await processContractItem(item, contrato, org.id, supplier?.id ?? null, osClient);
            if (result === 'ingested') ingested++;
            else if (result === 'updated') updated++;
            else if (result === 'skipped') skipped++;
          }
        }
      } catch (err: unknown) {
        logger.warn('[PNCP Ingest] Error processing contrato', { error: (err as Error).message });
        errors++;
      }
    }
  } catch (err: unknown) {
    logger.error('[PNCP Ingest] Fatal error', { error: (err as Error).message });
    errors++;
  }

  logger.info('[PNCP Ingest] Done', { ingested, updated, skipped, errors });
  return { ingested, updated, skipped, errors };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertOrganization(c: PncpContratacao) {
  return prisma.organization.upsert({
    where: { cnpj: c.orgaoEntidade.cnpj },
    create: {
      cnpj: c.orgaoEntidade.cnpj,
      name: c.orgaoEntidade.razaoSocial,
      uf: c.unidadeOrgao?.ufSigla,
      city: c.unidadeOrgao?.municipioNome,
      sphere: mapEsfera(c.orgaoEntidade.esferaId),
    },
    update: { name: c.orgaoEntidade.razaoSocial },
  });
}

async function upsertOrganizationFromContrato(c: import('../../connectors/pncp/pncp.types').PncpContrato) {
  return prisma.organization.upsert({
    where: { cnpj: c.orgaoEntidade.cnpj },
    create: {
      cnpj: c.orgaoEntidade.cnpj,
      name: c.orgaoEntidade.razaoSocial,
      uf: c.unidadeOrgao?.ufSigla,
      city: c.unidadeOrgao?.municipioNome,
    },
    update: { name: c.orgaoEntidade.razaoSocial },
  });
}

async function upsertSupplier(ni: string, name: string, tipo?: string) {
  const isCnpj = (tipo === 'PJ' || ni.length === 14);
  return prisma.supplier.upsert({
    where: isCnpj ? { cnpj: ni } : { cpf: ni },
    create: { [isCnpj ? 'cnpj' : 'cpf']: ni, name },
    update: { name },
  });
}

async function processLineItem(
  item: PncpItem,
  contratacao: PncpContratacao,
  orgId: string,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const validation = validateLineItem({
    description: item.descricao,
    unitPrice: item.valorUnitarioEstimado,
    totalPrice: item.valorTotal,
    quantity: item.quantidade,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = `pncp_${contratacao.numeroControlePNCP}_${item.numeroItem}`;
  const normalizedDescription = normalizeText(item.descricao ?? '');
  const unit = normalizeUnit(item.unidadeMedida);
  const unitPrice = item.valorUnitarioEstimado ?? calculateUnitPrice(item.valorTotal, item.quantidade);
  const contractDate = contratacao.dataPublicacaoPncp
    ? new Date(contratacao.dataPublicacaoPncp)
    : null;

  const confidenceScore = calculateConfidenceScore({
    source: 'pncp',
    contractDate,
    count: 1,
  });

  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: item.descricao ?? '',
    normalizedDescription,
    quantity: item.quantidade,
    unit,
    unitPrice,
    totalPrice: item.valorTotal,
    calculatedUnitPrice: unitPrice,
    catmatCode: item.codigoCatalogo,
    source: 'pncp',
    sourceId,
    confidenceScore,
    yearMonth,
    contractDate,
    uf: contratacao.unidadeOrgao?.ufSigla,
    city: contratacao.unidadeOrgao?.municipioNome,
    organizationId: orgId,
  };

  let dbItem: { id: string };
  if (existing) {
    dbItem = await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: '' });
    return 'updated';
  } else {
    dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: contratacao.orgaoEntidade.razaoSocial });
    return 'ingested';
  }
}

async function processContractItem(
  item: PncpItem,
  contrato: import('../../connectors/pncp/pncp.types').PncpContrato,
  orgId: string,
  supplierId: string | null,
  osClient: ReturnType<typeof getOpenSearchClient>,
): Promise<'ingested' | 'updated' | 'skipped'> {
  const validation = validateLineItem({
    description: item.descricao,
    unitPrice: item.valorUnitarioEstimado,
    totalPrice: item.valorTotal,
    quantity: item.quantidade,
  });
  if (!validation.isValid) return 'skipped';

  const sourceId = `pncp_c_${contrato.numeroControlePNCP}_${item.numeroItem}`;
  const normalizedDescription = normalizeText(item.descricao ?? '');
  const unit = normalizeUnit(item.unidadeMedida);
  const unitPrice = item.valorUnitarioEstimado ?? calculateUnitPrice(item.valorTotal, item.quantidade);
  const contractDate = contrato.dataAssinatura ? new Date(contrato.dataAssinatura) : null;

  const confidenceScore = calculateConfidenceScore({ source: 'pncp', contractDate, count: 1 });
  const yearMonth = contractDate
    ? `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  const existing = await prisma.lineItem.findFirst({ where: { sourceId } });

  const data = {
    description: item.descricao ?? '',
    normalizedDescription,
    quantity: item.quantidade,
    unit,
    unitPrice,
    totalPrice: item.valorTotal,
    calculatedUnitPrice: unitPrice,
    catmatCode: item.codigoCatalogo,
    source: 'pncp',
    sourceId,
    supplierId,
    supplierName: contrato.nomeFornecedor,
    supplierCnpj: contrato.tipoPessoa === 'PJ' ? contrato.niFornecedor : null,
    confidenceScore,
    yearMonth,
    contractDate,
    uf: contrato.unidadeOrgao?.ufSigla,
    city: contrato.unidadeOrgao?.municipioNome,
    organizationId: orgId,
  };

  let dbItem: { id: string };
  if (existing) {
    dbItem = await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: contrato.orgaoEntidade.razaoSocial });
    return 'updated';
  } else {
    dbItem = await prisma.lineItem.create({ data });
    await indexToOpenSearch(osClient, { ...data, id: dbItem.id, organizationName: contrato.orgaoEntidade.razaoSocial });
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
        source: item.source ?? 'pncp',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        confidence_score: item.confidenceScore ?? 1.0,
        year_month: item.yearMonth,
        indexed_at: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    logger.warn('[PNCP Ingest] OpenSearch index error', { error: (err as Error).message, id: item.id });
  }
}

function mapEsfera(esferaId?: string): string | undefined {
  if (!esferaId) return undefined;
  const map: Record<string, string> = { '1': 'federal', '2': 'estadual', '3': 'municipal' };
  return map[esferaId];
}
