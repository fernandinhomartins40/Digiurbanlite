'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DynamicEnrollmentForm } from '@/components/citizen/DynamicEnrollmentForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string;
  moduleType: string;
  departmentType: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  programType?: string;
  targetAudience?: string;
  startDate: string;
  endDate?: string;
  maxParticipants: number;
  currentParticipants: number;
  availableSlots: number;
  hasVacancy: boolean;
  coordinator?: string;
  status: string;
  customFields?: any;
  requiredDocuments?: any;
  enrollmentSettings?: any;
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

export default function InscreverProgramaPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const programId = params.programId as string;

  const [service, setService] = useState<Service | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [serviceId, programId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Carregar informações do serviço
      const serviceResponse = await apiClient.get(`/citizen/services/${serviceId}`);

      if (!serviceResponse.ok) {
        throw new Error('Erro ao carregar informações do serviço');
      }

      const serviceData = await serviceResponse.json();
      setService(serviceData.service);

      // Determinar tipo de API baseado no moduleType
      const serviceType = MODULE_TO_API_TYPE[serviceData.service.moduleType];

      if (!serviceType) {
        throw new Error('Tipo de serviço não suportado');
      }

      // Carregar detalhes do programa
      const programResponse = await apiClient.get(`/citizen/${serviceType}/${programId}`);

      if (!programResponse.ok) {
        throw new Error('Erro ao carregar informações do programa');
      }

      const programData = await programResponse.json();
      setProgram(programData.program || programData.course || programData.workshop);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
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

  if (error || !service || !program) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error || 'Erro ao Carregar Dados'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar as informações necessárias para a inscrição.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => router.back()} variant="outline">
                Voltar
              </Button>
              <Button onClick={loadData}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se ainda há vagas
  if (!program.hasVacancy) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Programa sem vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Infelizmente este programa já atingiu o número máximo de participantes.
            </p>
            <Button onClick={() => router.push(`/cidadao/servicos/${serviceId}/selecionar`)}>
              Escolher Outro Programa
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
          <h1 className="text-3xl font-bold">Inscrição em Programa</h1>
          <p className="text-muted-foreground">{service.name}</p>
        </div>
      </div>

      {/* Enrollment Form */}
      <DynamicEnrollmentForm
        program={program}
        serviceId={serviceId}
        moduleType={service.moduleType}
      />
    </div>
  );
}
