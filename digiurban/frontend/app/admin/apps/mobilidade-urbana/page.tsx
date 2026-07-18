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
import {
  IdCard,
  Plus,
  BadgeCheck,
  Play,
  Check,
  X,
  ClipboardList,
  RefreshCw,
  Ban,
  Copy,
  QrCode,
  Search,
} from 'lucide-react';

const STATUS_CARTEIRA: Record<string, { label: string; className?: string }> = {
  SOLICITADA: { label: 'Solicitada', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  ATIVA: { label: 'Ativa', className: 'bg-green-600' },
  INDEFERIDA: { label: 'Indeferida', className: 'bg-red-600' },
  SUSPENSA: { label: 'Suspensa', className: 'bg-orange-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const TIPOS_CARTEIRA: Record<string, string> = {
  ESTUDANTE: 'Cartão de Estudante',
  IDOSO: 'Gratuidade Idoso',
  PCD: 'Gratuidade PcD',
  TRANSPORTE: 'Cartão de Transporte',
  PASSE_LIVRE: 'Passe Livre',
  VAGA_ESPECIAL: 'Vaga Especial',
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

const dataBR = (d: any) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '');

export default function MobilidadeAppPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [carteiras, setCarteiras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // filtros
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('ATIVAS_E_PENDENTES');

  // dialogs
  const [novaAberta, setNovaAberta] = useState(false);
  const [novaCarteira, setNovaCarteira] = useState({
    tipo: 'ESTUDANTE',
    titularNome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    instituicao: '',
  });

  const [carteiraEmitir, setCarteiraEmitir] = useState<any>(null);
  const [validadeMeses, setValidadeMeses] = useState('12');

  const [acaoMotivo, setAcaoMotivo] = useState<{
    titulo: string;
    rota: string;
    rotulo: string;
  } | null>(null);
  const [motivo, setMotivo] = useState('');

  // validação pública
  const [codigoValidacao, setCodigoValidacao] = useState('');
  const [resultadoValidacao, setResultadoValidacao] = useState<any>(null);
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, carteirasData] = await Promise.all([
        api('/api/apps/mobilidade-urbana/stats').catch(() => null),
        api('/api/apps/mobilidade-urbana/carteiras').catch(() => []),
      ]);
      setStats(statsData);
      setCarteiras(Array.isArray(carteirasData) ? carteirasData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const executar = async (rotulo: string, fn: () => Promise<any>) => {
    setSalvando(true);
    try {
      await fn();
      toast({ title: rotulo });
      await loadData();
      return true;
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const carteirasFiltradas = useMemo(() => {
    let lista = carteiras;
    if (filtroStatus === 'ATIVAS_E_PENDENTES') {
      lista = lista.filter((c) => ['SOLICITADA', 'EM_ANALISE', 'ATIVA', 'SUSPENSA'].includes(c.status));
    } else if (filtroStatus !== 'TODAS') {
      lista = lista.filter((c) => c.status === filtroStatus);
    }
    if (filtroTipo !== 'TODOS') lista = lista.filter((c) => c.tipo === filtroTipo);
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.titularNome?.toLowerCase().includes(termo) ||
          c.cpf?.includes(termo.replace(/\D/g, '')) ||
          c.numeroCarteira?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [carteiras, filtroStatus, filtroTipo, busca]);

  const criarCarteira = () =>
    executar('Solicitação registrada', async () => {
      if (!novaCarteira.titularNome) throw new Error('Informe o titular');
      await api('/api/apps/mobilidade-urbana/carteiras', {
        method: 'POST',
        body: JSON.stringify({
          ...novaCarteira,
          dataNascimento: novaCarteira.dataNascimento || undefined,
        }),
      });
      setNovaAberta(false);
      setNovaCarteira({
        tipo: 'ESTUDANTE',
        titularNome: '',
        cpf: '',
        dataNascimento: '',
        telefone: '',
        instituicao: '',
      });
    });

  const emitirCarteira = () =>
    executar('Carteira emitida', async () => {
      await api(`/api/apps/mobilidade-urbana/carteiras/${carteiraEmitir.id}/emitir`, {
        method: 'POST',
        body: JSON.stringify({ validadeMeses: Number(validadeMeses) || 12 }),
      });
      setCarteiraEmitir(null);
      setValidadeMeses('12');
    });

  const confirmarAcaoMotivo = async () => {
    if (!acaoMotivo) return;
    const ok = await executar(acaoMotivo.rotulo, () =>
      api(acaoMotivo.rota, { method: 'POST', body: JSON.stringify({ motivo }) })
    );
    if (ok) {
      setAcaoMotivo(null);
      setMotivo('');
    }
  };

  const validarCodigo = async () => {
    if (!codigoValidacao.trim()) return;
    setValidando(true);
    setResultadoValidacao(null);
    try {
      const resultado = await api(
        `/api/apps/mobilidade-urbana/validar/${encodeURIComponent(codigoValidacao.trim())}`
      );
      setResultadoValidacao(resultado);
    } catch (error: any) {
      setResultadoValidacao({ valida: false, motivo: String(error?.message || error) });
    } finally {
      setValidando(false);
    }
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard?.writeText(codigo);
    toast({ title: 'Código de validação copiado' });
  };

  const acoesCarteira = (c: any) => {
    switch (c.status) {
      case 'SOLICITADA':
        return (
          <Button
            size="sm"
            onClick={() =>
              executar('Análise iniciada', () =>
                api(`/api/apps/mobilidade-urbana/carteiras/${c.id}/iniciar-analise`, {
                  method: 'POST',
                  body: JSON.stringify({}),
                })
              )
            }
          >
            <Play className="h-4 w-4 mr-1" /> Analisar
          </Button>
        );
      case 'EM_ANALISE':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setCarteiraEmitir(c)}
            >
              <BadgeCheck className="h-4 w-4 mr-1" /> Emitir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAcaoMotivo({
                  titulo: `Indeferir carteira de ${c.titularNome || 'titular'}`,
                  rota: `/api/apps/mobilidade-urbana/carteiras/${c.id}/indeferir`,
                  rotulo: 'Carteira indeferida',
                })
              }
            >
              <X className="h-4 w-4 mr-1" /> Indeferir
            </Button>
          </div>
        );
      case 'ATIVA':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                executar('Carteira renovada por 12 meses', () =>
                  api(`/api/apps/mobilidade-urbana/carteiras/${c.id}/renovar`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                  })
                )
              }
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Renovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                executar('2ª via registrada', () =>
                  api(`/api/apps/mobilidade-urbana/carteiras/${c.id}/segunda-via`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                  })
                )
              }
            >
              <Copy className="h-4 w-4 mr-1" /> 2ª via
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAcaoMotivo({
                  titulo: `Suspender carteira ${c.numeroCarteira || ''}`,
                  rota: `/api/apps/mobilidade-urbana/carteiras/${c.id}/suspender`,
                  rotulo: 'Carteira suspensa',
                })
              }
            >
              <Ban className="h-4 w-4 mr-1" /> Suspender
            </Button>
          </div>
        );
      case 'SUSPENSA':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button
              size="sm"
              onClick={() =>
                executar('Carteira reativada', () =>
                  api(`/api/apps/mobilidade-urbana/carteiras/${c.id}/reativar`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                  })
                )
              }
            >
              <Check className="h-4 w-4 mr-1" /> Reativar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAcaoMotivo({
                  titulo: `Cancelar carteira ${c.numeroCarteira || ''}`,
                  rota: `/api/apps/mobilidade-urbana/carteiras/${c.id}/cancelar`,
                  rotulo: 'Carteira cancelada',
                })
              }
            >
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
            <IdCard className="h-7 w-7 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carteiras & Gratuidades</h1>
            <p className="text-gray-500">
              Cartão de estudante, gratuidades de idoso e PcD, passe livre e vaga especial —
              emissão, renovação, 2ª via e validação pública por QR
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Carteiras ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.carteirasAtivas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solicitações em análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.solicitacoesEmAnalise ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.carteirasVencendo30d ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativas por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {(stats?.ativasPorTipo || []).length === 0 ? (
                <span className="text-sm text-gray-400">Nenhuma</span>
              ) : (
                (stats?.ativasPorTipo || []).map((t: any) => (
                  <Badge key={t.tipo} variant="outline" className="text-xs">
                    {TIPOS_CARTEIRA[t.tipo] || t.tipo}: {t.total}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="carteiras">
        <TabsList>
          <TabsTrigger value="carteiras">Carteiras</TabsTrigger>
          <TabsTrigger value="validar">Validar carteira</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------- carteiras */}
        <TabsContent value="carteiras" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por titular, CPF ou nº da carteira..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os tipos</SelectItem>
                    {Object.entries(TIPOS_CARTEIRA).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVAS_E_PENDENTES">Ativas e pendentes</SelectItem>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {Object.entries(STATUS_CARTEIRA).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setNovaAberta(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova solicitação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Carteiras
                <Badge variant="secondary">{carteirasFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : carteirasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma carteira encontrada</div>
              ) : (
                <div className="space-y-3">
                  {carteirasFiltradas.map((c: any) => {
                    const badge = STATUS_CARTEIRA[c.status] || { label: c.status };
                    const vencida =
                      c.status === 'ATIVA' && c.validade && new Date(c.validade) < new Date();
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2 flex-wrap">
                            {c.numeroCarteira && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                {c.numeroCarteira}
                              </Badge>
                            )}
                            {c.titularNome || 'Sem titular'}
                            <Badge variant="outline">{TIPOS_CARTEIRA[c.tipo] || c.tipo}</Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {c.cpf && `CPF ${c.cpf}`}
                            {c.dataNascimento && ` | Nasc.: ${dataBR(c.dataNascimento)}`}
                            {c.instituicao && ` | ${c.instituicao}`}
                            {c.telefone && ` | ${c.telefone}`}
                            {c.viasEmitidas > 1 && ` | ${c.viasEmitidas} vias`}
                          </div>
                          <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
                            {c.validade && (
                              <span
                                className={vencida ? 'text-red-600 font-medium' : 'text-gray-400'}
                              >
                                Validade: {dataBR(c.validade)}
                                {vencida && ' — VENCIDA'}
                              </span>
                            )}
                            {c.codigoValidacao && (
                              <button
                                type="button"
                                className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                                onClick={() => copiarCodigo(c.codigoValidacao)}
                              >
                                <QrCode className="h-3 w-3" /> Copiar código de validação
                              </button>
                            )}
                          </div>
                          {c.observacoes && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {c.observacoes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {acoesCarteira(c)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------------------------------------- validar */}
        <TabsContent value="validar" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Validação pública de carteira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Informe o código do QR da carteira para verificar a situação. Esta consulta é a
                mesma disponível publicamente para fiscais e motoristas — nunca exibe CPF.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Código de validação..."
                  value={codigoValidacao}
                  onChange={(e) => setCodigoValidacao(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && validarCodigo()}
                  className="max-w-md"
                />
                <Button onClick={validarCodigo} disabled={validando || !codigoValidacao.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  {validando ? 'Validando...' : 'Validar'}
                </Button>
              </div>
              {resultadoValidacao && (
                <div
                  className={`p-4 rounded-lg border ${
                    resultadoValidacao.valida
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div
                    className={`font-semibold flex items-center gap-2 ${
                      resultadoValidacao.valida ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {resultadoValidacao.valida ? (
                      <>
                        <Check className="h-5 w-5" /> Carteira VÁLIDA
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5" /> Carteira INVÁLIDA
                      </>
                    )}
                  </div>
                  {resultadoValidacao.motivo && (
                    <p className="text-sm text-red-600 mt-1">{resultadoValidacao.motivo}</p>
                  )}
                  {resultadoValidacao.numeroCarteira && (
                    <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                      <p>
                        <span className="font-medium">Nº:</span> {resultadoValidacao.numeroCarteira}
                      </p>
                      <p>
                        <span className="font-medium">Titular:</span> {resultadoValidacao.titular}
                      </p>
                      <p>
                        <span className="font-medium">Tipo:</span>{' '}
                        {TIPOS_CARTEIRA[resultadoValidacao.tipo] || resultadoValidacao.tipo}
                      </p>
                      {resultadoValidacao.validade && (
                        <p>
                          <span className="font-medium">Validade:</span>{' '}
                          {dataBR(resultadoValidacao.validade)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog nova solicitação */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova solicitação de carteira</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={novaCarteira.tipo}
                  onValueChange={(v) => setNovaCarteira({ ...novaCarteira, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_CARTEIRA).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titular *</Label>
                <Input
                  value={novaCarteira.titularNome}
                  onChange={(e) =>
                    setNovaCarteira({ ...novaCarteira, titularNome: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPF</Label>
                <Input
                  value={novaCarteira.cpf}
                  onChange={(e) => setNovaCarteira({ ...novaCarteira, cpf: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  value={novaCarteira.dataNascimento}
                  onChange={(e) =>
                    setNovaCarteira({ ...novaCarteira, dataNascimento: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={novaCarteira.telefone}
                  onChange={(e) => setNovaCarteira({ ...novaCarteira, telefone: e.target.value })}
                />
              </div>
              <div>
                <Label>Instituição de ensino</Label>
                <Input
                  placeholder="Para cartão de estudante"
                  value={novaCarteira.instituicao}
                  onChange={(e) =>
                    setNovaCarteira({ ...novaCarteira, instituicao: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarCarteira} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog emitir carteira */}
      <Dialog open={!!carteiraEmitir} onOpenChange={(open) => !open && setCarteiraEmitir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir carteira — {carteiraEmitir?.titularNome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Validade (meses)</Label>
              <Input
                type="number"
                min={1}
                value={validadeMeses}
                onChange={(e) => setValidadeMeses(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              O número da carteira (CTR-ano-sequência) e o código de validação do QR são gerados
              automaticamente
              {carteiraEmitir?.protocolId && ' e o protocolo de origem será concluído'}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCarteiraEmitir(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={emitirCarteira}
              disabled={salvando}
            >
              {salvando ? 'Emitindo...' : 'Emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog motivo (indeferir/suspender/cancelar) */}
      <Dialog open={!!acaoMotivo} onOpenChange={(open) => !open && setAcaoMotivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{acaoMotivo?.titulo}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcaoMotivo(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarAcaoMotivo}
              disabled={salvando || !motivo}
            >
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
