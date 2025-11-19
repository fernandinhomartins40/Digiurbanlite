'use client';

import React, { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import { cn } from '@/lib/utils';

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
 * Componente de input com máscara para formatação automática
 * Suporta: CPF, Telefone, CEP, Data, RG, CNPJ, CPF/CNPJ, Moeda
 *
 * SOLUÇÃO PROFISSIONAL: Usa estado interno para garantir que o react-input-mask
 * processe o valor inicial corretamente, sincronizando com props.value
 */
export function MaskedInput({
  id,
  type = 'cpf',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  className
}: MaskedInputProps) {

  // Debug para citizen_phone
  if (id === 'citizen_phone') {
    console.log('📱 [MASKED INPUT] Recebeu:', { value, type: typeof value });
  }

  // ✅ FIX: react-input-mask não funciona bem com valores pré-formatados
  // Extrair apenas números do valor para garantir que a máscara seja aplicada corretamente
  const cleanValue = value ? value.replace(/\D/g, '') : '';

  if (id === 'citizen_phone') {
    console.log('📱 [MASKED INPUT] Limpou para:', cleanValue);
  }

  // Definir máscara baseado no tipo
  const getMask = (): string | (string | RegExp)[] | ((value: string) => string) => {
    switch (type) {
      case 'cpf':
        return '999.999.999-99';

      case 'cnpj':
        return '99.999.999/9999-99';

      case 'cpf-cnpj':
        // Máscara dinâmica: CPF ou CNPJ baseado no tamanho
        return (value: string) => {
          const numbers = value.replace(/\D/g, '');
          if (numbers.length <= 11) {
            return '999.999.999-999'; // CPF
          }
          return '99.999.999/9999-99'; // CNPJ
        };

      case 'phone':
        // Máscara dinâmica: (99) 9999-9999 ou (99) 99999-9999
        return (value: string) => {
          const numbers = value.replace(/\D/g, '');
          if (numbers.length <= 10) {
            return '(99) 9999-9999'; // Fixo
          }
          return '(99) 99999-9999'; // Celular
        };

      case 'cep':
        return '99999-999';

      case 'date':
        return '99/99/9999';

      case 'rg':
        // Máscara dinâmica baseada no comprimento
        // Suporta RGs de 8 dígitos (X.XXX.XXX-X) ou 9 dígitos (XX.XXX.XXX-X)
        return (value: string) => {
          const numbers = value.replace(/\D/g, '');
          // Se tem até 8 dígitos, usa formato com 1 dígito inicial
          // Se tem 9 dígitos, usa formato com 2 dígitos iniciais
          if (numbers.length <= 8) {
            return '9.999.999-9';
          }
          return '99.999.999-9';
        };

      case 'currency':
        return 'R$ 999.999.999,99';

      default:
        return '';
    }
  };

  const mask = getMask();

  return (
    <InputMask
      id={id}
      mask={mask as any}
      value={cleanValue}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      alwaysShowMask={false}
      maskChar={null}
    >
      {/* @ts-ignore */}
      {(inputProps: any) => (
        <input
          {...inputProps}
          type="text"
          required={required}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        />
      )}
    </InputMask>
  );
}

/**
 * Hook para obter placeholder baseado no tipo de máscara
 */
export function getMaskPlaceholder(type: MaskedInputProps['type']): string {
  switch (type) {
    case 'cpf':
      return '000.000.000-00';
    case 'cnpj':
      return '00.000.000/0000-00';
    case 'cpf-cnpj':
      return 'CPF ou CNPJ';
    case 'phone':
      return '(00) 00000-0000';
    case 'cep':
      return '00000-000';
    case 'date':
      return 'DD/MM/AAAA';
    case 'rg':
      return '00.000.000-0';
    case 'currency':
      return 'R$ 0,00';
    default:
      return '';
  }
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
