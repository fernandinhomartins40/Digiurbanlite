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
import { ModuleConfig } from '@/lib/module-configs';
import { ArrowLeft, Save } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface RuralPropertyFormProps {
  config: ModuleConfig;
  departmentType: string;
  recordId?: string;
}

interface Producer {
  id: string;
  name: string;
  document: string;
}

export function RuralPropertyForm({ config, departmentType, recordId }: RuralPropertyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { apiRequest } = useAdminAuth();
  const [formData, setFormData] = useState<Record<string, any>>({
    status: 'ACTIVE',
  });
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!recordId);
  const [loadingProducers, setLoadingProducers] = useState(true);

  const isEditMode = !!recordId;
  const apiEndpoint = `/admin/secretarias/${departmentType}/propriedades`;

  useEffect(() => {
    fetchProducers();
    if (recordId) {
      fetchRecord();
    } else {
      setLoadingData(false);
    }
  }, [recordId]);

  const fetchProducers = async () => {
    try {
      const result = await apiRequest('/admin/secretarias/agricultura/produtores?limit=1000');
      const producersData = result.data || [];
      setProducers(producersData);
    } catch (error) {
      console.error('Error fetching producers:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar lista de produtores',
        variant: 'destructive',
      });
    } finally {
      setLoadingProducers(false);
    }
  };

  const fetchRecord = async () => {
    try {
      const result = await apiRequest(`${apiEndpoint}/${recordId}`);
      setFormData(result.data || result);
    } catch (error) {
      console.error('Error fetching record:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da propriedade',
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
      if (!formData.name || !formData.producerId || !formData.size || !formData.location) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha: Nome, Produtor, Área Total e Localização',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `${apiEndpoint}/${recordId}` : apiEndpoint;

      await apiRequest(url, {
        method,
        body: JSON.stringify(formData),
      });

      toast({
        title: 'Sucesso',
        description: `Propriedade ${isEditMode ? 'atualizada' : 'cadastrada'} com sucesso`,
      });

      router.push(`/admin/secretarias/${departmentType}/propriedades`);
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar propriedade',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || loadingProducers) {
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
            {isEditMode ? 'Editar' : 'Nova'} Propriedade Rural
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastro e mapeamento de propriedades rurais
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da Propriedade</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para {isEditMode ? 'atualizar' : 'cadastrar'} a propriedade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Nome da Propriedade <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Fazenda São João"
                  required
                />
              </div>

              {/* Produtor */}
              <div className="space-y-2">
                <Label htmlFor="producerId">
                  Produtor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.producerId || ''}
                  onValueChange={(v) => handleChange('producerId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    {producers.map((producer) => (
                      <SelectItem key={producer.id} value={producer.id}>
                        {producer.name} - {producer.document}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Área Total */}
              <div className="space-y-2">
                <Label htmlFor="size">
                  Área Total (Alqueire) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="size"
                  type="number"
                  step="0.01"
                  value={formData.size || ''}
                  onChange={(e) => handleChange('size', e.target.value)}
                  placeholder="Ex: 50.5"
                  required
                />
              </div>

              {/* Área Plantada */}
              <div className="space-y-2">
                <Label htmlFor="plantedArea">Área Plantada (Alqueire)</Label>
                <Input
                  id="plantedArea"
                  type="number"
                  step="0.01"
                  value={formData.plantedArea || ''}
                  onChange={(e) => handleChange('plantedArea', e.target.value)}
                  placeholder="Ex: 30.0"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'ACTIVE'}
                  onValueChange={(v) => handleChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativa</SelectItem>
                    <SelectItem value="INACTIVE">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Localização */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">
                  Localização <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Ex: Zona Rural, Km 15"
                  required
                />
              </div>

              {/* Culturas Principais */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mainCrops">Culturas Principais</Label>
                <Textarea
                  id="mainCrops"
                  value={formData.mainCrops || ''}
                  onChange={(e) => handleChange('mainCrops', e.target.value)}
                  placeholder="Ex: Milho, Feijão, Hortaliças"
                  rows={3}
                />
              </div>
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
