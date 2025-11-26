'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wand2, Eye, CheckCircle, Car, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MontarListaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [resultado, setResultado] = useState<any>(null);

  const [formData, setFormData] = useState({
    dataViagem: '',
    destino: '',
    horarioSaida: '07:00',
  });

  const handlePreview = async () => {
    setLoading(true);
    try {
      // TODO: Chamar API real
      // const response = await fetch('/api/tfd/viagens/preview-lista', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     dataViagem: new Date(formData.dataViagem),
      //     destino: formData.destino,
      //     horarioSaida: formData.horarioSaida,
      //   }),
      // });
      // const data = await response.json();

      // Mock data
      setPreview({
        totalSolicitacoes: 5,
        totalPassageiros: 8,
        tipoVeiculoRecomendado: 'VAN',
        solicitacoes: [
          { protocolId: 'TFD-2025-001', especialidade: 'Cardiologia', temAcompanhante: true },
          { protocolId: 'TFD-2025-002', especialidade: 'Oncologia', temAcompanhante: true },
          { protocolId: 'TFD-2025-003', especialidade: 'Neurologia', temAcompanhante: false },
        ],
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar preview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMontarLista = async () => {
    setLoading(true);
    try {
      // TODO: Chamar API real
      // const response = await fetch('/api/tfd/viagens/montar-lista', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     dataViagem: new Date(formData.dataViagem),
      //     destino: formData.destino,
      //     horarioSaida: formData.horarioSaida,
      //   }),
      // });
      // const data = await response.json();

      // Mock data
      setResultado({
        viagem: {
          id: 'viagem-123',
          dataViagem: formData.dataViagem,
          horarioSaida: formData.horarioSaida,
          destino: formData.destino,
        },
        passageiros: {
          total: 8,
          pacientes: 5,
          acompanhantes: 3,
        },
        veiculo: {
          modelo: 'Van Fiat Ducato',
          placa: 'ABC-1234',
          capacidade: 15,
        },
        motorista: {
          nome: 'João Silva',
          cnh: '12345678900',
          telefone: '(11) 98765-4321',
        },
      });

      toast({
        title: '🎉 Lista montada com sucesso!',
        description: 'A viagem foi criada e os veículos/motoristas foram alocados.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível montar a lista',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-purple-600" />
            Montador Automático de Listas
          </h1>
          <p className="text-muted-foreground">
            Agrupe automaticamente solicitações e aloque veículos e motoristas
          </p>
        </div>
      </div>

      {!resultado ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros da Viagem</CardTitle>
              <CardDescription>
                Informe a data e destino para agrupar as solicitações automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataViagem">Data da Viagem *</Label>
                  <Input
                    id="dataViagem"
                    type="date"
                    required
                    value={formData.dataViagem}
                    onChange={(e) => setFormData({ ...formData, dataViagem: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destino">Cidade Destino *</Label>
                  <Input
                    id="destino"
                    required
                    placeholder="Ex: São Paulo"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horarioSaida">Horário de Saída *</Label>
                  <Input
                    id="horarioSaida"
                    type="time"
                    required
                    value={formData.horarioSaida}
                    onChange={(e) => setFormData({ ...formData, horarioSaida: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handlePreview}
                  disabled={loading || !formData.dataViagem || !formData.destino}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {loading ? 'Gerando...' : 'Gerar Preview'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <>
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Preview da Lista
                  </CardTitle>
                  <CardDescription>
                    Visualize as solicitações compatíveis antes de criar a viagem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Solicitações Encontradas</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {preview.totalSolicitacoes}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total de Passageiros</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {preview.totalPassageiros}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Veículo Recomendado</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {preview.tipoVeiculoRecomendado}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Solicitações que serão agrupadas:</h4>
                    <div className="space-y-2">
                      {preview.solicitacoes.map((sol: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <div className="font-medium">{sol.protocolId}</div>
                            <div className="text-sm text-muted-foreground">{sol.especialidade}</div>
                          </div>
                          {sol.temAcompanhante && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              Com acompanhante
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleMontarLista}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <Wand2 className="h-5 w-5 mr-2" />
                    {loading ? 'Montando Lista...' : 'Confirmar e Montar Lista Automaticamente'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Lista Montada com Sucesso!
            </CardTitle>
            <CardDescription>
              A viagem foi criada e os recursos foram alocados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total de Passageiros</div>
                <div className="text-2xl font-bold text-green-600">
                  {resultado.passageiros.total}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {resultado.passageiros.pacientes} pacientes + {resultado.passageiros.acompanhantes} acompanhantes
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Veículo Alocado
                </div>
                <div className="text-lg font-bold">{resultado.veiculo.modelo}</div>
                <div className="text-sm text-muted-foreground">
                  {resultado.veiculo.placa} - Cap: {resultado.veiculo.capacidade}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Motorista
                </div>
                <div className="text-lg font-bold">{resultado.motorista.nome}</div>
                <div className="text-sm text-muted-foreground">{resultado.motorista.telefone}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => router.push(`/admin/apps/saude/tfd/viagens/${resultado.viagem.id}`)}
                className="flex-1"
              >
                Ver Detalhes da Viagem
              </Button>
              <Button
                onClick={() => {
                  setResultado(null);
                  setPreview(null);
                  setFormData({ dataViagem: '', destino: '', horarioSaida: '07:00' });
                }}
                variant="outline"
                className="flex-1"
              >
                Montar Nova Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
