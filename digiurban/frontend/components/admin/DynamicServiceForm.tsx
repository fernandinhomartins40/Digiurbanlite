'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'multiselect' | 'checkbox';
  required?: boolean;
  options?: FormFieldOption[];
  placeholder?: string;
  mask?: string;
  min?: number;
  max?: number;
  rows?: number;
  description?: string;
}

interface DynamicServiceFormProps {
  fields: FormField[];
  formData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export function DynamicServiceForm({
  fields,
  formData,
  onChange,
  errors = {}
}: DynamicServiceFormProps) {
  const handleChange = (name: string, value: any) => {
    onChange({ ...formData, [name]: value });
  };

  const handleMultiselectChange = (name: string, value: string, checked: boolean) => {
    const currentValues = formData[name] || [];
    let newValues: string[];

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: string) => v !== value);
    }

    handleChange(name, newValues);
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.name];
    const errorMessage = errors[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            id={field.name}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || field.label}
            className={hasError ? 'border-red-500' : ''}
          />
        );

      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || field.label}
            min={field.min}
            max={field.max}
            step="any"
            className={hasError ? 'border-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Input
            id={field.name}
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className={hasError ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder || field.label}
            rows={field.rows || 4}
            className={hasError ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => handleChange(field.name, value)}
          >
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const currentValues = formData[field.name] || [];
              const isChecked = currentValues.includes(option.value);

              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleMultiselectChange(field.name, option.value, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleChange(field.name, checked)}
            />
            <label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const hasError = !!errors[field.name];
        const errorMessage = errors[field.name];

        if (field.type === 'checkbox') {
          return (
            <div key={field.name} className="space-y-2">
              {renderField(field)}
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
              {hasError && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>
          );
        }

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
