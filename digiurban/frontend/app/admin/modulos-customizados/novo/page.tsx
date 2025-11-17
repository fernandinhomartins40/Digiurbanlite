'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Field {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

const moduleTypes = [
  { value: 'education', label: 'Educação' },
  { value: 'health', label: 'Saúde' },
  { value: 'social_assistance', label: 'Assistência Social' },
  { value: 'public_works', label: 'Obras Públicas' },
  { value: 'public_services', label: 'Serviços Públicos' },
  { value: 'housing', label: 'Habitação' },
  { value: 'culture', label: 'Cultura' },
  { value: 'sports', label: 'Esportes' },
  { value: 'tourism', label: 'Turismo' },
  { value: 'environment', label: 'Meio Ambiente' },
  { value: 'agriculture', label: 'Agricultura' },
  { value: 'urban_planning', label: 'Urbanismo' },
  { value: 'security', label: 'Segurança Pública' },
  { value: 'custom', label: 'Personalizado' }
];

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'select', label: 'Seleção' },
  { value: 'textarea', label: 'Texto Longo' },
];

export default function NewCustomModulePage() {
  const router = useRouter();
  const [tableName, setTableName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [moduleType, setModuleType] = useState('custom');
  const [fields, setFields] = useState<Field[]>([]);
  const [newField, setNewField] = useState<Partial<Field>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const schema = {
        fields: fields.reduce((acc, field) => {
          acc[field.name] = {
            label: field.label,
            type: field.type,
            required: field.required,
            ...(field.options && { options: field.options }),
          };
          return acc;
        }, {} as any),
      };

      const res = await fetch('/api/custom-modules/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          displayName,
          moduleType,
          schema,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao criar módulo');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Módulo criado com sucesso!');
      router.push('/admin/modulos-customizados');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddField = () => {
    if (!newField.name || !newField.label) {
      toast.error('Preencha o nome e o rótulo do campo');
      return;
    }

    const fieldId = newField.name.toLowerCase().replace(/\s+/g, '_');

    if (fields.some((f) => f.id === fieldId)) {
      toast.error('Já existe um campo com este nome');
      return;
    }

    setFields([
      ...fields,
      {
        id: fieldId,
        name: newField.name,
        label: newField.label,
        type: newField.type || 'text',
        required: newField.required || false,
        options: newField.options,
      },
    ]);

    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: undefined,
    });
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const handleSubmit = () => {
    if (!tableName.trim()) {
      toast.error('Informe o nome da tabela');
      return;
    }

    if (!displayName.trim()) {
      toast.error('Informe o nome de exibição');
      return;
    }

    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo');
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/modulos-customizados">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Módulo Customizado</h1>
        <p className="text-muted-foreground">
          Crie um módulo de dados personalizado para sua secretaria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Configure o módulo customizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableName">Nome da Tabela *</Label>
                <Input
                  id="tableName"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ex: cadastro_fornecedores"
                />
                <p className="text-xs text-muted-foreground">
                  Use apenas letras minúsculas, números e underscores
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Cadastro de Fornecedores"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moduleType">Tipo de Módulo</Label>
                <Select value={moduleType} onValueChange={setModuleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Campos Customizados</CardTitle>
              <CardDescription>Defina os campos que farão parte do módulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Field Form */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Nome do Campo</Label>
                  <Input
                    value={newField.name || ''}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="Ex: nome_completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rótulo</Label>
                  <Input
                    value={newField.label || ''}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="Ex: Nome Completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newField.type || 'text'}
                    onValueChange={(value: any) => setNewField({ ...newField, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newField.required || false}
                      onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Campo obrigatório</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <Button onClick={handleAddField} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>
              </div>

              {/* Fields List */}
              {fields.length > 0 && (
                <div className="space-y-2">
                  <Label>Campos Adicionados ({fields.length})</Label>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{field.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {fieldTypes.find((t) => t.value === field.type)?.label}
                            </Badge>
                            {field.required && <Badge variant="secondary" className="text-xs">Obrigatório</Badge>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(field.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Resumo do módulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <p className="text-sm">{displayName || 'Não informado'}</p>
              </div>
              <div>
                <Label>Tabela</Label>
                <p className="text-sm font-mono">{tableName || 'Não informado'}</p>
              </div>
              <div>
                <Label>Tipo</Label>
                <Badge>{moduleTypes.find(t => t.value === moduleType)?.label || moduleType}</Badge>
              </div>
              <div>
                <Label>Campos</Label>
                <Badge variant="secondary">{fields.length}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Módulo
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/modulos-customizados">Cancelar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
