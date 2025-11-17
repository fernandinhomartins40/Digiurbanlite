'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { InputWithCounter } from '@/components/ui/input-with-counter';
import { TextareaWithCounter } from '@/components/ui/textarea-with-counter';
import { Label } from '@/components/ui/label';
import { ModernMaskedInput as MaskedInput } from '@/components/ui/modern-masked-input';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { getFieldHint, getTextareaRows, shouldUseTextarea } from '@/lib/validation-messages';

interface ServiceFormFieldProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
  isPrefilled?: boolean;
}

export function ServiceFormField({ field, value, onChange, isPrefilled = false }: ServiceFormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extrair regras de validação do campo
  const minLength = field.minLength;
  const maxLength = field.maxLength;
  const min = field.min;
  const max = field.max;

  // Gerar hint do campo
  const hint = getFieldHint({
    type: field.type,
    minLength,
    maxLength,
    min,
    max,
    pattern: field.mask,
    placeholder: field.placeholder
  });

  // Determinar se deve usar textarea
  const useTextarea = shouldUseTextarea(field.type, maxLength);
  const textareaRows = useTextarea ? getTextareaRows(maxLength) : 3;

  // Validação onBlur
  const handleBlur = () => {
    setTouched(true);

    if (field.required && !value) {
      setError(`O campo "${field.label}" é obrigatório`);
      return;
    }

    if (minLength && value && value.length < minLength) {
      setError(`O campo "${field.label}" deve ter no mínimo ${minLength} caracteres`);
      return;
    }

    if (maxLength && value && value.length > maxLength) {
      setError(`O campo "${field.label}" deve ter no máximo ${maxLength} caracteres`);
      return;
    }

    if (field.type === 'number') {
      const numValue = Number(value);
      if (min !== undefined && numValue < min) {
        setError(`O valor de "${field.label}" deve ser no mínimo ${min}`);
        return;
      }
      if (max !== undefined && numValue > max) {
        setError(`O valor de "${field.label}" deve ser no máximo ${max}`);
        return;
      }
    }

    setError(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="flex items-center gap-2">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
        {isPrefilled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
            <CheckCircle className="h-3 w-3" />
            Auto-preenchido
          </span>
        )}
      </Label>

      {/* Hint do campo */}
      {hint && (
        <p className="text-xs text-gray-500 -mt-1">{hint}</p>
      )}

      {/* Máscaras têm prioridade */}
      {field.mask === 'cpf' && (
        <MaskedInput
          id={field.id}
          type="cpf"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          required={field.required}
        />
      )}

      {field.mask === 'phone' && (
        <MaskedInput
          id={field.id}
          type="phone"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          required={field.required}
        />
      )}

      {field.mask === 'cep' && (
        <MaskedInput
          id={field.id}
          type="cep"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          required={field.required}
        />
      )}

      {/* Tipos de campo sem máscara */}
      {!field.mask && field.type === 'email' && (
        <Input
          id={field.id}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          placeholder={field.placeholder}
          required={field.required}
        />
      )}

      {!field.mask && field.type === 'date' && (
        <Input
          id={field.id}
          type="date"
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
        />
      )}

      {!field.mask && field.type === 'number' && (
        <Input
          id={field.id}
          type="number"
          inputMode="numeric"
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          placeholder={field.placeholder}
          min={min}
          max={max}
        />
      )}

      {!field.mask && field.type === 'text' && !useTextarea && (
        <InputWithCounter
          id={field.id}
          type="text"
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          placeholder={field.placeholder}
          maxLength={maxLength}
          showCounter={!!maxLength}
        />
      )}

      {!field.mask && (field.type === 'textarea' || useTextarea) && (
        <TextareaWithCounter
          id={field.id}
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          rows={textareaRows}
          className={`resize-none ${isPrefilled ? 'border-green-300 bg-green-50/30' : ''}`}
          placeholder={field.placeholder}
          maxLength={maxLength}
          minLength={minLength}
          showCounter={!!(maxLength || minLength)}
        />
      )}

      {!field.mask && field.type === 'select' && (
        <select
          id={field.id}
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isPrefilled ? 'border-green-300 bg-green-50/30' : 'border-gray-300'
          }`}
        >
          <option value="">Selecione...</option>
          {field.options && field.options.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {!field.mask && field.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <input
            id={field.id}
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor={field.id} className="font-normal cursor-pointer">
            {field.placeholder || field.label}
          </Label>
        </div>
      )}

      {/* Mensagem de erro */}
      {touched && error && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
