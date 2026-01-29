'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FlaskConical, Plus, Upload, FileText, Loader2 } from 'lucide-react';

interface ExameSolicitado {
  id: string;
  codigoSIGTAP: string;
  nomeExame: string;
  urgencia: 'ROTINA' | 'URGENTE' | 'MUITO_URGENTE';
  justificativa?: string;
  cid10?: string;
  dataSolicitacao: Date;
  status: 'PENDENTE' | 'COLETADO' | 'RESULTADO_DISPONIVEL';
  resultado?: ExameResultado;
}

interface ExameResultado {
  id: string;
  exameId: string;
  dataResultado: Date;
  valor?: string;
  unidade?: string;
  valorReferencia?: string;
  interpretacao?: string;
  observacoes?: string;
  anexoUrl?: string;
  profissionalId?: string;
}

interface ExamesModuleProps {
  citizenId: string;
  atendimentoId?: string;
}

export function ExamesModule({ citizenId, atendimentoId }: ExamesModuleProps) {
  const [loading, setLoading] = useState(true);
  const [exameSolicitados, setExamesSolicitados] = useState<ExameSolicitado[]>([]);
  const [dialogSolicitacao, setDialogSolicitacao] = useState(false);
  const [dialogResultado, setDialogResultado] = useState(false);
  const [selectedExame, setSelectedExame] = useState<ExameSolicitado | null>(null);

  // Form Solicitação
  const [codigoSIGTAP, setCodigoSIGTAP] = useState('');
  const [nomeExame, setNomeExame] = useState('');
  const [urgencia, setUrgencia] = useState<'ROTINA' | 'URGENTE' | 'MUITO_URGENTE'>('ROTINA');
  const [justificativa, setJustificativa] = useState('');
  const [cid10, setCid10] = useState('');

  // Form Resultado
  const [dataResultado, setDataResultado] = useState('');
  const [valor, setValor] = useState('');
  const [unidade, setUnidade] = useState('');
  const [valorReferencia, setValorReferencia] = useState('');
  const [interpretacao, setInterpretacao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [anexo, setAnexo] = useState<File | null>(null);

  useEffect(() => {
    loadExames();
  }, [citizenId]);

  const loadExames = async () => {
    try {
      const response = await fetch(
        `/api/saude/exames?citizenId=${citizenId}${atendimentoId ? `&atendimentoId=${atendimentoId}` : ''}`
      );
      if (response.ok) {
        const data = await response.json();
        setExamesSolicitados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarExame = async () => {
    if (!codigoSIGTAP || !nomeExame) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/saude/exames/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId,
          atendimentoId,
          codigoSIGTAP,
          nomeExame,
          urgencia,
          justificativa,
          cid10,
        }),
      });

      if (response.ok) {
        alert('Exame solicitado com sucesso!');
        setDialogSolicitacao(false);
        resetFormSolicitacao();
        loadExames();
      } else {
        throw new Error('Erro ao solicitar exame');
      }
    } catch (error) {
      console.error('Erro ao solicitar exame:', error);
      alert('Erro ao solicitar exame');
    }
  };

  const handleSalvarResultado = async () => {
    if (!selectedExame || !dataResultado) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('exameId', selectedExame.id);
      formData.append('dataResultado', dataResultado);
      if (valor) formData.append('valor', valor);
      if (unidade) formData.append('unidade', unidade);
      if (valorReferencia) formData.append('valorReferencia', valorReferencia);
      if (interpretacao) formData.append('interpretacao', interpretacao);
      if (observacoes) formData.append('observacoes', observacoes);
      if (anexo) formData.append('anexo', anexo);

      const response = await fetch('/api/saude/exames/resultado', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Resultado registrado com sucesso!');
        setDialogResultado(false);
        resetFormResultado();
        loadExames();
      } else {
        throw new Error('Erro ao salvar resultado');
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      alert('Erro ao salvar resultado do exame');
    }
  };

  const resetFormSolicitacao = () => {
    setCodigoSIGTAP('');
    setNomeExame('');
    setUrgencia('ROTINA');
    setJustificativa('');
    setCid10('');
  };

  const resetFormResultado = () => {
    setSelectedExame(null);
    setDataResultado('');
    setValor('');
    setUnidade('');
    setValorReferencia('');
    setInterpretacao('');
    setObservacoes('');
    setAnexo(null);
  };

  const getUrgenciaBadge = (urg: string) => {
    switch (urg) {
      case 'MUITO_URGENTE':
        return <Badge variant="destructive">Muito Urgente</Badge>;
      case 'URGENTE':
        return <Badge className="bg-orange-500">Urgente</Badge>;
      default:
        return <Badge variant="secondary">Rotina</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESULTADO_DISPONIVEL':
        return <Badge className="bg-green-500">Resultado Disponível</Badge>;
      case 'COLETADO':
        return <Badge className="bg-blue-500">Coletado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando exames...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Exames Laboratoriais e Imagem</h2>
        <Button onClick={() => setDialogSolicitacao(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>

      <Tabs defaultValue="solicitados" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="solicitados">Exames Solicitados</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
        </TabsList>

        {/* Exames Solicitados */}
        <TabsContent value="solicitados">
          <div className="space-y-3">
            {exameSolicitados.filter((e) => e.status === 'PENDENTE').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhum exame pendente
                </CardContent>
              </Card>
            ) : (
              exameSolicitados
                .filter((e) => e.status === 'PENDENTE')
                .map((exame) => (
                  <Card key={exame.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{exame.nomeExame}</CardTitle>
                          <div className="text-sm text-gray-500 mt-1">
                            SIGTAP: {exame.codigoSIGTAP}
                            {exame.cid10 && ` | CID-10: ${exame.cid10}`}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {getUrgenciaBadge(exame.urgencia)}
                          {getStatusBadge(exame.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Data Solicitação:</span>{' '}
                          {new Date(exame.dataSolicitacao).toLocaleDateString('pt-BR')}
                        </div>
                        {exame.justificativa && (
                          <div>
                            <span className="text-gray-600">Justificativa:</span>{' '}
                            {exame.justificativa}
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExame(exame);
                            setDialogResultado(true);
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Anexar Resultado
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        {/* Resultados */}
        <TabsContent value="resultados">
          <div className="space-y-3">
            {exameSolicitados.filter((e) => e.status === 'RESULTADO_DISPONIVEL').length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Nenhum resultado disponível
                </CardContent>
              </Card>
            ) : (
              exameSolicitados
                .filter((e) => e.status === 'RESULTADO_DISPONIVEL')
                .map((exame) => (
                  <Card key={exame.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{exame.nomeExame}</CardTitle>
                          <div className="text-sm text-gray-500 mt-1">
                            Solicitado em:{' '}
                            {new Date(exame.dataSolicitacao).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {getStatusBadge(exame.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {exame.resultado && (
                        <div className="space-y-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Data do Resultado:</span>
                                <div className="font-medium">
                                  {new Date(exame.resultado.dataResultado).toLocaleDateString(
                                    'pt-BR'
                                  )}
                                </div>
                              </div>
                              {exame.resultado.valor && (
                                <div>
                                  <span className="text-gray-600">Valor:</span>
                                  <div className="font-medium">
                                    {exame.resultado.valor}{' '}
                                    {exame.resultado.unidade && exame.resultado.unidade}
                                  </div>
                                </div>
                              )}
                              {exame.resultado.valorReferencia && (
                                <div>
                                  <span className="text-gray-600">Valor de Referência:</span>
                                  <div className="text-xs">
                                    {exame.resultado.valorReferencia}
                                  </div>
                                </div>
                              )}
                              {exame.resultado.interpretacao && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Interpretação:</span>
                                  <div className="font-medium">
                                    {exame.resultado.interpretacao}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {exame.resultado.observacoes && (
                            <div className="text-sm">
                              <span className="text-gray-600">Observações:</span>
                              <div>{exame.resultado.observacoes}</div>
                            </div>
                          )}

                          {exame.resultado.anexoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={exame.resultado.anexoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Ver Anexo
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Solicitar Exame */}
      <Dialog open={dialogSolicitacao} onOpenChange={setDialogSolicitacao}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              Solicitar Exame
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoSIGTAP">Código SIGTAP *</Label>
                <Input
                  id="codigoSIGTAP"
                  value={codigoSIGTAP}
                  onChange={(e) => setCodigoSIGTAP(e.target.value)}
                  placeholder="Ex: 0202010457"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeExame">Nome do Exame *</Label>
                <Input
                  id="nomeExame"
                  value={nomeExame}
                  onChange={(e) => setNomeExame(e.target.value)}
                  placeholder="Ex: Hemograma completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgencia">Urgência *</Label>
                <Select
                  value={urgencia}
                  onValueChange={(v: any) => setUrgencia(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROTINA">Rotina</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="MUITO_URGENTE">Muito Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cid10">CID-10</Label>
                <Input
                  id="cid10"
                  value={cid10}
                  onChange={(e) => setCid10(e.target.value)}
                  placeholder="Ex: E11.9"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="justificativa">Justificativa Clínica</Label>
                <Textarea
                  id="justificativa"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Descreva a indicação clínica do exame..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogSolicitacao(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarExame}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Solicitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Resultado */}
      <Dialog open={dialogResultado} onOpenChange={setDialogResultado}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Registrar Resultado do Exame
            </DialogTitle>
          </DialogHeader>

          {selectedExame && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-semibold">{selectedExame.nomeExame}</div>
                <div className="text-sm text-gray-600">
                  SIGTAP: {selectedExame.codigoSIGTAP}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataResultado">Data do Resultado *</Label>
                  <Input
                    id="dataResultado"
                    type="date"
                    value={dataResultado}
                    onChange={(e) => setDataResultado(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ex: 12.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade">Unidade</Label>
                  <Input
                    id="unidade"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Ex: mg/dL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorReferencia">Valor de Referência</Label>
                  <Input
                    id="valorReferencia"
                    value={valorReferencia}
                    onChange={(e) => setValorReferencia(e.target.value)}
                    placeholder="Ex: 70-100 mg/dL"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="interpretacao">Interpretação</Label>
                  <Select value={interpretacao} onValueChange={setInterpretacao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="ALTERADO">Alterado</SelectItem>
                      <SelectItem value="LIMITE">Limítrofe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="anexo">Anexar Arquivo (PDF, imagem)</Label>
                  <Input
                    id="anexo"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setAnexo(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogResultado(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarResultado}>
              <Upload className="mr-2 h-4 w-4" />
              Salvar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
