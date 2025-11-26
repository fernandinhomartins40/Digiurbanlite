'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FilaRegulacaoMedicaPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parecer, setParecer] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');

  useEffect(() => {
    loadFila();
  }, []);

  const loadFila = async () => {
    setSolicitacoes([
      {
        id: '2',
        protocolId: 'TFD-2025-002',
        citizenName: 'João Santos',
        especialidade: 'Cardiologia',
        procedimento: 'Cateterismo',
        justificativa: 'Suspeita de obstrução coronariana...',
        prioridade: 'ALTA',
        createdAt: '2025-11-19',
      },
    ]);
  };

  const handleRegulacao = async (aprovado: boolean) => {
    setLoading(true);
    try {
      toast({
        title: aprovado ? 'Regulação Aprovada' : 'Regulação Negada',
        description: `Solicitação ${selectedSolicitacao?.protocolId} foi ${aprovado ? 'aprovada' : 'negada'}.`,
      });
      setSelectedSolicitacao(null);
      setParecer('');
      loadFila();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a regulação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          Fila de Regulação Médica
        </h1>
        <p className="text-muted-foreground">
          Análise médica das solicitações TFD
        </p>
      </div>

      <div className="grid gap-4">
        {solicitacoes.map((sol) => (
          <Card key={sol.id} className="border-blue-200 bg-blue-50/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{sol.protocolId}</h3>
                    <Badge>{sol.prioridade}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Paciente:</strong> {sol.citizenName}</div>
                    <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                    <div><strong>Procedimento:</strong> {sol.procedimento}</div>
                    <div><strong>Justificativa:</strong> {sol.justificativa}</div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedSolicitacao(sol)} className="bg-blue-600">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Regular
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regulação Médica - {sol.protocolId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Prioridade</label>
                        <Select value={prioridade} onValueChange={setPrioridade}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMERGENCIA">Emergência</SelectItem>
                            <SelectItem value="ALTA">Alta</SelectItem>
                            <SelectItem value="MEDIA">Média</SelectItem>
                            <SelectItem value="ROTINA">Rotina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Parecer Médico</label>
                        <Textarea
                          value={parecer}
                          onChange={(e) => setParecer(e.target.value)}
                          placeholder="Justifique a decisão..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRegulacao(false)}
                          disabled={loading}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Indeferir
                        </Button>
                        <Button
                          onClick={() => handleRegulacao(true)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
