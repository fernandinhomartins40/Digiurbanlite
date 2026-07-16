'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { HandCoins, Plus, Check, X, Pause, Play, Ban, Banknote } from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  INSCRITO: { label: 'Inscrito', className: 'bg-blue-600' },
  VERIFICACAO_CADUNICO: { label: 'Verificação CadÚnico', className: 'bg-blue-500' },
  NAO_ELEGIVEL: { label: 'Não elegível', className: 'bg-red-600' },
  VERIFICACAO_APROVADA: { label: 'Verificação aprovada', className: 'bg-indigo-600' },
  AGUARDANDO_ANALISE: { label: 'Aguardando análise', className: 'bg-yellow-600' },
  AGUARDANDO_VISITA: { label: 'Aguardando visita', className: 'bg-yellow-500' },
  PARECER_FAVORAVEL: { label: 'Parecer favorável', className: 'bg-indigo-500' },
  PARECER_DESFAVORAVEL: { label: 'Parecer desfavorável', className: 'bg-red-500' },
  AGUARDANDO_PARECER_PSICOLOGICO: { label: 'Aguardando parecer psicológico', className: 'bg-yellow-500' },
  PARECER_PSICOLOGICO_CONCLUIDO: { label: 'Parecer psicológico concluído', className: 'bg-indigo-500' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando aprovação', className: 'bg-orange-600' },
  APROVADO: { label: 'Aprovado', className: 'bg-green-600' },
  INDEFERIDO: { label: 'Indeferido', className: 'bg-red-600' },
  CONCEDIDO: { label: 'Concedido', className: 'bg-green-600' },
  ATIVO: { label: 'Benefício ativo', className: 'bg-green-700' },
  ATIVA: { label: 'Benefício ativo', className: 'bg-green-700' },
  SUSPENSO: { label: 'Suspenso', className: 'bg-orange-700' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-600' },
};

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

export default function BeneficiosPage() {
  const { toast } = useToast();
  const [programas, setProgramas] = useState<any[]>([]);
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');

  // Novo programa (catálogo)
  const [programaAberto, setProgramaAberto] = useState(false);
  const [novoPrograma, setNovoPrograma] = useState({
    nome: '',
    descricao: '',
    valorBeneficio: '',
    periodicidade: 'MENSAL',
  });

  // Nova inscrição
  const [inscricaoAberta, setInscricaoAberta] = useState(false);
  const [beneficiario, setBeneficiario] = useState<any>(null);
  const [programaId, setProgramaId] = useState('');
  const [familiaId, setFamiliaId] = useState('');

  // Ação com motivo (suspender/cancelar/indeferir)
  const [acaoMotivo, setAcaoMotivo] = useState<{ inscricao: any; rota: string; titulo: string } | null>(null);
  const [motivo, setMotivo] = useState('');

  // Pagamento
  const [inscricaoPagamento, setInscricaoPagamento] = useState<any>(null);
  const [pagamento, setPagamento] = useState({ mesReferencia: '', valor: '', mecanismoPagamento: 'PIX' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progs, inscs, fams] = await Promise.all([
        api('/api/apps/assistencia-social/programas/catalogo'),
        api('/api/apps/assistencia-social/programas/inscricoes'),
        api('/api/apps/assistencia-social/familias').catch(() => []),
      ]);
      setProgramas(Array.isArray(progs) ? progs : []);
      setInscricoes(Array.isArray(inscs) ? inscs : []);
      setFamilias(Array.isArray(fams) ? fams : []);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    let lista = inscricoes;
    if (filtroStatus !== 'TODOS') lista = lista.filter((i) => i.status === filtroStatus);
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (i) =>
          i.beneficiario?.name?.toLowerCase().includes(termo) ||
          i.programa?.nome?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [inscricoes, filtroStatus, busca]);

  const criarPrograma = async () => {
    if (!novoPrograma.nome) {
      toast({ title: 'Informe o nome do programa', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/assistencia-social/programas/catalogo', {
        method: 'POST',
        body: JSON.stringify({
          ...novoPrograma,
          valorBeneficio: novoPrograma.valorBeneficio ? Number(novoPrograma.valorBeneficio) : null,
        }),
      });
      toast({ title: 'Programa criado' });
      setProgramaAberto(false);
      setNovoPrograma({ nome: '', descricao: '', valorBeneficio: '', periodicidade: 'MENSAL' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const criarInscricao = async () => {
    if (!beneficiario?.id || !programaId || !familiaId) {
      toast({ title: 'Selecione beneficiário, família e programa', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/assistencia-social/programas/inscricoes', {
        method: 'POST',
        body: JSON.stringify({ beneficiarioId: beneficiario.id, programaId, familiaId }),
      });
      toast({ title: 'Inscrição registrada' });
      setInscricaoAberta(false);
      setBeneficiario(null);
      setProgramaId('');
      setFamiliaId('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (inscricao: any, rota: string, body: any = {}) => {
    try {
      await api(`/api/apps/assistencia-social/programas/inscricoes/${inscricao.id}/${rota}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Situação atualizada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const confirmarAcaoMotivo = async () => {
    if (!acaoMotivo) return;
    setSalvando(true);
    try {
      await acao(acaoMotivo.inscricao, acaoMotivo.rota, { motivo, justificativa: motivo, aprovado: false });
      setAcaoMotivo(null);
      setMotivo('');
    } finally {
      setSalvando(false);
    }
  };

  const registrarPagamento = async () => {
    if (!inscricaoPagamento || !pagamento.mesReferencia || !pagamento.valor) {
      toast({ title: 'Informe mês de referência e valor', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api(
        `/api/apps/assistencia-social/programas/inscricoes/${inscricaoPagamento.id}/pagamentos`,
        {
          method: 'POST',
          body: JSON.stringify({ ...pagamento, valor: Number(pagamento.valor) }),
        }
      );
      toast({ title: 'Pagamento registrado' });
      setInscricaoPagamento(null);
      setPagamento({ mesReferencia: '', valor: '', mecanismoPagamento: 'PIX' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acoesInscricao = (i: any) => {
    switch (i.status) {
      case 'INSCRITO':
      case 'VERIFICACAO_CADUNICO':
      case 'VERIFICACAO_APROVADA':
      case 'AGUARDANDO_ANALISE':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => acao(i, 'analisar', { aprovado: true })}
            >
              <Check className="h-4 w-4 mr-1" /> Parecer favorável
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAcaoMotivo({ inscricao: i, rota: 'analisar', titulo: 'Indeferir inscrição' })}
            >
              <X className="h-4 w-4 mr-1" /> Indeferir
            </Button>
          </div>
        );
      case 'PARECER_FAVORAVEL':
      case 'PARECER_PSICOLOGICO_CONCLUIDO':
      case 'AGUARDANDO_APROVACAO':
        return (
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => acao(i, 'aprovar')}>
            <Check className="h-4 w-4 mr-1" /> Conceder benefício
          </Button>
        );
      case 'APROVADO':
      case 'CONCEDIDO':
      case 'ATIVO':
      case 'ATIVA':
        return (
          <div className="flex gap-1">
            <Button size="sm" onClick={() => setInscricaoPagamento(i)}>
              <Banknote className="h-4 w-4 mr-1" /> Pagamento
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAcaoMotivo({ inscricao: i, rota: 'suspender', titulo: 'Suspender benefício' })}
            >
              <Pause className="h-4 w-4 mr-1" /> Suspender
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAcaoMotivo({ inscricao: i, rota: 'cancelar', titulo: 'Cancelar benefício' })}
            >
              <Ban className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          </div>
        );
      case 'SUSPENSO':
        return (
          <Button size="sm" onClick={() => acao(i, 'reativar')}>
            <Play className="h-4 w-4 mr-1" /> Reativar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programas & Benefícios</h1>
          <p className="text-gray-500 mt-1">
            Inscrição → análise → concessão → pagamentos e acompanhamento
          </p>
        </div>
      </div>

      <Tabs defaultValue="inscricoes">
        <TabsList>
          <TabsTrigger value="inscricoes">Inscrições & Benefícios</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo de Programas</TabsTrigger>
        </TabsList>

        <TabsContent value="inscricoes" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por beneficiário ou programa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os status</SelectItem>
                    {Object.entries(STATUS_LABEL).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setInscricaoAberta(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova inscrição
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="h-5 w-5" />
                Inscrições
                <Badge variant="secondary">{filtradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : filtradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma inscrição encontrada</div>
              ) : (
                <div className="space-y-3">
                  {filtradas.map((i: any) => {
                    const badge = STATUS_LABEL[i.status] || { label: i.status };
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {i.beneficiario?.name || 'Beneficiário'}
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              {i.programa?.nome}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {i.programa?.valorBeneficio
                              ? `R$ ${Number(i.programa.valorBeneficio).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })} · ${i.programa?.periodicidade || ''}`
                              : 'Sem valor definido'}
                          </div>
                          {i.createdAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Inscrito em {new Date(i.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {acoesInscricao(i)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setProgramaAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo programa
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programas.map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-2">{p.descricao || 'Sem descrição'}</p>
                  <div className="text-sm font-medium">
                    {p.valorBeneficio
                      ? `R$ ${Number(p.valorBeneficio).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}`
                      : 'Valor variável'}
                    {p.periodicidade && (
                      <span className="text-gray-500 font-normal"> · {p.periodicidade}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loading && programas.length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-8">
                Nenhum programa cadastrado
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog novo programa */}
      <Dialog open={programaAberto} onOpenChange={setProgramaAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo programa social</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={novoPrograma.nome}
                onChange={(e) => setNovoPrograma({ ...novoPrograma, nome: e.target.value })}
                placeholder="Ex.: Aluguel Social"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novoPrograma.descricao}
                onChange={(e) => setNovoPrograma({ ...novoPrograma, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor do benefício (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novoPrograma.valorBeneficio}
                  onChange={(e) =>
                    setNovoPrograma({ ...novoPrograma, valorBeneficio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Periodicidade</Label>
                <Select
                  value={novoPrograma.periodicidade}
                  onValueChange={(v) => setNovoPrograma({ ...novoPrograma, periodicidade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                    <SelectItem value="UNICA">Parcela única</SelectItem>
                    <SelectItem value="ANUAL">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgramaAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarPrograma} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Criar programa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova inscrição */}
      <Dialog open={inscricaoAberta} onOpenChange={setInscricaoAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova inscrição em programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector
              label="Beneficiário"
              onSelect={setBeneficiario}
              selectedCidadao={beneficiario}
            />
            <div>
              <Label>Família (CadÚnico)</Label>
              <Select value={familiaId} onValueChange={setFamiliaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a família" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.responsavel?.name || f.numeroCadUnico || f.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                A família precisa estar cadastrada no CadÚnico municipal.
              </p>
            </div>
            <div>
              <Label>Programa</Label>
              <Select value={programaId} onValueChange={setProgramaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInscricaoAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarInscricao} disabled={salvando}>
              {salvando ? 'Inscrevendo...' : 'Inscrever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ação com motivo */}
      <Dialog open={!!acaoMotivo} onOpenChange={(open) => !open && setAcaoMotivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{acaoMotivo?.titulo}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo / justificativa</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcaoMotivo(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmarAcaoMotivo} disabled={salvando || !motivo}>
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pagamento */}
      <Dialog open={!!inscricaoPagamento} onOpenChange={(open) => !open && setInscricaoPagamento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrar pagamento — {inscricaoPagamento?.beneficiario?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mês de referência</Label>
              <Input
                type="month"
                value={pagamento.mesReferencia}
                onChange={(e) => setPagamento({ ...pagamento, mesReferencia: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={pagamento.valor}
                  onChange={(e) => setPagamento({ ...pagamento, valor: e.target.value })}
                />
              </div>
              <div>
                <Label>Forma de pagamento</Label>
                <Select
                  value={pagamento.mecanismoPagamento}
                  onValueChange={(v) => setPagamento({ ...pagamento, mecanismoPagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CARTAO">Cartão benefício</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="DEPOSITO">Depósito bancário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInscricaoPagamento(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={registrarPagamento} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
