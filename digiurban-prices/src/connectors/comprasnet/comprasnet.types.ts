// Tipos para a API dadosabertos.compras.gov.br (Portal de Compras do Governo Federal)
// Base URL: https://dadosabertos.compras.gov.br
// Swagger: https://dadosabertos.compras.gov.br/swagger-ui/index.html
// Sem autenticação. Paginação: pagina (1-based), tamanhoPagina (10-500).
// Envelope de resposta: { resultado: T[], totalRegistros, totalPaginas, paginasRestantes }

export interface DadosAbertosResponse<T> {
  resultado: T[];
  totalRegistros: number;
  totalPaginas: number;
  paginasRestantes: number;
}

// ── Módulo Legado: Pregões homologados (SIASG pré e pós 14.133/2021) ──────────
// GET /modulo-legado/4_consultarItensPregoes
// Params obrigatórios: dt_hom_inicial, dt_hom_final (YYYY-MM-DD)
// Retorna itens de pregões com preço homologado

export interface ComprasnetItemPregao {
  tbVwItensPregaoId?: {
    coUasg?: number;
    coItem?: number;
  };
  descricaoItem?: string;
  descricaoDetalhadaItem?: string;
  quantidadeItem?: string;         // string numérico
  unidadeFornecimento?: string;
  valorHomologadoItem?: string;    // preço unitário homologado — string numérico
  valorEstimadoItem?: string;      // preço estimado
  valorNegociado?: string;
  menorLance?: string;
  fornecedorVencedor?: string;     // nome do fornecedor
  noAdjudic?: string;
  situacaoItem?: string;           // "homologado" | "cancelado" | etc
  idCompra?: string;               // ID da compra
  idCompraItem?: string;
  dtHom?: string;                  // data homologação "YYYY-MM-DD"
  dtEncerramento?: string;
  dtAdjudic?: string;
  decreto7174?: string;
  margemPreferencial?: string;
  tratamentoDiferenciado?: string;
}

// ── Módulo ARP: Atas de Registro de Preço ─────────────────────────────────────
// GET /modulo-arp/1_consultarARP
// Params obrigatórios: dataVigenciaInicialMin, dataVigenciaInicialMax (YYYY-MM-DD)

export interface ComprasnetARP {
  numeroAtaRegistroPreco?: string;
  codigoUnidadeGerenciadora?: string;
  nomeUnidadeGerenciadora?: string;
  dataAssinatura?: string;
  dataVigenciaInicial?: string;
  dataVigenciaFinal?: string;
  valorTotal?: number;
  quantidadeItens?: number;
  nomeModalidadeCompra?: string;
  numeroControlePncpAta?: string;
  numeroControlePncpCompra?: string;
  numeroCompra?: string;
  anoCompra?: string;
  linkAtaPNCP?: string;
  linkCompraPNCP?: string;
}

// GET /modulo-arp/2_consultarARPItem
// Params obrigatórios: dataVigenciaInicialMin, dataVigenciaInicialMax (YYYY-MM-DD)
// Atenção: usar janelas curtas (<= 30 dias) para evitar timeout

export interface ComprasnetARPItem {
  numeroAtaRegistroPreco?: string;
  numeroControlePncpAta?: string;
  descricaoItem?: string;
  codigoItem?: string;             // CATMAT ou CATSER
  tipoItem?: string;               // "M" = material, "S" = serviço
  unidadeMedida?: string;
  quantidade?: number;
  valorUnitario?: number;          // preço unitário da ATA
  valorTotal?: number;
  niFornecedor?: string;           // CNPJ/CPF do fornecedor
  nomeFornecedor?: string;
  marcaFabricante?: string;
  dataVigenciaInicial?: string;
  dataVigenciaFinal?: string;
  codigoUnidadeGerenciadora?: string;
  nomeUnidadeGerenciadora?: string;
  uf?: string;
  municipio?: string;
}

// ── Opções de busca ───────────────────────────────────────────────────────────

export interface ComprasnetPregaoOptions {
  dtHomInicial: string;   // "YYYY-MM-DD"
  dtHomFinal: string;
  coUasg?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface ComprasnetARPOptions {
  dataVigenciaInicialMin: string;   // "YYYY-MM-DD"
  dataVigenciaInicialMax: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface ComprasnetFetchOptions {
  sinceDays?: number;
}
