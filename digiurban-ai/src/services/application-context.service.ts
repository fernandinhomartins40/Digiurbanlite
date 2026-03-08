import adminRoutes from '../generated/admin-routes.generated.json';

type ApplicationContextKind = 'route' | 'workflow' | 'role' | 'module';

type ApplicationContextEntry = {
  id: string;
  kind: ApplicationContextKind;
  title: string;
  summary: string;
  path?: string;
  minRole?: string;
  permissions?: string[];
  steps?: string[];
  keywords: string[];
  source: 'curated' | 'generated';
};

export type ApplicationContextResult = {
  id: string;
  kind: ApplicationContextKind;
  title: string;
  summary: string;
  path?: string;
  minRole?: string;
  permissions?: string[];
  steps?: string[];
  score: number;
  source: 'curated' | 'generated';
};

type GeneratedRouteEntry = {
  id: string;
  title: string;
  path: string;
  category: string;
  summary: string;
  keywords: string[];
  sourcePath: string;
};

const curatedEntries: ApplicationContextEntry[] = [
  {
    id: 'role-admin-prefeito',
    kind: 'role',
    title: 'Prefeito(a) no DigiUrban',
    summary:
      'No DigiUrban, o papel ADMIN representa o Prefeito(a). Esse perfil tem gestao total do portal administrativo e acesso ao Gabinete Executivo.',
    minRole: 'ADMIN',
    keywords: ['prefeito', 'admin', 'papel', 'perfil', 'role', 'gestao', 'gabinete'],
    source: 'curated',
  },
  {
    id: 'workflow-abrir-chamado-prefeito',
    kind: 'workflow',
    title: 'Abrir chamado administrativo como Prefeito(a)',
    summary:
      'O fluxo principal para o Prefeito(a) abrir um chamado fica em /admin/chamados. O chamado e um protocolo top-down para uma secretaria.',
    path: '/admin/chamados',
    minRole: 'ADMIN',
    permissions: ['chamados:create'],
    steps: [
      'Acesse o portal administrativo em /admin.',
      'Entre em Gabinete Executivo e abra Criar Chamado.',
      'Selecione o cidadao que sera vinculado ao chamado.',
      'Selecione o servico que define a secretaria de destino.',
      'Preencha titulo, descricao e prioridade.',
      'Envie o chamado para a secretaria.',
      'Acompanhe o andamento em /admin/chamados/lista.',
    ],
    keywords: [
      'prefeito',
      'abrir chamado',
      'criar chamado',
      'gabinete',
      'secretaria',
      'ticket',
      'admin/chamados',
    ],
    source: 'curated',
  },
  {
    id: 'route-painel-prefeito',
    kind: 'route',
    title: 'Painel do Prefeito',
    summary:
      'Tela executiva em /admin/gabinete/painel-prefeito com visao municipal, urgencias, tendencias e acompanhamento estrategico.',
    path: '/admin/gabinete/painel-prefeito',
    minRole: 'ADMIN',
    keywords: ['prefeito', 'painel', 'gabinete', 'dashboard', 'urgencia', 'executivo'],
    source: 'curated',
  },
  {
    id: 'route-protocolos',
    kind: 'module',
    title: 'Gestao de Protocolos',
    summary:
      'A tela /admin/protocolos centraliza busca, acompanhamento e operacao dos protocolos da aplicacao.',
    path: '/admin/protocolos',
    permissions: ['protocols:read'],
    keywords: ['protocolos', 'protocolo', 'atendimento', 'solicitacao', 'fila', 'status'],
    source: 'curated',
  },
  {
    id: 'route-chamados-lista',
    kind: 'route',
    title: 'Lista de chamados administrativos',
    summary:
      'A tela /admin/chamados/lista mostra os chamados criados e o status de aceitacao, rejeicao ou geracao de protocolo.',
    path: '/admin/chamados/lista',
    minRole: 'ADMIN',
    keywords: ['chamados', 'lista', 'acompanhamento', 'status', 'ticket', 'prefeito'],
    source: 'curated',
  },
  {
    id: 'module-ia-centralizada',
    kind: 'module',
    title: 'IA Centralizada',
    summary:
      'A tela /admin/ia e o copiloto interno da DigiUrban para duvidas operacionais, redacao e consultas contextuais da aplicacao.',
    path: '/admin/ia',
    minRole: 'ADMIN',
    keywords: ['ia', 'chat', 'assistente', 'qwen', 'copiloto', 'contextual'],
    source: 'curated',
  },
];

const generatedEntries: ApplicationContextEntry[] = (adminRoutes as GeneratedRouteEntry[]).map((route) => ({
  id: route.id,
  kind: 'route',
  title: route.title,
  summary: `${route.summary} Categoria: ${route.category}.`,
  path: route.path,
  keywords: route.keywords,
  source: 'generated',
}));

const applicationEntries = [...curatedEntries, ...generatedEntries];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s/:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchableText(entry: ApplicationContextEntry): string {
  return normalizeText(
    [
      entry.title,
      entry.summary,
      entry.path,
      entry.minRole,
      ...(entry.permissions || []),
      ...(entry.steps || []),
      ...entry.keywords,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function scoreEntry(entry: ApplicationContextEntry, queryTerms: string[]): number {
  if (!queryTerms.length) {
    return 0;
  }

  const haystack = buildSearchableText(entry);
  let score = 0;

  for (const term of queryTerms) {
    if (!term) {
      continue;
    }

    if (haystack.includes(term)) {
      score += 1;
      if (entry.path?.toLowerCase().includes(term)) {
        score += 0.5;
      }
      if (entry.title.toLowerCase().includes(term)) {
        score += 0.75;
      }
    }
  }

  if (entry.source === 'curated' && score > 0) {
    score += 0.5;
  }

  return score;
}

export class ApplicationContextService {
  search(params: { query: string; limit?: number }): ApplicationContextResult[] {
    const normalized = normalizeText(params.query);
    if (!normalized) {
      return [];
    }

    const queryTerms = Array.from(
      new Set(
        normalized
          .split(/\s+/)
          .filter((term) => term.length >= 2)
          .slice(0, 12),
      ),
    );

    const results = applicationEntries
      .map((entry) => ({
        ...entry,
        score: scoreEntry(entry, queryTerms),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        if (left.source !== right.source) {
          return left.source === 'curated' ? -1 : 1;
        }

        return left.title.localeCompare(right.title);
      })
      .slice(0, Math.max(1, Math.min(params.limit || 5, 8)));

    return results.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      summary: entry.summary,
      path: entry.path,
      minRole: entry.minRole,
      permissions: entry.permissions,
      steps: entry.steps,
      score: Number(entry.score.toFixed(3)),
      source: entry.source,
    }));
  }
}

export const applicationContextService = new ApplicationContextService();
