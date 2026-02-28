import { prisma } from '../../models/prisma';
import { getPncpClient } from '../../connectors/pncp/pncp.client';
import { getOpenSearchClient } from '../../search_index/opensearch.client';
import { normalizeText, normalizeUnit, calculateUnitPrice, validateLineItem } from '../normalizer';
import { inferItemsFromObject } from '../object-itemizer';
import { calculateConfidenceScore } from '../../services/confidence.service';
import { classifyCatalog } from '../../services/catmat-classifier.service';
import { config } from '../../config/config';
import { buildProvenanceHash } from '../../utils/provenance';
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
      config.pncp.maxPagesContratacoes,
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

        if ((itens ?? []).length > 0) {
          for (const item of itens ?? []) {
            const result = await processLineItem(item, contratacao, org.id, osClient);
            if (result === 'ingested') ingested++;
            else if (result === 'updated') updated++;
            else if (result === 'skipped') skipped++;
          }
        } else {
          const inferred = inferItemsFromObject(contratacao.objetoCompra ?? '', 4);
          for (let idx = 0; idx < inferred.length; idx++) {
            const pseudoItem = buildPseudoPncpItem(inferred[idx].description, idx + 1, contratacao.valorTotalEstimado);
            const result = await processLineItem(pseudoItem, contratacao, org.id, osClient, {
              inferredFromObject: true,
              inferredIndex: idx + 1,
            });
            if (result === 'ingested') ingested++;
            else if (result === 'updated') updated++;
            else if (result === 'skipped') skipped++;
          }
        }
      } catch (err: unknown) {
        logger.warn('[PNCP Ingest] Error processing contratacao', {
          error: (err as Error).message,
          pncpId: contratacao.numeroControlePNCP,
        });
        errors++;
      }
    }

    // Contratos (fornecedores) — PNCP limita a 365 dias por request, usar multi-janela
    const contratos = await client.fetchContratosMultiWindow(sinceDays, 50, config.pncp.maxPagesContratos);

    logger.info('[PNCP Ingest] Contratos fetched', { count: contratos.length });

    for (const contrato of contratos) {
      try {
        const org = await upsertOrganizationFromContrato(contrato);
        const supplierName = contrato.nomeRazaoSocialFornecedor ?? contrato.nomeFornecedor ?? '';
        const supplier = contrato.niFornecedor
          ? await upsertSupplier(contrato.niFornecedor, supplierName, contrato.tipoPessoa)
          : null;

        if (contrato.itens?.length) {
          for (const item of contrato.itens) {
            const result = await processContractItem(item, contrato, org.id, supplier?.id ?? null, osClient);
            if (result === 'ingested') ingested++;
            else if (result === 'updated') updated++;
            else if (result === 'skipped') skipped++;
          }
        } else {
          const inferred = inferItemsFromObject(contrato.objetoContrato ?? '', 4);
          for (let idx = 0; idx < inferred.length; idx++) {
            const pseudoItem = buildPseudoPncpItem(inferred[idx].description, idx + 1, contrato.valorGlobal ?? contrato.valorInicial);
            const result = await processContractItem(pseudoItem, contrato, org.id, supplier?.id ?? null, osClient, {
              inferredFromObject: true,
              inferredIndex: idx + 1,
            });
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
  options: { inferredFromObject?: boolean; inferredIndex?: number } = {},
): Promise<'ingested' | 'updated' | 'skipped'> {
  const validation = validateLineItem({
    description: item.descricao,
    unitPrice: item.valorUnitarioEstimado,
    totalPrice: item.valorTotal,
    quantity: item.quantidade,
  });
  if (!validation.isValid) return 'skipped';

  const inferredFromObject = options.inferredFromObject ?? false;
  const sourceId = inferredFromObject
    ? `pncp_${contratacao.numeroControlePNCP}_inferred_${options.inferredIndex ?? item.numeroItem}`
    : `pncp_${contratacao.numeroControlePNCP}_${item.numeroItem}`;
  const normalizedDescription = normalizeText(item.descricao ?? '');
  const unit = normalizeUnit(item.unidadeMedida);
  const unitPrice = item.valorUnitarioEstimado ?? calculateUnitPrice(item.valorTotal, item.quantidade);
  const contractDate = contratacao.dataPublicacaoPncp
    ? new Date(contratacao.dataPublicacaoPncp)
    : null;
  const classification = await classifyCatalog({
    description: item.descricao ?? '',
    normalizedDescription,
    catmatCode: item.codigoCatalogo,
    allowDescriptionFallback: !item.codigoCatalogo,
  });
  const provenanceHash = buildProvenanceHash({
    source: 'pncp',
    sourceId,
    description: item.descricao ?? '',
    unitPrice,
    contractDate,
  });

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
    catmatCode: classification.catmatCode ?? item.codigoCatalogo ?? null,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'pncp',
    sourceId,
    provenanceHash,
    inferredFromObject,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
    yearMonth,
    contractDate,
    uf: contratacao.unidadeOrgao?.ufSigla,
    city: contratacao.unidadeOrgao?.municipioNome,
    organizationId: orgId,
  };

  let dbItem: { id: string };
  if (existing) {
    dbItem = await prisma.lineItem.update({ where: { id: existing.id }, data });
    await indexToOpenSearch(osClient, { ...data, id: existing.id, organizationName: contratacao.orgaoEntidade.razaoSocial });
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
  options: { inferredFromObject?: boolean; inferredIndex?: number } = {},
): Promise<'ingested' | 'updated' | 'skipped'> {
  const validation = validateLineItem({
    description: item.descricao,
    unitPrice: item.valorUnitarioEstimado,
    totalPrice: item.valorTotal,
    quantity: item.quantidade,
  });
  if (!validation.isValid) return 'skipped';

  const inferredFromObject = options.inferredFromObject ?? false;
  const sourceId = inferredFromObject
    ? `pncp_c_${contrato.numeroControlePNCP}_inferred_${options.inferredIndex ?? item.numeroItem}`
    : `pncp_c_${contrato.numeroControlePNCP}_${item.numeroItem}`;
  const normalizedDescription = normalizeText(item.descricao ?? '');
  const unit = normalizeUnit(item.unidadeMedida);
  const unitPrice = item.valorUnitarioEstimado ?? calculateUnitPrice(item.valorTotal, item.quantidade);
  const contractDate = contrato.dataAssinatura ? new Date(contrato.dataAssinatura) : null;
  const classification = await classifyCatalog({
    description: item.descricao ?? '',
    normalizedDescription,
    catmatCode: item.codigoCatalogo,
    allowDescriptionFallback: !item.codigoCatalogo,
  });
  const provenanceHash = buildProvenanceHash({
    source: 'pncp',
    sourceId,
    description: item.descricao ?? '',
    unitPrice,
    contractDate,
    supplier: contrato.tipoPessoa === 'PJ' ? contrato.niFornecedor : contrato.nomeRazaoSocialFornecedor ?? contrato.nomeFornecedor,
  });

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
    catmatCode: classification.catmatCode ?? item.codigoCatalogo ?? null,
    catserCode: classification.catserCode,
    catmatDescription: classification.catmatDescription,
    source: 'pncp',
    sourceId,
    provenanceHash,
    inferredFromObject,
    supplierId,
    supplierName: contrato.nomeRazaoSocialFornecedor ?? contrato.nomeFornecedor,
    supplierCnpj: contrato.tipoPessoa === 'PJ' ? contrato.niFornecedor : null,
    confidenceScore,
    classificationScore: classification.confidence > 0 ? classification.confidence : null,
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
        source: item.source ?? 'pncp',
        supplier_name: item.supplierName,
        supplier_cnpj: item.supplierCnpj,
        provenance_hash: item.provenanceHash ?? buildProvenanceHash({
          source: item.source ?? 'pncp',
          sourceId: item.sourceId ?? item.id,
          description: item.description,
          unitPrice: item.unitPrice,
          contractDate: item.contractDate,
          supplier: item.supplierCnpj ?? item.supplierName,
        }),
        confidence_score: item.confidenceScore ?? 1.0,
        classification_score: item.classificationScore,
        inferred_from_object: item.inferredFromObject ?? false,
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

function buildPseudoPncpItem(description: string, numeroItem: number, totalValue?: number | null): PncpItem {
  return {
    numeroItem,
    descricao: description,
    quantidade: 1,
    unidadeMedida: 'UN',
    valorTotal: totalValue ?? undefined,
    valorUnitarioEstimado: totalValue ?? undefined,
  };
}
