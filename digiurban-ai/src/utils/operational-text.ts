const CANONICAL_TERMS = [
  'aplicacao',
  'sistema',
  'digiurban',
  'menu',
  'tela',
  'pagina',
  'modulo',
  'rota',
  'dashboard',
  'painel',
  'prefeito',
  'secretaria',
  'cidadao',
  'servidor',
  'servico',
  'protocolo',
  'protocolos',
  'solicitacao',
  'solicitacoes',
  'chamado',
  'chamados',
  'ticket',
  'listar',
  'liste',
  'lista',
  'relacao',
  'quais',
  'quantos',
  'quantas',
  'total',
  'totais',
  'status',
  'numero',
  'numeros',
  'dados',
  'estatistica',
  'estatisticas',
  'metrica',
  'metricas',
  'aberto',
  'abertos',
  'ativo',
  'ativos',
  'ativa',
  'ativas',
  'andamento',
  'pendente',
  'pendentes',
  'concluido',
  'concluidos',
  'cancelado',
  'cancelados',
  'permissao',
  'papel',
  'role',
  'fluxo',
] as const;

function baseNormalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function maxDistanceForWord(word: string): number {
  if (word.length <= 4) return 0;
  if (word.length <= 6) return 1;
  if (word.length <= 10) return 2;
  return 3;
}

function correctOperationalWord(word: string): string {
  if (word.length <= 3 || /^\d+$/.test(word)) {
    return word;
  }

  if ((CANONICAL_TERMS as readonly string[]).includes(word)) {
    return word;
  }

  let best = word;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const term of CANONICAL_TERMS) {
    const lengthDelta = Math.abs(term.length - word.length);
    if (lengthDelta > maxDistanceForWord(word)) {
      continue;
    }

    const distance = editDistance(word, term);
    if (distance < bestDistance) {
      best = term;
      bestDistance = distance;
    }
  }

  return bestDistance <= maxDistanceForWord(word) ? best : word;
}

export function normalizeOperationalText(input: string): string {
  const normalized = baseNormalize(input);
  if (!normalized) {
    return '';
  }

  return normalized
    .split(' ')
    .map(correctOperationalWord)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
