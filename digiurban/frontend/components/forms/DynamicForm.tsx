'use client';

/**
 * ============================================================================
 * DYNAMIC FORM COMPONENT
 * ============================================================================
 *
 * Componente que gera formulários dinamicamente a partir de JSON Schema
 * Integra com React Hook Form + Zod para validação
 * Suporta todos os tipos de campos necessários para os 102 módulos
 */

import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: 'date' | 'time' | 'date-time' | 'email' | 'uri' | 'tel';
  enum?: string[];
  enumNames?: string[];
  default?: any;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  widget?: 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'hidden' | 'date' | 'time' | 'datetime';
  errorMessage?: string;
  [key: string]: any; // Permite propriedades customizadas como 'x-component'
}

export interface JSONSchema {
  type: 'object';
  title?: string;
  description?: string;
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  dependencies?: Record<string, any>;
}

export interface DynamicFormProps {
  schema: JSONSchema;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  defaultValues?: Record<string, any>;
  submitLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CONVERSÃO JSON SCHEMA → ZOD
// ============================================================================

function jsonSchemaToZod(jsonSchema: JSONSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  Object.entries(jsonSchema.properties).forEach(([key, prop]) => {
    let zodType: z.ZodTypeAny;

    switch (prop.type) {
      case 'string':
        zodType = z.string();

        if (prop.minLength !== undefined) {
          zodType = (zodType as z.ZodString).min(
            prop.minLength,
            prop.errorMessage || `Mínimo de ${prop.minLength} caracteres`
          );
        }

        if (prop.maxLength !== undefined) {
          zodType = (zodType as z.ZodString).max(
            prop.maxLength,
            prop.errorMessage || `Máximo de ${prop.maxLength} caracteres`
          );
        }

        if (prop.pattern) {
          zodType = (zodType as z.ZodString).regex(
            new RegExp(prop.pattern),
            prop.errorMessage || 'Formato inválido'
          );
        }

        if (prop.format === 'email') {
          zodType = (zodType as z.ZodString).email('Email inválido');
        }

        if (prop.format === 'uri') {
          zodType = (zodType as z.ZodString).url('URL inválida');
        }

        break;

      case 'number':
      case 'integer':
        zodType = prop.type === 'integer' ? z.number().int() : z.number();

        if (prop.minimum !== undefined) {
          zodType = (zodType as z.ZodNumber).min(
            prop.minimum,
            `Valor mínimo: ${prop.minimum}`
          );
        }

        if (prop.maximum !== undefined) {
          zodType = (zodType as z.ZodNumber).max(
            prop.maximum,
            `Valor máximo: ${prop.maximum}`
          );
        }

        break;

      case 'boolean':
        zodType = z.boolean();
        if (prop.default !== undefined) {
          zodType = zodType.default(prop.default);
        }
        break;

      case 'array':
        if (prop.items) {
          // Array de objetos ou primitivos
          const itemSchema = prop.items.type === 'object' && prop.items.properties
            ? z.object(
                Object.entries(prop.items.properties).reduce((acc, [k, v]) => {
                  acc[k] = z.any(); // Simplificado para arrays
                  return acc;
                }, {} as Record<string, z.ZodTypeAny>)
              )
            : z.any();

          zodType = z.array(itemSchema);
        } else {
          zodType = z.array(z.any());
        }
        break;

      case 'object':
        zodType = z.object({}).passthrough();
        break;

      default:
        zodType = z.any();
    }

    // Tornar opcional se não estiver em required
    if (!jsonSchema.required?.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  });

  return z.object(shape);
}

// ============================================================================
// RENDERIZAÇÃO DE CAMPOS
// ============================================================================

interface FieldRendererProps {
  name: string;
  schema: JSONSchemaProperty;
  control: any;
  errors: any;
  disabled?: boolean;
}

function FieldRenderer({ name, schema, control, errors, disabled }: FieldRendererProps) {
  const error = errors[name];
  const widget = schema.widget || getDefaultWidget(schema);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {schema.title}
        {schema.description && (
          <span className="text-xs text-muted-foreground ml-2">
            {schema.description}
          </span>
        )}
      </Label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Input de texto simples
          if (widget === 'hidden') {
            return <input type="hidden" {...field} />;
          }

          // Textarea
          if (widget === 'textarea') {
            return (
              <Textarea
                id={name}
                placeholder={schema.title}
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
              />
            );
          }

          // Select / Dropdown
          if (widget === 'select' || schema.enum) {
            return (
              <Select
                disabled={disabled}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className={error ? 'border-red-500' : ''}>
                  <SelectValue placeholder={`Selecione ${schema.title}`} />
                </SelectTrigger>
                <SelectContent>
                  {schema.enum?.map((value, index) => (
                    <SelectItem key={value} value={value}>
                      {schema.enumNames?.[index] || value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          // Checkbox
          if (widget === 'checkbox' || schema.type === 'boolean') {
            return (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={name}
                  disabled={disabled}
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor={name} className="font-normal cursor-pointer">
                  {schema.title}
                </Label>
              </div>
            );
          }

          // Date input
          if (widget === 'date' || schema.format === 'date') {
            return (
              <Input
                id={name}
                type="date"
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
              />
            );
          }

          // Time input
          if (widget === 'time' || schema.format === 'time') {
            return (
              <Input
                id={name}
                type="time"
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
              />
            );
          }

          // Datetime input
          if (widget === 'datetime' || schema.format === 'date-time') {
            return (
              <Input
                id={name}
                type="datetime-local"
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
              />
            );
          }

          // File input
          if (widget === 'file') {
            return (
              <Input
                id={name}
                type="file"
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  field.onChange(file);
                }}
              />
            );
          }

          // Number input
          if (schema.type === 'number' || schema.type === 'integer') {
            return (
              <Input
                id={name}
                type="number"
                step={schema.type === 'integer' ? '1' : 'any'}
                min={schema.minimum}
                max={schema.maximum}
                placeholder={schema.title}
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? '' : Number(value));
                }}
              />
            );
          }

          // Email input
          if (schema.format === 'email') {
            return (
              <Input
                id={name}
                type="email"
                placeholder="email@exemplo.com"
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
              />
            );
          }

          // Tel input
          if (schema.format === 'tel') {
            return (
              <Input
                id={name}
                type="tel"
                placeholder="(00) 00000-0000"
                disabled={disabled}
                className={error ? 'border-red-500' : ''}
                {...field}
                value={field.value || ''}
              />
            );
          }

          // Default: text input
          return (
            <Input
              id={name}
              type="text"
              placeholder={schema.title}
              maxLength={schema.maxLength}
              disabled={disabled}
              className={error ? 'border-red-500' : ''}
              {...field}
              value={field.value || ''}
            />
          );
        }}
      />

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error.message}
        </p>
      )}
    </div>
  );
}

