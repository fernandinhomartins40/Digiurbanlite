// Tipos para o Catálogo CATMAT / CATSER do ComprasGov
// API: https://dadosabertos.compras.gov.br/swagger-ui/index.html

export interface CatmatMaterial {
  codigo: string;
  descricao: string;
  grupoCodigo?: string;
  grupoDescricao?: string;
  classeCodigo?: string;
  classeDescricao?: string;
  pdmCodigo?: string;
  pdmDescricao?: string;
  statusCode?: string;   // "A" = ativo
  caracteristicas?: string;
}

export interface CatserServico {
  codigo: string;
  descricao: string;
  grupoCodigo?: string;
  grupoDescricao?: string;
  classeCodigo?: string;
  classeDescricao?: string;
  statusCode?: string;
}

export interface CatmatListResponse<T> {
  resultado?: T[];
  totalRegistros?: number;
  totalPaginas?: number;
  paginaAtual?: number;
}

export interface CatmatSearchOptions {
  q?: string;
  page?: number;
  pageSize?: number;
  type?: 'material' | 'service' | 'both';
}
