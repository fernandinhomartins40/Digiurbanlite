import { ServiceSuggestion, ServiceSubtype, ServiceType } from '@/lib/service-suggestions';
import { inferNoDataServiceSubtype } from './no-data-service-classification';

function urlCodeToDbCode(urlCode: string): string {
  return urlCode
    .toUpperCase()
    .replace(/-/g, '_');
}

export function buildServiceCreationUrl(
  departmentCode: string,
  suggestion: ServiceSuggestion
): string {
  const formSchema = {
    fields: suggestion.suggestedFields.map((field) => ({
      id: field.name,
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.label,
    })),
    citizenFields: [
      'citizen_name',
      'citizen_cpf',
      'citizen_rg',
      'citizen_birthdate',
      'citizen_phone',
      'citizen_email',
      'citizen_address',
      'citizen_addressnumber',
      'citizen_addresscomplement',
      'citizen_neighborhood',
      'citizen_city',
      'citizen_state',
      'citizen_zipcode',
    ],
  };

  const dbCode = urlCodeToDbCode(departmentCode);
  const params = new URLSearchParams({
    departmentCode: dbCode,
    serviceType: suggestion.serviceType,
    prefill_name: suggestion.name,
    prefill_description: suggestion.description,
    prefill_category: suggestion.category,
    prefill_estimatedDays: suggestion.estimatedDays.toString(),
    prefill_requiresDocuments: suggestion.requiresDocuments.toString(),
    prefill_icon: suggestion.icon,
  });

  const resolvedSubtype =
    suggestion.serviceType === ServiceType.SEM_DADOS
      ? suggestion.serviceSubtype !== ServiceSubtype.CONSULTIVO
        ? suggestion.serviceSubtype
        : inferNoDataServiceSubtype({
            name: suggestion.name,
            description: suggestion.description,
            category: suggestion.category,
            requiresDocuments: suggestion.requiresDocuments,
            requiredDocuments: suggestion.requiredDocuments,
          })
      : suggestion.serviceSubtype;

  if (resolvedSubtype) {
    params.set('prefill_serviceSubtype', resolvedSubtype);
  }

  if (suggestion.requiredDocuments?.length) {
    params.set('prefill_requiredDocuments', JSON.stringify(suggestion.requiredDocuments));
  }

  if (suggestion.serviceType === ServiceType.COM_DADOS) {
    params.set('prefill_formSchema', JSON.stringify(formSchema));
  }

  return `/admin/servicos/novo?${params.toString()}`;
}

export function readPrefillParams(searchParams: URLSearchParams) {
  const prefillData: Record<string, any> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('prefill_')) {
      continue;
    }

    const fieldName = key.replace('prefill_', '');

    if (fieldName === 'formSchema' || fieldName === 'requiredDocuments') {
      try {
        prefillData[fieldName] = JSON.parse(value);
      } catch (error) {
        console.error(`Erro ao parsear ${fieldName}:`, error);
        prefillData[fieldName] = null;
      }
      continue;
    }

    if (fieldName === 'estimatedDays') {
      prefillData[fieldName] = parseInt(value, 10);
      continue;
    }

    if (fieldName === 'requiresDocuments') {
      prefillData[fieldName] = value === 'true';
      continue;
    }

    prefillData[fieldName] = value;
  }

  return prefillData;
}

export function hasPrefillData(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (key.startsWith('prefill_')) {
      return true;
    }
  }
  return false;
}
