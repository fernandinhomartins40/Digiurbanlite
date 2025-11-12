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

interface TrainingFormData {
  title: string;
  trainingType: string;
  description: string;
  startDate: string;
  endDate?: string;
  duration: number;
  instructor: string;
  targetAudience?: string;
  maxParticipants?: number;
  location: string;
  cost?: number;
  certificate: boolean;
  status: string;
  formSchema?: any[];
  requiredDocuments?: any[];
}

interface TrainingFormWithSchemaProps {
  departmentType: string;
  trainingId?: string;
  initialData?: TrainingFormData;
}

const TRAINING_TYPES = [
  { value: 'workshop', label: 'Oficina' },
  { value: 'curso', label: 'Curso' },
  { value: 'palestra', label: 'Palestra' },
  { value: 'dia_campo', label: 'Dia de Campo' },
  { value: 'seminario', label: 'Seminário' },
  { value: 'other', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planejado' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function TrainingFormWithSchema({
  departmentType,
  trainingId,
  initialData
}: TrainingFormWithSchemaProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState<TrainingFormData>({
    title: '',
    trainingType: 'workshop',
    description: '',
    startDate: '',
    endDate: '',
    duration: 0,
    instructor: '',
    targetAudience: '',
    maxParticipants: 0,
    location: '',
    cost: 0,
    certificate: false,
    status: 'ACTIVE',
    formSchema: [],
    requiredDocuments: [],
  });

  const isEditMode = !!trainingId;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (trainingId) {
      fetchTraining();
    }
  }, [trainingId, initialData]);

  const fetchTraining = async () => {
    try {
      const response = await apiClient.get(`/api/admin/secretarias/${departmentType}/capacitacoes/${trainingId}`);
      if (!response.ok) throw new Error('Erro ao carregar capacitação');
      const result = await response.json();

      // Mapear customFields para formSchema
      const training = result.data || result;
      if (training.customFields && !training.formSchema) {
        training.formSchema = training.customFields;
      }

      setFormData(training);
    } catch (error) {
      console.error('Error fetching training:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da capacitação',
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
      if (!formData.title.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'O título da capacitação é obrigatório',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'A descrição da capacitação é obrigatória',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.instructor.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'O instrutor da capacitação é obrigatório',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const endpoint = isEditMode
        ? `/api/admin/secretarias/${departmentType}/capacitacoes/${trainingId}`
        : `/api/admin/secretarias/${departmentType}/capacitacoes`;

      console.log('\n========== Training Form Submit ==========');
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
      console.log('========== FIM Training Form Submit ==========\n');

      toast({
        title: 'Sucesso',
        description: `Capacitação ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`,
      });

      router.push(`/admin/secretarias/${departmentType}/capacitacoes`);
    } catch (error: any) {
      console.error('Error saving training:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar capacitação',
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
            {isEditMode ? 'Editar' : 'Nova'} Capacitação
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure a capacitação e personalize o formulário de inscrição
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
                <CardTitle>Informações da Capacitação</CardTitle>
                <CardDescription>
                  Preencha os dados principais da capacitação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">
                      Título da Capacitação <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Ex: Curso de Agricultura Orgânica"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainingType">
                      Tipo de Capacitação <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.trainingType}
                      onValueChange={(value) => handleChange('trainingType', value)}
                    >
                      <SelectTrigger id="trainingType">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRAINING_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione o status" />
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
                      placeholder="Descreva a capacitação, objetivos e metodologia..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructor">
                      Instrutor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="instructor"
                      value={formData.instructor}
                      onChange={(e) => handleChange('instructor', e.target.value)}
                      placeholder="Nome do instrutor"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      Local <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Local onde será realizada"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Data de Início <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (horas)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Vagas Disponíveis</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Custo (R$)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Público Alvo</Label>
                    <Input
                      id="targetAudience"
                      value={formData.targetAudience}
                      onChange={(e) => handleChange('targetAudience', e.target.value)}
                      placeholder="Ex: Produtores rurais, técnicos agrícolas..."
                    />
                  </div>

                  <div className="space-y-2 flex items-center gap-2 pt-8">
                    <input
                      type="checkbox"
                      id="certificate"
                      checked={formData.certificate}
                      onChange={(e) => handleChange('certificate', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="certificate" className="!m-0">
                      Emitir Certificado
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Formulário de Inscrição */}
          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campos Personalizados do Formulário</CardTitle>
                <CardDescription>
                  Adicione campos extras ao formulário de inscrição além dos campos básicos (Nome, CPF, Email, Telefone)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormSchemaEditor
                  value={formData.formSchema || []}
                  onChange={(fields) => handleChange('formSchema', fields)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Documentos */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Exigidos</CardTitle>
                <CardDescription>
                  Defina quais documentos os inscritos devem enviar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequiredDocumentsSelector
                  value={formData.requiredDocuments || []}
                  onChange={(docs) => handleChange('requiredDocuments', docs)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botão de Salvar */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Criar'} Capacitação
          </Button>
        </div>
      </form>
    </div>
  );
}
