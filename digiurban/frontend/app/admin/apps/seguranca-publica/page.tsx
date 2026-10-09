'use client';

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, portalApi as api } from '@/components/apps/portal-requests/shared';
import { Archive, Check, EyeOff, HandMetal, Map as MapIcon, NotebookPen, Plus, Shield } from 'lucide-react';

// Mesmo mapa das Ordens de Serviço (Google quando configurado, senão OpenStreetMap)
const OSMap = lazy(() => import('@/components/apps/servicos-publicos/OSMap').then((module) => ({ default: module.OSMap })));

const BASE = '/api/apps/seguranca-publica';
const TIPOS: Record<string, string> = {
  OCORRENCIA: 'Ocorrência',
  PATRULHAMENTO: 'Pedido de patrulhamento',
  DENUNCIA: 'Denúncia',
  PONTO_CRITICO: 'Ponto crítico',
  ALERTA: 'Alerta',
  PATRULHA_ESCOLAR: 'Patrulha escolar',
  GUARDA_PATRIMONIAL: 'Guarda patrimonial',
};
const STATUS = {
  ABERTA: { label: 'Aberta', className: 'bg-yellow-600' },
  EM_ATENDIMENTO: { label: 'Em atendimento', className: 'bg-indigo-600' },
  RESOLVIDA: { label: 'Resolvida', className: 'bg-green-600' },
  ARQUIVADA: { label: 'Arquivada', variant: 'secondary' },
};
const PRIORIDADE: Record<string, { label: string; className: string }> = {
  URGENTE: { label: 'Urgente', className: 'bg-red-600' },
  ALTA: { label: 'Alta', className: 'bg-orange-600' },
  MEDIA: { label: 'Média', className: 'bg-gray-500' },
  BAIXA: { label: 'Baixa', className: 'bg-gray-400' },
};
const NOVA = { tipo: 'OCORRENCIA', natureza: '', descricao: '', local: '', bairro: '', prioridade: 'MEDIA', solicitanteNome: '', telefone: '', anonima: false };

