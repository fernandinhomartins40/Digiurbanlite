'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProgramSelector } from '@/components/citizen/ProgramSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string;
  moduleType: string;
  departmentType: string;
}

// Mapeamento de moduleType para tipo de API
const MODULE_TO_API_TYPE: Record<string, string> = {
  INSCRICAO_PROGRAMA_RURAL: 'programas-rurais',
  INSCRICAO_CURSO_RURAL: 'cursos-rurais',
  INSCRICAO_OFICINA_CULTURAL: 'oficinas-culturais',
  INSCRICAO_ESCOLINHA: 'escolinhas-esportivas',
  INSCRICAO_PROGRAMA_SOCIAL: 'programas-sociais',
  INSCRICAO_PROGRAMA_TURISTICO: 'programas-turisticos'
};

export default function SelecionarProgramaPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  async function loadService() {
    try {
      setLoading(true);

      const response = await apiClient.get(`/citizen/services/${serviceId}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar informações do serviço');
      }

      const data = await response.json();
      setService(data.service);
    } catch (err) {
      console.error('Erro ao carregar serviço:', err);
      toast.error('Erro ao carregar informações do serviço');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectProgram(program: any) {
    // Redirecionar para página de inscrição
    router.push(`/cidadao/servicos/${serviceId}/inscrever/${program.id}`);
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Serviço não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              O serviço solicitado não foi encontrado.
            </p>
            <Button onClick={() => router.push('/cidadao/servicos')} variant="outline">
              Voltar para Serviços
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const serviceType = MODULE_TO_API_TYPE[service.moduleType];

  if (!serviceType) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle>Serviço não configurado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Este serviço ainda não está configurado para seleção de programas.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </div>

      {/* Program Selector */}
      <ProgramSelector
        serviceType={serviceType}
        onSelectProgram={handleSelectProgram}
      />
    </div>
  );
}
