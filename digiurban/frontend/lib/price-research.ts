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
  autoFlag: 'UNIDADE_DIFERENTE' | 'ANTIGO' | 'FORA_DA_FAIXA' | 'CONFIRMAR' | null
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
