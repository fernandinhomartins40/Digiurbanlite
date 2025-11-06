'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ModuleConfig, ModuleRecord } from '@/lib/module-configs';
import { ArrowLeft, Save } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ModuleFormProps {
  config: ModuleConfig;
  departmentType: string;
  recordId?: string;
  initialData?: ModuleRecord;
}

export function ModuleForm({ config, departmentType, recordId, initialData }: ModuleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!recordId);

  const isEditMode = !!recordId;
  const apiEndpoint = config.apiEndpoint || `/api/admin/secretarias/${departmentType}/${config.key}`;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setLoadingData(false);
    } else if (recordId) {
      fetchRecord();
    } else {
      // Inicializar valores padrão
      const defaults: Record<string, any> = {};
      config.fields.forEach((field) => {
        if (field.showInForm) {
          if (field.type === 'select' && field.options && field.options.length > 0) {
            defaults[field.name] = field.options[0].value;
          } else if (field.type === 'number') {
            defaults[field.name] = 0;
          } else if (field.type === 'boolean') {
            defaults[field.name] = false;
          } else {
            defaults[field.name] = '';
          }
        }
      });
      setFormData(defaults);
    }
  }, [recordId, initialData]);

  const fetchRecord = async () => {
    try {
      const response = await apiClient.get(`${apiEndpoint}/${recordId}`);

      if (!response.ok) throw new Error('Erro ao carregar dados');

      const result = await response.json();
      setFormData(result.data || result);
    } catch (error) {
      console.error('Error fetching record:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do registro',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos obrigatórios
      const requiredFields = config.fields.filter((f) => f.required && f.showInForm);
      const missingFields = requiredFields.filter((f) => !formData[f.name]);

      if (missingFields.length > 0) {
        toast({
          title: 'Campos obrigatórios',
          description: `Preencha: ${missingFields.map((f) => f.label).join(', ')}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const path = isEditMode ? `${apiEndpoint}/${recordId}` : apiEndpoint;

      console.log('\n========== ModuleForm Submit ==========');
      console.log('Path:', path);
      console.log('Is Edit Mode:', isEditMode);
      console.log('FormData:', formData);
      console.log('API Endpoint:', apiEndpoint);

      const response = isEditMode
        ? await apiClient.put(path, formData)
        : await apiClient.post(path, formData);

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.message || 'Erro ao salvar');
      }

      const result = await response.json();
      console.log('Success response:', result);
      console.log('========== FIM ModuleForm Submit ==========\n');

      toast({
        title: 'Sucesso',
        description: `${config.displayNameSingular} ${isEditMode ? 'atualizado' : 'cadastrado'} com sucesso`,
      });

      router.push(`/admin/secretarias/${departmentType}/${config.key}`);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar registro',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    if (!field.showInForm) return null;

    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type === 'email' ? 'email' : 'text'}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
              required={field.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value ? new Date(value).toISOString().split('T')[0] : ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(v) => handleChange(field.name, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.name}
              checked={value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        );

      default:
        return null;
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar' : 'Novo'} {config.displayNameSingular}
          </h1>
          {config.description && (
            <p className="text-muted-foreground mt-1">{config.description}</p>
          )}
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do {config.displayNameSingular}</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para {isEditMode ? 'atualizar' : 'cadastrar'} o registro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.fields.map((field) => renderField(field))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Atualizar' : 'Cadastrar'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
