/**
 * Extrator de Campos de Schema
 *
 * Utilitário para extrair campos de formulários tanto do formato legado
 * quanto do novo formato JSON Schema, garantindo compatibilidade.
 */

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  mask?: string;
  $id?: string;
  title?: string;
  description?: string;
  enum?: string[];
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: any;
  properties?: any;
}

/**
 * Mapeia tipo JSON Schema para tipo de campo do formulário legado
 */
function mapJsonSchemaTypeToFieldType(jsonType: string, format?: string): string {
  if (format === 'email') return 'email';
  if (format === 'date') return 'date';
  if (format === 'date-time') return 'date';

  switch (jsonType) {
    case 'string':
      return 'text';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'checkbox';
    case 'array':
      return 'select'; // Arrays geralmente são selects múltiplos
    case 'object':
      return 'object';
    default:
      return 'text';
  }
}

/**
 * Detecta máscara baseada no ID do campo ou formato
 */
function detectMask(fieldId: string, format?: string): string | undefined {
  const normalizedId = fieldId.toLowerCase();

  if (format === 'email') return undefined; // Email não precisa de máscara
  if (format === 'date') return 'date'; // Data brasileira DD/MM/YYYY

  // Data
  if (normalizedId.includes('birth') || normalizedId.includes('nascimento') || normalizedId.includes('data')) {
    return 'date';
  }

  // CPF
  if (normalizedId.includes('cpf') && !normalizedId.includes('cnpj')) {
    return 'cpf';
  }

  // Telefone
  if (normalizedId.includes('phone') || normalizedId.includes('telefone') || normalizedId.includes('celular')) {
    return 'phone';
  }

  // CEP
  if (normalizedId.includes('cep') || normalizedId.includes('zipcode')) {
    return 'cep';
  }

  return undefined;
}

/**
 * Converte um campo JSON Schema para FormField
 */
function convertJsonSchemaFieldToFormField(
  fieldId: string,
  schema: any,
  required: boolean
): FormField {
  const fieldType = mapJsonSchemaTypeToFieldType(schema.type, schema.format);
  const mask = detectMask(fieldId, schema.format);

  return {
    id: fieldId,
    $id: schema.$id || fieldId,
    type: fieldType,
    label: schema.title || schema.label || fieldId,
    placeholder: schema.description || schema.placeholder,
    required,
    options: schema.enum || schema.options,
    mask,
    // Preservar propriedades JSON Schema originais
    format: schema.format,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    minimum: schema.minimum,
    maximum: schema.maximum,
    pattern: schema.pattern,
    items: schema.items,
    properties: schema.properties,
  };
}

/**
 * Mapeamento de citizenFields para labels e tipos
 */
const CITIZEN_FIELD_MAPPING: Record<string, { label: string; type: string; mask?: string }> = {
  citizen_name: { label: 'Nome Completo', type: 'text' },
  citizen_cpf: { label: 'CPF', type: 'text', mask: 'cpf' },
  citizen_rg: { label: 'RG', type: 'text' },
  citizen_birthdate: { label: 'Data de Nascimento', type: 'date' }, // lowercase para match
  citizen_phone: { label: 'Telefone', type: 'text', mask: 'phone' },
  citizen_phonesecondary: { label: 'Telefone Secundário', type: 'text', mask: 'phone' }, // lowercase
  citizen_email: { label: 'E-mail', type: 'email' },
  citizen_address: { label: 'Endereço', type: 'text' },
  citizen_addressnumber: { label: 'Número', type: 'text' }, // lowercase
  citizen_addresscomplement: { label: 'Complemento', type: 'text' }, // lowercase
  citizen_neighborhood: { label: 'Bairro', type: 'text' },
  citizen_city: { label: 'Cidade', type: 'text' },
  citizen_state: { label: 'Estado (UF)', type: 'text' },
  citizen_zipcode: { label: 'CEP', type: 'text', mask: 'cep' }, // lowercase
  citizen_mothername: { label: 'Nome da Mãe', type: 'text' }, // lowercase
  citizen_maritalstatus: { label: 'Estado Civil', type: 'text' }, // lowercase
  citizen_occupation: { label: 'Profissão', type: 'text' },
  citizen_familyincome: { label: 'Renda Familiar', type: 'text' }, // lowercase
};

/**
 * Converte citizenFields em FormField objects
 */
function convertCitizenFieldsToFormFields(citizenFields: string[]): FormField[] {
  if (!Array.isArray(citizenFields) || citizenFields.length === 0) {
    return [];
  }

  return citizenFields.map((fieldId: string) => {
    // Normalizar para lowercase para buscar no mapeamento
    const normalizedId = fieldId.toLowerCase();
    const mapping = CITIZEN_FIELD_MAPPING[normalizedId] || { label: fieldId, type: 'text' };

    // Retornar com ID normalizado para garantir match com form-prefill-mapper
    return {
      id: normalizedId, // IMPORTANTE: usar lowercase para match
      label: mapping.label,
      type: mapping.type,
      mask: mapping.mask,
      required: true,
      placeholder: mapping.label
    };
  });
}