export default function SegurancaPublicaPage() {
  const { toast } = useToast();
  const [itens, setItens] = useState<any[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [somenteAbertas, setSomenteAbertas] = useState(true);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novaAberta, setNovaAberta] = useState(false);
  const [nova, setNova] = useState(NOVA);
  const [providencia, setProvidencia] = useState<any>(null);
  const [encerrar, setEncerrar] = useState<{ item: any; resultado: 'RESOLVIDA' | 'ARQUIVADA' } | null>(null);
  const [assumir, setAssumir] = useState<any>(null);
  const [equipe, setEquipe] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, mapa, numeros] = await Promise.all([api(`${BASE}/ocorrencias`), api(`${BASE}/ocorrencias/mapa`).catch(() => []), api(`${BASE}/stats`).catch(() => null)]);
      setItens(Array.isArray(lista) ? lista : []);
      setPontos(Array.isArray(mapa) ? mapa : []);
      setStats(numeros);
    } catch {
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(() => (somenteAbertas ? itens.filter((i) => ['ABERTA', 'EM_ATENDIMENTO'].includes(i.status)) : itens), [itens, somenteAbertas]);

  // O mapa das OS usa outras palavras para situação e prioridade
  const pontosMapa = useMemo(
    () =>
      pontos.map((p) => ({
        id: p.id,
        numero: p.numero || 'Ocorrência',
        tipo: p.natureza || TIPOS[p.tipo] || p.tipo,
        status: p.status === 'EM_ATENDIMENTO' ? 'EM_EXECUCAO' : 'ABERTA',
        prioridade: p.prioridade === 'MEDIA' ? 'NORMAL' : p.prioridade,
        bairro: p.bairro,
        latitude: p.latitude,
        longitude: p.longitude,
        createdAt: p.createdAt,
      })),
    [pontos]
  );

  const executar = async (acao: () => Promise<unknown>, mensagem: string) => {
    setSalvando(true);
    try {
      await acao();
      toast({ title: mensagem });
      await carregar();
      return true;
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
      return false;
    } finally {
      setSalvando(false);
    }
  };
  const post = (caminho: string, body: unknown = {}) => api(`${BASE}${caminho}`, { method: 'POST', body: JSON.stringify(body) });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-slate-700" />
            Ocorrências de Segurança
          </h1>
          <p className="text-gray-500 mt-1">Ocorrências, denúncias, pedidos de patrulhamento e pontos críticos</p>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" /> Registrar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Abertas', stats?.abertas],
          ['Em atendimento', stats?.emAtendimento],
          ['Urgentes', stats?.urgentes],
          ['Resolvidas', stats?.resolvidas],
        ].map(([rotulo, valor]) => (
          <Card key={rotulo as string}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{valor ?? '-'}</div>
              <div className="text-sm text-gray-500">{rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="fila">
        <TabsList>
          <TabsTrigger value="fila">Fila</TabsTrigger>
          <TabsTrigger value="mapa">Mapa ({pontos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="fila">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Por ordem de urgência</CardTitle>
              <FiltroPendentes somentePendentes={somenteAbertas} onChange={setSomenteAbertas} total={visiveis.length} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : visiveis.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum registro {somenteAbertas ? 'em aberto' : 'encontrado'}</div>
              ) : (
                <div className="space-y-3">
                  {visiveis.map((i) => (
                    <PedidoCard
                      key={i.id}
                      titulo={
                        <>
                          {i.numero} — {i.natureza || TIPOS[i.tipo] || i.tipo}
                          <Badge className={`ml-2 ${PRIORIDADE[i.prioridade]?.className || ''}`}>{PRIORIDADE[i.prioridade]?.label || i.prioridade}</Badge>
                          {i.anonima && (
                            <Badge variant="outline" className="ml-2">
                              <EyeOff className="h-3 w-3 mr-1" /> Anônima
                            </Badge>
                          )}
                        </>
                      }
                      subtitulo={[TIPOS[i.tipo], i.local, i.bairro].filter(Boolean).join(' · ')}
                      detalhes={[
                        i.descricao,
                        !i.anonima && (i.citizen?.name || i.solicitanteNome) && `Quem pediu: ${i.citizen?.name || i.solicitanteNome}${i.citizen?.phone || i.telefone ? ` (${i.citizen?.phone || i.telefone})` : ''}`,
                        i.equipe && `Equipe: ${i.equipe}`,
                        i.providencias && `Última providência: ${i.providencias}`,
                      ]}
                      protocolNumber={i.protocolNumber}
                      criadoEm={i.createdAt}
                      status={<StatusBadge status={i.status} map={STATUS} />}
                      acoes={
                        ['ABERTA', 'EM_ATENDIMENTO'].includes(i.status) && (
                          <>
                            {i.status === 'ABERTA' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEquipe('');
                                  setAssumir(i);
                                }}
                              >
                                <HandMetal className="h-4 w-4 mr-1" /> Assumir
                              </Button>
                            )}
                            <Select value={i.prioridade} onValueChange={(v) => executar(() => api(`${BASE}/ocorrencias/${i.id}/prioridade`, { method: 'PUT', body: JSON.stringify({ prioridade: v }) }), 'Prioridade atualizada')}>
                              <SelectTrigger className="h-9 w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PRIORIDADE).map(([valor, cfg]) => (
                                  <SelectItem key={valor} value={valor}>
                                    {cfg.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" onClick={() => setProvidencia(i)}>
                              <NotebookPen className="h-4 w-4 mr-1" /> Anotar
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setEncerrar({ item: i, resultado: 'RESOLVIDA' })}>
                              <Check className="h-4 w-4 mr-1" /> Resolver
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEncerrar({ item: i, resultado: 'ARQUIVADA' })}>
                              <Archive className="h-4 w-4 mr-1" /> Arquivar
                            </Button>
                          </>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapIcon className="h-5 w-5" /> Registros em aberto com localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pontosMapa.length === 0 ? (
                <div className="bg-gray-50 h-[260px] rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500">
                  <MapIcon className="h-10 w-10 text-gray-300" />
                  Nenhum registro em aberto tem ponto no mapa. O ponto vem do pedido feito no portal com localização.
                </div>
              ) : (
                <Suspense fallback={<div className="bg-gray-100 h-[600px] rounded-lg flex items-center justify-center text-gray-500">Carregando mapa...</div>}>
                  <OSMap pontos={pontosMapa as any} />
                </Suspense>
              )}
              {(stats?.bairros || []).length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  Bairros com mais registros: {stats.bairros.map((b: any) => `${b.bairro} (${b.total})`).join(' · ')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Registrar */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar ocorrência</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={nova.tipo} onValueChange={(v) => setNova({ ...nova, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>
                      {rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={nova.prioridade} onValueChange={(v) => setNova({ ...nova, prioridade: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDADE).map(([valor, cfg]) => (
                    <SelectItem key={valor} value={valor}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Assunto</Label>
              <Input value={nova.natureza} onChange={(e) => setNova({ ...nova, natureza: e.target.value })} placeholder="Ex.: perturbação do sossego" />
            </div>
            <div className="col-span-2">
              <Label>O que aconteceu</Label>
              <Textarea rows={3} value={nova.descricao} onChange={(e) => setNova({ ...nova, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Local</Label>
              <Input value={nova.local} onChange={(e) => setNova({ ...nova, local: e.target.value })} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={nova.bairro} onChange={(e) => setNova({ ...nova, bairro: e.target.value })} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nova.anonima} onChange={(e) => setNova({ ...nova, anonima: e.target.checked })} />
              Denúncia anônima (não guarda quem informou)
            </label>
            {!nova.anonima && (
              <>
                <div>
                  <Label>Quem informou</Label>
                  <Input value={nova.solicitanteNome} onChange={(e) => setNova({ ...nova, solicitanteNome: e.target.value })} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={nova.telefone} onChange={(e) => setNova({ ...nova, telefone: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !nova.descricao.trim()}
              onClick={async () => {
                if (await executar(() => post('/ocorrencias', nova), 'Registrado')) {
                  setNovaAberta(false);
                  setNova(NOVA);
                }
              }}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assumir */}
      <Dialog open={!!assumir} onOpenChange={(open) => !open && setAssumir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assumir {assumir?.numero}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Equipe ou viatura (opcional)</Label>
            <Input value={equipe} onChange={(e) => setEquipe(e.target.value)} placeholder="Ex.: Viatura 02" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssumir(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando}
              onClick={async () => {
                if (await executar(() => post(`/ocorrencias/${assumir.id}/assumir`, { equipe: equipe || undefined }), 'Em atendimento')) setAssumir(null);
              }}
            >
              Assumir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!providencia}
        titulo={`Anotar providência — ${providencia?.numero || ''}`}
        rotulo="O que foi feito (anotação interna, o cidadão não vê)"
        exemplo="Ex.: viatura foi ao local às 21h, sem flagrante"
        confirmar="Anotar"
        destrutivo={false}
        onClose={() => setProvidencia(null)}
        onConfirm={async (texto) => {
          if (await executar(() => post(`/ocorrencias/${providencia.id}/providencia`, { texto }), 'Anotado')) setProvidencia(null);
        }}
      />

      <MotivoDialog
        aberto={!!encerrar}
        titulo={`${encerrar?.resultado === 'ARQUIVADA' ? 'Arquivar' : 'Resolver'} — ${encerrar?.item?.numero || ''}`}
        rotulo="Resposta para o cidadão (ele vai ler no pedido)"
        exemplo={encerrar?.resultado === 'ARQUIVADA' ? 'Ex.: não foi possível confirmar o fato no local' : 'Ex.: a Guarda esteve no local e orientou os responsáveis'}
        confirmar={encerrar?.resultado === 'ARQUIVADA' ? 'Arquivar' : 'Resolver'}
        destrutivo={encerrar?.resultado === 'ARQUIVADA'}
        onClose={() => setEncerrar(null)}
        onConfirm={async (mensagem) => {
          if (encerrar && (await executar(() => post(`/ocorrencias/${encerrar.item.id}/encerrar`, { resultado: encerrar.resultado, mensagem }), 'Encerrado. O cidadão foi avisado.'))) setEncerrar(null);
        }}
      />
    </div>
  );
}
