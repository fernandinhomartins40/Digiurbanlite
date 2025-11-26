'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, User, MapPin, Calendar, AlertCircle } from 'lucide-react';

export default function DetalhesSolicitacaoPage() {
  const router = useRouter();
  const params = useParams();
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSolicitacao();
  }, [params.id]);

  const loadSolicitacao = async () => {
    try {
      // TODO: Fetch real data
      setSolicitacao({
        id: params.id,
        protocolId: 'TFD-2025-001',
        citizenName: 'Maria Silva Santos',
        citizenCpf: '123.456.789-00',
        especialidade: 'Oncologia',
        procedimento: 'Quimioterapia',
        justificativa: 'Paciente necessita de tratamento oncológico não disponível no município',
        cidadeDestino: 'São Paulo',
        estadoDestino: 'SP',
        hospitalDestino: 'Hospital das Clínicas',
        status: 'AGUARDANDO_ANALISE_DOCUMENTAL',
        prioridade: 'ALTA',
        createdAt: '2025-11-20T10:00:00',
      });
    } catch (error) {
      console.error('Erro ao carregar solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !solicitacao) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{solicitacao.protocolId}</h1>
          <p className="text-muted-foreground">Detalhes da solicitação TFD</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <p>{solicitacao.citizenName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">CPF</label>
                <p>{solicitacao.citizenCpf}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados Médicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Especialidade</label>
                <p>{solicitacao.especialidade}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Procedimento</label>
                <p>{solicitacao.procedimento}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Justificativa</label>
                <p>{solicitacao.justificativa}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cidade/Estado</label>
                <p>{solicitacao.cidadeDestino} - {solicitacao.estadoDestino}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Hospital</label>
                <p>{solicitacao.hospitalDestino}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className="w-full justify-center py-2">
                {solicitacao.status}
              </Badge>
              <Separator />
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Badge variant="outline" className="mt-1">
                  {solicitacao.prioridade}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Criado em</label>
                <p className="text-sm">
                  {new Date(solicitacao.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Ver Documentos
              </Button>
              <Button className="w-full" variant="outline">
                Imprimir
              </Button>
              <Button className="w-full" variant="destructive">
                Cancelar Solicitação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
