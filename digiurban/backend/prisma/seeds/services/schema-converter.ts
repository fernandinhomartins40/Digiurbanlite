/**
 * ============================================================================
 * CONVERSOR DE ESTRUTURA ANTIGA PARA NOVA
 * ============================================================================
 *
 * Utilitários para converter serviços da estrutura antiga (citizenFields + fields)
 * para a nova estrutura unificada (JSON Schema com metadado citizenFields)
 */

import { CITIZEN_FIELD_DEFINITIONS, UnifiedFormSchema, JSONSchemaProperty } from './schema-types';

/**
 * Mapeamento de campos antigos (citizen_*) para novos nomes
 */
const OLD_TO_NEW_CITIZEN_FIELDS: Record<string, string> = {
  citizen_name: 'nome',
  citizen_cpf: 'cpf',
  citizen_rg: 'rg',
  citizen_birthdate: 'dataNascimento',
  citizen_email: 'email',
  citizen_phone: 'telefone',
  citizen_phonesecondary: 'telefoneSecundario',
  citizen_zipcode: 'cep',
  citizen_address: 'logradouro',
  citizen_addressnumber: 'numero',
  citizen_addresscomplement: 'complemento',
  citizen_neighborhood: 'bairro',
  citizen_city: 'cidade',
  citizen_state: 'uf',
  citizen_mothername: 'nomeMae',
  citizen_maritalstatus: 'estadoCivil',
  citizen_occupation: 'profissao',
  citizen_familyincome: 'rendaFamiliar'
};

/**
 * Converte um campo do formato antigo para JSON Schema Property
 */
function convertOldFieldToProperty(field: any): JSONSchemaProperty {
  const property: JSONSchemaProperty = {
    type: field.type === 'number' ? 'number' :
          field.type === 'checkbox' ? 'boolean' :
          field.type === 'date' ? 'string' :
          'string',
    title: field.label
  };

  // Converter type específico para format
  if (field.type === 'date') {
    property.format = 'date';
  } else if (field.type === 'email') {
    property.format = 'email';
  } else if (field.type === 'phone') {
    property.format = 'tel';
    property.pattern = '^\\d{10,11}$';
  }

  // Aplicar validações
  if (field.minLength !== undefined) {
    property.minLength = field.minLength;
  }
  if (field.maxLength !== undefined) {
    property.maxLength = field.maxLength;
  }
  if (field.minimum !== undefined) {
    property.minimum = field.minimum;
  }
  if (field.maximum !== undefined) {
    property.maximum = field.maximum;
  }
  if (field.pattern) {
    property.pattern = field.pattern;
  }

  // Converter select para enum
  if (field.type === 'select' && field.options) {
    property.enum = field.options;
  }

  // Converter textarea
  if (field.type === 'textarea') {
    property.widget = 'textarea';
  }

  // Default value
  if (field.defaultValue !== undefined) {
    property.default = field.defaultValue;
  }

  return property;
}

/**
 * Converte estrutura antiga para nova estrutura unificada
 */
export function convertLegacyToUnified(legacySchema: any): UnifiedFormSchema {
  const properties: Record<string, JSONSchemaProperty> = {};
  const required: string[] = [];
  const citizenFields: string[] = [];

  // 1. Processar citizenFields (se existir)
  if (legacySchema.citizenFields && Array.isArray(legacySchema.citizenFields)) {
    for (const oldFieldName of legacySchema.citizenFields) {
      const newFieldName = OLD_TO_NEW_CITIZEN_FIELDS[oldFieldName] || oldFieldName;

      // Adicionar à lista de campos do cidadão
      citizenFields.push(newFieldName);

      // Buscar definição padrão do campo do cidadão
      if (CITIZEN_FIELD_DEFINITIONS[newFieldName]) {
        properties[newFieldName] = { ...CITIZEN_FIELD_DEFINITIONS[newFieldName] };
        required.push(newFieldName); // Campos do cidadão são sempre obrigatórios
      }
    }
  }

  // 2. Processar fields customizados (se existir)
  if (legacySchema.fields && Array.isArray(legacySchema.fields)) {
    for (const field of legacySchema.fields) {
      const fieldId = field.id;
      properties[fieldId] = convertOldFieldToProperty(field);

      if (field.required) {
        required.push(fieldId);
      }
    }
  }

  // 3. Se já for JSON Schema novo, apenas adicionar citizenFields se não existir
  if (legacySchema.type === 'object' && legacySchema.properties) {
    return {
      type: 'object',
      citizenFields: legacySchema.citizenFields || [],
      properties: legacySchema.properties,
      required: legacySchema.required || []
    };
  }

  return {
    type: 'object',
    citizenFields,
    properties,
    required
  };
}

/**
 * Helper para criar schema unificado do zero
 */
export function createUnifiedSchema(
  citizenFieldNames: string[],
  customProperties: Record<string, JSONSchemaProperty>,
  requiredCustomFields: string[] = []
): UnifiedFormSchema {
  const properties: Record<string, JSONSchemaProperty> = {};
  const required: string[] = [];

  // Adicionar campos do cidadão
  for (const fieldName of citizenFieldNames) {
    if (CITIZEN_FIELD_DEFINITIONS[fieldName]) {
      properties[fieldName] = { ...CITIZEN_FIELD_DEFINITIONS[fieldName] };
      required.push(fieldName);
    }
  }

  // Adicionar campos customizados
  Object.assign(properties, customProperties);
  required.push(...requiredCustomFields);

  return {
    type: 'object',
    citizenFields: citizenFieldNames,
    properties,
    required
  };
}
