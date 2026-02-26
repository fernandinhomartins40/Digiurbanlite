// Tipos para a API do Portal da Transparência do Governo Federal
// Documentação: https://portaldatransparencia.gov.br/api-de-dados

export interface TransparenciaContrato {
  id: number;
  numero: string;
  objeto: string;
  valorInicial?: number;
  valorFinal?: number;
  dataAssinatura?: string;
  dataInicioVigencia?: string;
  dataFimVigencia?: string;
  situacao?: string;
  modalidade?: { id: number; descricao: string };
  fundamentoLegal?: string;

  unidadeGestora?: {
    codigo: string;
    nome: string;
    orgaoVinculado?: {
      codigoSIAFI?: string;
      nome?: string;
      sigla?: string;
      municipio?: { codigoIBGE?: string; nomeIBGE?: string; uf?: string };
    };
  };

  fornecedor?: {
    id?: number;
    tipo?: string;
    cpfFormatado?: string;
    cnpj?: string;
    nome?: string;
  };
}

export interface TransparenciaListResponse<T> {
  data?: T[];
}

export interface TransparenciaFetchOptions {
  dataInicio?: string;     // "dd/MM/yyyy"
  dataFim?: string;
  codigoOrgao?: string;
  cnpjFornecedor?: string;
  page?: number;
  size?: number;
}
