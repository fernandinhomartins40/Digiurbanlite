/**
 * Normaliza o campo requiredDocuments para sempre retornar um array
 * Backend pode enviar como string JSON ou array
 */
export function normalizeRequiredDocuments(requiredDocuments: any): any[] {
  if (!requiredDocuments) {
    return [];
  }

  // Se já é array, retorna diretamente
  if (Array.isArray(requiredDocuments)) {
    return requiredDocuments;
  }

  // Se é string, tenta fazer parse
  if (typeof requiredDocuments === 'string') {
    try {
      const parsed = JSON.parse(requiredDocuments);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Erro ao fazer parse de requiredDocuments:', e);
      return [];
    }
  }

  // Qualquer outro tipo, retorna array vazio
  return [];
}
