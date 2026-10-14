/**
 * Compras.gov.br — API de dados abertos (https://dadosabertos.compras.gov.br,
 * documentação em /v3/api-docs). Fonte principal da pesquisa (art. 23, § 1º, I):
 *  - 03 Pesquisa de Preço: preços praticados por código CATMAT/CATSER
 *  - 08 ARP: itens de atas de registro de preços vigentes
 *  - 01/02 Catálogo: famílias (PDM), itens de material e serviços
 * A busca por texto do catálogo NÃO funciona na API (só por código): o texto é
 * procurado na cópia local (price_catalog), mantida por jobs/prices.job.ts.
 */

import { COMPRAS_BASE, DAY, HOUR, cached, getJson, isoDay, parseDate } from '../http';
import { quoteBase } from '../rules';
import type { RawQuote } from './types';

const PAGE = 500;

interface Paged<T> {
  resultado: T[];
  totalRegistros: number;
  totalPaginas: number;
}

/** "CNPJ-1-000012/2025-000001" → página da ata no PNCP */
function ataUrl(control: unknown): string | null {
  const match = String(control || '').match(/^(\d{14})-\d-(\d+)\/(\d{4})-(\d+)$/);
  return match ? `https://pncp.gov.br/app/atas/${match[1]}/${match[3]}/${Number(match[2])}/${Number(match[4])}` : null;
}

const esfera = (value: unknown) => (['F', 'E', 'M'].includes(String(value)) ? String(value) : null);

/** Último ano (a API não aceita mais que 365 dias de intervalo) */
function priceWindow() {
  const to = new Date();
  const from = new Date(to.getTime() - 364 * DAY);
  return { from: isoDay(from), to: isoDay(to) };
}

/** Preços praticados de um material (por código CATMAT) */
export async function materialPrices(code: number, maxPages = 2): Promise<RawQuote[]> {
  const { from, to } = priceWindow();
  const rows: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await cached<Paged<any>>(`compras:mat:${code}:${from}:${page}`, 12 * HOUR, () =>
      getJson(`${COMPRAS_BASE}/modulo-pesquisa-preco/1_consultarMaterial`, {
        pagina: page,
        tamanhoPagina: PAGE,
        tipo: 'codigoItemCatalogo',
        codigo: code,
        dataCompraInicio: from,
        dataCompraFim: to,
      })
    );
    rows.push(...(data?.resultado || []));
    if (!data || page >= (data.totalPaginas || 1)) break;
  }
  return rows.map((row) => {
    const unit = { unitPrice: Number(row.precoUnitario), unitLabel: row.siglaUnidadeFornecimento, capacity: Number(row.capacidadeUnidadeFornecimento) || null, measureUnit: row.siglaUnidadeMedida };
    return {
      source: 'COMPRAS' as const,
      sourceRef: String(row.idCompraItem || `${row.idCompra}-${row.numeroItemCompra}`),
      sourceUrl: `https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?tipo=codigoItemCatalogo&codigo=${code}&idCompra=${row.idCompra}`,
      description: String(row.descricaoItem || '').trim(),
      buyer: row.nomeUasg || row.nomeOrgao || null,
      buyerCity: row.municipio || null,
      buyerUf: row.estado || null,
      sphere: esfera(row.esfera),
      supplier: row.nomeFornecedor || null,
      supplierDoc: row.niFornecedor || null,
      brand: row.marca || null,
      date: parseDate(row.dataResultado || row.dataCompra),
      quantity: Number(row.quantidade) || null,
      ...unit,
      ...quoteBase(unit),
    };
  });
}

/** Preços praticados de um serviço (por código CATSER) */
export async function servicePrices(code: number, maxPages = 2): Promise<RawQuote[]> {
  const { from, to } = priceWindow();
  const rows: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await cached<Paged<any>>(`compras:serv:${code}:${from}:${page}`, 12 * HOUR, () =>
      getJson(`${COMPRAS_BASE}/modulo-pesquisa-preco/3_consultarServico`, {
        pagina: page,
        tamanhoPagina: PAGE,
        codigoItemCatalogo: code,
        dataCompraInicio: from,
        dataCompraFim: to,
      })
    );
    rows.push(...(data?.resultado || []));
    if (!data || page >= (data.totalPaginas || 1)) break;
  }
  return rows.map((row) => {
    const unit = { unitPrice: Number(row.precoUnitario), unitLabel: row.siglaUnidadeMedida || row.nomeUnidadeMedida, capacity: null, measureUnit: null };
    return {
      source: 'COMPRAS' as const,
      sourceRef: String(row.idItemCompra || `${row.idCompra}-${row.numeroItemCompra}`),
      sourceUrl: `https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/3_consultarServico?codigoItemCatalogo=${code}&idCompra=${row.idCompra}`,
      description: String(row.descricaoDetalhadaItem || row.descricaoItem || '').trim(),
      buyer: row.nomeUasg || row.nomeOrgao || null,
      buyerCity: row.municipio || null,
      buyerUf: row.estado || null,
      sphere: esfera(row.esfera),
      supplier: row.nomeFornecedor || null,
      supplierDoc: row.niFornecedor || null,
      brand: null,
      date: parseDate(row.dataResultado || row.dataCompra),
      quantity: Number(row.quantidade) || null,
      ...unit,
      ...quoteBase(unit),
    };
  });
}

