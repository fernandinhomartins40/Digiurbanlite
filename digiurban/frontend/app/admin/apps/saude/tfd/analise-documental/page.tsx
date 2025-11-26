'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FilaAnaliseDocumentalPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    loadFila();
  }, []);

  const loadFila = async () => {
    // Mock data
    setSolicitacoes([
      {
        id: '1',
        protocolId: 'TFD-2025-001',
        citizenName: 'Maria Silva',
        especialidade: 'Oncologia',
        prioridade: 'ALTA',
        createdAt: '2025-11-20',
        documentos: {
          encaminhamento: true,
          exames: true,
          rg: false,
        },
      },
      {
        id: '2',
        protocolId: 'TFD-2025-005',
        citizenName: 'João Santos',
        especialidade: 'Cardiologia',
        prioridade: 'EMERGENCIA',
        createdAt: '2025-11-21',
        documentos: {
          encaminhamento: true,
          exames: false,
          rg: true,
        },
      },
    ]);
  };

  const handleDecisao = async (aprovado: boolean) => {
    setLoading(true);
    try {
      // TODO: API call
      toast({
        title: aprovado ? 'Documentação Aprovada' : 'Documentação Recusada',
        description: `Solicitação ${selectedSolicitacao?.protocolId} ${aprovado ? 'avançou' : 'retornou'} para o cidadão.`,
      });
      setSelectedSolicitacao(null);
      setObservacoes('');
      loadFila();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a decisão',
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
          <Clock className="h-8 w-8 text-yellow-600" />
          Fila de Análise Documental
        </h1>
        <p className="text-muted-foreground">
          Verifique os documentos das solicitações TFD
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{solicitacoes.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {solicitacoes.map((sol) => (
          <Card key={sol.id} className="border-yellow-200 bg-yellow-50/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{sol.protocolId}</h3>
                    <Badge variant={sol.prioridade === 'EMERGENCIA' ? 'destructive' : 'default'}>
                      {sol.prioridade}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Paciente:</strong> {sol.citizenName}</div>
                    <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                    <div><strong>Data:</strong> {new Date(sol.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Documentos:</h4>
                    <div className="flex gap-2">
                      <Badge variant={sol.documentos.encaminhamento ? 'default' : 'destructive'}>
                        {sol.documentos.encaminhamento ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        Encaminhamento
                      </Badge>
                      <Badge variant={sol.documentos.exames ? 'default' : 'destructive'}>
                        {sol.documentos.exames ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        Exames
                      </Badge>
                      <Badge variant={sol.documentos.rg ? 'default' : 'destructive'}>
                        {sol.documentos.rg ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        RG
                      </Badge>
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedSolicitacao(sol)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Analisar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Análise Documental - {sol.protocolId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Observações</label>
                        <Textarea
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Descreva problemas encontrados ou observações..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDecisao(false)}
                          disabled={loading}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Recusar
                        </Button>
                        <Button
                          onClick={() => handleDecisao(true)}
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