/**
 * Extrai campos de um formSchema, suportando ambos os formatos
 *
 * @param formSchema - Schema do formulário (formato legado ou JSON Schema)
 * @returns Array de FormField normalizado
 */
export function extractFieldsFromSchema(formSchema: any): FormField[] {
  if (!formSchema) {
    return [];
  }

  // Formato Legado: { type: 'form', fields: [...], citizenFields: [...] }
  if (Array.isArray(formSchema.fields)) {
    const customFields = formSchema.fields.map((field: any) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required || false,
      options: field.options,
      mask: field.mask,
      ...field, // Preservar outras propriedades
    }));

    // Incluir citizenFields se existirem
    const citizenFields = formSchema.citizenFields
      ? convertCitizenFieldsToFormFields(formSchema.citizenFields)
      : [];

    const totalFields = [...citizenFields, ...customFields];

    console.log('📋 [SCHEMA] Formato legado detectado:', {
      citizenFields: citizenFields.length,
      customFields: customFields.length,
      total: totalFields.length
    });

    return totalFields;
  }

  // Formato JSON Schema: { type: 'object', properties: {...}, required: [...] }
  if (formSchema.type === 'object' && formSchema.properties) {
    console.log('📋 [SCHEMA] JSON Schema detectado:', Object.keys(formSchema.properties).length, 'campos');

    const requiredFields = Array.isArray(formSchema.required) ? formSchema.required : [];
    const fields: FormField[] = [];

    Object.entries(formSchema.properties).forEach(([fieldId, fieldSchema]: [string, any]) => {
      const isRequired = requiredFields.includes(fieldId);
      const field = convertJsonSchemaFieldToFormField(fieldId, fieldSchema, isRequired);
      fields.push(field);
    });

    return fields;
  }

  // Se formSchema é um array direto (alguns casos especiais)
  if (Array.isArray(formSchema)) {
    console.log('📋 [SCHEMA] Array direto detectado:', formSchema.length, 'campos');
    return formSchema.map((field: any) => ({
      id: field.id || field.$id,
      type: field.type || 'text',
      label: field.label || field.title || field.id,
      placeholder: field.placeholder || field.description,
      required: field.required || false,
      options: field.options || field.enum,
      mask: field.mask,
      ...field,
    }));
  }

  console.warn('⚠️ [SCHEMA] Formato de schema desconhecido:', formSchema);
  return [];
}

/**
 * Extrai campos "citizen_*" de um schema
 * Estes são campos especiais que devem ser pré-preenchidos com dados do cidadão
 */
export function extractCitizenFields(formSchema: any): string[] {
  if (!formSchema) return [];

  // Extrair todos os campos
  const allFields = extractFieldsFromSchema(formSchema);

  // Filtrar apenas campos citizen_*
  const citizenFields = allFields
    .filter(field => field.id.toLowerCase().startsWith('citizen_'))
    .map(field => field.id);

  console.log('👤 [CITIZEN FIELDS] Encontrados:', citizenFields);

  return citizenFields;
}

/**
 * Verifica se um schema é JSON Schema válido
 */
export function isJsonSchema(schema: any): boolean {
  return (
    schema &&
    typeof schema === 'object' &&
    schema.type === 'object' &&
    schema.properties &&
    typeof schema.properties === 'object'
  );
}

/**
 * Verifica se um schema é formato legado
 */
export function isLegacySchema(schema: any): boolean {
  return (
    schema &&
    typeof schema === 'object' &&
    Array.isArray(schema.fields)
  );
}

/**
 * Obtém informações sobre o schema
 */
export function getSchemaInfo(formSchema: any): {
  type: 'json-schema' | 'legacy' | 'array' | 'unknown';
  fieldCount: number;
  citizenFieldCount: number;
} {
  if (isJsonSchema(formSchema)) {
    const fields = extractFieldsFromSchema(formSchema);
    const citizenFields = fields.filter(f => f.id.toLowerCase().startsWith('citizen_'));

    return {
      type: 'json-schema',
      fieldCount: fields.length,
      citizenFieldCount: citizenFields.length,
    };
  }

  if (isLegacySchema(formSchema)) {
    const fields = formSchema.fields;
    const citizenFields = fields.filter((f: any) => f.id.toLowerCase().startsWith('citizen_'));

    return {
      type: 'legacy',
      fieldCount: fields.length,
      citizenFieldCount: citizenFields.length,
    };
  }

  if (Array.isArray(formSchema)) {
    const citizenFields = formSchema.filter((f: any) =>
      (f.id || f.$id || '').toLowerCase().startsWith('citizen_')
    );

    return {
      type: 'array',
      fieldCount: formSchema.length,
      citizenFieldCount: citizenFields.length,
    };
  }

  return {
    type: 'unknown',
    fieldCount: 0,
    citizenFieldCount: 0,
  };
}
