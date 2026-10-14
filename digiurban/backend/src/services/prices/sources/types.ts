import type { QuoteSource } from '../rules';

/** Preço como chega de qualquer fonte, antes das marcas automáticas */
export interface RawQuote {
  source: QuoteSource;
  sourceRef: string | null;
  sourceUrl: string | null;
  description: string;
  buyer: string | null;
  buyerCity: string | null;
  buyerUf: string | null;
  sphere: string | null;
  supplier: string | null;
  supplierDoc: string | null;
  brand: string | null;
  date: Date | null;
  quantity: number | null;
  unitPrice: number;
  unitLabel: string | null;
  capacity: number | null;
  measureUnit: string | null;
  baseUnit: string | null;
  basePrice: number | null;
  /** semelhança com a descrição pedida, quando achado pelo texto (PNCP, família sem código) */
  matchScore?: number | null;
}
