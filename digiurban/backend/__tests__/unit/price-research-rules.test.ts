/**
 * Pesquisa de preços (IN 65/2021) — regras puras: unidade de comparação,
 * marcas automáticas, cálculo, IPCA, comparação de textos, documento, BPS.
 */

import * as zlib from 'zlib';
import {
  buildDocumentTexts,
  dominantBaseUnit,
  dominantCapacity,
  flagQuotes,
  ipcaFactor,
  keywords,
  matchScore,
  normalizeUnit,
  quoteBase,
  stats,
  summarizeItem,
} from '../../src/services/prices/rules';
import { bpsRowsFromCsv, parseCsv, unzipFirst } from '../../src/services/prices/sources/bps';
import { DOCUMENT_TEMPLATES, fillTemplate } from '../../src/services/internal-process/flows/templates';

const NOW = new Date('2026-10-14T12:00:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe('unidades', () => {
  it('padroniza nomes de unidade', () => {
    expect(normalizeUnit('Unidade')).toBe('UN');
    expect(normalizeUnit('und.')).toBe('UN');
    expect(normalizeUnit('Pacote')).toBe('PCT');
    expect(normalizeUnit('folhas')).toBe('FL');
    expect(normalizeUnit('')).toBe('');
  });

  it('compara embalagens pelo conteúdo: EMB com 500 FL a R$ 25 = R$ 0,05 por folha', () => {
    expect(quoteBase({ unitPrice: 25, unitLabel: 'EMB', capacity: 500, measureUnit: 'FL' })).toEqual({ baseUnit: 'FL', basePrice: 0.05 });
  });

  it('converte grama para quilo e resma para folhas', () => {
    expect(quoteBase({ unitPrice: 2, unitLabel: 'PCT', capacity: 500, measureUnit: 'G' })).toEqual({ baseUnit: 'KG', basePrice: 4 });
    expect(quoteBase({ unitPrice: 30, unitLabel: 'RESMA' })).toEqual({ baseUnit: 'FL', basePrice: 0.06 });
  });

  it('embalagem sem conteúdo informado fica com unidade desconhecida', () => {
    expect(quoteBase({ unitPrice: 30, unitLabel: 'CX' })).toEqual({ baseUnit: null, basePrice: null });
    expect(quoteBase({ unitPrice: 3, unitLabel: 'UN' })).toEqual({ baseUnit: 'UN', basePrice: 3 });
  });

  it('sugere a unidade e a embalagem mais comuns', () => {
    const quotes = [
      { baseUnit: 'FL', capacity: 500, measureUnit: 'FL' },
      { baseUnit: 'FL', capacity: 500, measureUnit: 'FL' },
      { baseUnit: 'FL', capacity: 100, measureUnit: 'FL' },
      { baseUnit: 'UN', capacity: null, measureUnit: null },
    ];
    expect(dominantBaseUnit(quotes)).toBe('FL');
    expect(dominantCapacity(quotes, 'FL')).toBe(500);
  });
});

