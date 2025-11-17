/**
 * Biblioteca de mensagens de validação customizadas
 *
 * Transforma mensagens técnicas em mensagens amigáveis para o usuário
 */

interface ValidationRule {
  type: string;
  value?: number | string;
}

/**
 * Gera mensagem de erro amigável baseada na regra de validação
 */
export function getValidationMessage(
  fieldLabel: string,
  rule: ValidationRule
): string {
  switch (rule.type) {
    case 'required':
      return `O campo "${fieldLabel}" é obrigatório`;

    case 'minLength':
      return `O campo "${fieldLabel}" deve ter no mínimo ${rule.value} caracteres`;

    case 'maxLength':
      return `O campo "${fieldLabel}" deve ter no máximo ${rule.value} caracteres`;

    case 'min':
      return `O valor de "${fieldLabel}" deve ser no mínimo ${rule.value}`;

    case 'max':
      return `O valor de "${fieldLabel}" deve ser no máximo ${rule.value}`;

    case 'pattern':
      return `O formato do campo "${fieldLabel}" é inválido`;

    case 'email':
      return `Digite um e-mail válido em "${fieldLabel}"`;

    case 'cpf':
      return `O CPF informado em "${fieldLabel}" é inválido`;

    case 'phone':
      return `O telefone informado em "${fieldLabel}" é inválido`;

    case 'cep':
      return `O CEP informado em "${fieldLabel}" é inválido`;

    case 'date':
      return `Digite uma data válida em "${fieldLabel}"`;

    case 'url':
      return `Digite uma URL válida em "${fieldLabel}"`;

    case 'number':
      return `O campo "${fieldLabel}" deve conter apenas números`;

    case 'enum':
      return `Selecione uma opção válida em "${fieldLabel}"`;

    default:
      return `O campo "${fieldLabel}" contém um valor inválido`;
  }
}

/**
 * Gera dica de preenchimento baseada nas regras do campo
 */
export function getFieldHint(field: {
  type?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  placeholder?: string;
}): string | null {
  const hints: string[] = [];

  // Dica de tamanho para textos
  if (field.minLength && field.maxLength) {
    hints.push(`Entre ${field.minLength} e ${field.maxLength} caracteres`);
  } else if (field.minLength) {
    hints.push(`Mínimo de ${field.minLength} caracteres`);
  } else if (field.maxLength) {
    hints.push(`Máximo de ${field.maxLength} caracteres`);
  }

  // Dica de valor para números
  if (field.type === 'number') {
    if (field.min !== undefined && field.max !== undefined) {
      hints.push(`Valor entre ${field.min} e ${field.max}`);
    } else if (field.min !== undefined) {
      hints.push(`Valor mínimo: ${field.min}`);
    } else if (field.max !== undefined) {
      hints.push(`Valor máximo: ${field.max}`);
    }
  }

  // Dica de formato
  if (field.pattern) {
    switch (field.pattern) {
      case 'cpf':
        hints.push('Formato: 000.000.000-00');
        break;
      case 'phone':
        hints.push('Formato: (00) 00000-0000');
        break;
      case 'cep':
        hints.push('Formato: 00000-000');
        break;
      case 'date':
        hints.push('Formato: DD/MM/AAAA');
        break;
    }
  }

  // Usar placeholder como hint se não houver outras dicas
  if (hints.length === 0 && field.placeholder) {
    return field.placeholder;
  }

  return hints.length > 0 ? hints.join(' • ') : null;
}

/**
 * Calcula o número de linhas ideal para um textarea baseado no maxLength
 */
export function getTextareaRows(maxLength?: number): number {
  if (!maxLength) return 3;

  if (maxLength <= 100) return 3;
  if (maxLength <= 300) return 5;
  if (maxLength <= 500) return 7;
  if (maxLength <= 1000) return 10;

  return 12;
}

/**
 * Determina se um campo deve ser renderizado como textarea baseado no maxLength
 */
export function shouldUseTextarea(type: string, maxLength?: number): boolean {
  if (type === 'textarea') return true;
  if (type !== 'text' && type !== 'string') return false;

  // Se maxLength >= 100, usar textarea
  return maxLength !== undefined && maxLength >= 100;
}
