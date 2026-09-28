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
import { aprovarGestao, listarAguardandoAprovacaoGestao } from '@/lib/api/tfd-api';

interface Solicitacao {
  id: string;
  protocolId: string;
  citizenId: string;
  especialidade: string;
  procedimento: string;
  cidadeDestino: string;
  estadoDestino: string;
  hospitalDestino?: string;
  prioridade: string;
  createdAt: string;
  stageId?: string;
}

export default function FilaAprovacaoGestaoPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [valorEstimado, setValorEstimado] = useState('');
  const [justificativa, setJustificativa] = useState('');

  useEffect(() => {
    loadFila();
  }, []);

  // Fila real: solicitações TFD com parecer médico aprovado aguardando a gestão
  const loadFila = async () => {
    try {
      setLoading(true);
      const data = await listarAguardandoAprovacaoGestao();
      setSolicitacoes(
        (Array.isArray(data) ? data : []).map((s: any) => ({
          id: s.id,
          protocolId: s.protocol?.number || '—',
          citizenId: s.citizenId,
          especialidade: s.especialidade || 'Não informado',
          procedimento: s.procedimento || 'Não informado',
          cidadeDestino: s.cidadeDestino || 'Não informado',
          estadoDestino: s.estadoDestino || '',
          hospitalDestino: s.hospitalDestino,
          prioridade: s.prioridade || 'ROTINA',
          createdAt: s.createdAt,
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a fila de aprovação',
        variant: 'destructive',
      });
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (solicitacao: Solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setValorEstimado('');
    setJustificativa('');
  };

  const handleAprovacao = async (aprovado: boolean) => {
    if (!selectedSolicitacao) return;

    // Validação: justificativa obrigatória
    if (!justificativa.trim()) {
      toast({
        title: 'Atenção',
        description: 'A justificativa da decisão é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    // Validação: valor estimado obrigatório se aprovado
    if (aprovado && (!valorEstimado || parseFloat(valorEstimado) <= 0)) {
      toast({
        title: 'Atenção',
        description: 'O valor estimado é obrigatório para aprovação',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Aprovador = usuário logado (definido no backend); valor aprovado fica registrado
      await aprovarGestao({
        solicitacaoId: selectedSolicitacao.id,
        aprovado,
        valorAprovado: aprovado ? parseFloat(valorEstimado) : undefined,
        observacoes: justificativa.trim(),
      });

      toast({
        title: aprovado ? 'Aprovado pela Gestão' : 'Negado pela Gestão',
        description: `Solicitação ${selectedSolicitacao.protocolId} foi ${
          aprovado ? 'aprovada e está pronta para agendamento' : 'indeferida'
        }.`,
      });

      setSelectedSolicitacao(null);
      setValorEstimado('');
      setJustificativa('');
      loadFila();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a aprovação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d]/g, '')) / 100;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Aguardando Aprovação</div>
            <div className="text-3xl font-bold text-purple-600">{solicitacoes.length}</div>
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
            Nenhuma solicitação aguardando aprovação da gestão
          </CardContent>
        </Card>
      ) : (
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
                      <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                      <div><strong>Procedimento:</strong> {sol.procedimento}</div>
                      <div><strong>Destino:</strong> {sol.cidadeDestino} - {sol.estadoDestino}</div>
                      {sol.hospitalDestino && (
                        <div><strong>Hospital:</strong> {sol.hospitalDestino}</div>
                      )}
                      <div><strong>Data:</strong> {new Date(sol.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <Dialog
                    open={selectedSolicitacao?.id === sol.id}
                    onOpenChange={(open) => !open && setSelectedSolicitacao(null)}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenDialog(sol)} className="bg-purple-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Analisar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Aprovação Gestão - {sol.protocolId}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Informações da solicitação */}
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                          <h4 className="font-semibold">Resumo da Solicitação</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                            <div><strong>Prioridade:</strong> <Badge>{sol.prioridade}</Badge></div>
                            <div className="col-span-2"><strong>Procedimento:</strong> {sol.procedimento}</div>
                            <div className="col-span-2">
                              <strong>Destino:</strong> {sol.cidadeDestino} - {sol.estadoDestino}
                              {sol.hospitalDestino && ` (${sol.hospitalDestino})`}
                            </div>
                          </div>
                        </div>

                        {/* Análise orçamentária */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                          <h4 className="font-semibold text-blue-900 mb-2">Análise Orçamentária</h4>
                          <p className="text-sm text-blue-800">
                            Avalie a viabilidade financeira desta solicitação considerando:
                          </p>
                          <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                            <li>Disponibilidade orçamentária do departamento</li>
                            <li>Custo estimado de transporte, alimentação e hospedagem</li>
                            <li>Prioridade médica da solicitação</li>
                            <li>Possibilidade de realizar o procedimento no município</li>
                          </ul>
                        </div>

                        {/* Campos de aprovação */}
                        <div>
                          <label className="text-sm font-medium">Valor Estimado (R$) *</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={valorEstimado}
                            onChange={(e) => setValorEstimado(e.target.value)}
                            placeholder="0.00"
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Incluir custos de transporte, alimentação, hospedagem e outros.
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Justificativa da Decisão *</label>
                          <Textarea
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            placeholder="Justifique a decisão orçamentária... (obrigatório)"
                            rows={5}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Esta justificativa será registrada para auditoria e prestação de contas.
                          </p>
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
      )}
    </div>
  );
}
