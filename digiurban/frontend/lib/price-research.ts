/** Pesquisa de preços (IN 65/2021): tipos e textos das telas. Backend: /api/prices */

export type QuoteSource = 'COMPRAS' | 'ARP' | 'PNCP' | 'BPS' | 'FORNECEDOR' | 'NOTA_FISCAL' | 'OUTRO'
export type PriceMethod = 'MEDIANA' | 'MEDIA' | 'MENOR'

export interface PriceQuote {
  id: string
  source: QuoteSource
  sourceUrl: string | null
  description: string
  buyer: string | null
  buyerCity: string | null
  buyerUf: string | null
  sphere: string | null
  supplier: string | null
  supplierDoc: string | null
  brand: string | null
  date: string | null
  quantity: number | null
  unitLabel: string | null
  capacity: number | null
  measureUnit: string | null
  unitPrice: number
  baseUnit: string | null
  basePrice: number | null
  included: boolean
  excludedReason: string | null
  autoFlag: 'UNIDADE_DIFERENTE' | 'ANTIGO' | 'FORA_DA_FAIXA' | 'CONFIRMAR' | 'TEXTO' | null
  manual: boolean
  decidedByName: string | null
  hasAttachment: boolean
  attachmentName: string | null
  accessedAt: string
}

export interface ItemSummary {
  baseUnit: string | null
  count: number
  stats: { count: number; min: number; max: number; mean: number; median: number; cv: number } | null
  basePrice: number | null
  unitPrice: number | null
  total: number | null
  sources: QuoteSource[]
  warnings: string[]
}

export interface PriceItem {
  id: string
  position: number
  description: string
  kind: 'MATERIAL' | 'SERVICO'
  catalogCode: number | null
  catalogName: string | null
  unit: string
  baseUnit: string | null
  unitCapacity: number
  quantity: number
  justification: string | null
  searchStatus: 'NOVO' | 'BUSCANDO' | 'PRONTO' | 'ERRO'
  searchMessage: string | null
  searchedAt: string | null
  summary: ItemSummary
  quotes: PriceQuote[]
}

export interface PriceResearch {
  id: string
  title: string
  processId: string | null
  process: { id: string; number: string; subject: string } | null
  status: 'RASCUNHO' | 'CONCLUIDA'
  method: PriceMethod
  applyIpca: boolean
  ipcaAvailable: boolean
  uf: string | null
  nationwide: boolean
  notes: string | null
  documentId: string | null
  createdByName: string
  updatedAt: string
  items: PriceItem[]
  total: number
}

export interface CatalogHit {
  kind: 'PDM' | 'MATERIAL' | 'SERVICO'
  code: number
  name: string
  className: string | null
  pdmCode: number | null
}

export const SOURCE_LABEL: Record<QuoteSource, string> = {
  COMPRAS: 'Compras.gov.br',
  ARP: 'Ata de registro de preços',
  PNCP: 'PNCP',
  BPS: 'Banco de Preços em Saúde',
  FORNECEDOR: 'Cotação de fornecedor',
  NOTA_FISCAL: 'Nota fiscal',
  OUTRO: 'Site / tabela / mídia',
}

export const FLAG_LABEL: Record<NonNullable<PriceQuote['autoFlag']>, { label: string; className: string }> = {
  UNIDADE_DIFERENTE: { label: 'Unidade diferente', className: 'bg-gray-100 text-gray-700' },
  ANTIGO: { label: 'Antigo', className: 'bg-amber-100 text-amber-800' },
  FORA_DA_FAIXA: { label: 'Fora da faixa', className: 'bg-red-100 text-red-700' },
  CONFIRMAR: { label: 'Confirmar', className: 'bg-blue-100 text-blue-800' },
  TEXTO: { label: 'Pela descrição', className: 'bg-sky-50 text-sky-800' },
}

export const METHOD_LABEL: Record<PriceMethod, string> = { MEDIANA: 'Mediana', MEDIA: 'Média', MENOR: 'Menor preço' }