/** Itens de atas de registro de preços com vigência iniciada nos últimos 12 meses */
export async function arpPrices(code: number): Promise<RawQuote[]> {
  const { from, to } = priceWindow();
  const data = await cached<Paged<any>>(`compras:arp:${code}:${from}`, 12 * HOUR, () =>
    getJson(`${COMPRAS_BASE}/modulo-arp/2_consultarARPItem`, {
      pagina: 1,
      tamanhoPagina: PAGE,
      codigoItem: code,
      dataVigenciaInicialMin: from,
      dataVigenciaInicialMax: to,
    })
  );
  return (data?.resultado || [])
    .filter((row: any) => !row.itemExcluido && Number(row.valorUnitario) > 0)
    .map((row: any) => ({
      source: 'ARP' as const,
      sourceRef: `${row.numeroControlePncpAta || row.numeroAtaRegistroPreco}-${row.numeroItem}`,
      sourceUrl: ataUrl(row.numeroControlePncpAta),
      description: String(row.descricaoItem || '').trim(),
      buyer: row.nomeUnidadeGerenciadora || null,
      buyerCity: null,
      buyerUf: null,
      sphere: null,
      supplier: row.nomeRazaoSocialFornecedor || null,
      supplierDoc: row.niFornecedor || null,
      brand: null,
      date: parseDate(row.dataAssinatura || row.dataVigenciaInicial),
      quantity: Number(row.quantidadeHomologadaVencedor) || null,
      unitPrice: Number(row.valorUnitario),
      unitLabel: null,
      capacity: null,
      measureUnit: null,
      baseUnit: null,
      basePrice: null,
    }));
}

// ─── catálogo ─────────────────────────────────────────────────────────────

export async function catalogPage(kind: 'PDM' | 'SERVICO', page: number): Promise<Paged<any>> {
  return kind === 'PDM'
    ? getJson(`${COMPRAS_BASE}/modulo-material/3_consultarPdmMaterial`, { pagina: page, tamanhoPagina: PAGE, statusPdm: true })
    : getJson(`${COMPRAS_BASE}/modulo-servico/6_consultarItemServico`, { pagina: page, tamanhoPagina: PAGE, statusServico: true });
}

/** Itens de material de uma família (PDM), guardados por uma semana */
export async function materialsOfPdm(pdm: number): Promise<Array<{ code: number; name: string; className: string | null }>> {
  const rows: any[] = [];
  for (let page = 1; page <= 4; page++) {
    const data = await cached<Paged<any>>(`compras:pdm-itens:${pdm}:${page}`, 7 * DAY, () =>
      getJson(`${COMPRAS_BASE}/modulo-material/4_consultarItemMaterial`, { pagina: page, tamanhoPagina: PAGE, codigoPdm: pdm, statusItem: true })
    );
    rows.push(...(data?.resultado || []));
    if (!data || page >= (data.totalPaginas || 1)) break;
  }
  return rows.map((row) => ({ code: Number(row.codigoItem), name: String(row.descricaoItem || '').trim(), className: row.nomeClasse || null }));
}

/** Um item de material pelo código (para conferir/descrever o que o servidor digitou) */
export async function materialByCode(code: number): Promise<{ code: number; name: string; pdmCode: number | null; className: string | null } | null> {
  const data = await cached<Paged<any>>(`compras:item:${code}`, 7 * DAY, () =>
    getJson(`${COMPRAS_BASE}/modulo-material/4_consultarItemMaterial`, { pagina: 1, tamanhoPagina: 10, codigoItem: code })
  );
  const row = data?.resultado?.[0];
  return row ? { code: Number(row.codigoItem), name: String(row.descricaoItem || '').trim(), pdmCode: Number(row.codigoPdm) || null, className: row.nomeClasse || null } : null;
}
