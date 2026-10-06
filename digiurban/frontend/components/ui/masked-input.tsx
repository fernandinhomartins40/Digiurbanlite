'use client';

import React from 'react';
import { ModernMaskedInput, getMaskPlaceholder as modernPlaceholder } from './modern-masked-input';

interface MaskedInputProps {
  id?: string;
  type?: 'cpf' | 'phone' | 'cep' | 'date' | 'rg' | 'cnpj' | 'cpf-cnpj' | 'currency';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Campo com máscara. Agora é o mesmo componente do ModernMaskedInput: o antigo
 * usava react-input-mask com máscara em forma de função (telefone, RG, CPF/CNPJ),
 * o que essa biblioteca não aceita — o campo não mascarava direito.
 */
export function MaskedInput({ type = 'cpf', ...props }: MaskedInputProps) {
  return <ModernMaskedInput type={type} {...props} />;
}

/**
 * Placeholder baseado no tipo de máscara
 */
export function getMaskPlaceholder(type: MaskedInputProps['type']): string {
  return modernPlaceholder(type);
}

/**
 * Função para remover máscara e obter apenas números
 */
export function unmaskValue(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Função para validar CPF
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = unmaskValue(cpf);

  if (numbers.length !== 11) return false;

  // Validar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;

  return true;
}

/**
 * Função para validar CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numbers = unmaskValue(cnpj);

  if (numbers.length !== 14) return false;

  // Validar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;

  // Validar primeiro dígito verificador
  let size = numbers.length - 2;
  let nums = numbers.substring(0, size);
  const digits = numbers.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validar segundo dígito verificador
  size = size + 1;
  nums = numbers.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(nums.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Função para validar telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const numbers = unmaskValue(phone);
  return numbers.length === 10 || numbers.length === 11;
}

/**
 * Função para validar CEP
 */
export function isValidCEP(cep: string): boolean {
  const numbers = unmaskValue(cep);
  return numbers.length === 8;
}
