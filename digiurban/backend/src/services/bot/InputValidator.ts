import { ValidationRule, InputValidator as IInputValidator } from './types';

/**
 * InputValidator - Sistema de validação inteligente de entradas
 *
 * Valida dados do usuário e oferece sugestões/correções automáticas
 */
export class InputValidator {
  /**
   * Valida número de protocolo
   */
  public static validateProtocolNumber(value: string): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    // Remove espaços e caracteres especiais
    const cleaned = value.replace(/[^\d]/g, '');

    if (!cleaned) {
      return {
        isValid: false,
        error: 'Número de protocolo inválido.',
      };
    }

    // Protocolo deve ter entre 4 e 10 dígitos
    if (cleaned.length < 4 || cleaned.length > 10) {
      return {
        isValid: false,
        error: 'Número de protocolo deve ter entre 4 e 10 dígitos.',
      };
    }

    // Formata com zeros à esquerda se necessário
    const formatted = cleaned.padStart(10, '0');

    return {
      isValid: true,
      suggestion: formatted !== value ? formatted : undefined,
    };
  }

  /**
   * Valida CPF
   */
  public static validateCPF(value: string): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    // Remove formatação
    const cleaned = value.replace(/[^\d]/g, '');

    if (cleaned.length !== 11) {
      return {
        isValid: false,
        error: 'CPF deve ter 11 dígitos.',
      };
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return {
        isValid: false,
        error: 'CPF inválido.',
      };
    }

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;

    if (digit !== parseInt(cleaned.charAt(9))) {
      return {
        isValid: false,
        error: 'CPF inválido.',
      };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;

    if (digit !== parseInt(cleaned.charAt(10))) {
      return {
        isValid: false,
        error: 'CPF inválido.',
      };
    }

    // Formata CPF
    const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    return {
      isValid: true,
      suggestion: formatted !== value ? formatted : undefined,
    };
  }

  /**
   * Valida telefone
   */
  public static validatePhone(value: string): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    const cleaned = value.replace(/[^\d]/g, '');

    if (cleaned.length < 10 || cleaned.length > 11) {
      return {
        isValid: false,
        error: 'Telefone deve ter 10 ou 11 dígitos (com DDD).',
      };
    }

    // Verifica DDD válido (11-99)
    const ddd = parseInt(cleaned.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return {
        isValid: false,
        error: 'DDD inválido.',
      };
    }

    // Formata telefone
    let formatted: string;
    if (cleaned.length === 11) {
      // Celular: (XX) 9XXXX-XXXX
      formatted = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
      // Fixo: (XX) XXXX-XXXX
      formatted = cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return {
      isValid: true,
      suggestion: formatted !== value ? formatted : undefined,
    };
  }

  /**
   * Valida CEP
   */
  public static validateCEP(value: string): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    const cleaned = value.replace(/[^\d]/g, '');

    if (cleaned.length !== 8) {
      return {
        isValid: false,
        error: 'CEP deve ter 8 dígitos.',
      };
    }

    // Formata CEP
    const formatted = cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');

    return {
      isValid: true,
      suggestion: formatted !== value ? formatted : undefined,
    };
  }

  /**
   * Valida data
   */
  public static validateDate(value: string, options?: {
    minDate?: Date | 'today';
    maxDate?: Date | string; // '+30days', '+1year', etc
    allowPast?: boolean;
  }): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    // Tenta parsear a data
    let date: Date;

    // Aceita vários formatos
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];

    let matched = false;
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[1]) {
          // YYYY-MM-DD
          date = new Date(value);
        } else {
          // DD/MM/YYYY ou DD-MM-YYYY
          date = new Date(`${match[3]}-${match[2]}-${match[1]}`);
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      return {
        isValid: false,
        error: 'Data inválida. Use o formato DD/MM/YYYY.',
      };
    }

    if (isNaN(date!.getTime())) {
      return {
        isValid: false,
        error: 'Data inválida.',
      };
    }

    // Valida data mínima
    if (options?.minDate) {
      const minDate = options.minDate === 'today' ? new Date() : options.minDate;
      minDate.setHours(0, 0, 0, 0);
      date!.setHours(0, 0, 0, 0);

      if (date! < minDate) {
        return {
          isValid: false,
          error: 'Data não pode ser no passado.',
        };
      }
    }

    // Valida data máxima
    if (options?.maxDate) {
      let maxDate: Date;

      if (typeof options.maxDate === 'string') {
        // Parse strings como '+30days', '+1year'
        const match = options.maxDate.match(/\+(\d+)(days?|months?|years?)/);
        if (match) {
          const amount = parseInt(match[1]);
          const unit = match[2];

          maxDate = new Date();
          if (unit.startsWith('day')) {
            maxDate.setDate(maxDate.getDate() + amount);
          } else if (unit.startsWith('month')) {
            maxDate.setMonth(maxDate.getMonth() + amount);
          } else if (unit.startsWith('year')) {
            maxDate.setFullYear(maxDate.getFullYear() + amount);
          }
        } else {
          maxDate = new Date(options.maxDate);
        }
      } else {
        maxDate = options.maxDate;
      }

      maxDate!.setHours(23, 59, 59, 999);

      if (date! > maxDate!) {
        return {
          isValid: false,
          error: `Data não pode ser depois de ${maxDate!.toLocaleDateString('pt-BR')}.`,
        };
      }
    }

    return {
      isValid: true,
    };
  }

  /**
   * Valida email
   */
  public static validateEmail(value: string): {
    isValid: boolean;
    error?: string;
  } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        error: 'Email inválido.',
      };
    }

    return { isValid: true };
  }

  /**
   * Detecta tipo de dado automaticamente e oferece sugestões
   */
  public static autoDetect(value: string): {
    possibleTypes: Array<{
      type: 'protocol' | 'cpf' | 'phone' | 'cep' | 'date' | 'email';
      label: string;
      formatted?: string;
    }>;
  } {
    const possibilities: any[] = [];

    // Remove espaços
    const trimmed = value.trim();

    // Testa protocolo
    const protocolTest = this.validateProtocolNumber(trimmed);
    if (protocolTest.isValid) {
      possibilities.push({
        type: 'protocol',
        label: `Protocolo #${protocolTest.suggestion || trimmed}`,
        formatted: protocolTest.suggestion,
      });
    }

    // Testa CPF
    const cpfTest = this.validateCPF(trimmed);
    if (cpfTest.isValid) {
      possibilities.push({
        type: 'cpf',
        label: `CPF ${cpfTest.suggestion || trimmed}`,
        formatted: cpfTest.suggestion,
      });
    }

    // Testa telefone
    const phoneTest = this.validatePhone(trimmed);
    if (phoneTest.isValid) {
      possibilities.push({
        type: 'phone',
        label: `Telefone ${phoneTest.suggestion || trimmed}`,
        formatted: phoneTest.suggestion,
      });
    }

    // Testa CEP
    const cepTest = this.validateCEP(trimmed);
    if (cepTest.isValid) {
      possibilities.push({
        type: 'cep',
        label: `CEP ${cepTest.suggestion || trimmed}`,
        formatted: cepTest.suggestion,
      });
    }

    // Testa email
    const emailTest = this.validateEmail(trimmed);
    if (emailTest.isValid) {
      possibilities.push({
        type: 'email',
        label: `Email ${trimmed}`,
      });
    }

    return { possibleTypes: possibilities };
  }

  /**
   * Corrige erros comuns de digitação
   */
  public static autoCorrect(value: string, context?: string): string {
    let corrected = value;

    // Remove espaços múltiplos
    corrected = corrected.replace(/\s+/g, ' ');

    // Trim
    corrected = corrected.trim();

    // Correções específicas por contexto
    if (context === 'name') {
      // Capitaliza nomes próprios
      corrected = corrected
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    if (context === 'phone') {
      // Remove tudo exceto números
      corrected = corrected.replace(/[^\d]/g, '');
    }

    if (context === 'cpf') {
      // Remove tudo exceto números
      corrected = corrected.replace(/[^\d]/g, '');
    }

    return corrected;
  }

  /**
   * Valida campo customizado com regras
   */
  public static validateField(
    value: any,
    rules: ValidationRule[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const rule of rules) {
      if (!rule.validator(value)) {
        errors.push(rule.errorMessage);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Cria regras de validação comuns
   */
  public static createRules = {
    required: (fieldName: string): ValidationRule => ({
      type: 'required',
      errorMessage: `${fieldName} é obrigatório.`,
      validator: (value: any) => value !== null && value !== undefined && value !== '',
    }),

    minLength: (min: number, fieldName: string): ValidationRule => ({
      type: 'length',
      errorMessage: `${fieldName} deve ter pelo menos ${min} caracteres.`,
      validator: (value: string) => value.length >= min,
    }),

    maxLength: (max: number, fieldName: string): ValidationRule => ({
      type: 'length',
      errorMessage: `${fieldName} deve ter no máximo ${max} caracteres.`,
      validator: (value: string) => value.length <= max,
    }),

    pattern: (regex: RegExp, fieldName: string, example?: string): ValidationRule => ({
      type: 'format',
      errorMessage: `${fieldName} está em formato inválido.${example ? ` Exemplo: ${example}` : ''}`,
      validator: (value: string) => regex.test(value),
    }),

    custom: (
      validator: (value: any) => boolean,
      errorMessage: string
    ): ValidationRule => ({
      type: 'custom',
      errorMessage,
      validator,
    }),
  };
}

export default InputValidator;
