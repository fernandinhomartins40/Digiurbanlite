/**
 * Tipos de documento pessoal do cidadão — nome amigável num lugar só
 * (documentos, perfil, nível Ouro). Antes o perfil mostrava o código interno
 * ("COMPROVANTE_RESIDENCIA") para a pessoa.
 */

export const CITIZEN_DOCUMENT_TYPES = [
  { value: 'rg_frente', label: 'RG, CIN ou CNH (frente)' },
  { value: 'rg_verso', label: 'RG, CIN ou CNH (verso)' },
  { value: 'cpf', label: 'CPF' },
  { value: 'comprovante_residencia', label: 'Comprovante de residência' },
  { value: 'certidao_nascimento', label: 'Certidão de nascimento' },
  { value: 'certidao_casamento', label: 'Certidão de casamento' },
  { value: 'titulo_eleitor', label: 'Título de eleitor' },
  { value: 'carteira_trabalho', label: 'Carteira de trabalho' },
  { value: 'comprovante_renda', label: 'Comprovante de renda' },
  { value: 'declaracao_escolar', label: 'Declaração escolar' },
  { value: 'cartao_sus', label: 'Cartão do SUS' },
  { value: 'laudo_medico', label: 'Laudo médico' },
  { value: 'outro', label: 'Outro documento' },
] as const;

/** Os que contam para o nível Ouro aparecem primeiro na escolha (o CPF já vem no documento de identidade) */
export const GOLD_DOCUMENT_TYPES = ['rg_frente', 'rg_verso', 'comprovante_residencia'];

export function citizenDocumentLabel(type: string | null | undefined): string {
  const key = String(type || '').toLowerCase();
  const found = CITIZEN_DOCUMENT_TYPES.find((item) => item.value === key);
  if (found) return found.label;
  // código desconhecido: "algum_tipo" → "Algum tipo"
  const text = key.replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Documento';
}

export const DOCUMENT_STATUS: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Recusado', className: 'bg-red-100 text-red-700' },
  UNDER_REVIEW: { label: 'Em análise', className: 'bg-blue-100 text-blue-800' },
  UPLOADED: { label: 'Em análise', className: 'bg-blue-100 text-blue-800' },
  PENDING: { label: 'Em análise', className: 'bg-blue-100 text-blue-800' },
  EXPIRED: { label: 'Vencido', className: 'bg-orange-100 text-orange-800' },
};
