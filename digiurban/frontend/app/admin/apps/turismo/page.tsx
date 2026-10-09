'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { MotivoDialog, PedidoCard, StatusBadge, fmtData, portalApi as api } from '@/components/apps/portal-requests/shared';
import { Ban, CalendarDays, Check, Eye, EyeOff, MapPinned, Plus, RefreshCw } from 'lucide-react';

const BASE = '/api/apps/turismo';
const TIPOS: Record<string, string> = {
  ESTABELECIMENTO: 'Hospedagem / alimentação',
  GUIA: 'Guia de turismo',
  AGENCIA: 'Agência',
  TRANSPORTE: 'Transporte turístico',
  ATRACAO: 'Atrativo turístico',
};
const STATUS = {
  SOLICITADO: { label: 'Aguardando', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  ATIVO: { label: 'Ativo', className: 'bg-green-600' },
  VENCIDO: { label: 'Vencido', className: 'bg-orange-600' },
  INDEFERIDO: { label: 'Não aprovado', variant: 'destructive' },
  SUSPENSO: { label: 'Suspenso', variant: 'secondary' },
};
const STATUS_EVENTO = {
  SOLICITADO: { label: 'Aguardando', className: 'bg-yellow-600' },
  APROVADO: { label: 'No calendário', className: 'bg-green-600' },
  REALIZADO: { label: 'Realizado', className: 'bg-blue-600' },
  CANCELADO: { label: 'Cancelado', variant: 'secondary' },
  INDEFERIDO: { label: 'Não aprovado', variant: 'destructive' },
};
const PRESTADOR = { tipo: 'ESTABELECIMENTO', nome: '', categoria: '', responsavel: '', cpfCnpj: '', telefone: '', email: '', endereco: '', descricao: '', cadastur: '' };
const EVENTO = { nome: '', tipo: '', local: '', dataInicio: '', dataFim: '', organizador: '', contato: '', publicoEstimado: '', descricao: '' };

export default function TurismoPage() {
  const { toast } = useToast();
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [prestadorAberto, setPrestadorAberto] = useState(false);
  const [prestador, setPrestador] = useState(PRESTADOR);
  const [eventoAberto, setEventoAberto] = useState(false);
  const [evento, setEvento] = useState(EVENTO);
  const [recusar, setRecusar] = useState<{ item: any; tipo: 'prestador' | 'evento' | 'suspender' } | null>(null);
  const [aprovarEvento, setAprovarEvento] = useState<any>(null);
  const [apoio, setApoio] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, agenda, numeros] = await Promise.all([api(`${BASE}/prestadores`), api(`${BASE}/eventos`), api(`${BASE}/stats`).catch(() => null)]);
      setPrestadores(Array.isArray(lista) ? lista : []);
      setEventos(Array.isArray(agenda) ? agenda : []);
      setStats(numeros);
    } catch {
      setPrestadores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return prestadores.filter(
      (p) => (filtroTipo === 'TODOS' || p.tipo === filtroTipo) && (!termo || p.nome?.toLowerCase().includes(termo) || p.responsavel?.toLowerCase().includes(termo) || p.numero?.toLowerCase().includes(termo))
    );
  }, [prestadores, filtroTipo, busca]);

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
            <MapPinned className="h-8 w-8 text-teal-600" />
            Cadastro do Turismo
          </h1>
          <p className="text-gray-500 mt-1">Prestadores de serviço turístico e calendário de eventos da cidade</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEventoAberto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo evento
          </Button>
          <Button onClick={() => setPrestadorAberto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo cadastro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ['Cadastros aguardando', stats?.aguardando],
          ['Cadastros ativos', stats?.ativos],
          ['Vencendo em 60 dias', stats?.vencendo],
          ['Eventos aguardando', stats?.eventosPendentes],
          ['Próximos eventos', stats?.proximosEventos],
        ].map(([rotulo, valor]) => (
          <Card key={rotulo as string}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{valor ?? '-'}</div>
              <div className="text-sm text-gray-500">{rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="prestadores">
        <TabsList>
          <TabsTrigger value="prestadores">Prestadores ({prestadores.length})</TabsTrigger>
          <TabsTrigger value="eventos">Eventos ({eventos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="prestadores">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 md:flex-row">
                <Input placeholder="Buscar por nome, responsável ou número" value={busca} onChange={(e) => setBusca(e.target.value)} />
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os tipos</SelectItem>
                    {Object.entries(TIPOS).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : filtrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum cadastro encontrado</div>
              ) : (
                <div className="space-y-3">
                  {filtrados.map((p) => (
                    <PedidoCard
                      key={p.id}
                      titulo={
                        <>
                          {p.nome}
                          {p.numero && (
                            <Badge variant="outline" className="ml-2 font-normal">
                              {p.numero}
                            </Badge>
                          )}
                          {p.publicado && (
                            <Badge variant="outline" className="ml-2 font-normal">
                              <Eye className="h-3 w-3 mr-1" /> No guia
                            </Badge>
                          )}
                        </>
                      }
                      subtitulo={[TIPOS[p.tipo], p.categoria, p.endereco].filter(Boolean).join(' · ')}
                      detalhes={[
                        p.responsavel && `Responsável: ${p.responsavel}`,
                        p.telefone,
                        p.cadastur && `Cadastur ${p.cadastur}`,
                        p.validade && `Vale até ${fmtData(p.validade)}`,
                        p.descricao,
                        p.motivo && `Motivo: ${p.motivo}`,
                      ]}
                      protocolNumber={p.protocolNumber}
                      criadoEm={p.createdAt}
                      status={<StatusBadge status={p.situacao || p.status} map={STATUS} />}
                      acoes={
                        <>
                          {p.status === 'SOLICITADO' && (
                            <Button size="sm" variant="outline" disabled={salvando} onClick={() => executar(() => post(`/prestadores/${p.id}/analisar`), 'Em análise')}>
                              Analisar
                            </Button>
                          )}
                          {['SOLICITADO', 'EM_ANALISE'].includes(p.status) && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={salvando} onClick={() => executar(() => post(`/prestadores/${p.id}/aprovar`), 'Cadastro aprovado. O solicitante foi avisado.')}>
                                <Check className="h-4 w-4 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRecusar({ item: p, tipo: 'prestador' })}>
                                <Ban className="h-4 w-4 mr-1" /> Não aprovar
                              </Button>
                            </>
                          )}
                          {p.status === 'ATIVO' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={salvando}
                                onClick={() => executar(() => api(`${BASE}/prestadores/${p.id}/publicar`, { method: 'PUT', body: JSON.stringify({ publicado: !p.publicado }) }), p.publicado ? 'Retirado do guia' : 'Publicado no guia')}
                              >
                                {p.publicado ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                {p.publicado ? 'Tirar do guia' : 'Pôr no guia'}
                              </Button>
                              <Button size="sm" variant="outline" disabled={salvando} onClick={() => executar(() => post(`/prestadores/${p.id}/renovar`), 'Cadastro renovado')}>
                                <RefreshCw className="h-4 w-4 mr-1" /> Renovar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setRecusar({ item: p, tipo: 'suspender' })}>
                                Suspender
                              </Button>
                            </>
                          )}
                          {p.status === 'SUSPENSO' && (
                            <Button size="sm" variant="outline" disabled={salvando} onClick={() => executar(() => post(`/prestadores/${p.id}/reativar`), 'Cadastro reativado')}>
                              Reativar
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

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5" /> Calendário de eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum evento registrado</div>
              ) : (
                <div className="space-y-3">
                  {eventos.map((e) => (
                    <PedidoCard
                      key={e.id}
                      titulo={e.nome}
                      subtitulo={[e.dataInicio && (e.dataFim && e.dataFim !== e.dataInicio ? `${fmtData(e.dataInicio)} a ${fmtData(e.dataFim)}` : fmtData(e.dataInicio)), e.local, e.tipo].filter(Boolean).join(' · ')}
                      detalhes={[
                        e.organizador && `Organização: ${e.organizador}`,
                        e.contato,
                        e.publicoEstimado && `Público esperado: ${e.publicoEstimado}`,
                        e.apoioSolicitado && `Pede: ${e.apoioSolicitado}`,
                        e.apoioConcedido && `Apoio dado: ${e.apoioConcedido}`,
                        e.descricao,
                        e.motivo && `Motivo: ${e.motivo}`,
                      ]}
                      protocolNumber={e.protocolNumber}
                      criadoEm={e.createdAt}
                      status={<StatusBadge status={e.status} map={STATUS_EVENTO} />}
                      acoes={
                        <>
                          {e.status === 'SOLICITADO' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setApoio('');
                                  setAprovarEvento(e);
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRecusar({ item: e, tipo: 'evento' })}>
                                <Ban className="h-4 w-4 mr-1" /> Não aprovar
                              </Button>
                            </>
                          )}
                          {e.status === 'APROVADO' && (
                            <>
                              <Button size="sm" variant="outline" disabled={salvando} onClick={() => executar(() => post(`/eventos/${e.id}/situacao`, { status: 'REALIZADO' }), 'Evento marcado como realizado')}>
                                Realizado
                              </Button>
                              <Button size="sm" variant="ghost" disabled={salvando} onClick={() => executar(() => post(`/eventos/${e.id}/situacao`, { status: 'CANCELADO' }), 'Evento cancelado')}>
                                Cancelar
                              </Button>
                            </>
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
      </Tabs>

      {/* Novo cadastro */}
      <Dialog open={prestadorAberto} onOpenChange={setPrestadorAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo cadastro turístico</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Tipo</Label>
              <Select value={prestador.tipo} onValueChange={(v) => setPrestador({ ...prestador, tipo: v })}>
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
            {(
              [
                ['nome', 'Nome', 'col-span-2'],
                ['categoria', 'Categoria (ex.: pousada, restaurante)', ''],
                ['responsavel', 'Responsável', ''],
                ['cpfCnpj', 'CPF ou CNPJ', ''],
                ['telefone', 'Telefone', ''],
                ['email', 'E-mail', ''],
                ['cadastur', 'Nº do Cadastur (se tiver)', ''],
                ['endereco', 'Endereço', 'col-span-2'],
              ] as const
            ).map(([campo, rotulo, classe]) => (
              <div key={campo} className={classe}>
                <Label>{rotulo}</Label>
                <Input value={prestador[campo]} onChange={(e) => setPrestador({ ...prestador, [campo]: e.target.value })} />
              </div>
            ))}
            <div className="col-span-2">
              <Label>O que oferece</Label>
              <Textarea rows={2} value={prestador.descricao} onChange={(e) => setPrestador({ ...prestador, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrestadorAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !prestador.nome.trim()}
              onClick={async () => {
                if (await executar(() => post('/prestadores', prestador), 'Cadastro registrado. Aprove para emitir o número.')) {
                  setPrestadorAberto(false);
                  setPrestador(PRESTADOR);
                }
              }}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novo evento */}
      <Dialog open={eventoAberto} onOpenChange={setEventoAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo evento no calendário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome do evento</Label>
              <Input value={evento.nome} onChange={(e) => setEvento({ ...evento, nome: e.target.value })} />
            </div>
            <div>
              <Label>Começa em</Label>
              <Input type="date" value={evento.dataInicio} onChange={(e) => setEvento({ ...evento, dataInicio: e.target.value })} />
            </div>
            <div>
              <Label>Termina em</Label>
              <Input type="date" value={evento.dataFim} onChange={(e) => setEvento({ ...evento, dataFim: e.target.value })} />
            </div>
            {(
              [
                ['local', 'Local'],
                ['tipo', 'Tipo (festa, feira, esportivo...)'],
                ['organizador', 'Quem organiza'],
                ['contato', 'Contato'],
                ['publicoEstimado', 'Público esperado'],
              ] as const
            ).map(([campo, rotulo]) => (
              <div key={campo}>
                <Label>{rotulo}</Label>
                <Input value={evento[campo]} onChange={(e) => setEvento({ ...evento, [campo]: e.target.value })} />
              </div>
            ))}
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={2} value={evento.descricao} onChange={(e) => setEvento({ ...evento, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !evento.nome.trim()}
              onClick={async () => {
                if (await executar(() => post('/eventos', { ...evento, publicoEstimado: evento.publicoEstimado ? Number(evento.publicoEstimado) : undefined }), 'Evento no calendário')) {
                  setEventoAberto(false);
                  setEvento(EVENTO);
                }
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aprovar evento pedido no portal */}
      <Dialog open={!!aprovarEvento} onOpenChange={(open) => !open && setAprovarEvento(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aprovar — {aprovarEvento?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {aprovarEvento?.apoioSolicitado && <p className="text-sm text-gray-600">O organizador pediu: {aprovarEvento.apoioSolicitado}</p>}
            <Label>Apoio que a prefeitura vai dar (opcional — o organizador vai ler)</Label>
            <Textarea rows={2} value={apoio} onChange={(e) => setApoio(e.target.value)} placeholder="Ex.: palco, som e divulgação" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovarEvento(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={salvando}
              onClick={async () => {
                if (await executar(() => post(`/eventos/${aprovarEvento.id}/aprovar`, { apoioConcedido: apoio || undefined }), 'Evento aprovado. O organizador foi avisado.')) setAprovarEvento(null);
              }}
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`${recusar?.tipo === 'suspender' ? 'Suspender' : 'Não aprovar'} — ${recusar?.item?.nome || ''}`}
        rotulo={recusar?.tipo === 'suspender' ? 'Motivo da suspensão' : 'Motivo (o solicitante vai ler)'}
        exemplo="Ex.: falta o alvará de funcionamento"
        confirmar={recusar?.tipo === 'suspender' ? 'Suspender' : 'Não aprovar'}
        onClose={() => setRecusar(null)}
        onConfirm={async (motivo) => {
          if (!recusar) return;
          const caminho =
            recusar.tipo === 'evento' ? `/eventos/${recusar.item.id}/indeferir` : recusar.tipo === 'suspender' ? `/prestadores/${recusar.item.id}/suspender` : `/prestadores/${recusar.item.id}/indeferir`;
          if (await executar(() => post(caminho, { motivo }), recusar.tipo === 'suspender' ? 'Cadastro suspenso' : 'Pedido encerrado. O solicitante foi avisado.')) setRecusar(null);
        }}
      />
    </div>
  );
}
