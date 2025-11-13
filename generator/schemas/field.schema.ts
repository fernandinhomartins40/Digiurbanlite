import { z } from 'zod';

export const fieldTypeEnum = z.enum([
  'string',
  'text',
  'number',
  'email',
  'phone',
  'cpf',
  'cnpj',
  'cep',
  'date',
  'datetime',
  'time',
  'boolean',
  'select',
  'multiselect',
  'radio',
  'file',
  'image',
  'currency',
  'percentage',
  'url',
  'color',
  'reference'
]);

export type FieldType = z.infer<typeof fieldTypeEnum>;

export const fieldConfigSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: fieldTypeEnum,
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.any().optional(),

  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    custom: z.string().optional()
  }).optional(),

  config: z.object({
    options: z.array(z.object({
      label: z.string(),
      value: z.string()
    })).optional(),
    referenceModel: z.string().optional(),
    referenceDisplayField: z.string().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    step: z.number().optional(),
    maxLength: z.number().optional(),
    minLength: z.number().optional(),
    accept: z.array(z.string()).optional(),
    maxSize: z.number().optional()
  }).optional(),

  display: z.object({
    showInList: z.boolean(),
    showInDetail: z.boolean(),
    showInForm: z.boolean(),
    order: z.number(),
    width: z.string().optional(),
    format: z.string().optional()
  }).optional()
});

export type FieldConfig = z.infer<typeof fieldConfigSchema>;
