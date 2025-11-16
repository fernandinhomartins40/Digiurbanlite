/**
 * ============================================================================
 * TIPOS PARA JSON SCHEMA UNIFICADO
 * ============================================================================
 *
 * Define a estrutura unificada para formulários de serviços usando JSON Schema
 * mantendo separação visual entre campos do cidadão e campos customizados
 */

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: 'date' | 'time' | 'date-time' | 'email' | 'uri' | 'tel';
  enum?: string[];
  enumNames?: string[];
  default?: any;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  widget?: 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'hidden' | 'date' | 'time' | 'datetime';
  errorMessage?: string;
}

export interface UnifiedFormSchema {
  type: 'object';

  // Metadado para separação visual - campos do cidadão que serão pré-preenchidos
  citizenFields?: string[];

  // Todas as propriedades do formulário (cidadão + customizados)
  properties: Record<string, JSONSchemaProperty>;

  // Campos obrigatórios
  required: string[];

  // Dependências entre campos (opcional)
  dependencies?: Record<string, any>;
}

/**
 * Mapeamento completo dos campos do cidadão
 * Estes campos podem ser pré-preenchidos automaticamente
 */
export const CITIZEN_FIELD_DEFINITIONS: Record<string, JSONSchemaProperty> = {
  nome: {
    type: 'string',
    title: 'Nome Completo',
    minLength: 3,
    maxLength: 200
  },
  cpf: {
    type: 'string',
    title: 'CPF',
    pattern: '^\\d{11}$',
    minLength: 11,
    maxLength: 11
  },
  rg: {
    type: 'string',
    title: 'RG',
    minLength: 5,
    maxLength: 20
  },
  dataNascimento: {
    type: 'string',
    format: 'date',
    title: 'Data de Nascimento'
  },
  email: {
    type: 'string',
    format: 'email',
    title: 'E-mail'
  },
  telefone: {
    type: 'string',
    title: 'Telefone Principal',
    pattern: '^\\d{10,11}$',
    minLength: 10,
    maxLength: 11
  },
  telefoneSecundario: {
    type: 'string',
    title: 'Telefone Secundário (opcional)',
    pattern: '^\\d{10,11}$',
    minLength: 10,
    maxLength: 11
  },
  cep: {
    type: 'string',
    title: 'CEP',
    pattern: '^\\d{8}$',
    minLength: 8,
    maxLength: 8
  },
  logradouro: {
    type: 'string',
    title: 'Rua/Avenida',
    minLength: 3,
    maxLength: 200
  },
  numero: {
    type: 'string',
    title: 'Número',
    maxLength: 10
  },
  complemento: {
    type: 'string',
    title: 'Complemento (opcional)',
    maxLength: 100
  },
  bairro: {
    type: 'string',
    title: 'Bairro/Comunidade',
    minLength: 2,
    maxLength: 100
  },
  pontoReferencia: {
    type: 'string',
    title: 'Ponto de Referência (opcional)',
    maxLength: 200
  },
  nomeMae: {
    type: 'string',
    title: 'Nome da Mãe',
    minLength: 3,
    maxLength: 200
  },
  estadoCivil: {
    type: 'string',
    title: 'Estado Civil',
    enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']
  },
  profissao: {
    type: 'string',
    title: 'Profissão/Ocupação',
    maxLength: 100
  },
  rendaFamiliar: {
    type: 'string',
    title: 'Faixa de Renda Familiar',
    enum: ['Até 1 salário mínimo', '1 a 2 salários mínimos', '2 a 3 salários mínimos', '3 a 5 salários mínimos', 'Acima de 5 salários mínimos']
  }
};

/**
 * Campos padrão do cidadão mais comumente usados
 */
export const STANDARD_CITIZEN_FIELDS = [
  'nome',
  'cpf',
  'rg',
  'dataNascimento',
  'email',
  'telefone',
  'telefoneSecundario',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'pontoReferencia',
  'nomeMae',
  'estadoCivil',
  'profissao',
  'rendaFamiliar'
];
