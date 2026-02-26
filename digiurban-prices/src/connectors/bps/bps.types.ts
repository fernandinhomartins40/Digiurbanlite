// Tipos para o Banco de Preços em Saúde (BPS) — Ministério da Saúde
// Dados: OpenDataSUS — https://opendatasus.saude.gov.br/dataset/bps

export interface BpsItem {
  COMPETENCIA?: string;         // "2024-01"
  CODIGO_ITEM?: string;
  DESCRICAO_ITEM?: string;
  TIPO_ITEM?: string;           // "Medicamento" | "Material"
  PRINCIPIO_ATIVO?: string;
  CONCENTRACAO?: string;
  FORMA_FARMACEUTICA?: string;
  APRESENTACAO?: string;
  UNIDADE_MEDIDA?: string;
  QUANTIDADE?: string;
  PRECO_UNITARIO?: string;
  PRECO_TOTAL?: string;
  MODALIDADE?: string;
  CNPJ_COMPRADOR?: string;
  NOME_COMPRADOR?: string;
  UF_COMPRADOR?: string;
  MUNICIPIO_COMPRADOR?: string;
  CNPJ_FORNECEDOR?: string;
  NOME_FORNECEDOR?: string;
}

export interface BpsDataset {
  id: string;
  name: string;
  url: string;
  year: number;
}
