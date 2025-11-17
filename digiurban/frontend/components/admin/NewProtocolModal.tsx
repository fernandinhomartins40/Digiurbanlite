'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DynamicServiceForm, FormField } from './DynamicServiceForm';
import { api } from '@/lib/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/hooks/useSecretariaServices';

interface NewProtocolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onSuccess?: () => void;
}

interface ServiceTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  formSchema?: {
    fields: FormField[];
  };
  requiredDocs?: string[];
  moduleType?: string;
  moduleEntity?: string;
}

export function NewProtocolModal({
  open,
  onOpenChange,
  services,
  onSuccess,
}: NewProtocolModalProps) {
  const [selectedService, setSelectedService] = useState<string>('');
  const [serviceTemplate, setServiceTemplate] = useState<ServiceTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [currentStep, setCurrentStep] = useState<'service' | 'citizen' | 'form'>('service');

  // Dados do cidadão
  const [citizenData, setCitizenData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
  });

  // Dados do formulário do serviço
  const [serviceFormData, setServiceFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [protocolCreated, setProtocolCreated] = useState<string | null>(null);
  const { toast } = useToast();

  const selectedServiceData = services.find((s) => s.id === selectedService);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setSelectedService('');
      setServiceTemplate(null);
      setCurrentStep('service');
      setCitizenData({ name: '', cpf: '', email: '', phone: '' });
      setServiceFormData({});
      setFormErrors({});
      setProtocolCreated(null);
    }
  }, [open]);

  // Não busca template - usa formSchema do próprio serviço se disponível
  useEffect(() => {
    if (!selectedService || !selectedServiceData) {
      setServiceTemplate(null);
      return;
    }

    // Usar formSchema do serviço se disponível
    if (selectedServiceData.customForm) {
      setServiceTemplate({
        id: selectedServiceData.id,
        code: selectedServiceData.id,
        name: selectedServiceData.name,
        description: selectedServiceData.description || '',
        formSchema: selectedServiceData.customForm as any,
        moduleType: selectedServiceData.moduleType || undefined,
        moduleEntity: selectedServiceData.moduleEntity || undefined,
      });
    } else {
      setServiceTemplate(null);
    }
  }, [selectedService, selectedServiceData]);

  const validateCitizenData = (): boolean => {
    const errors: Record<string, string> = {};

    if (!citizenData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!citizenData.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (citizenData.cpf.replace(/\D/g, '').length !== 11) {
      errors.cpf = 'CPF inválido';
    }

    if (!citizenData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateServiceForm = (): boolean => {
    if (!serviceTemplate?.formSchema?.fields) return true;

    const errors: Record<string, string> = {};

    serviceTemplate.formSchema.fields.forEach((field) => {
      if (field.required && !serviceFormData[field.name]) {
        errors[field.name] = `${field.label} é obrigatório`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 'service') {
      if (!selectedService) {
        toast({
          title: 'Erro',
          description: 'Selecione um serviço',
          variant: 'destructive',
        });
        return;
      }
      setCurrentStep('citizen');
    } else if (currentStep === 'citizen') {
      if (!validateCitizenData()) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive',
        });
        return;
      }
      setCurrentStep('form');
    }
  };

  const handleBack = () => {
    if (currentStep === 'form') {
      setCurrentStep('citizen');
    } else if (currentStep === 'citizen') {
      setCurrentStep('service');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateServiceForm()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios do formulário',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/admin/secretarias/agricultura/protocols', {
        serviceId: selectedService,
        citizenData: {
          name: citizenData.name,
          cpf: citizenData.cpf.replace(/\D/g, ''),
          email: citizenData.email,
          phone: citizenData.phone,
        },
        formData: serviceFormData,
      });

      if (response.data.success) {
        const protocolNumber = response.data.data.protocol.number;
        setProtocolCreated(protocolNumber);

        toast({
          title: 'Sucesso!',
          description: response.data.data.message || `Protocolo ${protocolNumber} criado com sucesso`,
        });

        // Aguardar 2 segundos e fechar
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Create protocol error:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar protocolo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderServiceSelection = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service">Selecione o Serviço *</Label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um serviço da agricultura" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <span>{service.name}</span>
                  {service.moduleType && (
                    <Badge variant="default" className="bg-green-600 text-xs">
                      Motor
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedServiceData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-blue-900 font-medium">
              {selectedServiceData.description}
            </p>
            {selectedServiceData.estimatedDays && (
              <p className="text-xs text-blue-700">
                ⏱️ Prazo estimado: {selectedServiceData.estimatedDays} dias
              </p>
            )}
            {selectedServiceData.moduleType && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-700">
                  Integrado com motor de protocolos ({selectedServiceData.moduleEntity})
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {loadingTemplate && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">Carregando formulário...</span>
        </div>
      )}

      {selectedServiceData?.requiresDocuments && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            📎 Documentos Necessários:
          </p>
          <ul className="text-sm text-yellow-700 space-y-1">
            {serviceTemplate?.requiredDocs?.map((doc, index) => (
              <li key={index}>• {doc}</li>
            )) || (
              <>
                <li>• RG e CPF</li>
                <li>• Comprovante de residência</li>
                <li>• Documentação específica do serviço</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  const renderCitizenForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="citizenName">Nome Completo *</Label>
          <Input
            id="citizenName"
            value={citizenData.name}
            onChange={(e) => setCitizenData({ ...citizenData, name: e.target.value })}
            placeholder="Nome completo do cidadão"
            className={formErrors.name ? 'border-red-500' : ''}
          />
          {formErrors.name && (
            <p className="text-sm text-red-500">{formErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="citizenCpf">CPF *</Label>
          <Input
            id="citizenCpf"
            value={citizenData.cpf}
            onChange={(e) => setCitizenData({ ...citizenData, cpf: e.target.value })}
            placeholder="000.000.000-00"
            maxLength={14}
            className={formErrors.cpf ? 'border-red-500' : ''}
          />
          {formErrors.cpf && (
            <p className="text-sm text-red-500">{formErrors.cpf}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="citizenPhone">Telefone *</Label>
          <Input
            id="citizenPhone"
            value={citizenData.phone}
            onChange={(e) => setCitizenData({ ...citizenData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className={formErrors.phone ? 'border-red-500' : ''}
          />
          {formErrors.phone && (
            <p className="text-sm text-red-500">{formErrors.phone}</p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="citizenEmail">E-mail (opcional)</Label>
          <Input
            id="citizenEmail"
            type="email"
            value={citizenData.email}
            onChange={(e) => setCitizenData({ ...citizenData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>
    </div>
  );

  const renderServiceForm = () => {
    if (!serviceTemplate?.formSchema?.fields) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Este serviço não possui formulário customizado</p>
          <p className="text-sm text-gray-500 mt-2">
            Clique em "Criar Protocolo" para finalizar
          </p>
        </div>
      );
    }

    return (
      <DynamicServiceForm
        fields={serviceTemplate.formSchema.fields}
        formData={serviceFormData}
        onChange={setServiceFormData}
        errors={formErrors}
      />
    );
  };

  if (protocolCreated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Protocolo Criado!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4">
              <p className="text-sm text-gray-600 mb-2">Número do Protocolo</p>
              <p className="text-3xl font-bold text-green-700">{protocolCreated}</p>
            </div>
            <p className="text-sm text-gray-600">
              O protocolo foi criado e vinculado ao sistema.
              <br />
              Esta janela fechará automaticamente.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Protocolo - Agricultura
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo protocolo de atendimento
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="service" disabled>
              1. Serviço
            </TabsTrigger>
            <TabsTrigger value="citizen" disabled>
              2. Cidadão
            </TabsTrigger>
            <TabsTrigger value="form" disabled>
              3. Detalhes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="service" className="space-y-4 mt-4">
            {renderServiceSelection()}
          </TabsContent>

          <TabsContent value="citizen" className="space-y-4 mt-4">
            {renderCitizenForm()}
          </TabsContent>

          <TabsContent value="form" className="space-y-4 mt-4">
            {renderServiceForm()}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep !== 'service' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            {currentStep !== 'form' ? (
              <Button onClick={handleNext} disabled={loading || loadingTemplate}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Protocolo'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
