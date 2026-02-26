// Tipos para os dados abertos do FNDE (Fundo Nacional de Desenvolvimento da Educação)
// Portal: https://www.fnde.gov.br/dadosabertos

export interface FndeContrato {
  id?: string | number;
  numero?: string;
  objeto?: string;
  valor?: number;
  valorTotal?: number;
  valorUnitario?: number;
  quantidade?: number;
  unidadeMedida?: string;
  dataAssinatura?: string;
  dataPublicacao?: string;
  programa?: string;       // "PNAE", "PNATE", "PDDE", etc.
  modalidade?: string;
  situacao?: string;

  // Comprador / Entidade
  cnpjEntidade?: string;
  nomeEntidade?: string;
  uf?: string;
  municipio?: string;

  // Fornecedor
  cnpjFornecedor?: string;
  nomeFornecedor?: string;

  // Item
  descricaoItem?: string;
  codigoCatmat?: string;
}

export interface FndeApiResponse<T> {
  data?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface FndeFetchOptions {
  programa?: string;   // "PNAE" | "PNATE" | "PDDE"
  uf?: string;
  anoInicio?: number;
  anoFim?: number;
  page?: number;
  pageSize?: number;
}
