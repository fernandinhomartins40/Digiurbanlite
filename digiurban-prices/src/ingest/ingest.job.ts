import { prisma } from '../models/prisma';
import { Prisma } from '@prisma/client';
import { getPncpClient } from '../connectors/pncp/pncp.client';
import { getOpenSearchClient } from '../search_index/opensearch.client';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import {
  normalizeText,
  normalizeUnit,
  calculateUnitPrice,
  validateLineItem,
} from './normalizer';
import type { PncpContratacao } from '../connectors/pncp/pncp.types';

export interface IngestJobOptions {
  sinceDays?: number;
  triggeredBy?: string;
  uf?: string;
}

export interface IngestJobResult {
  runId: string;
  itemsIngested: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: number;
  durationMs: number;
}

export async function runIngestJob(options: IngestJobOptions = {}): Promise<IngestJobResult> {
  const sinceDays = options.sinceDays ?? config.ingest.sinceDays;
  const triggeredBy = options.triggeredBy ?? 'scheduled';

  const run = await prisma.ingestRun.create({
    data: {
      source: 'pncp',
      status: 'running',
      triggeredBy,
      sinceDays,
    },
  });

  logger.info('[Ingest] Job started', { runId: run.id, sinceDays, triggeredBy });

  const startMs = Date.now();
  let itemsIngested = 0;
  let itemsUpdated = 0;
  let itemsSkipped = 0;
  let errors = 0;
  const errorDetails: unknown[] = [];

  const pncp = getPncpClient();
  const os = getOpenSearchClient();

  try {
    // Busca todas as contratações nas últimas N páginas
    const contratacoes = await pncp.fetchAllPages(
      (page) =>
        pncp.fetchContratacoes({ sinceDays, page, pageSize: config.pncp.pageSize, uf: options.uf }),
      30, // máximo 30 páginas = 1500 contratações por ingestão
    );

    logger.info('[Ingest] Contratações fetched', { count: contratacoes.length, runId: run.id });

    for (const contratacao of contratacoes) {
      try {
        // Salvar payload bruto
        await prisma.rawPayload.create({
          data: {
            source: 'pncp',
            endpoint: 'contratacoes/publicacoes',
            payload: contratacao as unknown as Prisma.InputJsonValue,
            processedAt: new Date(),
            ingestRunId: run.id,
          },
        });

        // Upsert organização
        const orgCnpj = contratacao.orgaoEntidade?.cnpj?.replace(/[^0-9]/g, '') ?? '';
        const orgName = contratacao.orgaoEntidade?.razaoSocial ?? 'Desconhecido';
        const orgUf = contratacao.unidadeOrgao?.ufSigla ?? null;
        const orgCity = contratacao.unidadeOrgao?.municipioNome ?? null;

        let org = orgCnpj
          ? await prisma.organization.findFirst({ where: { cnpj: orgCnpj } })
          : null;

        if (!org) {
          org = await prisma.organization.create({
            data: {
              cnpj: orgCnpj || null,
              name: orgName,
              uf: orgUf,
              city: orgCity,
              sphere: detectSphere(orgName),
              pncpCode: contratacao.numeroControlePNCP ?? null,
            },
          });
        }

        // Upsert contrato
        const pncpId = contratacao.numeroControlePNCP;
        let dbContract = pncpId
          ? await prisma.contract.findFirst({ where: { pncpId } })
          : null;

        if (!dbContract) {
          dbContract = await prisma.contract.create({
            data: {
              pncpId: pncpId ?? null,
              processNumber: contratacao.numeroCompra ?? contratacao.processo ?? null,
              year: contratacao.anoCompra ?? new Date().getFullYear(),
              modality: contratacao.modalidadeNome ?? null,
              modalityCode: contratacao.modalidadeId ?? null,
              description: contratacao.objetoCompra ?? null,
              totalValue: contratacao.valorTotalHomologado ?? contratacao.valorTotalEstimado ?? null,
              publicationDate: contratacao.dataPublicacaoPncp
                ? new Date(contratacao.dataPublicacaoPncp)
                : null,
              uf: orgUf,
              city: orgCity,
              status: contratacao.situacaoCompraNome ?? null,
              organizationId: org.id,
            },
          });
        }

        // Buscar itens desta contratação
        let itens = contratacao.itens ?? [];
        if (itens.length === 0 && orgCnpj && contratacao.anoCompra && contratacao.sequencialCompra) {
          itens = await pncp.fetchItensContratacao(
            orgCnpj,
            contratacao.anoCompra,
            contratacao.sequencialCompra,
          ) ?? [];
        }

        // Processar cada item
        for (const item of itens) {
          try {
            const rawDesc = item.descricao ?? '';
            const normalizedDesc = normalizeText(rawDesc);
            const unit = normalizeUnit(item.unidadeMedida);
            const qty = item.quantidade ?? null;
            const unitPriceRaw = item.valorUnitarioEstimado ?? null;
            const totalPriceRaw = item.valorTotal ?? null;
            const calcUnitPrice = calculateUnitPrice(totalPriceRaw, qty);
            const finalUnitPrice = unitPriceRaw ?? calcUnitPrice;

            const validation = validateLineItem({
              description: rawDesc,
              quantity: qty,
              unitPrice: finalUnitPrice,
              totalPrice: totalPriceRaw,
            });

            const lineItem = await prisma.lineItem.create({
              data: {
                pncpId: `${pncpId}-${item.numeroItem}`,
                description: rawDesc,
                normalizedDescription: normalizedDesc,
                quantity: qty,
                unit,
                unitPrice: unitPriceRaw,
                totalPrice: totalPriceRaw,
                calculatedUnitPrice: calcUnitPrice,
                catmatCode: item.codigoCatalogo ?? null,
                contractDate: contratacao.dataPublicacaoPncp
                  ? new Date(contratacao.dataPublicacaoPncp)
                  : null,
                uf: orgUf,
                city: orgCity,
                isValid: validation.isValid,
                invalidReason: validation.reason ?? null,
                organizationId: org.id,
                contractId: dbContract.id,
              },
            });

            // Indexar no OpenSearch (apenas itens válidos)
            if (validation.isValid) {
              try {
                await os.index({
                  index: config.opensearch.indexLineItems,
                  id: lineItem.id,
                  body: {
                    id: lineItem.id,
                    description: rawDesc,
                    normalized_description: normalizedDesc,
                    unit,
                    unit_price: finalUnitPrice,
                    total_price: totalPriceRaw,
                    quantity: qty,
                    contract_date: contratacao.dataPublicacaoPncp ?? null,
                    uf: orgUf,
                    city: orgCity,
                    organization_name: orgName,
                    modality: contratacao.modalidadeNome ?? null,
                    catmat_code: item.codigoCatalogo ?? null,
                  },
                });
              } catch (osErr) {
                logger.warn('[Ingest] OpenSearch index error', { id: lineItem.id, error: (osErr as Error).message });
              }
            }

            itemsIngested++;
          } catch (itemErr) {
            errors++;
            errorDetails.push({ tipo: 'item', erro: (itemErr as Error).message });
          }
        }
      } catch (contErr) {
        errors++;
        errorDetails.push({ tipo: 'contratacao', erro: (contErr as Error).message });
      }
    }

    // Finalizar run
    const durationMs = Date.now() - startMs;
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        itemsIngested,
        itemsUpdated,
        itemsSkipped,
        errors,
        errorDetails: errorDetails.length > 0 ? (errorDetails as Prisma.InputJsonValue) : undefined,
      },
    });

    logger.info('[Ingest] Job completed', {
      runId: run.id,
      itemsIngested,
      errors,
      durationMs,
    });

    return { runId: run.id, itemsIngested, itemsUpdated, itemsSkipped, errors, durationMs };
  } catch (fatalErr) {
    const durationMs = Date.now() - startMs;
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        itemsIngested,
        errors: errors + 1,
        errorDetails: [{ fatal: (fatalErr as Error).message }] as Prisma.InputJsonValue,
      },
    });

    logger.error('[Ingest] Job failed', { runId: run.id, error: (fatalErr as Error).message });
    throw fatalErr;
  }
}

function detectSphere(orgName: string): string {
  const lower = orgName.toLowerCase();
  if (lower.includes('prefeitura') || lower.includes('câmara municipal') || lower.includes('camara municipal')) {
    return 'municipal';
  }
  if (lower.includes('governo do estado') || lower.includes('secretaria de estado')) {
    return 'estadual';
  }
  if (lower.includes('ministério') || lower.includes('ministerio') || lower.includes('federal')) {
    return 'federal';
  }
  return 'municipal';
}
