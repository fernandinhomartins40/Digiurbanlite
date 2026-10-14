/**
 * PNCP — contratações similares de municípios e estados (art. 23, § 1º, II).
 * A API de consulta do PNCP não filtra por item nem traz preço; então:
 *  1. a busca do próprio portal (/api/search) acha compras pelo texto, na UF;
 *  2. os itens de cada compra (/api/pncp/v1/orgaos/.../itens) são comparados
 *     com a descrição pedida (matchScore);
 *  3. o preço homologado vem de .../itens/{n}/resultados.
 * Cada preço leva a semelhança com a descrição (matchScore): parecido o
 * bastante entra no cálculo com etiqueta "Pela descrição"; em parte, fica a confirmar.
 * Limitado a poucas compras por item para não sobrecarregar a fonte.
 */

import { DAY, PNCP_BASE, cached, getJson, parseDate, pool } from '../http';
import { PNCP_MATCH_MIN, keywords, matchScore, quoteBase } from '../rules';
import type { RawQuote } from './types';

const MAX_PURCHASES = 25;
const MAX_ITEMS_PER_PURCHASE = 3;

interface SearchHit {
  orgao_cnpj: string;
  ano: string;
  numero_sequencial: string;
  orgao_nome?: string;
  unidade_nome?: string;
  municipio_nome?: string;
  uf?: string;
  esfera_id?: string;
  data_publicacao_pncp?: string;
  createdAt?: string;
  description?: string;
}

export async function searchPurchases(description: string, uf: string | null): Promise<SearchHit[]> {
  const q = keywords(description, 4).join(' ');
  if (!q) return [];
  const params: Record<string, unknown> = { tipos_documento: 'edital', ordenacao: '-data', pagina: 1, tam_pagina: 60, status: 'encerradas', q };
  if (uf) params.ufs = uf;
  const data = await cached<{ items?: SearchHit[] }>(`pncp:search:${uf || 'BR'}:${q}`, DAY, () => getJson(`${PNCP_BASE}/api/search/`, params));
  const limit = Date.now() - 366 * DAY;
  return (data?.items || []).filter((hit) => {
    const date = parseDate(hit.data_publicacao_pncp || hit.createdAt);
    return hit.orgao_cnpj && hit.ano && hit.numero_sequencial && (!date || date.getTime() >= limit);
  });
}

async function purchaseItems(hit: SearchHit): Promise<any[]> {
  const base = `${PNCP_BASE}/api/pncp/v1/orgaos/${hit.orgao_cnpj}/compras/${hit.ano}/${hit.numero_sequencial}/itens`;
  return cached(`pncp:itens:${hit.orgao_cnpj}:${hit.ano}:${hit.numero_sequencial}`, 7 * DAY, async () => {
    const rows: any[] = [];
    for (let page = 1; page <= 3; page++) {
      const data = await getJson<any[]>(base, { pagina: page, tamanhoPagina: 100 });
      const list = Array.isArray(data) ? data : [];
      rows.push(...list.map((row) => ({
        numeroItem: row.numeroItem,
        descricao: row.descricao,
        materialOuServico: row.materialOuServico,
        unidadeMedida: row.unidadeMedida,
        temResultado: !!row.temResultado,
      })));
      if (list.length < 100) break;
    }
    return rows;
  });
}

async function itemResults(hit: SearchHit, numeroItem: number): Promise<any[]> {
  const url = `${PNCP_BASE}/api/pncp/v1/orgaos/${hit.orgao_cnpj}/compras/${hit.ano}/${hit.numero_sequencial}/itens/${numeroItem}/resultados`;
  return cached(`pncp:res:${hit.orgao_cnpj}:${hit.ano}:${hit.numero_sequencial}:${numeroItem}`, 30 * DAY, async () => {
    const data = await getJson<any[]>(url);
    return (Array.isArray(data) ? data : []).map((row) => ({
      valorUnitarioHomologado: row.valorUnitarioHomologado,
      quantidadeHomologada: row.quantidadeHomologada,
      nomeRazaoSocialFornecedor: row.nomeRazaoSocialFornecedor,
      niFornecedor: row.niFornecedor,
      dataResultado: row.dataResultado || row.dataInclusao,
      situacao: row.situacaoCompraItemResultadoNome,
    }));
  });
}

/** Preços homologados de compras parecidas no PNCP (na UF, ou no Brasil todo) */
export async function pncpPrices(description: string, kind: 'MATERIAL' | 'SERVICO', uf: string | null): Promise<RawQuote[]> {
  const hits = (await searchPurchases(description, uf)).slice(0, MAX_PURCHASES);
  const wanted = kind === 'SERVICO' ? 'S' : 'M';
  const perPurchase = await pool(hits, 5, async (hit) => {
    try {
      const items = (await purchaseItems(hit))
        .filter((item) => item.temResultado && (!item.materialOuServico || item.materialOuServico === wanted))
        .map((item) => ({ item, score: matchScore(description, item.descricao || '') }))
        .filter((entry) => entry.score >= PNCP_MATCH_MIN)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_ITEMS_PER_PURCHASE);
      const quotes: RawQuote[] = [];
      for (const { item, score } of items) {
        const results = await itemResults(hit, Number(item.numeroItem)).catch(() => []);
        for (const result of results) {
          const price = Number(result.valorUnitarioHomologado);
          if (!(price > 0) || /cancel/i.test(String(result.situacao || ''))) continue;
          const unit = { unitPrice: price, unitLabel: item.unidadeMedida || null, capacity: null, measureUnit: null };
          quotes.push({
            source: 'PNCP',
            sourceRef: `${hit.orgao_cnpj}-${hit.ano}-${hit.numero_sequencial}-${item.numeroItem}`,
            sourceUrl: `https://pncp.gov.br/app/editais/${hit.orgao_cnpj}/${hit.ano}/${hit.numero_sequencial}`,
            description: String(item.descricao || '').trim(),
            buyer: hit.orgao_nome || hit.unidade_nome || null,
            buyerCity: hit.municipio_nome || null,
            buyerUf: hit.uf || null,
            sphere: ['F', 'E', 'M'].includes(String(hit.esfera_id)) ? String(hit.esfera_id) : null,
            supplier: result.nomeRazaoSocialFornecedor || null,
            supplierDoc: result.niFornecedor || null,
            brand: null,
            date: parseDate(result.dataResultado) || parseDate(hit.data_publicacao_pncp || hit.createdAt),
            quantity: Number(result.quantidadeHomologada) || null,
            ...unit,
            ...quoteBase(unit),
            matchScore: score,
          });
        }
      }
      return quotes;
    } catch {
      return [];
    }
  });
  return perPurchase.flat();
}