describe('marcas automáticas', () => {
  const quote = (basePrice: number, extra: Record<string, unknown> = {}) => ({ source: 'COMPRAS' as const, date: daysAgo(30), baseUnit: 'FL', basePrice, ...extra });

  it('tira do cálculo unidade diferente, preço antigo e o que precisa de confirmação', () => {
    const [unit, old, pncp, arp, ok] = flagQuotes(
      [
        quote(1, { baseUnit: 'UN' }),
        quote(0.05, { date: daysAgo(400) }),
        quote(0.05, { source: 'PNCP' }),
        quote(0.05, { source: 'ARP', baseUnit: null }),
        quote(0.05),
      ],
      'FL',
      NOW
    );
    expect(unit).toMatchObject({ autoFlag: 'UNIDADE_DIFERENTE', included: false });
    expect(old).toMatchObject({ autoFlag: 'ANTIGO', included: false });
    expect(pncp).toMatchObject({ autoFlag: 'CONFIRMAR', included: false });
    expect(arp).toMatchObject({ autoFlag: 'CONFIRMAR', included: false });
    expect(ok).toMatchObject({ autoFlag: null, included: true, excludedReason: null });
  });

  it('achado pelo texto: parecido o bastante entra no cálculo com etiqueta; parecido em parte fica a confirmar', () => {
    const [strong, weak, byCode] = flagQuotes(
      [quote(0.05, { source: 'PNCP', matchScore: 1 }), quote(0.05, { source: 'PNCP', matchScore: 0.6 }), quote(0.05, { matchScore: null })],
      'FL',
      NOW
    );
    expect(strong).toMatchObject({ autoFlag: 'TEXTO', included: true, excludedReason: null });
    expect(weak).toMatchObject({ autoFlag: 'CONFIRMAR', included: false });
    expect(byCode).toMatchObject({ autoFlag: null, included: true });
  });

  it('o achado pelo texto também passa pela faixa (IQR)', () => {
    const flagged = flagQuotes([0.05, 0.051, 0.049, 0.052, 0.5].map((price) => quote(price, { source: 'PNCP', matchScore: 1 })), 'FL', NOW);
    expect(flagged[4]).toMatchObject({ autoFlag: 'FORA_DA_FAIXA', included: false });
    expect(flagged.slice(0, 4).every((item) => item.included && item.autoFlag === 'TEXTO')).toBe(true);
  });

  it('marca preço muito fora da faixa dos demais (IQR) com o motivo', () => {
    const flagged = flagQuotes([quote(0.05), quote(0.051), quote(0.049), quote(0.052), quote(0.048), quote(0.5)], 'FL', NOW);
    expect(flagged[5]).toMatchObject({ autoFlag: 'FORA_DA_FAIXA', included: false });
    expect(flagged[5].excludedReason).toMatch(/inexequível ou excessivo/);
    expect(flagged.slice(0, 5).every((item) => item.included)).toBe(true);
  });

  it('cotação de fornecedor de mais de 6 meses só avisa: anexo do servidor não sai sozinho', () => {
    const [manual] = flagQuotes([{ source: 'FORNECEDOR' as const, date: daysAgo(200), baseUnit: 'FL', basePrice: 0.05, manual: true }], 'FL', NOW);
    expect(manual).toMatchObject({ autoFlag: 'ANTIGO', included: true });
  });
});

describe('cálculo do item', () => {
  const q = (basePrice: number, extra: Record<string, unknown> = {}) => ({ source: 'COMPRAS' as const, unitPrice: basePrice * 500, date: daysAgo(30), baseUnit: 'FL', basePrice, included: true, ...extra });
  const item = { baseUnit: 'FL', unitCapacity: 500, quantity: 10 };

  it('mediana por folha × folhas por pacote × quantidade', () => {
    const summary = summarizeItem(item, [q(0.04), q(0.05), q(0.06)], 'MEDIANA', [], NOW);
    expect(summary.basePrice).toBeCloseTo(0.05);
    expect(summary.unitPrice).toBe(25);
    expect(summary.total).toBe(250);
    expect(summary.warnings).toEqual([]);
  });

  it('média e menor preço', () => {
    expect(summarizeItem(item, [q(0.04), q(0.05), q(0.09)], 'MEDIA', [], NOW).unitPrice).toBe(30);
    expect(summarizeItem(item, [q(0.04), q(0.05), q(0.09)], 'MENOR', [], NOW).unitPrice).toBe(20);
  });

  it('pede justificativa com menos de 3 preços ou só fornecedores', () => {
    expect(summarizeItem(item, [q(0.05), q(0.06)], 'MEDIANA', [], NOW).warnings.join(' ')).toMatch(/pelo menos 3/);
    const onlySuppliers = summarizeItem(item, [q(0.05, { source: 'FORNECEDOR' }), q(0.05, { source: 'FORNECEDOR' }), q(0.05, { source: 'FORNECEDOR' })], 'MEDIANA', [], NOW);
    expect(onlySuppliers.warnings.join(' ')).toMatch(/Só cotações de fornecedores/);
    expect(summarizeItem({ ...item, justification: 'Item exclusivo.' }, [q(0.05)], 'MEDIANA', [], NOW).warnings).toEqual([]);
  });

  it('preço confirmado sem unidade conhecida conta como preço por unidade comprada', () => {
    const summary = summarizeItem(item, [q(0.05), q(0.05), { source: 'ARP' as const, unitPrice: 25, date: daysAgo(10), baseUnit: null, basePrice: null, included: true }], 'MEDIANA', [], NOW);
    expect(summary.count).toBe(3);
    expect(summary.unitPrice).toBe(25);
  });

  it('corrige pelo IPCA dos meses seguintes ao da compra', () => {
    const rates = [{ month: '2026-08', rate: 1 }, { month: '2026-09', rate: 1 }];
    expect(ipcaFactor(rates, new Date('2026-07-15T12:00:00Z'))).toBeCloseTo(1.0201);
    expect(ipcaFactor(rates, new Date('2026-09-02T12:00:00Z'))).toBe(1);
    const summary = summarizeItem({ baseUnit: 'UN', unitCapacity: 1, quantity: 1 }, [{ source: 'COMPRAS', unitPrice: 100, date: new Date('2026-07-15T12:00:00Z'), baseUnit: 'UN', basePrice: 100, included: true }], 'MEDIANA', rates, NOW);
    expect(summary.unitPrice).toBe(102.01);
  });

  it('estatística básica', () => {
    expect(stats([3, 1, 2])).toMatchObject({ count: 3, min: 1, max: 3, median: 2, mean: 2 });
    expect(stats([])).toBeNull();
  });
});

