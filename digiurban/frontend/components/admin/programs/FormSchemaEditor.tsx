'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Hash,
  Type,
  CheckSquare,
  List,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'cpf' | 'textarea' | 'select' | 'checkbox' | 'file';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[]; // Para campos do tipo select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface FormSchemaEditorProps {
  value: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'textarea', label: 'Texto Longo', icon: FileText },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'email', label: 'E-mail', icon: Type },
  { value: 'phone', label: 'Telefone', icon: Type },
  { value: 'cpf', label: 'CPF', icon: Type },
  { value: 'select', label: 'Seleção', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'file', label: 'Arquivo', icon: FileText },
];

// Componente para gerenciar opções de select
function SelectOptionsManager({
  options,
  onChange
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim()) {
      onChange([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    onChange(options.map((opt, i) => i === index ? value : opt));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma opção e pressione Enter"
        />
        <Button
          type="button"
          onClick={addOption}
          size="sm"
          disabled={!newOption.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {options.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Opções ({options.length})
          </Label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 h-8 bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeOption(index)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FormSchemaEditor({ value, onChange }: FormSchemaEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: `campo_${value.length + 1}`,
      label: `Novo Campo ${value.length + 1}`,
      type: 'text',
      required: false,
      placeholder: '',
      description: '',
    };
    onChange([...value, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(value.map(field =>
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    onChange(value.filter(field => field.id !== id));
    if (editingField === id) {
      setEditingField(null);
    }
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = value.findIndex(f => f.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === value.length - 1)
    ) {
      return;
    }

    const newFields = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    onChange(newFields);
  };

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
      required: field.required,
      disabled: true,
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} />;
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input type="checkbox" disabled className="h-4 w-4" />
            <span className="text-sm">{field.label}</span>
          </div>
        );
      default:
        return <Input type={field.type} {...commonProps} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campos do Formulário</h3>
          <p className="text-sm text-muted-foreground">
            Configure os campos que serão solicitados na inscrição
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Editar' : 'Visualizar'}
          </Button>
          <Button type="button" onClick={addField} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Campo
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum campo adicionado ainda.<br />
              Clique em "Adicionar Campo" para começar.
            </p>
          </CardContent>
        </Card>
      ) : previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização do Formulário</CardTitle>
            <CardDescription>Veja como o formulário aparecerá para os cidadãos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {value.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
                {renderFieldPreview(field)}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {value.map((field, index) => (
            <Card key={field.id} className={editingField === field.id ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{field.label}</CardTitle>
                        {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                        <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                      </div>
                      {field.description && (
                        <CardDescription className="text-sm mt-1">{field.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveField(field.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveField(field.id, 'down')}
                      disabled={index === value.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                    >
                      {editingField === field.id ? '✓' : '✎'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingField === field.id && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Campo (ID)</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="campo_nome"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Campo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(type: any) => updateField(field.id, { type })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rótulo do Campo</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Ex: Nome Completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Ex: Digite seu nome"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição/Ajuda</Label>
                    <Input
                      value={field.description || ''}
                      onChange={(e) => updateField(field.id, { description: e.target.value })}
                      placeholder="Texto de ajuda para o usuário"
                    />
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <Label>Opções de Seleção</Label>
                      <SelectOptionsManager
                        options={field.options || []}
                        onChange={(options) => updateField(field.id, { options })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`required-${field.id}`}
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`required-${field.id}`}>Campo obrigatório</Label>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
