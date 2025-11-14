import { ServiceSuggestion } from '@/lib/service-suggestions';

/**
 * Constrói URL para página de criação de serviço com dados pré-preenchidos
 */
export function buildServiceCreationUrl(
  departmentCode: string,
  suggestion: ServiceSuggestion
): string {
  const params = new URLSearchParams({
    departmentCode,
    serviceType: 'COM_DADOS',
    // Dados básicos do serviço
    prefill_name: suggestion.name,
    prefill_description: suggestion.description,
    prefill_category: suggestion.category,
    prefill_estimatedDays: suggestion.estimatedDays.toString(),
    prefill_requiresDocuments: suggestion.requiresDocuments.toString(),
    // Schema de formulário sugerido (JSON stringificado)
    prefill_formSchema: JSON.stringify(suggestion.suggestedFields),
  });

  return `/admin/servicos/novo?${params.toString()}`;
}

/**
 * Lê parâmetros de pré-preenchimento da URL
 */
export function readPrefillParams(searchParams: URLSearchParams) {
  const prefillData: Record<string, any> = {};

  // Extrair todos os parâmetros que começam com 'prefill_'
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('prefill_')) {
      const fieldName = key.replace('prefill_', '');

      // Parsear valores especiais
      if (fieldName === 'formSchema') {
        try {
          prefillData[fieldName] = JSON.parse(value);
        } catch (e) {
          console.error('Erro ao parsear formSchema:', e);
          prefillData[fieldName] = null;
        }
      } else if (fieldName === 'estimatedDays') {
        prefillData[fieldName] = parseInt(value, 10);
      } else if (fieldName === 'requiresDocuments') {
        prefillData[fieldName] = value === 'true';
      } else {
        prefillData[fieldName] = value;
      }
    }
  }

  return prefillData;
}

/**
 * Verifica se há dados de pré-preenchimento disponíveis
 */
export function hasPrefillData(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (key.startsWith('prefill_')) {
      return true;
    }
  }
  return false;
}
