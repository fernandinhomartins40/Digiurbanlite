'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ModernMaskedInput as MaskedInput } from '@/components/ui/modern-masked-input';
import { UserCheck } from 'lucide-react';

interface JSONSchemaFormProps {
  schema: {
    type: 'object';
    citizenFields?: string[];
    properties: Record<string, any>;
    required: string[];
  };
  formData: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  prefilledData?: Record<string, any>;
}

export function JSONSchemaForm({ schema, formData, onChange, prefilledData = {} }: JSONSchemaFormProps) {
  if (!schema || !schema.properties) {
    return null;
  }

  const citizenFieldNames = schema.citizenFields || [];
  const allFieldNames = Object.keys(schema.properties);
  const customFieldNames = allFieldNames.filter(name => !citizenFieldNames.includes(name));

  const renderField = (fieldName: string, fieldSchema: any, isPrefilled: boolean = false) => {
    const isRequired = schema.required?.includes(fieldName);
    const value = formData[fieldName] || '';
    const label = fieldSchema.title || fieldName;

    // Determinar o tipo de input baseado no schema
    const inputType = fieldSchema.format === 'email' ? 'email' :
                     fieldSchema.format === 'date' ? 'date' :
                     fieldSchema.format === 'time' ? 'time' :
                     fieldSchema.format === 'date-time' ? 'datetime-local' :
                     fieldSchema.type === 'number' || fieldSchema.type === 'integer' ? 'number' :
                     'text';

    // Checkbox para boolean
    if (fieldSchema.type === 'boolean') {
      return (
        <div key={fieldName} className="flex items-center space-x-2">
          <Checkbox
            id={fieldName}
            checked={value || fieldSchema.default || false}
            onCheckedChange={(checked) => onChange(fieldName, checked)}
            disabled={isPrefilled}
          />
          <Label
            htmlFor={fieldName}
            className={`text-sm font-normal cursor-pointer ${isPrefilled ? 'text-gray-600' : ''}`}
          >
            {label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
        </div>
      );
    }

    // Select para enum
    if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className={isPrefilled ? 'text-gray-600' : ''}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={value}
            onValueChange={(val) => onChange(fieldName, val)}
            disabled={isPrefilled}
          >
            <SelectTrigger className={isPrefilled ? 'bg-green-50 border-green-200' : ''}>
              <SelectValue placeholder={`Selecione ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldSchema.enum.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Textarea para widget textarea
    if (fieldSchema.widget === 'textarea') {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className={isPrefilled ? 'text-gray-600' : ''}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id={fieldName}
            value={value}
            onChange={(e) => onChange(fieldName, e.target.value)}
            placeholder={fieldSchema.description}
            maxLength={fieldSchema.maxLength}
            rows={4}
            disabled={isPrefilled}
            className={isPrefilled ? 'bg-green-50 border-green-200 resize-none' : 'resize-none'}
          />
          {fieldSchema.maxLength && (
            <p className="text-xs text-gray-500">
              {value.length}/{fieldSchema.maxLength} caracteres
            </p>
          )}
        </div>
      );
    }

    // Input com máscara para CPF, telefone, CEP
    const needsMask = fieldName === 'cpf' || fieldName === 'telefone' || fieldName === 'telefoneSecundario' || fieldName === 'cep';
    const maskType = fieldName === 'cpf' ? 'cpf' :
                     fieldName.includes('telefone') ? 'phone' :
                     fieldName === 'cep' ? 'cep' : undefined;

    if (needsMask && maskType) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName} className={isPrefilled ? 'text-gray-600' : ''}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <MaskedInput
            id={fieldName}
            type={maskType as 'cpf' | 'phone' | 'cep'}
            value={value}
            onChange={(val) => onChange(fieldName, val)}
            placeholder={fieldSchema.description}
            disabled={isPrefilled}
            className={isPrefilled ? 'bg-green-50 border-green-200' : ''}
          />
        </div>
      );
    }

    // Input padrão
    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName} className={isPrefilled ? 'text-gray-600' : ''}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={fieldName}
          type={inputType}
          value={value}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder={fieldSchema.description}
          min={fieldSchema.minimum}
          max={fieldSchema.maximum}
          minLength={fieldSchema.minLength}
          maxLength={fieldSchema.maxLength}
          disabled={isPrefilled}
          className={isPrefilled ? 'bg-green-50 border-green-200' : ''}
        />
      </div>
    );
  };

  return (
    <>
      {/* Campos do Cidadão (Pré-preenchidos) */}
      {citizenFieldNames.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Dados Pessoais</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Pré-preenchidos automaticamente do seu cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {citizenFieldNames.map(fieldName =>
              renderField(fieldName, schema.properties[fieldName], true)
            )}
          </CardContent>
        </Card>
      )}

      {/* Campos Customizados do Serviço */}
      {customFieldNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Específicas do Serviço</CardTitle>
            <CardDescription>
              Preencha os dados solicitados para este serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFieldNames.map(fieldName =>
              renderField(fieldName, schema.properties[fieldName], false)
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
