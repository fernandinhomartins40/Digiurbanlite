'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, fmtData, portalApi as api } from '@/components/apps/portal-requests/shared';
import { ArrowLeft, Ban, CalendarPlus, Check, Play, Plus, Tractor, Trash2 } from 'lucide-react';

const BASE = '/api/agricultura/mecanizacao';
const STATUS = {
  SOLICITADO: { label: 'Aguardando', className: 'bg-yellow-600' },
  AGENDADO: { label: 'Agendado', className: 'bg-blue-600' },
  EM_EXECUCAO: { label: 'Em execução', className: 'bg-indigo-600' },
  CONCLUIDO: { label: 'Concluído', className: 'bg-green-600' },
  RECUSADO: { label: 'Não atendido', variant: 'destructive' },
  CANCELADO: { label: 'Cancelado', variant: 'secondary' },
};
const ABERTOS = ['SOLICITADO', 'AGENDADO', 'EM_EXECUCAO'];
const TIPOS = ['Trator', 'Grade', 'Arado', 'Plantadeira', 'Colheitadeira', 'Roçadeira', 'Pulverizador', 'Retroescavadeira', 'Outros'];
const NOVO_PEDIDO = { solicitanteNome: '', telefone: '', tipoMaquina: 'Trator', local: '', areaHectares: '', dataDesejada: '', descricao: '' };
const NOVA_MAQUINA = { tipo: 'Trator', identificacao: '', modelo: '', valorHoraUso: '' };

