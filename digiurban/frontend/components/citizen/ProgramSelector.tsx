'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { normalizeRequiredDocuments } from '@/lib/normalize-documents';

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

interface ProgramSelectorProps {
  serviceType: string; // 'programas-rurais', 'cursos-rurais', 'oficinas-culturais'
  onSelectProgram: (program: Program) => void;
}

export function ProgramSelector({ serviceType, onSelectProgram }: ProgramSelectorProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrograms();
  }, [serviceType]);

  async function loadPrograms() {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/citizen/${serviceType}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar programas disponíveis');
      }

      const data = await response.json();
      const rawPrograms = data.programs || data.courses || data.workshops || [];

      // Normalizar requiredDocuments para array
      const normalizedPrograms = rawPrograms.map((program: any) => ({
        ...program,
        requiredDocuments: normalizeRequiredDocuments(program.requiredDocuments)
      }));

      setPrograms(normalizedPrograms);
    } catch (err) {
      console.error('Erro ao carregar programas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar programas disponíveis');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando programas disponíveis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Programas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPrograms} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum Programa Disponível</CardTitle>
          <CardDescription>
            No momento não há programas abertos para inscrição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Volte novamente em breve para verificar novas oportunidades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Programas Disponíveis</h2>
        <p className="text-muted-foreground">
          Selecione um programa para realizar sua inscrição
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <Card
            key={program.id}
            className={!program.hasVacancy ? 'opacity-60' : 'hover:shadow-lg transition-shadow'}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {program.programType && (
                      <Badge variant="outline">
                        {program.programType}
                      </Badge>
                    )}
                    {program.status === 'PLANNED' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Em Planejamento
                      </Badge>
                    )}
                    {program.status === 'ACTIVE' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    )}
                  </div>
                </div>
                {program.hasVacancy ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vagas Disponíveis
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Sem Vagas
                  </Badge>
                )}
              </div>

              <CardDescription className="mt-2">
                {program.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informações do Programa */}
              <div className="space-y-2 text-sm">
                {program.targetAudience && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Público-Alvo: {program.targetAudience}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Início: {format(new Date(program.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    {program.endDate && ` - Fim: ${format(new Date(program.endDate), "dd/MM/yyyy", { locale: ptBR })}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    Vagas: {program.availableSlots} disponíveis de {program.maxParticipants} totais
                  </span>
                </div>

                {program.coordinator && (
                  <div className="text-muted-foreground">
                    <strong>Coordenador:</strong> {program.coordinator}
                  </div>
                )}
              </div>

              {/* Documentos Necessários */}
              {program.requiredDocuments && Array.isArray(program.requiredDocuments) && program.requiredDocuments.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Documentos Necessários:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {program.requiredDocuments.map((doc: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{typeof doc === 'string' ? doc : (doc.name || JSON.stringify(doc))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botão de Inscrição */}
              <Button
                onClick={() => onSelectProgram(program)}
                disabled={!program.hasVacancy}
                className="w-full"
              >
                {program.hasVacancy ? 'Inscrever-se' : 'Sem Vagas'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
