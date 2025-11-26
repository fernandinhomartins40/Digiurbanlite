'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, Car, Users, Clock, Eye, Plus } from 'lucide-react';

export default function ViagensPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [viagens, setViagens] = useState<any[]>([]);

  useEffect(() => {
    loadViagens();
  }, [date]);

  const loadViagens = async () => {
    // Mock data
    setViagens([
      {
        id: '1',
        dataViagem: '2025-11-25',
        horarioSaida: '07:00',
        destino: 'São Paulo - SP',
        totalPassageiros: 8,
        veiculo: 'Van Fiat Ducato - ABC-1234',
        motorista: 'João Silva',
        status: 'PLANEJADA',
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      PLANEJADA: { label: 'Planejada', variant: 'outline' },
      EM_ANDAMENTO: { label: 'Em Andamento', variant: 'default' },
      CONCLUIDA: { label: 'Concluída', variant: 'secondary' },
    };
    const config = map[status] || map.PLANEJADA;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Viagens TFD</h1>
          <p className="text-muted-foreground">Gerencie as viagens agendadas</p>
        </div>
        <Button
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => router.push('/admin/apps/saude/tfd/viagens/montar-lista')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Montar Lista Automática
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Viagens do Dia - {date?.toLocaleDateString('pt-BR')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viagens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma viagem agendada para esta data
                </div>
              ) : (
                <div className="space-y-4">
                  {viagens.map((viagem) => (
                    <Card key={viagem.id} className="border-green-200 bg-green-50/30">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-bold">{viagem.horarioSaida}</span>
                              {getStatusBadge(viagem.status)}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{viagem.destino}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{viagem.totalPassageiros} passageiros</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span>{viagem.veiculo}</span>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              Motorista: {viagem.motorista}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => router.push(`/admin/apps/saude/tfd/viagens/${viagem.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
