'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, FileText, Clock, AlertCircle, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { listarFilaAnaliseDocumental, registrarAnaliseDocumental } from '@/lib/api/tfd-api';

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
  status: string;
  protocolDbId: string;
  protocolNumber: string;
  citizenName: string;
  especialidade: string;
  procedimento: string;
  prioridade: string;
  observacoes?: string;
  createdAt: string;
}

export default function FilaAnaliseDocumentalPage() {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [documentosPendentes, setDocumentosPendentes] = useState<string[]>([]);
  const [outroDocumento, setOutroDocumento] = useState('');

  useEffect(() => {
    loadFila();
  }, []);

  // Fila real do TFD (SolicitacaoTFD), não protocolos genéricos
  const loadFila = async () => {
    try {
      setLoading(true);
      const data = await listarFilaAnaliseDocumental();
      setSolicitacoes(
        (Array.isArray(data) ? data : []).map((s: any) => ({
          id: s.id,
          status: s.status,
          protocolDbId: s.protocol?.id || s.protocolId,
          protocolNumber: s.protocol?.number || '—',
          citizenName: s.protocol?.citizen?.name || 'Cidadão',
          especialidade: s.especialidade || 'Não informado',
          procedimento: s.procedimento || 'Não informado',
          prioridade: s.prioridade || 'ROTINA',
          observacoes: s.observacoes || undefined,
          createdAt: s.createdAt,
        }))
      );
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

  const loadDocumentos = async (protocolDbId: string) => {
    try {
      const response = await fetch(`/api/protocols/${protocolDbId}/documents`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao carregar documentos');
      const body = await response.json();
      setDocumentos(Array.isArray(body?.data) ? body.data : []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setDocumentos([]);
    }
  };

  const handleOpenDialog = async (solicitacao: Solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setObservacoes('');
    setDocumentosPendentes([]);
    setOutroDocumento('');
    setDocumentos([]);
    await loadDocumentos(solicitacao.protocolDbId);
  };

  const toggleDocumentoPendente = (documentType: string) => {
    setDocumentosPendentes(prev =>
      prev.includes(documentType)
        ? prev.filter(d => d !== documentType)
        : [...prev, documentType]
    );
  };

  // Documento que o cidadão nem chegou a enviar
  const adicionarOutroDocumento = () => {
    const nome = outroDocumento.trim();
    if (!nome) return;
    setDocumentosPendentes(prev => (prev.includes(nome) ? prev : [...prev, nome]));
    setOutroDocumento('');
  };

  const handleDecisao = async (aprovado: boolean) => {
    if (!selectedSolicitacao) return;

    if (!aprovado && documentosPendentes.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Marque ou informe os documentos pendentes',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await registrarAnaliseDocumental(selectedSolicitacao.id, {
        aprovado,
        documentosPendentes: aprovado ? [] : documentosPendentes,
        observacoes: observacoes.trim() || undefined,
      });

      toast({
        title: aprovado ? 'Documentação aprovada' : 'Pendências enviadas ao cidadão',
        description: aprovado
          ? `Protocolo ${selectedSolicitacao.protocolNumber} seguiu para a Regulação Médica.`
          : `${result?.pendenciasCriadas ?? documentosPendentes.length} pendência(s) criada(s) no protocolo ${selectedSolicitacao.protocolNumber}. O cidadão verá o aviso no portal.`,
      });

      setSelectedSolicitacao(null);
      loadFila();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a decisão',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const aguardandoAnalise = solicitacoes.filter(s => s.status === 'AGUARDANDO_ANALISE_DOCUMENTAL');
  const aguardandoCidadao = solicitacoes.filter(s => s.status === 'DOCUMENTACAO_PENDENTE');

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aguardando análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{aguardandoAnalise.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aguardando documentos do cidadão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{aguardandoCidadao.length}</div>
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
          {[...aguardandoAnalise, ...aguardandoCidadao].map((sol) => {
            const pendenteCidadao = sol.status === 'DOCUMENTACAO_PENDENTE';
            return (
              <Card
                key={sol.id}
                className={pendenteCidadao ? 'border-orange-200 bg-orange-50/30' : 'border-yellow-200 bg-yellow-50/30'}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{sol.protocolNumber}</h3>
                        <Badge variant={sol.prioridade === 'EMERGENCIA' ? 'destructive' : 'default'}>
                          {sol.prioridade}
                        </Badge>
                        {pendenteCidadao && (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Aguardando cidadão
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Cidadão:</strong> {sol.citizenName}</div>
                        <div><strong>Especialidade:</strong> {sol.especialidade}</div>
                        <div><strong>Procedimento:</strong> {sol.procedimento}</div>
                        <div><strong>Data:</strong> {new Date(sol.createdAt).toLocaleDateString('pt-BR')}</div>
                        {pendenteCidadao && sol.observacoes && (
                          <div className="text-orange-800"><strong>Pendências:</strong> {sol.observacoes}</div>
                        )}
                      </div>
                    </div>

                    <Button onClick={() => handleOpenDialog(sol)} className="w-full sm:w-auto">
                      <FileText className="h-4 w-4 mr-2" />
                      {pendenteCidadao ? 'Reanalisar' : 'Analisar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedSolicitacao} onOpenChange={(open) => !open && setSelectedSolicitacao(null)}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análise Documental - {selectedSolicitacao?.protocolNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Documentos do protocolo:</h4>
              {documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 p-2 border rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        {doc.status === 'UPLOADED' || doc.status === 'APPROVED' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{doc.documentType}</span>
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
                          id={`pend-${doc.id}`}
                          checked={documentosPendentes.includes(doc.documentType)}
                          onCheckedChange={() => toggleDocumentoPendente(doc.documentType)}
                        />
                        <label htmlFor={`pend-${doc.id}`} className="text-xs text-muted-foreground">Pendente</label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="outro-doc">Documento que falta e não foi enviado</label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="outro-doc"
                  value={outroDocumento}
                  onChange={(e) => setOutroDocumento(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarOutroDocumento(); } }}
                  placeholder="Ex.: Pedido médico, Cartão SUS..."
                />
                <Button type="button" variant="outline" onClick={adicionarOutroDocumento} aria-label="Adicionar documento pendente">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {documentosPendentes.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <strong>O cidadão será avisado para enviar:</strong>
                  <ul className="mt-1 space-y-1">
                    {documentosPendentes.map(doc => (
                      <li key={doc} className="flex items-center gap-2">
                        • {doc}
                        <button
                          type="button"
                          onClick={() => toggleDocumentoPendente(doc)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remover ${doc}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium" htmlFor="obs-analise">Observações</label>
              <Textarea
                id="obs-analise"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva problemas encontrados ou observações..."
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleDecisao(false)}
                disabled={saving}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Devolver com pendências
              </Button>
              <Button
                onClick={() => handleDecisao(true)}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar e enviar à regulação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