describe('comparação de textos (PNCP)', () => {
  it('tira enchimento e mantém números', () => {
    expect(keywords('Papel sulfite tipo A4, 75g, cor branca')).toEqual(['papel', 'sulfite', 'a4', '75g', 'branca']);
  });

  it('reconhece o mesmo item com outras palavras em volta', () => {
    expect(matchScore('Papel sulfite A4 75g', 'PAPEL SULFITE A4 75G/M² BRANCO, PACOTE COM 500 FOLHAS')).toBeGreaterThanOrEqual(0.75);
    expect(matchScore('Papel sulfite A4 75g', 'Adesivos personalizados 20x20cm')).toBe(0);
  });

  it('entende como o catálogo escreve: "A4" = 297 X 210 MM e "75g" = 75 G/M2', () => {
    const catmat = 'PAPEL PARA IMPRESSÃO FORMATADO, TIPO: SULFITE/APERGAMINHADO/OFÍCIO, TAMANHO (C X L): 297 X 210 MM, GRAMATURA: 75 G/M2, COR: BRANCO';
    expect(matchScore('Papel sulfite A4 75g', catmat)).toBe(1);
  });

  it('palavra conta pelo começo, nunca pelo meio', () => {
    expect(matchScore('caneta azul', 'CANETAS ESFEROGRÁFICAS AZUIS')).toBe(0.5);
    expect(matchScore('intel i5', 'CARTUCHO CANETA TINTEIRO')).toBe(0);
    expect(matchScore('intel i5', 'Notebook com processador Intel Core i5 de 12ª geração')).toBe(1);
  });
});

