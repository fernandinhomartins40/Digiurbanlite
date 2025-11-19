// Tipos compartilhados para todas as sugestões de serviços

export interface FormFieldSuggestion {
  name: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'cpf' | 'cnpj' | 'cep' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ServiceSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedFields: FormFieldSuggestion[];
  category: string;
  estimatedDays: number;
  requiresDocuments: boolean;
  linkedCitizensConfig?: {
    enabled: boolean;
    minLinked?: number;
    maxLinked?: number;
    label?: string;
    description?: string;
    links?: Array<Record<string, any>>;
  };
}
