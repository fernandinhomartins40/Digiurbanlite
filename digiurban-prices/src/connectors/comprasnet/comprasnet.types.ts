// Tipos para a API de Dados Abertos do ComprasNet / SIASG
// Documentação: https://compras.dados.gov.br/docs/home.html

export interface ComprasnetLicitacao {
  id_licitacao: string;
  num_processo: string;
  num_licitacao?: string;
  cod_orgao: string;
  nome_orgao: string;
  cod_uasg?: string;
  nome_uasg?: string;
  modalidade_compra?: string;
  tipo_licitacao?: string;
  situacao?: string;
  objeto?: string;
  data_abertura?: string;
  data_publicacao?: string;
  valor_estimado?: number;
  valor_adjudicado?: number;
  uf?: string;
  municipio?: string;
}

export interface ComprasnetItem {
  id_item: string;
  id_licitacao: string;
  num_item?: number;
  descricao?: string;
  descricao_complementar?: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  codigo_catmat?: string;
  situacao?: string;
}

export interface ComprasnetLicitacaoComItens extends ComprasnetLicitacao {
  itens?: ComprasnetItem[];
}

export interface ComprasnetListResponse {
  _links?: { self?: string; next?: string };
  _embedded?: {
    licitacoes?: ComprasnetLicitacao[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface ComprasnetFetchOptions {
  dataAberturaMim?: string;   // "YYYY-MM-DD"
  dataAberturaMax?: string;
  uf?: string;
  page?: number;
  pageSize?: number;
}
