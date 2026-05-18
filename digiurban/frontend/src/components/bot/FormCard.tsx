'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Check } from 'lucide-react';

interface FormFieldOption {
  value?: string;
  id?: string;
  label: string;
}

function normalizeOption(opt: FormFieldOption): { value: string; label: string } {
  return { value: opt.value || opt.id || opt.label, label: opt.label };
}

interface FormField {
  id?: string;
  name?: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: FormFieldOption[];
  placeholder?: string;
  description?: string;
}

interface FormCardProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
}

const normalizeField = (field: FormField) => {
  const id = field.id || field.name || '';
  return { ...field, id, label: field.label || id, type: field.type || 'text' } as Required<FormField>;
};

// Verifica se um valor deve ser considerado "preenchido" para validação de required
function hasValue(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true; // false, 0, "false" são valores válidos
}

export function FormCard({ fields, onSubmit, submitLabel = 'Enviar' }: FormCardProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Limpa erro ao preencher
    if (errors[id]) setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    fields.map(normalizeField).forEach((field) => {
      if (field.required && !hasValue(formData[field.id])) {
        nextErrors[field.id] = 'Campo obrigatório';
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(formData);
  };

  const renderField = (field: Required<FormField>) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
            className="resize-none"
          />
        );

      case 'select': {
        const opts = (field.options || []).map(normalizeOption);
        return (
          <Select value={formData[field.id] ?? ''} onValueChange={(v) => handleChange(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Selecione'} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case 'radio': {
        const opts = (field.options || []).map(normalizeOption);
        return (
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            {opts.map((opt) => {
              const isSelected = formData[field.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(field.id, opt.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors min-w-0 break-words ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      }

      case 'multiselect': {
        const opts = (field.options || []).map(normalizeOption);
        return (
          <div className="space-y-2">
            {opts.map((opt) => {
              const current = Array.isArray(formData[field.id]) ? formData[field.id] : [];
              const isChecked = current.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = isChecked
                      ? current.filter((i: string) => i !== opt.value)
                      : [...current, opt.value];
                    handleChange(field.id, next);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors min-w-0 break-words ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50 text-blue-800 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${
                    isChecked ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}>
                    {isChecked && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      }

      case 'checkbox':
      case 'boolean': {
        // Opções explícitas → botões de seleção (Sim/Não ou qualquer par)
        const rawOpts = field.options || [];
        const opts = rawOpts.length >= 2
          ? rawOpts.map(normalizeOption)
          : [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }];

        // Normaliza valor atual: aceita boolean nativo e string "true"/"false"
        const rawVal = formData[field.id];
        const currentStr =
          rawVal === true ? 'true' :
          rawVal === false ? 'false' :
          rawVal != null ? String(rawVal) : undefined;

        // Se tem exatamente 2 opções (ou é boolean puro), mostra par de botões
        if (rawOpts.length !== 1) {
          return (
            <div className="grid grid-cols-2 gap-2">
              {opts.map((opt) => {
                const isSelected = currentStr === opt.value;
                const isPositive = opt.value === 'true' || opt.value === 'sim' || opt.value === 'yes';
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange(field.id, opt.value)}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-2 text-sm font-medium transition-colors min-w-0 break-words ${
                      isSelected
                        ? isPositive
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          );
        }

        // Opção única → checkbox de aceite/concordância
        const singleOpt = opts[0];
        return (
          <button
            type="button"
            onClick={() => handleChange(field.id, !formData[field.id])}
            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors ${
              formData[field.id]
                ? 'border-blue-600 bg-blue-50 text-blue-800'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${
              formData[field.id] ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
            }`}>
              {formData[field.id] && <Check className="h-3 w-3 text-white" />}
            </span>
            <span className="break-words">{singleOpt.label || field.label}</span>
          </button>
        );
      }

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={formData[field.id] ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
          />
        );

      case 'email':
        return (
          <Input
            id={field.id}
            type="email"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
          />
        );

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );

      default:
        return (
          <Input
            id={field.id}
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
          />
        );
    }
  };

  // Tipos que mostram o label separado (acima do campo)
  const showLabelAbove = (type: string) => !['checkbox', 'boolean'].includes(type);

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-3.5 space-y-4 overflow-hidden">
      {fields.map((field) => {
        const normalized = normalizeField(field);
        if (!normalized.id) return null;
        return (
          <div key={normalized.id} className="space-y-1.5 min-w-0">
            {showLabelAbove(normalized.type) && (
              <Label htmlFor={normalized.id} className="text-sm font-medium break-words">
                {normalized.label}
                {normalized.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {normalized.type === 'checkbox' || normalized.type === 'boolean' ? (
              <div>
                <p className="text-sm font-medium text-gray-800 mb-1.5 break-words">
                  {normalized.label}
                  {normalized.required && <span className="text-red-500 ml-1">*</span>}
                </p>
                {renderField(normalized)}
              </div>
            ) : renderField(normalized)}
            {normalized.description && (
              <p className="text-xs text-muted-foreground break-words">{normalized.description}</p>
            )}
            {errors[normalized.id] && (
              <p className="text-xs text-red-500">{errors[normalized.id]}</p>
            )}
          </div>
        );
      })}
      <Button
        className="w-full rounded-lg bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800"
        onClick={handleSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

export default FormCard;