function getDefaultWidget(schema: JSONSchemaProperty): string {
  if (schema.enum) return 'select';
  if (schema.type === 'boolean') return 'checkbox';
  if (schema.format === 'date') return 'date';
  if (schema.format === 'time') return 'time';
  if (schema.format === 'date-time') return 'datetime';
  if (schema.maxLength && schema.maxLength > 200) return 'textarea';
  return 'input';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function DynamicForm({
  schema,
  onSubmit,
  defaultValues = {},
  submitLabel = 'Enviar',
  isLoading = false,
  disabled = false,
  className = ''
}: DynamicFormProps) {
  // Converter JSON Schema para Zod Schema
  const zodSchema = useMemo(() => jsonSchemaToZod(schema), [schema]);

  // Configurar React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues
  });

  const isFormDisabled = disabled || isLoading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-6 ${className}`}
    >
      {/* Título e Descrição do Schema */}
      {(schema.title || schema.description) && (
        <div className="space-y-2">
          {schema.title && (
            <h3 className="text-lg font-semibold">{schema.title}</h3>
          )}
          {schema.description && (
            <p className="text-sm text-muted-foreground">{schema.description}</p>
          )}
        </div>
      )}

      {/* Campos do Formulário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(schema.properties).map(([name, prop]) => (
          <div
            key={name}
            className={
              prop.widget === 'textarea' || prop.type === 'object'
                ? 'md:col-span-2'
                : ''
            }
          >
            <FieldRenderer
              name={name}
              schema={prop}
              control={control}
              errors={errors}
              disabled={isFormDisabled}
            />
          </div>
        ))}
      </div>

      {/* Mensagem de Erro Geral */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor, corrija os erros no formulário antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isFormDisabled}
          className="min-w-[120px]"
        >
          {(isLoading || isSubmitting) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {submitLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isFormDisabled}
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DynamicForm;
