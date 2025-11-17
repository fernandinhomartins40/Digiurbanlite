// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO MODERNOS - FASE 2 - 2024
// ============================================================================

import { z, ZodSchema } from 'zod';

// Schemas de validação reutilizáveis
export const commonSchemas = {
  // IDs e identificadores
  cuid: z.string().regex(/^c[a-zA-Z0-9]{20}$/, 'ID inválido'),
  uuid: z.string().uuid('UUID inválido'),

  // Documentos brasileiros
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
  rg: z.string().min(7).max(12),

  // Contato
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .regex(/^[\d\s()\-+]+$/, 'Telefone inválido')
    .min(10)
    .max(15),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),

  // Textos
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000),
  shortText: z.string().min(1).max(255),
  longText: z.string().max(5000),

  // Números
  positiveNumber: z.number().positive('Deve ser um número positivo'),
  nonNegativeNumber: z.number().min(0, 'Não pode ser negativo'),
  currency: z.number().min(0).multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais'),
  percentage: z.number().min(0).max(100),

  // Datas
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  dateTimeString: z.string().datetime('Data/hora inválida'),

  // Coordenadas geográficas
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),

  // URLs
  url: z.string().url('URL inválida'),

  // Paginação
  page: z
    .string()
    .optional()
    .transform(val => (val ? Math.max(1, parseInt(val)) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? Math.min(100, Math.max(1, parseInt(val))) : 20)),

  // Ordenação
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
        };

// Funções de validação específicas
export const validators = {
  // Validação de CPF
  cpf: (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11 || /^(.)\1{10}$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }

    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }

    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;

    return remainder === parseInt(cleaned.charAt(10));
  },

  // Validação de CNPJ
  cnpj: (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14 || /^(.)\1{13}$/.test(cleaned)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];

    const calculateDigit = (digits: string, weights: number[]): number => {
      const sum = digits.split('').reduce((acc, digit, index) => {
        const weight = weights[index];
        if (weight !== undefined) {
          return acc + parseInt(digit) * weight;
        }
        return acc;
      }, 0);

      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstDigit = calculateDigit(cleaned.substring(0, 12), weights1);
    const secondDigit = calculateDigit(cleaned.substring(0, 13), weights2);

    return (
      firstDigit === parseInt(cleaned.charAt(12)) && secondDigit === parseInt(cleaned.charAt(13))
    );
  },

  // Validação de senha forte
  strongPassword: (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/.test(password);
  },

  // Validação de CEP
  cep: (cep: string): boolean => {
    return /^\d{8}$/.test(cep.replace(/\D/g, ''));
  },

  // Validação de idade
  minimumAge: (birthDate: Date, minAge: number): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= minAge;
    }

    return age >= minAge;
  },

  // Validação de horário de funcionamento
  businessHours: (time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }
        };

// Schemas personalizados com validações brasileiras
export const brazilianSchemas = {
  cpf: z.string().refine(validators.cpf, 'CPF inválido'),
  cnpj: z.string().refine(validators.cnpj, 'CNPJ inválido'),
  cep: z.string().refine(validators.cep, 'CEP inválido'),
  strongPassword: z
    .string()
    .refine(
      validators.strongPassword,
      'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo'
    )
        } as const;

// Endereço brasileiro completo - definido separadamente para evitar referência circular
export const addressSchema = z.object({
  street: commonSchemas.shortText,
  number: z.string().max(10),
  complement: z.string().max(100).optional(),
  neighborhood: commonSchemas.shortText,
  city: commonSchemas.shortText,
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  cep: z.string().refine(validators.cep, 'CEP inválido'),
  coordinates: z
    .object({
      lat: commonSchemas.latitude,
      lng: commonSchemas.longitude
        })
    .optional()
        });

// Pessoa física
export const individualSchema = z.object({
  name: commonSchemas.name,
  cpf: z.string().refine(validators.cpf, 'CPF inválido'),
  rg: commonSchemas.rg.optional(),
  birthDate: z
    .date()
    .refine(date => validators.minimumAge(date, 0), 'Data de nascimento inválida'),
  phone: commonSchemas.phone,
  email: commonSchemas.email.optional(),
  address: addressSchema.optional()
        });

// Pessoa jurídica
export const companySchema = z.object({
  name: commonSchemas.name,
  cnpj: z.string().refine(validators.cnpj, 'CNPJ inválido'),
  phone: commonSchemas.phone,
  email: commonSchemas.email.optional(),
  address: addressSchema.optional()
        });

// Adicionamos os schemas aos brazilianSchemas depois de definidos
Object.assign(brazilianSchemas, {
  address: addressSchema,
  individual: individualSchema,
  company: companySchema
        });

