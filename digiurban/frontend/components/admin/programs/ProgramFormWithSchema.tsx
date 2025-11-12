'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, FileText, Settings } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { FormSchemaEditor } from './FormSchemaEditor';
import { RequiredDocumentsSelector } from './RequiredDocumentsSelector';

interface ProgramFormData {
  name: string;
  programType: string;
  description: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  coordinator: string;
  targetAudience?: string;
  maxParticipants?: number;
  status: string;
  formSchema?: any[];
  requiredDocuments?: any[];
}

interface ProgramFormWithSchemaProps {
  departmentType: string;
  programId?: string;
  initialData?: ProgramFormData;
}

const PROGRAM_TYPES = [
  { value: 'credit', label: 'Crédito Rural' },
  { value: 'pronaf', label: 'PRONAF' },
  { value: 'subsidy', label: 'Subsídio' },
  { value: 'incentive', label: 'Incentivo' },
  { value: 'training', label: 'Capacitação' },
  { value: 'assistance', label: 'Assistência Técnica' },
  { value: 'other', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planejado' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function ProgramFormWithSchema({
  departmentType,
  programId,
  initialData
}: ProgramFormWithSchemaProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    programType: 'credit',
    description: '',
    startDate: '',
    endDate: '',
    budget: 0,
    coordinator: '',
    targetAudience: '',
    maxParticipants: 0,
    status: 'ACTIVE',
    formSchema: [],
    requiredDocuments: [],
  });

  const isEditMode = !!programId;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (programId) {
      fetchProgram();
    }
  }, [programId, initialData]);

  const fetchProgram = async () => {
    try {
      const response = await apiClient.get(`/api/admin/secretarias/${departmentType}/programas/${programId}`);
      if (!response.ok) throw new Error('Erro ao carregar programa');
      const result = await response.json();
      setFormData(result.data || result);
    } catch (error) {
      console.error('Error fetching program:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do programa',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.name.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'O nome do programa é obrigatório',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'A descrição do programa é obrigatória',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.coordinator.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'O coordenador do programa é obrigatório',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const endpoint = isEditMode
        ? `/api/admin/secretarias/${departmentType}/programas/${programId}`
        : `/api/admin/secretarias/${departmentType}/programas`;

      console.log('\n========== Program Form Submit ==========');
      console.log('Endpoint:', endpoint);
      console.log('Is Edit Mode:', isEditMode);
      console.log('Form Data:', formData);

      const response = isEditMode
        ? await apiClient.put(endpoint, formData)
        : await apiClient.post(endpoint, formData);

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.message || 'Erro ao salvar');
      }

      const result = await response.json();
      console.log('Success response:', result);
      console.log('========== FIM Program Form Submit ==========\n');

      toast({
        title: 'Sucesso',
        description: `Programa ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`,
      });

      router.push(`/admin/secretarias/${departmentType}/programas`);
    } catch (error: any) {
      console.error('Error saving program:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar programa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
            {isEditMode ? 'Editar' : 'Novo'} Programa
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure o programa e personalize o formulário de inscrição
          </p>
        </div>
      </div>

      {/* Formulário com Tabs */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              <Settings className="h-4 w-4 mr-2" />
              Dados Básicos
            </TabsTrigger>
            <TabsTrigger value="form">
              <FileText className="h-4 w-4 mr-2" />
              Formulário de Inscrição
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dados Básicos */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Programa</CardTitle>
                <CardDescription>
                  Preencha os dados principais do programa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">
                      Nome do Programa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Ex: PRONAF - Crédito para Agricultura Familiar"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programType">
                      Tipo de Programa <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.programType}
                      onValueChange={(v) => handleChange('programType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => handleChange('status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">
                      Descrição <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Descreva o programa, seus objetivos e benefícios..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coordinator">
                      Coordenador <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="coordinator"
                      value={formData.coordinator}
                      onChange={(e) => handleChange('coordinator', e.target.value)}
                      placeholder="Nome do responsável"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Público-Alvo</Label>
                    <Input
                      id="targetAudience"
                      value={formData.targetAudience || ''}
                      onChange={(e) => handleChange('targetAudience', e.target.value)}
                      placeholder="Ex: Agricultores familiares"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Data de Início <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Orçamento (R$)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants || ''}
                      onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Formulário de Inscrição */}
          <TabsContent value="form">
            <Card>
              <CardContent className="pt-6">
                <FormSchemaEditor
                  value={formData.formSchema || []}
                  onChange={(schema) => handleChange('formSchema', schema)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Documentos */}
          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                <RequiredDocumentsSelector
                  value={formData.requiredDocuments || []}
                  onChange={(docs) => handleChange('requiredDocuments', docs)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2">
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
                {isEditMode ? 'Atualizar' : 'Criar'} Programa
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