export const SPHERE_LABEL: Record<string, string> = { F: 'Federal', E: 'Estadual', M: 'Municipal' }

export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']

export function brl(value: number | null | undefined, small = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: small && value < 1 ? 4 : 2 })
}

export function dateBr(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'
}

export interface ShoppingList {
  id: string
  title: string
  status: 'RASCUNHO' | 'CONCLUIDA'
  processId: string | null
  createdByName: string
  updatedAt: string
  itemCount: number
  total: number
}

export interface RecentSearch {
  id: string
  description: string
  searchStatus: PriceItem['searchStatus']
  createdAt: string
}

/** Nomes das unidades em português ("PCT" → "pacote") */
const UNIT_NAME: Record<string, [string, string]> = {
  UN: ['unidade', 'unidades'], PCT: ['pacote', 'pacotes'], CX: ['caixa', 'caixas'], EMB: ['embalagem', 'embalagens'],
  FL: ['folha', 'folhas'], RESMA: ['resma', 'resmas'], KG: ['kg', 'kg'], G: ['g', 'g'], L: ['litro', 'litros'], ML: ['ml', 'ml'],
  M: ['metro', 'metros'], M2: ['m²', 'm²'], M3: ['m³', 'm³'], FR: ['frasco', 'frascos'], GL: ['galão', 'galões'], AMP: ['ampola', 'ampolas'],
  COMP: ['comprimido', 'comprimidos'], CAPS: ['cápsula', 'cápsulas'], ROLO: ['rolo', 'rolos'], TB: ['tubo', 'tubos'], CJ: ['conjunto', 'conjuntos'],
  KIT: ['kit', 'kits'], PAR: ['par', 'pares'], DZ: ['dúzia', 'dúzias'], SC: ['saco', 'sacos'], BD: ['balde', 'baldes'], H: ['hora', 'horas'],
  DIA: ['dia', 'dias'], MES: ['mês', 'meses'], SV: ['serviço', 'serviços'], KM: ['km', 'km'],
}

export function unitName(unit: string | null | undefined, plural = false): string {
  if (!unit) return plural ? 'unidades' : 'unidade'
  const known = UNIT_NAME[unit.toUpperCase()]
  return known ? known[plural ? 1 : 0] : unit.toLowerCase()
}

/** "pacote com 500 folhas", "unidade", "caixa com 12 unidades" */
export function unitPhrase(item: Pick<PriceItem, 'unit' | 'baseUnit' | 'unitCapacity'>): string {
  const main = unitName(item.unit)
  if (!item.baseUnit || item.unitCapacity === 1 || item.baseUnit === item.unit) return main
  return `${main} com ${item.unitCapacity.toLocaleString('pt-BR')} ${unitName(item.baseUnit, item.unitCapacity !== 1)}`
}

/** Preço do anúncio levado para a unidade que a prefeitura vai comprar (para comparar maçã com maçã) */
export function priceForItem(quote: PriceQuote, item: Pick<PriceItem, 'baseUnit' | 'unitCapacity'>): number {
  if (quote.baseUnit && item.baseUnit && quote.baseUnit === item.baseUnit && quote.basePrice !== null) return quote.basePrice * (item.unitCapacity || 1)
  return quote.unitPrice
}

/** Em que grupo o preço aparece na tela */
export function quoteGroup(quote: PriceQuote): 'used' | 'check' | 'discarded' {
  if (quote.included) return 'used'
  if (quote.autoFlag === 'CONFIRMAR' && !quote.decidedByName) return 'check'
  return 'discarded'
}

/** Motivo em linguagem simples para preço que não está sendo usado */
export function discardReason(quote: PriceQuote): string {
  if (quote.excludedReason && quote.decidedByName) return quote.excludedReason
  switch (quote.autoFlag) {
    case 'UNIDADE_DIFERENTE': return 'Vendido em outra unidade ou embalagem'
    case 'ANTIGO': return 'Compra antiga demais para a lei'
    case 'FORA_DA_FAIXA': return 'Muito acima ou muito abaixo dos outros preços'
    default: return quote.excludedReason || 'Não usado'
  }
}
