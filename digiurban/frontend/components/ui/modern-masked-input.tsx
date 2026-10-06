'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type MaskType = 'cpf' | 'phone' | 'cep' | 'rg' | 'cnpj' | 'date' | 'cpf-cnpj' | 'currency';

interface ModernMaskedInputProps {
  id?: string;
  name?: string;
  type?: MaskType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

const formatCpf = (n: string) =>
  n.substring(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

const formatCnpj = (n: string) =>
  n
    .substring(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');

/**
 * Aplica a máscara a qualquer valor (digitado ou vindo do servidor).
 * Uma regra só para o campo e para a formatação de dados pré-preenchidos.
 */
export function formatValue(value: string, type: MaskType): string {
  if (!value) return '';
  const n = String(value).replace(/\D/g, '');

  switch (type) {
    case 'cpf':
      return formatCpf(n);
    case 'cnpj':
      return formatCnpj(n);
    case 'cpf-cnpj':
      return n.length <= 11 ? formatCpf(n) : formatCnpj(n);
    case 'phone':
      if (n.length <= 10) return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
      return n.substring(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    case 'cep':
      return n.substring(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
    case 'rg':
      if (n.length <= 8) return n.replace(/(\d{1})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1})$/, '$1-$2');
      return n.substring(0, 9).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1})$/, '$1-$2');
    case 'date':
      return n.substring(0, 8).replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2');
    case 'currency': {
      if (!n) return '';
      const cents = Number(n.substring(0, 13));
      return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    default:
      return value;
  }
}

/**
 * Campo com máscara em JavaScript puro (sem react-input-mask, que não aceita
 * máscara dinâmica e quebrava telefone/RG). Devolve no onChange o próprio
 * evento do campo, com o valor já mascarado — name/id continuam disponíveis.
 */
export function ModernMaskedInput({
  id,
  name,
  type = 'cpf',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  className,
  autoComplete,
}: ModernMaskedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatValue(e.target.value, type);
    onChange(e);
  };

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode={type === 'currency' || type === 'date' || type === 'cep' || type === 'phone' || type === 'cpf' ? 'numeric' : undefined}
      autoComplete={autoComplete}
      // valor vindo do servidor só com números já aparece formatado
      value={type === 'date' || type === 'currency' ? value ?? '' : formatValue(value ?? '', type)}
      onChange={handleChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      placeholder={placeholder ?? getMaskPlaceholder(type)}
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

/** Remove a máscara (só números) */
export function unmaskValue(value: string): string {
  return value.replace(/\D/g, '');
}

export function getMaskPlaceholder(type: MaskType | undefined): string {
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
    case 'rg':
      return '00.000.000-0';
    case 'date':
      return 'DD/MM/AAAA';
    case 'currency':
      return 'R$ 0,00';
    default:
      return '';
  }
}
