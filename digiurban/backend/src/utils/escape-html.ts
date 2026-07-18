/**
 * Escapa conteúdo dinâmico interpolado em templates HTML gerados no servidor
 * (relatórios PDF, timelines). Todo valor vindo de banco/usuário DEVE passar
 * por aqui antes de entrar numa template string de HTML.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
