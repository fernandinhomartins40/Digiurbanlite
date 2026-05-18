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

export function FormCard({ fields, onSubmit, submitLabel = 'Enviar' }: FormCardProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    fields.map(normalizeField).forEach((field) => {
      if (field.required && !formData[field.id]) nextErrors[field.id] = 'Campo obrigatorio';
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

      case 'multiselect': {
        const opts = (field.options || []).map(normalizeOption);
        return (
          <div className="space-y-2">
            {opts.map((opt) => {
              const current = Array.isArray(formData[field.id]) ? formData[field.id] : [];
              return (
                <div key={opt.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${opt.value}`}
                    checked={current.includes(opt.value)}
                    onCheckedChange={(val) => {
                      const next = val ? [...current, opt.value] : current.filter((i: string) => i !== opt.value);
                      handleChange(field.id, next);
                    }}
                  />
                  <label htmlFor={`${field.id}-${opt.value}`} className="text-sm text-gray-700 break-words">
                    {opt.label}
                  </label>
                </div>
              );
            })}
          </div>
        );
      }

      case 'checkbox':
      case 'boolean': {
        const opts = (field.options || []).map(normalizeOption);
        if (opts.length >= 2) {
          return (
          <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              {opts.map((opt) => {
                const isSelected = formData[field.id] === opt.value;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-auto min-w-0 rounded-lg py-3 whitespace-normal break-words transition-colors ${
                      isSelected
                        ? opt.value === 'true'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleChange(field.id, opt.value)}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={Boolean(formData[field.id])}
              onCheckedChange={(val) => handleChange(field.id, val)}
            />
            <label htmlFor={field.id} className="text-sm text-gray-700 break-words">{field.label}</label>
          </div>
        );
      }

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={formData[field.id] || ''}
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

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-3.5 space-y-4 overflow-hidden">
      {fields.map((field) => {
        const normalized = normalizeField(field);
        if (!normalized.id) return null;
        return (
          <div key={normalized.id} className="space-y-1.5">
            {normalized.type !== 'checkbox' && normalized.type !== 'boolean' && (
              <Label htmlFor={normalized.id} className="text-sm break-words">
                {normalized.label}
                {normalized.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {renderField(normalized)}
            {normalized.description && (
              <p className="text-xs text-muted-foreground break-words">{normalized.description}</p>
            )}
            {errors[normalized.id] && (
              <p className="text-xs text-red-500">{errors[normalized.id]}</p>
            )}
          </div>
        );
      })}
      <Button className="w-full rounded-lg bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-800 hover:to-teal-800" onClick={handleSubmit}>{submitLabel}</Button>
    </div>
  );
}

export default FormCard;
