'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ModernMaskedInputProps {
  id?: string;
  type?: 'cpf' | 'phone' | 'cep' | 'rg' | 'cnpj' | 'date';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente de input com máscara MODERNO - Solução Profissional
 *
 * ✅ Compatível com Next.js 14
 * ✅ TypeScript nativo
 * ✅ Não quebra onChange
 * ✅ Não interfere com pré-preenchimento
 * ✅ Máscaras aplicadas em tempo real via JavaScript puro
 *
 * SOLUÇÃO: Usa JavaScript puro para aplicar máscaras sem bibliotecas problemáticas
 */
export function ModernMaskedInput({
  id,
  type = 'cpf',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  className
}: ModernMaskedInputProps) {

  // Debug apenas para citizen_phone
  if (id === 'citizen_phone') {
    console.log('📱 [MASKED INPUT] Recebeu value:', value, 'type:', typeof value);
  }

  // Função para aplicar máscara ao valor
  const applyMask = (rawValue: string, maskType: string): string => {
    // Remove tudo que não é número
    const numbers = rawValue.replace(/\D/g, '');

    switch (maskType) {
      case 'cpf':
        // 999.999.999-99
        if (numbers.length <= 11) {
          return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return numbers.substring(0, 11)
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

      case 'cnpj':
        // 99.999.999/9999-99
        if (numbers.length <= 14) {
          return numbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        return numbers.substring(0, 14)
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

      case 'phone':
        // (99) 9999-9999 ou (99) 99999-9999
        if (numbers.length <= 10) {
          return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return numbers.substring(0, 11)
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');

      case 'cep':
        // 99999-999
        return numbers.substring(0, 8)
          .replace(/(\d{5})(\d)/, '$1-$2');

      case 'rg':
        // 99.999.999-9 ou 9.999.999-9
        if (numbers.length <= 8) {
          return numbers
            .replace(/(\d{1})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1})$/, '$1-$2');
        }
        return numbers.substring(0, 9)
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1})$/, '$1-$2');

      case 'date':
        // DD/MM/YYYY (data brasileira)
        return numbers.substring(0, 8)
          .replace(/(\d{2})(\d)/, '$1/$2')
          .replace(/(\d{2})(\d)/, '$1/$2');

      default:
        return numbers;
    }
  };

  // Handler que aplica a máscara e chama o onChange original
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const maskedValue = applyMask(rawValue, type);

    // Cria um novo evento com o valor mascarado
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: maskedValue
      }
    } as React.ChangeEvent<HTMLInputElement>;

    // Chama o onChange original com o valor mascarado
    onChange(syntheticEvent);
  };

  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  );
}

/**
 * Função para remover máscara e obter apenas números
 */
export function unmaskValue(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Função EXPORTADA para aplicar máscara a um valor (uso externo)
 * ✅ Útil para formatar valores vindos do backend/pré-preenchimento
 */
export function formatValue(value: string, type: 'cpf' | 'phone' | 'cep' | 'rg' | 'cnpj' | 'date'): string {
  if (!value) return '';

  const numbers = value.replace(/\D/g, '');

  switch (type) {
    case 'cpf':
      if (numbers.length <= 11) {
        return numbers
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
      return numbers.substring(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    case 'phone':
      if (numbers.length <= 10) {
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
      return numbers.substring(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');

    case 'cep':
      return numbers.substring(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');

    case 'rg':
      if (numbers.length <= 8) {
        return numbers
          .replace(/(\d{1})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1})$/, '$1-$2');
      }
      return numbers.substring(0, 9)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');

    case 'cnpj':
      if (numbers.length <= 14) {
        return numbers
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
      }
      return numbers.substring(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

    case 'date':
      // DD/MM/YYYY (data brasileira)
      return numbers.substring(0, 8)
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');

    default:
      return value;
  }
}

/**
 * Função para obter placeholder baseado no tipo
 */
export function getMaskPlaceholder(type: ModernMaskedInputProps['type']): string {
  switch (type) {
    case 'cpf':
      return '000.000.000-00';
    case 'cnpj':
      return '00.000.000/0000-00';
    case 'phone':
      return '(00) 00000-0000';
    case 'cep':
      return '00000-000';
    case 'rg':
      return '00.000.000-0';
    case 'date':
      return 'DD/MM/AAAA';
    default:
      return '';
  }
}