export default function MecanizacaoAgricolaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [servicos, setServicos] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [somenteAbertos, setSomenteAbertos] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [pedidoAberto, setPedidoAberto] = useState(false);
  const [pedido, setPedido] = useState(NOVO_PEDIDO);
  const [maquinaAberta, setMaquinaAberta] = useState(false);
  const [maquina, setMaquina] = useState(NOVA_MAQUINA);
  const [agendar, setAgendar] = useState<any>(null);
  const [agenda, setAgenda] = useState({ maquinaId: '', dataAgendada: '', operador: '', horasPrevistas: '' });
  const [concluir, setConcluir] = useState<any>(null);
  const [horas, setHoras] = useState('');
  const [recusar, setRecusar] = useState<any>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, frota, numeros] = await Promise.all([api(`${BASE}/servicos`), api(`${BASE}/maquinas`), api(`${BASE}/stats`).catch(() => null)]);
      setServicos(Array.isArray(lista) ? lista : []);
      setMaquinas(Array.isArray(frota) ? frota : []);
      setStats(numeros);
    } catch {
      setServicos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(() => (somenteAbertos ? servicos.filter((s) => ABERTOS.includes(s.status)) : servicos), [servicos, somenteAbertos]);

  /** Executa a chamada, avisa e recarrega; devolve true se deu certo. */
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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/apps/agricultura')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Tractor className="h-8 w-8 text-green-600" />
              Mecanização Agrícola
            </h1>
            <p className="text-gray-500 mt-1">Pedidos de máquina dos produtores, agenda da frota e horas trabalhadas</p>
          </div>
        </div>
        <Button onClick={() => setPedidoAberto(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo pedido
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ['Aguardando', stats?.aguardando],
          ['Agendados', stats?.agendados],
          ['Em execução', stats?.emExecucao],
          ['Horas trabalhadas', stats?.horasTrabalhadas],
          ['Máquinas', stats?.maquinas],
        ].map(([rotulo, valor]) => (
          <Card key={rotulo as string}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{valor ?? '-'}</div>
              <div className="text-sm text-gray-500">{rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="maquinas">Máquinas ({maquinas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Pedidos de máquina</CardTitle>
              <FiltroPendentes somentePendentes={somenteAbertos} onChange={setSomenteAbertos} total={visiveis.length} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : visiveis.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum pedido {somenteAbertos ? 'em aberto' : 'encontrado'}</div>
              ) : (
                <div className="space-y-3">
                  {visiveis.map((s) => (
                    <PedidoCard
                      key={s.id}
                      titulo={`${s.tipoMaquina} — ${s.solicitanteNome || 'Produtor'}`}
                      subtitulo={[s.local, s.areaHectares != null && `${s.areaHectares} ha`, s.telefone].filter(Boolean).join(' · ') || undefined}
                      detalhes={[
                        s.dataDesejada && `Quer para ${fmtData(s.dataDesejada)}`,
                        s.dataAgendada && `Agendado para ${fmtData(s.dataAgendada)}`,
                        s.maquina && `Máquina: ${s.maquina.identificacao}`,
                        s.operador && `Operador: ${s.operador}`,
                        s.horasRealizadas != null && `${s.horasRealizadas} h trabalhadas`,
                        s.valorCobrado ? `R$ ${Number(s.valorCobrado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
                        s.descricao,
                        s.motivo && `Motivo: ${s.motivo}`,
                      ]}
                      protocolNumber={s.protocolNumber}
                      criadoEm={s.createdAt}
                      status={<StatusBadge status={s.status} map={STATUS} />}
                      acoes={
                        <>
                          {['SOLICITADO', 'AGENDADO'].includes(s.status) && (
                            <Button
                              size="sm"
                              variant={s.status === 'SOLICITADO' ? 'default' : 'outline'}
                              onClick={() => {
                                setAgendar(s);
                                setAgenda({ maquinaId: s.maquinaId || '', dataAgendada: (s.dataAgendada || s.dataDesejada || '').slice(0, 10), operador: s.operador || '', horasPrevistas: '' });
                              }}
                            >
                              <CalendarPlus className="h-4 w-4 mr-1" /> {s.status === 'SOLICITADO' ? 'Agendar' : 'Reagendar'}
                            </Button>
                          )}
                          {s.status === 'AGENDADO' && (
                            <Button size="sm" disabled={salvando} onClick={() => executar(() => post(`/servicos/${s.id}/iniciar`), 'Serviço iniciado')}>
                              <Play className="h-4 w-4 mr-1" /> Iniciar
                            </Button>
                          )}
                          {['AGENDADO', 'EM_EXECUCAO'].includes(s.status) && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setConcluir(s);
                                setHoras(s.horasPrevistas ? String(s.horasPrevistas) : '');
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" /> Concluir
                            </Button>
                          )}
                          {ABERTOS.includes(s.status) && (
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRecusar(s)}>
                              <Ban className="h-4 w-4 mr-1" /> Não atender
                            </Button>
                          )}
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maquinas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setMaquinaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova máquina
            </Button>
          </div>
          {maquinas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">Cadastre as máquinas da prefeitura para poder agendar os serviços.</CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {maquinas.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {m.identificacao}
                      <Badge variant={m.status === 'Disponível' ? 'default' : 'secondary'} className={m.status === 'Disponível' ? 'bg-green-600' : undefined}>
                        {m.status === 'Emprestada' ? 'Em serviço' : m.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-1">
                    <div>
                      {m.tipo}
                      {m.modelo ? ` · ${m.modelo}` : ''}
                    </div>
                    <div>{m.horasUso} hora(s) de uso</div>
                    <div>{m.valorHoraUso ? `R$ ${Number(m.valorHoraUso).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por hora` : 'Sem cobrança por hora'}</div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={salvando || m.status === 'Emprestada'}
                        onClick={() =>
                          executar(
                            () => api(`${BASE}/maquinas/${m.id}`, { method: 'PUT', body: JSON.stringify({ ...m, status: m.status === 'Manutenção' ? 'Disponível' : 'Manutenção' }) }),
                            m.status === 'Manutenção' ? 'Máquina liberada' : 'Máquina em manutenção'
                          )
                        }
                      >
                        {m.status === 'Manutenção' ? 'Liberar' : 'Manutenção'}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" disabled={salvando} onClick={() => executar(() => api(`${BASE}/maquinas/${m.id}`, { method: 'DELETE' }), 'Máquina removida')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Novo pedido (balcão) */}
      <Dialog open={pedidoAberto} onOpenChange={setPedidoAberto}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo pedido de máquina</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Produtor</Label>
              <Input value={pedido.solicitanteNome} onChange={(e) => setPedido({ ...pedido, solicitanteNome: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={pedido.telefone} onChange={(e) => setPedido({ ...pedido, telefone: e.target.value })} />
            </div>
            <div>
              <Label>Máquina</Label>
              <Select value={pedido.tipoMaquina} onValueChange={(v) => setPedido({ ...pedido, tipoMaquina: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Local (sítio, estrada, comunidade)</Label>
              <Input value={pedido.local} onChange={(e) => setPedido({ ...pedido, local: e.target.value })} />
            </div>
            <div>
              <Label>Área (hectares)</Label>
              <Input value={pedido.areaHectares} onChange={(e) => setPedido({ ...pedido, areaHectares: e.target.value })} />
            </div>
            <div>
              <Label>Data desejada</Label>
              <Input type="date" value={pedido.dataDesejada} onChange={(e) => setPedido({ ...pedido, dataDesejada: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>O que precisa ser feito</Label>
              <Input value={pedido.descricao} onChange={(e) => setPedido({ ...pedido, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPedidoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !pedido.solicitanteNome.trim()}
              onClick={async () => {
                const ok = await executar(
                  () => post('/servicos', { ...pedido, areaHectares: pedido.areaHectares ? Number(pedido.areaHectares.replace(',', '.')) : undefined, dataDesejada: pedido.dataDesejada || undefined }),
                  'Pedido registrado'
                );
                if (ok) {
                  setPedidoAberto(false);
                  setPedido(NOVO_PEDIDO);
                }
              }}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nova máquina */}
      <Dialog open={maquinaAberta} onOpenChange={setMaquinaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova máquina</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={maquina.tipo} onValueChange={(v) => setMaquina({ ...maquina, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Identificação</Label>
              <Input value={maquina.identificacao} onChange={(e) => setMaquina({ ...maquina, identificacao: e.target.value })} placeholder="Trator 01" />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={maquina.modelo} onChange={(e) => setMaquina({ ...maquina, modelo: e.target.value })} />
            </div>
            <div>
              <Label>Valor por hora (R$)</Label>
              <Input value={maquina.valorHoraUso} onChange={(e) => setMaquina({ ...maquina, valorHoraUso: e.target.value })} placeholder="vazio = não cobra" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaquinaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !maquina.identificacao.trim()}
              onClick={async () => {
                const ok = await executar(() => post('/maquinas', { ...maquina, valorHoraUso: maquina.valorHoraUso ? Number(maquina.valorHoraUso.replace(',', '.')) : '' }), 'Máquina cadastrada');
                if (ok) {
                  setMaquinaAberta(false);
                  setMaquina(NOVA_MAQUINA);
                }
              }}
            >
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agendar */}
      <Dialog open={!!agendar} onOpenChange={(open) => !open && setAgendar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Agendar {agendar?.tipoMaquina?.toLowerCase()} — {agendar?.solicitanteNome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Máquina</Label>
              {maquinas.length === 0 ? (
                <p className="text-sm text-orange-600">Cadastre uma máquina na aba Máquinas.</p>
              ) : (
                <Select value={agenda.maquinaId} onValueChange={(v) => setAgenda({ ...agenda, maquinaId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquinas.map((m) => (
                      <SelectItem key={m.id} value={m.id} disabled={m.status === 'Manutenção'}>
                        {m.identificacao} ({m.tipo}){m.status === 'Manutenção' ? ' — em manutenção' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dia</Label>
                <Input type="date" value={agenda.dataAgendada} onChange={(e) => setAgenda({ ...agenda, dataAgendada: e.target.value })} />
              </div>
              <div>
                <Label>Horas previstas</Label>
                <Input value={agenda.horasPrevistas} onChange={(e) => setAgenda({ ...agenda, horasPrevistas: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Operador</Label>
              <Input value={agenda.operador} onChange={(e) => setAgenda({ ...agenda, operador: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgendar(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !agenda.maquinaId || !agenda.dataAgendada}
              onClick={async () => {
                const ok = await executar(
                  () => post(`/servicos/${agendar.id}/agendar`, { ...agenda, horasPrevistas: agenda.horasPrevistas ? Number(agenda.horasPrevistas.replace(',', '.')) : undefined }),
                  'Serviço agendado. O produtor foi avisado.'
                );
                if (ok) setAgendar(null);
              }}
            >
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Concluir */}
      <Dialog open={!!concluir} onOpenChange={(open) => !open && setConcluir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir serviço — {concluir?.solicitanteNome}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Quantas horas a máquina trabalhou</Label>
            <Input value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ex.: 3,5" />
            <p className="text-xs text-gray-500 mt-1">As horas entram no contador da máquina. Se ela tem valor por hora, o total é calculado sozinho.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConcluir(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={salvando || !horas.trim()}
              onClick={async () => {
                const ok = await executar(() => post(`/servicos/${concluir.id}/concluir`, { horasRealizadas: Number(horas.replace(',', '.')) }), 'Serviço concluído. O produtor foi avisado.');
                if (ok) setConcluir(null);
              }}
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Não atender — ${recusar?.solicitanteNome || ''}`}
        rotulo="Motivo (o produtor vai ler)"
        exemplo="Ex.: área fora do município"
        confirmar="Não atender"
        onClose={() => setRecusar(null)}
        onConfirm={async (motivo) => {
          if (await executar(() => post(`/servicos/${recusar.id}/recusar`, { motivo }), 'Pedido encerrado. O produtor foi avisado.')) setRecusar(null);
        }}
      />
    </div>
  );
}
