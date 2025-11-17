import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Validador de JSON Schema para formulários de serviços
 *
 * Usa AJV (Another JSON Schema Validator) para validar dados
 * de formulários contra schemas JSON Schema definidos nos serviços.
 */

// Criar instância do AJV com configurações
const ajv = new Ajv({
  allErrors: true, // Retornar todos os erros, não apenas o primeiro
  removeAdditional: false, // Não remover propriedades adicionais
  useDefaults: true, // Aplicar valores padrão definidos no schema
  coerceTypes: true, // Converter tipos automaticamente (ex: "123" -> 123)
  strict: false, // Modo não-estrito para maior flexibilidade
});

// Adicionar formatos comuns (email, url, date, etc.)
addFormats(ajv);

/**
 * Valida dados de formulário contra um JSON Schema
 *
 * @param schema - JSON Schema do formulário
 * @param data - Dados a serem validados
 * @returns { valid: boolean, errors: string[] }
 */
export function validateFormData(
  schema: any,
  data: any
): { valid: boolean; errors: string[] } {
  try {
    // Se não houver schema, considerar válido
    if (!schema || typeof schema !== 'object') {
      return { valid: true, errors: [] };
    }

    // Compilar o schema
    const validate = ajv.compile(schema);

    // Validar os dados
    const valid = validate(data);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // Formatar erros de forma legível
    const errors = (validate.errors || []).map(error => {
      const field = error.instancePath ? error.instancePath.replace('/', '') : 'root';

      switch (error.keyword) {
        case 'required':
          return `O campo '${error.params.missingProperty}' é obrigatório`;
        case 'type':
          return `O campo '${field}' deve ser do tipo ${error.params.type}`;
        case 'format':
          return `O campo '${field}' está em formato inválido (esperado: ${error.params.format})`;
        case 'minLength':
          return `O campo '${field}' deve ter no mínimo ${error.params.limit} caracteres`;
        case 'maxLength':
          return `O campo '${field}' deve ter no máximo ${error.params.limit} caracteres`;
        case 'minimum':
          return `O campo '${field}' deve ser maior ou igual a ${error.params.limit}`;
        case 'maximum':
          return `O campo '${field}' deve ser menor ou igual a ${error.params.limit}`;
        case 'pattern':
          return `O campo '${field}' não corresponde ao padrão esperado`;
        case 'enum':
          return `O campo '${field}' deve ser um dos valores: ${error.params.allowedValues.join(', ')}`;
        default:
          return `Erro no campo '${field}': ${error.message}`;
      }
    });

    return { valid: false, errors };
  } catch (error) {
    console.error('Erro ao validar schema:', error);
    return {
      valid: false,
      errors: ['Erro interno ao validar formulário']
    };
  }
}

/**
 * Valida dados de serviço contra seu formSchema
 *
 * @param service - Serviço contendo formSchema
 * @param data - Dados a serem validados
 * @returns { valid: boolean, errors: string[] }
 */
export function validateServiceFormData(
  service: any,
  data: any
): { valid: boolean; errors: string[] } {
  // Se o serviço não tiver formSchema, considerar válido
  if (!service?.formSchema) {
    return { valid: true, errors: [] };
  }

  const formSchema = service.formSchema;

  // Se formSchema já é um JSON Schema válido (tem type, properties, etc.)
  if (formSchema.type === 'object' && formSchema.properties) {
    // ✅ FIX: Remover campos do cidadão da validação (são preenchidos pelo backend)
    const cleanedSchema = { ...formSchema };

    if (Array.isArray(cleanedSchema.required)) {
      // Campos do cidadão que devem ser ignorados na validação do customFormData
      const citizenFieldsToIgnore = [
        'nome', 'cpf', 'rg', 'dataNascimento', 'email', 'telefone',
        'telefoneSecundario', 'cep', 'logradouro', 'numero', 'complemento',
        'bairro', 'cidade', 'uf', 'nomeMae', 'estadoCivil', 'profissao', 'rendaFamiliar'
      ];

      cleanedSchema.required = cleanedSchema.required.filter(
        (field: string) => !citizenFieldsToIgnore.includes(field)
      );
    }

    return validateFormData(cleanedSchema, data);
  }

  // Se formSchema é o formato legado (array de fields)
  if (Array.isArray(formSchema.fields)) {
    // Converter para JSON Schema
    const schema = convertLegacyToJsonSchema(formSchema.fields);
    return validateFormData(schema, data);
  }

  // Formato desconhecido, considerar válido
  return { valid: true, errors: [] };
}

/**
 * Converte formato legado de campos para JSON Schema
 *
 * @param fields - Array de campos legados
 * @returns JSON Schema
 */
function convertLegacyToJsonSchema(fields: any[]): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  fields.forEach(field => {
    const { id, type, label, required: isRequired, options, placeholder } = field;

    // Mapear tipo legado para tipo JSON Schema
    let schemaType = 'string';
    let format: string | undefined;

    switch (type) {
      case 'text':
      case 'textarea':
        schemaType = 'string';
        break;
      case 'number':
        schemaType = 'number';
        break;
      case 'date':
        schemaType = 'string';
        format = 'date';
        break;
      case 'email':
        schemaType = 'string';
        format = 'email';
        break;
      case 'checkbox':
        schemaType = 'boolean';
        break;
      case 'select':
        schemaType = 'string';
        break;
      default:
        schemaType = 'string';
    }

    properties[id] = {
      type: schemaType,
      title: label,
      description: placeholder
    };

    if (format) {
      properties[id].format = format;
    }

    if (options && type === 'select') {
      properties[id].enum = options;
    }

    if (isRequired) {
      required.push(id);
    }
  });

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: true
  };
}

/**
 * Middleware Express para validar formData de serviços
 *
 * Uso:
 * router.post('/services/:id/request', validateServiceFormMiddleware, async (req, res) => {
 *   // formData já foi validado
 * });
 */
export async function validateServiceFormMiddleware(req: any, res: any, next: any) {
  try {
    const { id: serviceId } = req.params;

    // Parse customFormData se for string
    let customFormData = req.body.customFormData;
    if (typeof customFormData === 'string') {
      try {
        customFormData = JSON.parse(customFormData);
      } catch (e) {
        return res.status(400).json({ error: 'customFormData inválido' });
      }
    }

    // Se não houver customFormData, pular validação
    if (!customFormData || Object.keys(customFormData).length === 0) {
      return next();
    }

    // Buscar serviço do banco (assumindo Prisma)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Validar formData
    const validation = validateServiceFormData(service, customFormData);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Dados do formulário inválidos',
        details: validation.errors
      });
    }

    // Validação OK, continuar
    next();
  } catch (error) {
    console.error('Erro no middleware de validação:', error);
    next(); // Continuar mesmo com erro (não bloquear request)
  }
}
