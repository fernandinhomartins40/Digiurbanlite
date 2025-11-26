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

interface Solicitacao {
  id: string;
  protocolId: string;
  citizenId: string;
  especialidade: string;
  procedimento: string;
  justificativa: string;
  prioridade: string;
  createdAt: string;
}

export default function FilaRegulacaoMedicaPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [parecer, setParecer] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');

  useEffect(() => {
    loadFila();
  }, []);

  const loadFila = async () => {
    try {
      setLoading(true);

      // ✅ Chamada real à API
      const response = await fetch('/api/tfd/solicitacoes?status=AGUARDANDO_REGULACAO_MEDICA');

      if (!response.ok) {
        throw new Error('Erro ao carregar fila');
      }

      const data = await response.json();
      setSolicitacoes(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a fila de regulação médica',
        variant: 'destructive',
      });
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (solicitacao: Solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setParecer('');
    setPrioridade(solicitacao.prioridade || 'MEDIA');
  };

  const handleRegulacao = async (aprovado: boolean) => {
    if (!selectedSolicitacao) return;

    // Validação: parecer obrigatório
    if (!parecer.trim()) {
      toast({
        title: 'Atenção',
        description: 'O parecer médico é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // ✅ Chamada real à API
      const response = await fetch(`/api/tfd/solicitacoes/${selectedSolicitacao.id}/regulacao-medica`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reguladorId: 'CURRENT_USER_ID', // TODO: Pegar do contexto de autenticação
          aprovado,
          justificativa: parecer,
          prioridade: aprovado ? prioridade : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar regulação');
      }

      toast({
        title: aprovado ? 'Regulação Aprovada' : 'Regulação Negada',
        description: `Solicitação ${selectedSolicitacao.protocolId} foi ${
          aprovado ? 'aprovada e encaminhada para Aprovação da Gestão' : 'negada e cancelada'
        }.`,
      });

      setSelectedSolicitacao(null);
      setParecer('');
      loadFila();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a regulação',
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Aguardando Regulação</div>
            <div className="text-3xl font-bold text-blue-600">{solicitacoes.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading && solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Carregando solicitações...
          </CardContent>
        </Card>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma solicitação aguardando regulação médica
          </CardContent>
        </Card>
      ) : (
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
                      <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                      <div><strong>Procedimento:</strong> {sol.procedimento}</div>
                      <div><strong>Justificativa:</strong> {sol.justificativa}</div>
                      <div><strong>Data:</strong> {new Date(sol.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenDialog(sol)} className="bg-blue-600">
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Regular
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Regulação Médica - {sol.protocolId}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Informações da solicitação */}
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <h4 className="font-semibold">Informações da Solicitação</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                            <div><strong>Prioridade Atual:</strong> <Badge>{sol.prioridade}</Badge></div>
                            <div className="col-span-2"><strong>Procedimento:</strong> {sol.procedimento}</div>
                            <div className="col-span-2">
                              <strong>Justificativa Médica:</strong>
                              <p className="mt-1 text-muted-foreground">{sol.justificativa}</p>
                            </div>
                          </div>
                        </div>

                        {/* Campos de regulação */}
                        <div>
                          <label className="text-sm font-medium">Prioridade (após análise médica)</label>
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
                          <label className="text-sm font-medium">Parecer Médico *</label>
                          <Textarea
                            value={parecer}
                            onChange={(e) => setParecer(e.target.value)}
                            placeholder="Justifique a decisão médica... (obrigatório)"
                            rows={5}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Este parecer será registrado no protocolo e ficará visível para o cidadão.
                          </p>
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
      )}
    </div>
  );
}
