// Tipos baseados na API pública do PNCP
// Documentação: https://pncp.gov.br/api/consulta/swagger-ui/index.html

export interface PncpContratacao {
  numeroControlePNCP: string;
  orgaoEntidade: {
    cnpj: string;
    razaoSocial: string;
    poderId?: string;
    esferaId?: string;
  };
  unidadeOrgao: {
    codigoUnidade: string;
    nomeUnidade: string;
    municipioNome?: string;
    ufSigla?: string;
    ufNome?: string;
  };
  anoCompra?: number;
  sequencialCompra?: number;
  numeroCompra?: string;
  processo?: string;
  modalidadeId?: number;
  modalidadeNome?: string;
  objetoCompra?: string;
  informacaoComplementar?: string;
  situacaoCompraId?: number;
  situacaoCompraNome?: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  dataPublicacaoPncp?: string;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  linkSistemaOrigem?: string;
  itens?: PncpItem[];
}

export interface PncpItem {
  numeroItem: number;
  descricao: string;
  materialOuServico?: string;
  codigoCatalogo?: string;
  codigoItem?: string;
  tipoBeneficio?: string;
  incentivoDesenvolvimentoLocal?: boolean;
  quantidade?: number;
  unidadeMedida?: string;
  valorUnitarioEstimado?: number;
  valorTotal?: number;
  orcamentoSigiloso?: boolean;
  situacaoCompraItem?: string;
}

export interface PncpContrato {
  numeroControlePNCP?: string;
  numeroControlePncpCompra?: string;
  orgaoEntidade: {
    cnpj: string;
    razaoSocial: string;
  };
  unidadeOrgao: {
    codigoUnidade: string;
    nomeUnidade: string;
    municipioNome?: string;
    ufSigla?: string;
    ufNome?: string;
  };
  numeroContratoEmpenho?: string;
  anoContrato?: number;
  objetoContrato?: string;
  valorInicial?: number;
  valorGlobal?: number;
  valorParcela?: number;
  dataAssinatura?: string;
  dataPublicacaoPncp?: string;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  niFornecedor?: string;
  nomeFornecedor?: string;                // alias local para compatibilidade
  nomeRazaoSocialFornecedor?: string;     // nome real retornado pela API
  tipoPessoa?: string;
  receita?: boolean;
  categoriaProcesso?: { id: number; nome: string };
  categoriaProcessoId?: number;
  categoriaProcessoNome?: string;
  modalidadeId?: number;
  modalidadeNome?: string;
  processo?: string;
  itens?: PncpItem[];
}

export interface PncpListResponse<T> {
  data: T[];
  totalRegistros: number;
  totalPaginas: number;
  paginaAtual: number;
  itensPorPagina?: number;
}

export interface PncpFetchOptions {
  sinceDays?: number;
  uf?: string;
  modality?: number;
  page?: number;
  pageSize?: number;
  dataInicial?: Date;   // quando fornecido, sobrepõe sinceDays
  dataFinal?: Date;
}
