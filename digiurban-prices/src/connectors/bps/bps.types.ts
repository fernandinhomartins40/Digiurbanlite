// Tipos para o Banco de Preços em Saúde (BPS) — Ministério da Saúde
// Dados: https://dadosabertos.saude.gov.br/dataset/bps
// Colunas reais do CSV (verificado em fev/2026):
// "ano_compra";"nome_instituicao";"cnpj_instituicao";"municipio_instituicao";"uf";
// "compra";"insercao";"codigo_br";"descricao_catmat";"unidade_fornecimento";
// "generico";"anvisa";"modalidade_compra";"tipo_compra";"capacidade";
// "unidade_medida";"unidade_fornecimento_capacidade";"cnpj_fornecedor";"fornecedor";
// "cnpj_fabricante";"fabricante";"qtd_itens_comprados";"preco_unitario";"preco_total"

export interface BpsItem {
  ANO_COMPRA?: string;                    // "2024"
  NOME_INSTITUICAO?: string;              // nome do comprador
  CNPJ_INSTITUICAO?: string;             // CNPJ do comprador
  MUNICIPIO_INSTITUICAO?: string;
  UF?: string;
  COMPRA?: string;                        // data da compra "YYYY-MM-DD HH:mm:ss.mmm"
  INSERCAO?: string;                      // data de inserção
  CODIGO_BR?: string;                     // código CATMAT/BPS
  DESCRICAO_CATMAT?: string;              // descrição do item
  UNIDADE_FORNECIMENTO?: string;
  GENERICO?: string;
  ANVISA?: string;
  MODALIDADE_COMPRA?: string;
  TIPO_COMPRA?: string;
  CAPACIDADE?: string;
  UNIDADE_MEDIDA?: string;
  UNIDADE_FORNECIMENTO_CAPACIDADE?: string;
  CNPJ_FORNECEDOR?: string;
  FORNECEDOR?: string;                    // nome do fornecedor
  CNPJ_FABRICANTE?: string;
  FABRICANTE?: string;
  QTD_ITENS_COMPRADOS?: string;          // quantidade
  PRECO_UNITARIO?: string;               // preço unitário (usa "." como decimal)
  PRECO_TOTAL?: string;                  // preço total
}

export interface BpsDataset {
  id: string;
  name: string;
  url: string;
  year: number;
}
