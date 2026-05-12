/**
 * Feature flags — desabilite/habilite funcionalidades sem deletar código.
 * Para reativar uma feature, mude o valor para `true` e remova o notFound()
 * da respectiva page.tsx.
 */
export const FEATURE_FLAGS = {
  /** Cotação / Pesquisa de Preços */
  PESQUISA_PRECOS: false,

  /** Processos Internos (hub + fluxos de tramitação + novo processo) */
  PROCESSOS_INTERNOS: false,

  /** Workflows de serviço (/admin/workflows) */
  WORKFLOWS: false,

  /** App Segurança Escolar */
  SEGURANCA_ESCOLAR: false,
} as const;
