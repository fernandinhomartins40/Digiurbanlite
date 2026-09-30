/**
 * Cliente do Catálogo de Apps (backend: config/app-catalog.ts, GET /api/app-catalog).
 *
 * O catálogo lista os apps com ações de entrada por protocolo. Algumas telas
 * de trabalho das secretarias não recebem pedidos (cadastros de apoio, frota
 * escolar…) e por isso não estão lá — ficam aqui, por secretaria, para
 * aparecerem na aba Apps e no menu Apps junto com os apps do catálogo.
 */

import { FEATURE_FLAGS } from '@/lib/feature-flags'

export interface CatalogApp {
  code: string
  name: string
  description: string
  departments: string[]
  route: string
  actions: { code: string; label: string; stage: string }[]
}

export interface ExtraAppScreen {
  name: string
  description: string
  route: string
}

/** Telas de trabalho fora do catálogo, por código canônico da secretaria */
export const EXTRA_APP_SCREENS: Record<string, ExtraAppScreen[]> = {
  SAUDE: [
    {
      name: 'Cadastros da Saúde',
      description: 'Unidades, especialidades, salas, turnos e agendas da rede',
      route: '/admin/apps/saude/cadastros',
    },
  ],
  EDUCACAO: [
    {
      name: 'Transporte Escolar',
      description: 'Frota de veículos, rotas por turno e alunos transportados',
      route: '/admin/apps/educacao/transporte',
    },
    // Desligado por FEATURE_FLAGS.SEGURANCA_ESCOLAR (a página responde 404)
    ...(FEATURE_FLAGS.SEGURANCA_ESCOLAR
      ? [
          {
            name: 'Segurança Escolar',
            description: 'Reconhecimento facial na entrada/saída com aviso aos responsáveis',
            route: '/admin/apps/seguranca-escolar',
          },
        ]
      : []),
  ],
  ASSISTENCIA_SOCIAL: [
    {
      name: 'Famílias (CadÚnico)',
      description: 'Cadastro de famílias, entrevistas, validação e composição familiar',
      route: '/admin/apps/assistencia-social/familias',
    },
    {
      name: 'Programas & Benefícios',
      description: 'Inscrições em programas sociais, análise, concessão, pagamentos e acompanhamento',
      route: '/admin/apps/assistencia-social/beneficios',
    },
    {
      name: 'Unidades (CRAS/CREAS)',
      description: 'Centros de referência e equipamentos da assistência social',
      route: '/admin/apps/assistencia-social/unidades',
    },
  ],
}

export const departmentCodeFromSlug = (slug: string) => slug.toUpperCase().replace(/-/g, '_')
export const departmentSlugFromCode = (code: string) => code.toLowerCase().replace(/_/g, '-')
