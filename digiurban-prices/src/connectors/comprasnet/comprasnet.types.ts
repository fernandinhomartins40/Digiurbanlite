// Tipos para a nova API de Contratos do SIASG / ComprasNet
// Nova API (v2, fev/2026): https://api.compras.dados.gov.br
// Documentação: https://api.compras.dados.gov.br/openapi.yaml

export interface ComprasnetContrato {
  id: string;
  numero?: string;
  objeto?: string;
  categoria?: string;
  modalidade?: string;
  tipo?: string;
  processo?: string;

  // Datas
  data_assinatura?: string;   // "YYYY-MM-DD"
  data_publicacao?: string;
  vigencia_inicio?: string;
  vigencia_fim?: string;

  // Valores
  valor_inicial?: number;
  valor_global?: number;

  // Órgão comprador
  orgao_codigo?: string;
  orgao_nome?: string;
  unidade_gestora_codigo?: string;
  unidade_gestora_nome?: string;
  uf?: string;
  municipio?: string;

  // Fornecedor
  fornecedor_cnpj_cpf_idgener?: string;
  fornecedor_nome?: string;
  fornecedor_tipo?: string;   // "PJ" | "PF" | "EX"

  // Fundamento legal / licitação
  licitacao_numero?: string;
  fundamento_legal?: string;
}

export interface ComprasnetContratoItem {
  id?: string;
  numero_item?: number;
  descricao?: string;
  descricao_complementar?: string;
  unidade_medida?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  codigo_catmat?: string;
}

export interface ComprasnetListResponse {
  data?: ComprasnetContrato[];
  total?: number;
  offset?: number;
}

export interface ComprasnetFetchOptions {
  dataAssinaturaMin?: string;   // "YYYY-MM-DD"
  dataAssinaturaMax?: string;
  orgaoNome?: string;
  fornecedorNome?: string;
  offset?: number;
  pageSize?: number;
}

// Tipos legados mantidos para compatibilidade (não usados na nova API)
export interface ComprasnetLicitacao {
  id_licitacao: string;
  num_processo: string;
  nome_orgao: string;
  cod_uasg?: string;
  nome_uasg?: string;
  modalidade_compra?: string;
  objeto?: string;
  data_abertura?: string;
  uf?: string;
  municipio?: string;
  cod_orgao: string;
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
