import { ServiceSuggestion } from '@/lib/service-suggestions';

/**
 * Constrói URL para página de criação de serviço com dados pré-preenchidos
 */
/**
 * Converte código de departamento de formato de URL para formato do banco
 * Exemplo: 'assistencia-social' -> 'ASSISTENCIA_SOCIAL'
 */
function urlCodeToDbCode(urlCode: string): string {
  return urlCode
    .toUpperCase()
    .replace(/-/g, '_');
}

export function buildServiceCreationUrl(
  departmentCode: string,
  suggestion: ServiceSuggestion
): string {
  // Converter suggestedFields para o formato esperado pelo formSchema
  const formSchema = {
    fields: suggestion.suggestedFields.map((field, index) => ({
      id: `field_${index}`,
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.label,
    }))
  };

  // Converter código de URL para formato do banco (ex: 'saude' -> 'SAUDE')
  const dbCode = urlCodeToDbCode(departmentCode);

  const params = new URLSearchParams({
    departmentCode: dbCode,
    serviceType: 'COM_DADOS',
    // Dados básicos do serviço
    prefill_name: suggestion.name,
    prefill_description: suggestion.description,
    prefill_category: suggestion.category,
    prefill_estimatedDays: suggestion.estimatedDays.toString(),
    prefill_requiresDocuments: suggestion.requiresDocuments.toString(),
    prefill_icon: suggestion.icon,
    // Schema de formulário sugerido (JSON stringificado)
    prefill_formSchema: JSON.stringify(formSchema),
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
