// Tipos para a API do Portal da Transparência do Governo Federal
// Documentação: https://portaldatransparencia.gov.br/api-de-dados
// Header obrigatório: chave-api-dados: <KEY>
// Endpoint /contratos requer codigoOrgao obrigatório

export interface TransparenciaContrato {
  id: number;
  numero: string;
  objeto: string;
  numeroProcesso?: string;
  fundamentoLegal?: string;
  situacaoContrato?: string;

  // Valores — campos reais da API (verificado fev/2026)
  valorInicialCompra?: number;
  valorFinalCompra?: number;

  // Datas
  dataAssinatura?: string;         // "YYYY-MM-DD"
  dataPublicacaoDOU?: string;
  dataInicioVigencia?: string;
  dataFimVigencia?: string;

  // Modalidade retorna como string, não objeto
  modalidadeCompra?: string;

  unidadeGestora?: {
    codigo: string;
    nome: string;
    descricaoPoder?: string;
    orgaoVinculado?: {
      codigoSIAFI?: string;
      cnpj?: string;
      sigla?: string;
      nome?: string;
    };
    orgaoMaximo?: {
      codigo?: string;
      sigla?: string;
      nome?: string;
    };
  };

  fornecedor?: {
    id?: number;
    tipo?: string;
    cpfFormatado?: string;
    cnpjFormatado?: string;         // campo real (não "cnpj")
    numeroInscricaoSocial?: string;
    nome?: string;
    razaoSocialReceita?: string;
    nomeFantasiaReceita?: string;
  };
}

export interface TransparenciaFetchOptions {
  dataInicio?: string;     // "YYYY-MM-DD" — será convertido para "dd/MM/yyyy"
  dataFim?: string;
  codigoOrgao?: string;    // obrigatório na API
  page?: number;
  size?: number;
}

// Códigos SIAFI dos principais órgãos federais com alto volume de compras
// Usado para paginar contratos sem ter um órgão específico como filtro
export const TRANSPARENCIA_ORGAOS_PRINCIPAIS = [
  '26000', // Ministério da Educação
  '36000', // Ministério da Saúde
  '52000', // Ministério da Defesa
  '20000', // Presidência da República
  '30000', // Ministério da Justiça
  '44000', // Ministério do Trabalho
  '25000', // Ministério da Fazenda
  '39000', // Ministério da Ciência e Tecnologia
  '22000', // Ministério das Comunicações
  '71000', // Ministério da Agricultura
  '54000', // Ministério dos Transportes
  '67000', // Ministério do Desenvolvimento
  '55000', // Ministério do Meio Ambiente
  '53000', // Ministério do Planejamento
  '47000', // Ministério das Relações Exteriores
];
