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
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { CitizenSelector } from '@/components/admin/CitizenSelector';
import { type Citizen } from '@/hooks/useSearchCitizen';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface RuralProducerFormProps {
  config: ModuleConfig;
  departmentType: string;
  recordId?: string;
  initialData?: ModuleRecord;
}

export function RuralProducerForm({ config, departmentType, recordId, initialData }: RuralProducerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { apiRequest } = useAdminAuth();
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!recordId);

  const isEditMode = !!recordId;
  const apiEndpoint = `/admin/secretarias/${departmentType}/${config.key}`;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setLoadingData(false);
      // Se já tem cidadão vinculado, carregar dados
      if (initialData.citizenId) {
        fetchCitizenData(initialData.citizenId as string);
      }
    } else if (recordId) {
      fetchRecord();
    } else {
      // Inicializar valores padrão
      const defaults: Record<string, any> = {
        status: 'ACTIVE',
        productionType: 'conventional',
      };
      setFormData(defaults);
    }
  }, [recordId, initialData]);

  const fetchCitizenData = async (citizenId: string) => {
    try {
      const result = await apiRequest(`/admin/citizens/${citizenId}`);
      setSelectedCitizen(result.citizen || result.data);
    } catch (error) {
      console.error('Error fetching citizen:', error);
    }
  };

  const fetchRecord = async () => {
    try {
      const result = await apiRequest(`${apiEndpoint}/${recordId}`);
      const data = result.data || result;
      setFormData(data);

      // Carregar dados do cidadão se existir
      if (data.citizenId) {
        await fetchCitizenData(data.citizenId);
      }
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

  const handleCitizenSelect = (citizen: Citizen | null) => {
    setSelectedCitizen(citizen);
    if (citizen) {
      // Auto-preencher campos baseados no cidadão
      setFormData((prev) => ({
        ...prev,
        citizenId: citizen.id,
        name: citizen.name,
        document: citizen.cpf,
        email: citizen.email,
        phone: citizen.phone || '',
        address: typeof citizen.address === 'string'
          ? citizen.address
          : `${citizen.address?.logradouro || ''}, ${citizen.address?.numero || ''} - ${citizen.address?.bairro || ''}`,
      }));
    } else {
      // Limpar campos vinculados ao cidadão
      setFormData((prev) => ({
        ...prev,
        citizenId: undefined,
        name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
      }));
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar cidadão selecionado
      if (!selectedCitizen && !isEditMode) {
        toast({
          title: 'Cidadão Obrigatório',
          description: 'Selecione um cidadão cadastrado antes de continuar',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Validar campos obrigatórios específicos
      if (!formData.productionType || !formData.mainCrop) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha: Tipo de Produção e Cultura Principal',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (isEditMode) {
        // Modo edição: atualizar diretamente
        await apiRequest(`${apiEndpoint}/${recordId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            citizenId: selectedCitizen?.id || formData.citizenId,
          }),
        });

        toast({
          title: 'Sucesso',
          description: 'Produtor Rural atualizado com sucesso',
        });
      } else {
        // Modo criação: usar motor de protocolos
        // 1. Buscar serviço de "Cadastro de Produtor"
        console.log('[RuralProducerForm] Buscando serviços de agricultura...');
        console.log('[RuralProducerForm] URL que será chamada: /admin/secretarias/agricultura/services');

        const servicesResponse = await apiRequest(`/admin/secretarias/agricultura/services`);
        console.log('[RuralProducerForm] Status da resposta:', servicesResponse);
        console.log('[RuralProducerForm] Tipo da resposta:', typeof servicesResponse);
        console.log('[RuralProducerForm] Keys da resposta:', Object.keys(servicesResponse || {}));

        const services = servicesResponse.data || servicesResponse || [];
        console.log('[RuralProducerForm] Serviços extraídos:', services);
        console.log('[RuralProducerForm] É array?', Array.isArray(services));
        console.log('[RuralProducerForm] Quantidade:', services.length);

        if (services.length > 0) {
          console.log('[RuralProducerForm] Primeiro serviço:', services[0]);
          console.log('[RuralProducerForm] Todos moduleTypes:', services.map((s: any) => ({ name: s.name, moduleType: s.moduleType })));
        }

        const cadastroService = services.find(
          (s: any) => s.moduleType === 'CADASTRO_PRODUTOR'
        );

        if (!cadastroService) {
          console.error('[RuralProducerForm] ❌ Serviço CADASTRO_PRODUTOR não encontrado');
          console.error('[RuralProducerForm] Serviços disponíveis:', services.map((s: any) => ({ id: s.id, name: s.name, moduleType: s.moduleType })));
          throw new Error('Serviço de Cadastro de Produtor não encontrado. Verifique se o seed foi executado corretamente.');
        }

        console.log('[RuralProducerForm] Serviço encontrado:', cadastroService);

        // 2. Criar produtor rural vinculado ao cidadão
        if (!selectedCitizen) {
          throw new Error('Cidadão não selecionado');
        }

        const producerData = await apiRequest(`/admin/secretarias/agricultura/produtores`, {
          method: 'POST',
          body: JSON.stringify({
            citizenId: selectedCitizen.id,
            name: formData.name,
            document: formData.document,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            productionType: formData.productionType,
            mainCrop: formData.mainCrop,
            status: 'ACTIVE',
          }),
        });

        toast({
          title: 'Produtor Cadastrado',
          description: `Produtor Rural cadastrado com sucesso!`,
        });
      }

      router.push(`/admin/secretarias/${departmentType}/produtores`);
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
            {isEditMode ? 'Editar' : 'Novo'} Produtor Rural
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastro de produtores e agricultores familiares
          </p>
        </div>
      </div>

      {/* Aviso Importante */}
      {!isEditMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Importante:</p>
                <p>
                  O produtor rural deve ser vinculado a um cidadão já cadastrado no sistema.
                  Busque o cidadão pelo nome e os dados serão preenchidos automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Cidadão */}
        {!isEditMode && (
          <CitizenSelector
            selectedCitizen={selectedCitizen}
            onCitizenSelect={handleCitizenSelect}
            required={true}
            label="Cidadão Vinculado"
            showFullDetails={true}
          />
        )}

        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
            <CardDescription>
              {isEditMode
                ? 'Informações cadastrais do produtor'
                : 'Preenchidos automaticamente ao selecionar o cidadão'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="document">CPF *</Label>
                <Input
                  id="document"
                  value={formData.document || ''}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status || 'ACTIVE'}
                  onValueChange={(v) => handleChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Endereço */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  disabled={true}
                  rows={2}
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Produção */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Produção Rural</CardTitle>
            <CardDescription>
              Informações sobre a atividade agrícola do produtor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Produção */}
              <div className="space-y-2">
                <Label htmlFor="productionType">Tipo de Produção *</Label>
                <Select
                  value={formData.productionType || ''}
                  onValueChange={(v) => handleChange('productionType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Orgânica</SelectItem>
                    <SelectItem value="conventional">Convencional</SelectItem>
                    <SelectItem value="agroecological">Agroecológica</SelectItem>
                    <SelectItem value="mixed">Mista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cultura Principal */}
              <div className="space-y-2">
                <Label htmlFor="mainCrop">Cultura Principal *</Label>
                <Input
                  id="mainCrop"
                  placeholder="Ex: Milho, Feijão, Hortaliças"
                  value={formData.mainCrop || ''}
                  onChange={(e) => handleChange('mainCrop', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
          <Button type="submit" disabled={loading || (!selectedCitizen && !isEditMode)}>
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
      </form>
    </div>
  );
}