describe('documento', () => {
  const texts = buildDocumentTexts({
    method: 'MEDIANA',
    applyIpca: true,
    generatedAt: NOW,
    items: [
      {
        position: 1,
        description: 'Papel A4',
        unit: 'PCT',
        quantity: 10,
        baseUnit: 'FL',
        unitCapacity: 500,
        justification: null,
        summary: summarizeItem({ baseUnit: 'FL', unitCapacity: 500, quantity: 10 }, [
          { source: 'COMPRAS', unitPrice: 25, date: daysAgo(10), baseUnit: 'FL', basePrice: 0.05, included: true },
          { source: 'ARP', unitPrice: 24, date: daysAgo(10), baseUnit: null, basePrice: null, included: true },
          { source: 'FORNECEDOR', unitPrice: 26, date: daysAgo(10), baseUnit: 'FL', basePrice: 0.052, included: true },
        ], 'MEDIANA', [], NOW),
        quotes: [
          { source: 'COMPRAS', buyer: 'TRE/SE', buyerCity: 'ARACAJU', buyerUf: 'SE', supplier: null, date: daysAgo(10), unitPrice: 25, basePrice: 0.05, included: true, excludedReason: null, sourceUrl: null, accessedAt: NOW },
          { source: 'ARP', buyer: 'Pref. X', buyerCity: null, buyerUf: null, supplier: null, date: daysAgo(10), unitPrice: 24, basePrice: null, included: true, excludedReason: null, sourceUrl: null, accessedAt: NOW },
          { source: 'FORNECEDOR', buyer: null, buyerCity: null, buyerUf: null, supplier: 'Loja Y', date: daysAgo(10), unitPrice: 26, basePrice: 0.052, included: true, excludedReason: null, sourceUrl: null, accessedAt: NOW },
          { source: 'PNCP', buyer: 'Município Z', buyerCity: 'Z', buyerUf: 'PR', supplier: null, date: daysAgo(10), unitPrice: 90, basePrice: null, included: false, excludedReason: 'Outro item', sourceUrl: null, accessedAt: NOW },
        ],
      },
    ],
  });

  it('marca os incisos usados, lista os descartes e soma o total', () => {
    expect(texts.parametros).toContain('(X) I —');
    expect(texts.parametros).toContain('(X) II —');
    expect(texts.parametros).toContain('(X) IV —');
    expect(texts.parametros).toContain('( ) V —');
    expect(texts.mapa).toContain('Preço adotado: R$ 25,00 por PCT');
    expect(texts.tratamento).toContain('Outro item');
    expect(texts.tratamento).toContain('mediana');
    expect(texts.total).toBe(250);
  });

  it('o modelo do processo usa os textos da pesquisa e, sem pesquisa, o formulário em branco', () => {
    const ctx = { municipio: 'Pref', cidade: 'X', unidade: 'Compras', numero: 'LIC-2026-00001', objeto: 'Papel', responsavel: 'Ana', cargo: '', flowKey: 'LICITACAO', fields: {} };
    const blank = fillTemplate(DOCUMENT_TEMPLATES.PESQUISA_PRECOS, ctx);
    expect(blank).toContain('( ) I — Painel de Preços');
    expect(blank).not.toContain('{{');
    const filled = fillTemplate(DOCUMENT_TEMPLATES.PESQUISA_PRECOS, { ...ctx, extra: { ...texts, valor: 'R$ 250,00', total: '' } as any });
    expect(filled).toContain('Preço adotado: R$ 25,00');
    expect(filled).toContain('R$ 250,00');
  });
});

describe('Banco de Preços em Saúde', () => {
  it('lê CSV com ";" e aspas (inclusive ";" e quebra de linha dentro)', () => {
    expect(parseCsv('a;"b;c";"d\ne"\n1;2;3')).toEqual([['a', 'b;c', 'd\ne'], ['1', '2', '3']]);
  });

  it('converte as linhas do arquivo e ignora preço vazio', () => {
    const csv = [
      'ano_compra;"sg_uf";"ds_esfera";dt_compra;"co_catmat";"ds_item";"co_pdm";"no_fornecedor";"no_instituicao";"no_municipio";"un_fornecimento";"sg_unidade_medida";qt_medicamento;"modalidade";vl_capacidade;vl_preco_unitario;co_seq_bps',
      '"2026";"SP";"ESTADUAL";"09/01/2026";"446467";"PALIVIZUMABE 100 MG/ML";"18814";"ASTRAZENECA";"SES";"SAO PAULO";"FRASCO";"ML";"723";"Pregão";"100.0";"5029.73";"26141913"',
      '"2026";"SP";"MUNICIPAL";"09/01/2026";"1";"X";"";"";"";"";"UN";"";"";"";"";"";"2"',
    ].join('\r\n');
    const rows = bpsRowsFromCsv(csv, 2026);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: '26141913', catmat: 446467, uf: 'SP', sphere: 'E', unitPrice: 5029.73, supplyUnit: 'FRASCO', purchaseDate: new Date('2026-01-09T12:00:00Z') });
  });

  it('abre o .zip do Ministério sem biblioteca', () => {
    const content = Buffer.from('ola;mundo\n1;2', 'utf8');
    const deflated = zlib.deflateRawSync(content);
    const name = Buffer.from('2026.csv');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(deflated.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(0, 42);
    const centralOffset = local.length + name.length + deflated.length;
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(1, 10);
    end.writeUInt32LE(central.length + name.length, 12);
    end.writeUInt32LE(centralOffset, 16);
    const zip = Buffer.concat([local, name, deflated, central, name, end]);
    expect(unzipFirst(zip).toString('utf8')).toBe('ola;mundo\n1;2');
  });
});
