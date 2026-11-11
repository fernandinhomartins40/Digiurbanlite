/**
 * "Usar o que já enviei": documento pedido pelo serviço que o cidadão já tem
 * APROVADO em Meus documentos (mesmo código do catálogo). Regra pura, sem
 * import, para o teste do backend (__tests__/unit/citizen-protocol-eta.test.ts).
 */

export interface PersonalDocumentLite {
  id: string;
  documentType: string;
  status: string;
  uploadedAt: string;
  fileName?: string;
  mimeType?: string;
}

// shortcut: IDENTIDADE pede frente e verso numa imagem só e Meus documentos guarda
// separado (rg_frente/rg_verso); entra quando houver junção das duas fotos.
const NOT_REUSABLE = new Set(['IDENTIDADE']);

/**
 * @param required documento pedido ({ code, name } do catálogo)
 * @param catalogName nome padrão do código; nome diferente = tem observação
 *        ("— do responsável"), ou seja, documento de outra pessoa
 */
export function pickReusableDocument<T extends PersonalDocumentLite>(
  required: { code?: string; name?: string },
  catalogName: string | undefined,
  mine: T[]
): T | null {
  const code = required.code;
  if (!code || NOT_REUSABLE.has(code) || !catalogName || required.name !== catalogName) return null;
  const matches = mine
    .filter((doc) => doc.status === 'APPROVED' && doc.documentType.toUpperCase() === code)
    .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
  return matches[0] || null;
}
