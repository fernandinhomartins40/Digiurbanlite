'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, FileText, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Documento {
  id: string;
  documentType: string;
  isRequired: boolean;
  status: string;
  fileName?: string;
  fileUrl?: string;
}

interface Solicitacao {
  id: string;
  protocolId: string;
  citizenId: string;
  especialidade: string;
  procedimento: string;
  prioridade: string;
  createdAt: string;
  documentos?: Documento[];
}

export default function FilaAnaliseDocumentalPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [documentosPendentes, setDocumentosPendentes] = useState<string[]>([]);

  useEffect(() => {
    loadFila();
  }, []);

  const loadFila = async () => {
    try {
      setLoading(true);

      // ✅ Chamada real à API
      const response = await fetch('/api/tfd/solicitacoes?status=AGUARDANDO_ANALISE_DOCUMENTAL');

      if (!response.ok) {
        throw new Error('Erro ao carregar fila');
      }

      const data = await response.json();
      setSolicitacoes(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a fila de análise documental',
        variant: 'destructive',
      });
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async (protocolId: string) => {
    try {
      const response = await fetch(`/api/protocols/${protocolId}/documents`);

      if (!response.ok) {
        throw new Error('Erro ao carregar documentos');
      }

      const data = await response.json();
      setDocumentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setDocumentos([]);
    }
  };

  const handleOpenDialog = async (solicitacao: Solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setObservacoes('');
    setDocumentosPendentes([]);
    await loadDocumentos(solicitacao.protocolId);
  };

  const toggleDocumentoPendente = (documentType: string) => {
    setDocumentosPendentes(prev =>
      prev.includes(documentType)
        ? prev.filter(d => d !== documentType)
        : [...prev, documentType]
    );
  };

  const handleDecisao = async (aprovado: boolean) => {
    if (!selectedSolicitacao) return;

    // Validação: se recusar, precisa marcar documentos pendentes
    if (!aprovado && documentosPendentes.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione os documentos pendentes',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // ✅ Chamada real à API
      const response = await fetch(`/api/tfd/solicitacoes/${selectedSolicitacao.id}/analisar-documentacao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analistaId: 'CURRENT_USER_ID', // TODO: Pegar do contexto de autenticação
          aprovado,
          documentosPendentes: aprovado ? [] : documentosPendentes,
          observacoes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar análise');
      }

      toast({
        title: aprovado ? 'Documentação Aprovada' : 'Documentação Recusada',
        description: `Solicitação ${selectedSolicitacao.protocolId} ${
          aprovado ? 'avançou para Regulação Médica' : 'retornou para o cidadão com pendências'
        }.`,
      });

      setSelectedSolicitacao(null);
      setObservacoes('');
      setDocumentosPendentes([]);
      loadFila();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a decisão',
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

      {loading && solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Carregando solicitações...
          </CardContent>
        </Card>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma solicitação aguardando análise documental
          </CardContent>
        </Card>
      ) : (
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
                      <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                      <div><strong>Procedimento:</strong> {sol.procedimento}</div>
                      <div><strong>Data:</strong> {new Date(sol.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenDialog(sol)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Analisar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Análise Documental - {sol.protocolId}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Lista de documentos */}
                        <div>
                          <h4 className="font-semibold mb-2">Documentos do Protocolo:</h4>
                          {documentos.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                          ) : (
                            <div className="space-y-2">
                              {documentos.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    {doc.status === 'UPLOADED' || doc.status === 'APPROVED' ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-sm font-medium">{doc.documentType}</span>
                                    {doc.isRequired && <Badge variant="outline">Obrigatório</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {doc.fileUrl && (
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        Ver arquivo
                                      </a>
                                    )}
                                    <Checkbox
                                      checked={documentosPendentes.includes(doc.documentType)}
                                      onCheckedChange={() => toggleDocumentoPendente(doc.documentType)}
                                    />
                                    <label className="text-xs text-muted-foreground">Pendente</label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {documentosPendentes.length > 0 && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm">
                              <strong>Documentos marcados como pendentes:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {documentosPendentes.map(doc => (
                                  <li key={doc}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

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
      )}
    </div>
  );
}
