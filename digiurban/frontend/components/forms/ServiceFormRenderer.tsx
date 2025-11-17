'use client';

import { JSONSchemaForm } from './JSONSchemaForm';
import { ServiceFormField } from './ServiceFormField';

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
          {citizenFields.map((field: any) => (
            <ServiceFormField
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={(value) => onChange(field.id, value)}
              isPrefilled={isFieldPrefilled ? isFieldPrefilled(field.id) : false}
            />
          ))}
        </div>
      )}

      {/* Seção: Informações do Serviço (custom fields) */}
      {customFields.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-gray-900">{title || 'Informações Específicas do Serviço'}</h3>
          {customFields.map((field: any) => (
            <ServiceFormField
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={(value) => onChange(field.id, value)}
              isPrefilled={isFieldPrefilled ? isFieldPrefilled(field.id) : false}
            />
          ))}
        </div>
      )}
    </>
  );
}
