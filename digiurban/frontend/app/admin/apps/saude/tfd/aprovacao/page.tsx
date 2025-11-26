'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FilaAprovacaoGestaoPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [valorEstimado, setValorEstimado] = useState('');
  const [justificativa, setJustificativa] = useState('');

  useEffect(() => {
    loadFila();
  }, []);

  const loadFila = async () => {
    setSolicitacoes([
      {
        id: '3',
        protocolId: 'TFD-2025-003',
        citizenName: 'Ana Paula',
        especialidade: 'Neurologia',
        cidadeDestino: 'São Paulo - SP',
        prioridade: 'MEDIA',
        createdAt: '2025-11-18',
      },
    ]);
  };

  const handleAprovacao = async (aprovado: boolean) => {
    setLoading(true);
    try {
      toast({
        title: aprovado ? 'Aprovado pela Gestão' : 'Negado pela Gestão',
        description: `Solicitação ${selectedSolicitacao?.protocolId} foi ${aprovado ? 'aprovada' : 'negada'}.`,
      });
      setSelectedSolicitacao(null);
      setValorEstimado('');
      setJustificativa('');
      loadFila();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a aprovação',
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
          <DollarSign className="h-8 w-8 text-purple-600" />
          Fila de Aprovação - Gestão
        </h1>
        <p className="text-muted-foreground">
          Aprovação orçamentária das solicitações TFD
        </p>
      </div>

      <div className="grid gap-4">
        {solicitacoes.map((sol) => (
          <Card key={sol.id} className="border-purple-200 bg-purple-50/30">
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
                    <div><strong>Destino:</strong> {sol.cidadeDestino}</div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedSolicitacao(sol)} className="bg-purple-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Analisar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Aprovação Gestão - {sol.protocolId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Valor Estimado (R$)</label>
                        <Input
                          type="number"
                          value={valorEstimado}
                          onChange={(e) => setValorEstimado(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Justificativa</label>
                        <Textarea
                          value={justificativa}
                          onChange={(e) => setJustificativa(e.target.value)}
                          placeholder="Justifique a decisão..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAprovacao(false)}
                          disabled={loading}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Negar
                        </Button>
                        <Button
                          onClick={() => handleAprovacao(true)}
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
