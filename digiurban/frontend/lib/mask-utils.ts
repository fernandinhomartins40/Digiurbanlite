/**
 * Funções utilitárias para aplicar máscaras manualmente
 * Usadas para formatar valores pré-preenchidos antes de enviar para o MaskedInput
 */

/**
 * Remove todos os caracteres não numéricos
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function maskCPF(value: string): string {
  const numbers = unmask(value);
  if (numbers.length !== 11) return value;
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Aplica máscara de RG: 00.000.000-0 ou 0.000.000-0
 */
export function maskRG(value: string): string {
  const numbers = unmask(value);
  if (numbers.length === 8) {
    return numbers.replace(/(\d{1})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  } else if (numbers.length === 9) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  }
  return value;
}

/**
 * Aplica máscara de telefone: (00) 0000-0000 ou (00) 00000-0000
 */
export function maskPhone(value: string): string {
  const numbers = unmask(value);
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return value;
}

/**
 * Aplica máscara de CEP: 00000-000
 */
export function maskCEP(value: string): string {
  const numbers = unmask(value);
  if (numbers.length !== 8) return value;
  return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Aplica máscara de data: DD/MM/AAAA
 */
export function maskDate(value: string): string {
  // Se já estiver no formato YYYY-MM-DD, converter
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  const numbers = unmask(value);
  if (numbers.length !== 8) return value;
  return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCNPJ(value: string): string {
  const numbers = unmask(value);
  if (numbers.length !== 14) return value;
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Aplica máscara apropriada baseado no tipo
 */
export function applyMask(value: string, type: 'cpf' | 'rg' | 'phone' | 'cep' | 'date' | 'cnpj' | 'cpf-cnpj'): string {
  if (!value) return '';

  switch (type) {
    case 'cpf':
      return maskCPF(value);
    case 'rg':
      return maskRG(value);
    case 'phone':
      return maskPhone(value);
    case 'cep':
      return maskCEP(value);
    case 'date':
      return maskDate(value);
    case 'cnpj':
      return maskCNPJ(value);
    case 'cpf-cnpj':
      const numbers = unmask(value);
      return numbers.length <= 11 ? maskCPF(value) : maskCNPJ(value);
    default:
      return value;
  }
}