// Helper para sanitização de dados
export const sanitizers = {
  // Remove caracteres não numéricos
  numbersOnly: (value: string): string => {
    return value.replace(/\D/g, '');
  },

  // Capitaliza primeira letra de cada palavra
  capitalize: (value: string): string => {
    return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  },

  // Remove espaços extras
  trimSpaces: (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
  },

  // Sanitiza email
  email: (value: string): string => {
    return value.toLowerCase().trim();
  },

  // Sanitiza telefone
  phone: (value: string): string => {
    return value.replace(/\D/g, '');
  },

  // Remove HTML tags básicas
  removeHtml: (value: string): string => {
    return value.replace(/<[^>]*>/g, '');
  },

  // Sanitiza texto mantendo apenas caracteres seguros
  safeText: (value: string): string => {
    return value.replace(/[<>\"'&]/g, '');
  }
        };

// Helper para validação condicional
export function conditionalValidation<T>(condition: (data: T) => boolean, schema: ZodSchema<unknown>) {
  return z.unknown().superRefine((data, ctx) => {
    if (condition(data as T)) {
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach(error => {
          ctx.addIssue({
            code: 'custom',
            path: error.path,
            message: error.message
        });
        });
      }
    }
  });
}

// Helper para validação de array único
export function uniqueArray<T>(keyExtractor?: (item: T) => unknown): z.ZodArray<z.ZodUnknown> {
  return z.array(z.unknown()).refine(arr => {
    if (!keyExtractor) {
      return new Set(arr).size === arr.length;
    }

    const keys = arr.map(item => keyExtractor(item as T));
    return new Set(keys).size === keys.length;
  }, 'Array deve conter elementos únicos');
}

// Helper para validação de range de datas
export function dateRange(startField: string = 'startDate', endField: string = 'endDate') {
  return z
    .object({})
    .catchall(z.unknown())
    .refine(data => {
      const startDate = data[startField];
      const endDate = data[endField];

      if (!startDate || !endDate) return true;

      const startDateValue = typeof startDate === 'string' || typeof startDate === 'number' ? startDate : String(startDate);
      const endDateValue = typeof endDate === 'string' || typeof endDate === 'number' ? endDate : String(endDate);
      return new Date(startDateValue) <= new Date(endDateValue);
    }, `${endField} deve ser posterior a ${startField}`);
}

// Helper para validação de horários
export function timeRange(startField: string = 'startTime', endField: string = 'endTime') {
  return z
    .object({})
    .catchall(z.unknown())
    .refine(data => {
      const startTime = data[startField];
      const endTime = data[endField];

      if (!startTime || !endTime) return true;

      const startTimeStr = typeof startTime === 'string' ? startTime : String(startTime);
      const endTimeStr = typeof endTime === 'string' ? endTime : String(endTime);

      const startTimeParts = startTimeStr.split(':').map(Number);
      const endTimeParts = endTimeStr.split(':').map(Number);

      const startHour = startTimeParts[0] ?? 0;
      const startMin = startTimeParts[1] ?? 0;
      const endHour = endTimeParts[0] ?? 0;
      const endMin = endTimeParts[1] ?? 0;

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      return startMinutes < endMinutes;
    }, `${endField} deve ser posterior a ${startField}`);
}

// Helper para criar esquemas de paginação
export function paginationSchema(maxLimit: number = 100) {
  return z.object({
    page: z
      .string()
      .optional()
      .transform(val => (val ? Math.max(1, parseInt(val)) : 1)),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? Math.min(maxLimit, Math.max(1, parseInt(val))) : 20)),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
        });
}

// Helper para transformar strings em tipos apropriados
export const transformers = {
  stringToNumber: z
    .string()
    .transform(val => {
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .optional(),

  stringToBoolean: z.string().transform(val => {
    return val === 'true' || val === '1' || val === 'yes';
  }),

  stringToDate: z
    .string()
    .transform(val => {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    })
    .optional(),

  stringToArray: z.string().transform(val => {
    try {
      return JSON.parse(val);
    } catch {
      return val
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
  })
        };

// Helper para validação de arquivos
export function fileValidation(
  allowedTypes: string[] = [],
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB
) {
  return z
    .object({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string(),
      size: z.number(),
      buffer: z.instanceof(Buffer).optional(),
      filename: z.string().optional(),
      path: z.string().optional()
        })
    .refine(
      file => {
        if (allowedTypes.length > 0) {
          return allowedTypes.includes(file.mimetype);
        }
        return true;
      },
      `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    )
    .refine(
      file => {
        return file.size <= maxSizeBytes;
      },
      `Arquivo muito grande. Tamanho máximo: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
    );
}

// Helper para criar mensagens de erro personalizadas
export function createErrorMessage(field: string, rule: string): string {
  const messages: Record<string, string> = {
    required: `${field} é obrigatório`,
    invalid: `${field} é inválido`,
    too_short: `${field} é muito curto`,
    too_long: `${field} é muito longo`,
    invalid_email: `${field} deve ser um email válido`,
    invalid_phone: `${field} deve ser um telefone válido`,
    invalid_cpf: `${field} deve ser um CPF válido`,
    invalid_cnpj: `${field} deve ser um CNPJ válido`,
    weak_password: `${field} deve ser uma senha forte`,
    future_date: `${field} deve ser uma data futura`,
    past_date: `${field} deve ser uma data passada`
        };

  return messages[rule] || `${field} não atende aos critérios de validação`;
}
