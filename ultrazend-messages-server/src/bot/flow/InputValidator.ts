/**
 * InputValidator
 * Validação de entradas do usuário
 */

import { QuestionNodeConfig } from '../types';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class InputValidator {
  /**
   * Valida input baseado na configuração de validação
   */
  validate(
    input: string,
    validation: QuestionNodeConfig['validation']
  ): ValidationResult {
    if (!validation) {
      return { valid: true };
    }

    const value = String(input).trim();

    switch (validation.type) {
      case 'text':
        return this.validateText(value, validation);
      case 'number':
        return this.validateNumber(value, validation);
      case 'email':
        return this.validateEmail(value);
      case 'cpf':
        return this.validateCPF(value);
      case 'phone':
        return this.validatePhone(value);
      case 'date':
        return this.validateDate(value);
      case 'protocol':
        return this.validateProtocol(value);
      default:
        return { valid: true };
    }
  }

  private validateText(
    value: string,
    validation: QuestionNodeConfig['validation']
  ): ValidationResult {
    if (validation?.minLength && value.length < validation.minLength) {
      return {
        valid: false,
        error: `Mínimo de ${validation.minLength} caracteres`,
      };
    }

    if (validation?.maxLength && value.length > validation.maxLength) {
      return {
        valid: false,
        error: `Máximo de ${validation.maxLength} caracteres`,
      };
    }

    if (validation?.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return {
          valid: false,
          error: validation.errorMessage || 'Formato inválido',
        };
      }
    }

    return { valid: true };
  }

  private validateNumber(
    value: string,
    validation: QuestionNodeConfig['validation']
  ): ValidationResult {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, error: 'Deve ser um número válido' };
    }

    if (validation?.min !== undefined && num < validation.min) {
      return { valid: false, error: `Valor mínimo: ${validation.min}` };
    }

    if (validation?.max !== undefined && num > validation.max) {
      return { valid: false, error: `Valor máximo: ${validation.max}` };
    }

    return { valid: true };
  }

  private validateEmail(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Email inválido' };
    }

    return { valid: true };
  }

  private validateCPF(value: string): ValidationResult {
    // Remove caracteres não numéricos
    const cpf = value.replace(/\D/g, '');

    if (cpf.length !== 11) {
      return { valid: false, error: 'CPF deve ter 11 dígitos' };
    }

    // Valida CPFs conhecidos como inválidos
    if (/^(\d)\1{10}$/.test(cpf)) {
      return { valid: false, error: 'CPF inválido' };
    }

    // Valida dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;

    if (digit !== parseInt(cpf.charAt(9))) {
      return { valid: false, error: 'CPF inválido' };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;

    if (digit !== parseInt(cpf.charAt(10))) {
      return { valid: false, error: 'CPF inválido' };
    }

    return { valid: true };
  }

  private validatePhone(value: string): ValidationResult {
    // Remove caracteres não numéricos
    const phone = value.replace(/\D/g, '');

    // Aceita telefones com 10 ou 11 dígitos (com ou sem DDD)
    if (phone.length < 10 || phone.length > 11) {
      return {
        valid: false,
        error: 'Telefone inválido. Use formato: (XX) XXXXX-XXXX',
      };
    }

    return { valid: true };
  }

  private validateDate(value: string): ValidationResult {
    // Aceita formatos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
    ];

    const matchesFormat = formats.some((format) => format.test(value));

    if (!matchesFormat) {
      return {
        valid: false,
        error: 'Data inválida. Use formato: DD/MM/AAAA',
      };
    }

    // Tenta parsear a data
    let date: Date;
    if (value.includes('/')) {
      const [day, month, year] = value.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = value.split('-');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Data inválida' };
    }

    return { valid: true };
  }

  private validateProtocol(value: string): ValidationResult {
    // Remove espaços
    const protocol = value.trim();

    // Protocolo deve ter no mínimo 4 caracteres
    if (protocol.length < 4) {
      return {
        valid: false,
        error: 'Número de protocolo inválido',
      };
    }

    return { valid: true };
  }

  /**
   * Sanitiza input removendo caracteres perigosos
   */
  sanitize(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Valida tamanho de arquivo
   */
  validateFileSize(sizeInBytes: number, maxSizeInMB: number): ValidationResult {
    const maxBytes = maxSizeInMB * 1024 * 1024;

    if (sizeInBytes > maxBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Valida tipo de arquivo
   */
  validateFileType(
    mimeType: string,
    allowedTypes: string[]
  ): ValidationResult {
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return mimeType.startsWith(category + '/');
      }
      return mimeType === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }
}
