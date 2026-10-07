/** Mesmo serviço com nome um pouco diferente? (acentos, artigos, "Solicitação de"...) */
export function normalizeServiceName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(solicitacao|pedido|requerimento|de|da|do|das|dos|e|para|a|o|em|online)\b/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSameService(a: string, b: string): boolean {
  const x = normalizeServiceName(a);
  const y = normalizeServiceName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // um contém o outro e o menor ainda é específico (não "taxa", "cadastro"...)
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 12 && long.includes(short);
}
