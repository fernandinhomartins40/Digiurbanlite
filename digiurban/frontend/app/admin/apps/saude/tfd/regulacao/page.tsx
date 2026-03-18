'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  listarSolicitacoes,
  criarParecerRegulacao,
  aprovarSolicitacao,
  negarSolicitacao,
} from '@/lib/api/tfd-api';
import { FileText, CheckCircle, XCircle, AlertCircle, User, MapPin, Calendar, ArrowLeft } from 'lucide-react';

export default function RegulacaoPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [parecer, setParecer] = useState({
    parecer: '',
    justificativa: '',
    recomendacoes: '',
    urgencia: 'NORMAL',
  });
  const [acao, setAcao] = useState<'aprovar' | 'negar' | null>(null);

  useEffect(() => {
    loadSolicitacoes();
  }, []);

  const loadSolicitacoes = async () => {
    try {
      const data = await listarSolicitacoes({ status: 'AGUARDANDO_REGULACAO' });
      setSolicitacoes(data);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (solicitacao: any, tipo: 'aprovar' | 'negar') => {
    setSelectedSolicitacao(solicitacao);
    setAcao(tipo);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedSolicitacao || !acao) return;

    try {
      if (acao === 'aprovar') {
        await aprovarSolicitacao(selectedSolicitacao.id, {
          parecerMedico: parecer.parecer,
          recomendacoes: parecer.recomendacoes || undefined,
        });
      } else {
        await negarSolicitacao(selectedSolicitacao.id, {
          motivoNegacao: parecer.justificativa,
        });
      }

      alert(`Solicitação ${acao === 'aprovar' ? 'aprovada' : 'negada'} com sucesso!`);
      setDialogOpen(false);
      setParecer({ parecer: '', justificativa: '', recomendacoes: '', urgencia: 'NORMAL' });
      loadSolicitacoes();
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      alert('Erro ao processar solicitação');
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    if (prioridade === 'URGENTE') {
      return <Badge variant="destructive">Urgente</Badge>;
    }
    if (prioridade === 'PRIORITARIO') {
      return <Badge className="bg-orange-600">Prioritário</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando solicitações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Regulação Médica - TFD</h1>
          <p className="text-gray-500 mt-1">
            Análise e parecer médico sobre solicitações de TFD
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Estatística */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Fila de Regulação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{solicitacoes.length}</div>
          <p className="text-sm text-gray-500 mt-1">
            Solicitações aguardando parecer médico
          </p>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <div className="space-y-4">
        {solicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma solicitação pendente</h3>
              <p className="text-gray-500">
                Todas as solicitações foram reguladas
              </p>
            </CardContent>
          </Card>
        ) : (
          solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {solicitacao.citizen?.name || 'Paciente'}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          CPF: {solicitacao.citizen?.cpf || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getPrioridadeBadge(solicitacao.prioridade)}
                    <Badge variant="secondary">
                      {new Date(solicitacao.dataSolicitacao).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Especialidade</div>
                    <div className="text-sm text-gray-900">
                      {solicitacao.especialidade || 'Não informada'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Destino
                    </div>
                    <div className="text-sm text-gray-900">
                      {solicitacao.municipioDestino || '-'}
                    </div>
                  </div>
                </div>

                {solicitacao.justificativa && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      <FileText className="inline h-3 w-3 mr-1" />
                      Justificativa Médica
                    </div>
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                      {solicitacao.justificativa}
                    </div>
                  </div>
                )}

                {solicitacao.diagnostico && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Diagnóstico</div>
                    <div className="text-sm text-gray-600">{solicitacao.diagnostico}</div>
                  </div>
                )}

                {solicitacao.dataPreferencialConsulta && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Data Preferencial
                    </div>
                    <div className="text-sm text-gray-900">
                      {new Date(solicitacao.dataPreferencialConsulta).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleOpenDialog(solicitacao, 'negar')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Negar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleOpenDialog(solicitacao, 'aprovar')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Parecer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {acao === 'aprovar' ? 'Aprovar Solicitação' : 'Negar Solicitação'}
            </DialogTitle>
            <DialogDescription>
              Paciente: {selectedSolicitacao?.citizen?.name || 'Não informado'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {acao === 'aprovar' ? (
              <>
                <div>
                  <Label htmlFor="parecer">Parecer Médico *</Label>
                  <Textarea
                    id="parecer"
                    value={parecer.parecer}
                    onChange={(e) => setParecer({ ...parecer, parecer: e.target.value })}
                    placeholder="Descreva seu parecer sobre a solicitação"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recomendacoes">Recomendações</Label>
                  <Textarea
                    id="recomendacoes"
                    value={parecer.recomendacoes}
                    onChange={(e) => setParecer({ ...parecer, recomendacoes: e.target.value })}
                    placeholder="Recomendações para o tratamento"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="urgencia">Nível de Urgência</Label>
                  <Select
                    value={parecer.urgencia}
                    onValueChange={(value) => setParecer({ ...parecer, urgencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENTE">Urgente</SelectItem>
                      <SelectItem value="PRIORITARIO">Prioritário</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="justificativa">Motivo da Negação *</Label>
                <Textarea
                  id="justificativa"
                  value={parecer.justificativa}
                  onChange={(e) => setParecer({ ...parecer, justificativa: e.target.value })}
                  placeholder="Descreva o motivo da negação da solicitação"
                  rows={6}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                acao === 'aprovar'
                  ? !parecer.parecer.trim()
                  : !parecer.justificativa.trim()
              }
              className={acao === 'aprovar' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={acao === 'negar' ? 'destructive' : 'default'}
            >
              {acao === 'aprovar' ? 'Aprovar' : 'Negar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
