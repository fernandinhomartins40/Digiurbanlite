'use client';

import { JSONSchemaForm } from './JSONSchemaForm';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ModernMaskedInput as MaskedInput } from '@/components/ui/modern-masked-input';
import { CheckCircle } from 'lucide-react';

interface ServiceFormRendererProps {
  fields: any[];
  formData: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  isFieldPrefilled?: (fieldId: string) => boolean;
  title?: string;
}

/**
 * ServiceFormRenderer - Renderiza campos de formulário de serviços
 *
 * Se os campos seguem JSON Schema (propriedades como $id, type, etc.),
 * usa JSONSchemaForm. Caso contrário, usa renderização tradicional.
 */
export function ServiceFormRenderer({
  fields,
  formData,
  onChange,
  isFieldPrefilled,
  title
}: ServiceFormRendererProps) {
  // Separar campos citizen_* de campos customizados
  const citizenFields = fields.filter(f => f.id?.toLowerCase().startsWith('citizen_'));
  const customFields = fields.filter(f => !f.id?.toLowerCase().startsWith('citizen_'));

  // Verificar se é JSON Schema (procurar por campos com $id, type, properties, etc.)
  const isJsonSchema = fields.some(field =>
    field.$id ||
    (field.type && ['object', 'array'].includes(field.type)) ||
    field.properties ||
    field.items
  );

  // Função auxiliar para renderizar um campo
  const renderField = (field: any) => {
    const isPrefilled = isFieldPrefilled ? isFieldPrefilled(field.id) : false;

    return (
      <div key={field.id} className="space-y-2">
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

        {/* Máscaras têm prioridade */}
        {field.mask === 'cpf' && (
          <MaskedInput
            id={field.id}
            type="cpf"
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
            required={field.required}
          />
        )}

        {field.mask === 'phone' && (
          <MaskedInput
            id={field.id}
            type="phone"
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
            required={field.required}
          />
        )}

        {field.mask === 'cep' && (
          <MaskedInput
            id={field.id}
            type="cep"
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
            required={field.required}
          />
        )}

        {/* Tipos de campo sem máscara */}
        {!field.mask && field.type === 'email' && (
          <Input
            id={field.id}
            type="email"
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
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
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
          />
        )}

        {!field.mask && field.type === 'number' && (
          <Input
            id={field.id}
            type="number"
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
            placeholder={field.placeholder}
          />
        )}

        {!field.mask && field.type === 'text' && (
          <Input
            id={field.id}
            type="text"
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={isPrefilled ? 'border-green-300 bg-green-50/30' : ''}
            placeholder={field.placeholder}
          />
        )}

        {!field.mask && field.type === 'textarea' && (
          <Textarea
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            rows={3}
            className={`resize-none ${isPrefilled ? 'border-green-300 bg-green-50/30' : ''}`}
            placeholder={field.placeholder}
          />
        )}

        {!field.mask && field.type === 'select' && (
          <select
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
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
              checked={formData[field.id] === true || formData[field.id] === 'true'}
              onChange={(e) => onChange(field.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor={field.id} className="font-normal cursor-pointer">
              {field.placeholder || field.label}
            </Label>
          </div>
        )}
      </div>
    );
  };

  if (isJsonSchema) {
    // Se for JSON Schema, converter para o formato esperado pelo JSONSchemaForm
    const schema = {
      type: 'object',
      properties: fields.reduce((acc, field) => {
        acc[field.id || field.$id] = field;
        return acc;
      }, {} as Record<string, any>),
      required: fields.filter(f => f.required).map(f => f.id || f.$id)
    };

    return (
      <div className="space-y-4 pt-4 border-t">
        {title && <h3 className="font-medium text-gray-900">{title}</h3>}
        <JSONSchemaForm
          schema={schema}
          formData={formData}
          onChange={(data) => {
            // Propagar mudanças individuais
            Object.entries(data).forEach(([key, value]) => {
              if (formData[key] !== value) {
                onChange(key, value);
              }
            });
          }}
        />
      </div>
    );
  }

  // Renderização tradicional para campos legados COM SEPARAÇÃO
  return (
    <>
      {/* Seção: Dados Pessoais (citizen_*) */}
      {citizenFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="font-medium text-gray-900">Dados Pessoais</h3>
            <p className="text-sm text-gray-600 mt-1">
              Estes dados serão preenchidos automaticamente com suas informações cadastradas
            </p>
          </div>
          {citizenFields.map((field: any) => renderField(field))}
        </div>
      )}

      {/* Seção: Informações do Serviço (custom fields) */}
      {customFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-gray-900">{title || 'Informações Específicas do Serviço'}</h3>
          {customFields.map((field: any) => renderField(field))}
        </div>
      )}
    </>
  );
}
