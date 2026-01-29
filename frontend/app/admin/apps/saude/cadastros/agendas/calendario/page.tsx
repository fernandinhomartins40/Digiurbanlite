'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, List } from 'lucide-react';
import { UnidadeSaudeSelector } from '@/components/apps/saude/cadastros';
import toast from 'react-hot-toast';

interface Agenda {
  id: number;
  profissional: { nome: string };
  especialidade: { nome: string; cor: string | null };
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  vagasDisponiveis: number;
}

export default function CalendarioAgendasPage() {
  const router = useRouter();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [unidadeId, setUnidadeId] = useState<number | null>(null);

  useEffect(() => {
    if (unidadeId) {
      fetchAgendas();
    }
  }, [unidadeId]);

  const fetchAgendas = async () => {
    if (!unidadeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/apps/saude/cadastros/agendas?unidadeId=${unidadeId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAgendas(data);
      } else {
        toast.error('Erro ao carregar agendas');
      }
    } catch (error) {
      console.error('Erro ao carregar agendas:', error);
      toast.error('Erro ao carregar agendas');
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const getAgendasPorDia = (dia: number) => {
    return agendas.filter(a => a.diaSemana === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/apps/saude/cadastros/agendas')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Calendário de Agendas</h1>
            <p className="text-gray-600">Visualização semanal de agendas</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/apps/saude/cadastros/agendas')}>
          <List className="h-4 w-4 mr-2" />
          Visualizar Lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">Unidade de Saúde</label>
            <UnidadeSaudeSelector
              value={unidadeId}
              onChange={(id) => setUnidadeId(id)}
            />
          </div>
        </CardContent>
      </Card>

      {!unidadeId ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Selecione uma unidade de saúde para visualizar as agendas
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {diasSemana.map((dia, index) => {
            const agendasDia = getAgendasPorDia(index);
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{dia}</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {agendasDia.length} agenda{agendasDia.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {agendasDia.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Nenhuma agenda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {agendasDia.map((agenda) => (
                        <div
                          key={agenda.id}
                          className="p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: agenda.especialidade.cor || '#6366f1'
                          }}
                          onClick={() => router.push(`/admin/apps/saude/cadastros/agendas/${agenda.id}/editar`)}
                        >
                          <div className="font-medium text-sm">{agenda.profissional.nome}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {agenda.especialidade.nome}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {agenda.horaInicio} - {agenda.horaFim}
                            </span>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {agenda.vagasDisponiveis} vagas
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
