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
import { MotivoDialog, PedidoCard, StatusBadge, portalApi as api } from '@/components/apps/portal-requests/shared';
import { Numeros, fmtDataHora, fmtDia, paraCampoData } from '@/components/apps/apps-gerais/shared';
import { Ban, CalendarClock, Check, Cross, Pencil, Plus, Search } from 'lucide-react';

const BASE = '/api/apps/cemiterios';
const STATUS_PEDIDO = {
  AGUARDANDO: { label: 'Aguardando', className: 'bg-yellow-600' },
  AGENDADO: { label: 'Marcado', className: 'bg-indigo-600' },
  ATENDIDO: { label: 'Atendido', className: 'bg-green-600' },
  RECUSADO: { label: 'Recusado', variant: 'secondary' },
};
const STATUS_JAZIGO: Record<string, { label: string; className?: string; variant?: any }> = {
  LIVRE: { label: 'Livre', className: 'bg-green-600' },
  CONCEDIDO: { label: 'Concedido', className: 'bg-blue-600' },
  OCUPADO: { label: 'Ocupado', className: 'bg-gray-600' },
  INATIVO: { label: 'Desativado', variant: 'secondary' },
};
const TIPO_PEDIDO: Record<string, string> = {
  CONCESSAO: 'Concessão',
  RENOVACAO: 'Renovação da concessão',
  TRANSFERENCIA: 'Transferência de titularidade',
  EXUMACAO: 'Exumação',
  SEPULTAMENTO: 'Sepultamento',
};
const TIPO_JAZIGO: Record<string, string> = { SEPULTURA: 'Sepultura', JAZIGO: 'Jazigo', GAVETA: 'Gaveta', OSSUARIO: 'Ossuário' };
const JAZIGO_VAZIO = { id: '', cemiterio: '', quadra: '', numero: '', tipo: 'SEPULTURA', titularNome: '', titularDocumento: '', concessaoAte: '', observacoes: '' };

const nomeJazigo = (j: any) => (j ? `${j.cemiterio}${j.quadra ? `, quadra ${j.quadra}` : ''}, nº ${j.numero}` : '');

export default function CemiteriosPage() {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [jazigos, setJazigos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [atender, setAtender] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [recusar, setRecusar] = useState<any>(null);
  const [jazigoForm, setJazigoForm] = useState<typeof JAZIGO_VAZIO | null>(null);
  const [sepultar, setSepultar] = useState<any>(null);
  const [sepultamento, setSepultamento] = useState({ falecidoNome: '', dataObito: '', dataSepultamento: '', certidaoObito: '' });

  const carregarJazigos = useCallback(async (termo = '') => {
    const lista = await api(`${BASE}/jazigos${termo ? `?busca=${encodeURIComponent(termo)}` : ''}`).catch(() => []);
    setJazigos(Array.isArray(lista) ? lista : []);
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, numeros] = await Promise.all([api(`${BASE}/pedidos?pendentes=true`), api(`${BASE}/stats`).catch(() => null)]);
      setPedidos(Array.isArray(lista) ? lista : []);
      setStats(numeros);
      await carregarJazigos(busca);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [busca, carregarJazigos]);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cemiterios = useMemo(() => Array.from(new Set(jazigos.map((j) => j.cemiterio))).sort(), [jazigos]);

  const executar = async (acao: () => Promise<unknown>, mensagem: string) => {
    setSalvando(true);
    try {
      await acao();
      toast({ title: mensagem });
      await carregar();
      return true;
    } catch (error: any) {
      toast({ title: 'Não deu certo', description: String(error?.message || error), variant: 'destructive' });
      return false;
    } finally {
      setSalvando(false);
    }
  };
  const enviar = (caminho: string, body: unknown = {}, method = 'POST') => api(`${BASE}${caminho}`, { method, body: JSON.stringify(body) });

  /** Sepulturas que fazem sentido para cada tipo de pedido */
  const opcoesDeJazigo = (pedido: any) => {
    if (!pedido) return [];
    if (pedido.tipo === 'CONCESSAO') return jazigos.filter((j) => j.status === 'LIVRE');
    if (pedido.tipo === 'EXUMACAO') return jazigos.filter((j) => j.status === 'OCUPADO');
    if (pedido.tipo === 'SEPULTAMENTO') return jazigos.filter((j) => j.status !== 'INATIVO');
    return jazigos.filter((j) => ['CONCEDIDO', 'OCUPADO'].includes(j.status));
  };

  const abrirAtender = (pedido: any) => {
    setForm({ jazigoId: pedido.jazigoId || '', anos: '5', novoTitularNome: pedido.novoTitularNome || '', novoTitularDocumento: pedido.novoTitularDocumento || '', dataAgendada: '', destinoRestos: 'Ossuário municipal', dataSepultamento: '', ordemJudicial: false, mensagem: '' });
    setAtender(pedido);
  };

  const exumacaoParaMarcar = atender?.tipo === 'EXUMACAO' && atender?.status === 'AGUARDANDO';

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Cross className="h-8 w-8 text-slate-600" />
            Cemitérios
          </h1>
          <p className="text-gray-500 mt-1">Sepulturas e jazigos, concessões, sepultamentos e exumações.</p>
        </div>
        <Button onClick={() => setJazigoForm({ ...JAZIGO_VAZIO, cemiterio: cemiterios[0] || '' })}>
          <Plus className="h-4 w-4 mr-2" /> Cadastrar sepultura
        </Button>
      </div>

      <Numeros
        itens={[
          ['Pedidos em aberto', stats?.pendentes],
          ['Sepulturas livres', stats?.livres],
          ['Ocupadas', stats?.ocupados],
          ['Concessões vencendo (90 dias)', stats?.concessoesVencendo],
        ]}
      />

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos ({pedidos.length})</TabsTrigger>
          <TabsTrigger value="jazigos">Sepulturas e jazigos</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos">
          <Card>
            <CardHeader>
              <CardTitle>Por ordem de chegada</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum pedido em aberto</div>
              ) : (
                <div className="space-y-3">
                  {pedidos.map((p) => (
                    <PedidoCard
                      key={p.id}
                      titulo={
                        <>
                          {TIPO_PEDIDO[p.tipo] || p.tipo} — {p.solicitanteNome}
                        </>
                      }
                      subtitulo={[p.jazigo ? nomeJazigo(p.jazigo) : p.localizacaoInformada && `Informou: ${p.localizacaoInformada}`, p.cemiterioDesejado && !p.jazigo && `Cemitério: ${p.cemiterioDesejado}`]
                        .filter(Boolean)
                        .join(' · ')}
                      detalhes={[
                        p.falecidoNome && `Falecido(a): ${p.falecidoNome}`,
                        p.dataObito && `Óbito: ${fmtDia(p.dataObito)}`,
                        p.novoTitularNome && `Novo titular: ${p.novoTitularNome}`,
                        p.dataAgendada && `Marcado para ${fmtDataHora(p.dataAgendada)}`,
                        p.telefone && `Telefone: ${p.telefone}`,
                      ]}
                      protocolNumber={p.protocolNumber}
                      criadoEm={p.createdAt}
                      status={<StatusBadge status={p.status} map={STATUS_PEDIDO} />}
                      acoes={
                        <>
                          <Button size="sm" className={p.tipo === 'EXUMACAO' && p.status === 'AGUARDANDO' ? '' : 'bg-green-600 hover:bg-green-700'} onClick={() => abrirAtender(p)}>
                            {p.tipo === 'EXUMACAO' && p.status === 'AGUARDANDO' ? (
                              <>
                                <CalendarClock className="h-4 w-4 mr-1" /> Marcar dia
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" /> Atender
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRecusar(p)}>
                            <Ban className="h-4 w-4 mr-1" /> Recusar
                          </Button>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jazigos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Cadastro</CardTitle>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  carregarJazigos(busca);
                }}
              >
                <Input className="w-64" placeholder="Número, titular ou falecido" value={busca} onChange={(e) => setBusca(e.target.value)} />
                <Button type="submit" variant="outline" size="icon" aria-label="Procurar">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              {jazigos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{busca ? 'Nada encontrado' : 'Nenhuma sepultura cadastrada. Clique em "Cadastrar sepultura".'}</div>
              ) : (
                <div className="space-y-2">
                  {jazigos.map((j) => (
                    <div key={j.id} className="flex flex-col gap-2 p-3 border rounded-lg md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {TIPO_JAZIGO[j.tipo] || j.tipo} — {nomeJazigo(j)} <StatusBadge status={j.status} map={STATUS_JAZIGO} />
                        </div>
                        <div className="text-xs text-gray-500">
                          {[
                            j.titularNome && `Titular: ${j.titularNome}`,
                            j.concessaoAte && `Concessão até ${fmtDia(j.concessaoAte)}`,
                            (j.sepultamentos || []).filter((s: any) => !s.exumadoEm).map((s: any) => `${s.falecidoNome} (${fmtDia(s.dataSepultamento)})`).join(', '),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setJazigoForm({
                              id: j.id,
                              cemiterio: j.cemiterio,
                              quadra: j.quadra || '',
                              numero: j.numero,
                              tipo: j.tipo,
                              titularNome: j.titularNome || '',
                              titularDocumento: j.titularDocumento || '',
                              concessaoAte: paraCampoData(j.concessaoAte),
                              observacoes: j.observacoes || '',
                            })
                          }
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSepultamento({ falecidoNome: '', dataObito: '', dataSepultamento: '', certidaoObito: '' });
                            setSepultar(j);
                          }}
                        >
                          Registrar sepultamento
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Atender / marcar exumação */}
      <Dialog open={!!atender} onOpenChange={(open) => !open && setAtender(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {exumacaoParaMarcar ? 'Marcar exumação' : TIPO_PEDIDO[atender?.tipo] || 'Atender'} — {atender?.solicitanteNome}
            </DialogTitle>
          </DialogHeader>
          {atender && (
            <div className="space-y-4">
              {atender.localizacaoInformada && <p className="text-sm text-gray-600">O cidadão informou: {atender.localizacaoInformada}</p>}
              <div>
                <Label>Sepultura / jazigo</Label>
                <Select value={form.jazigoId} onValueChange={(v) => setForm({ ...form, jazigoId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesDeJazigo(atender).map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {nomeJazigo(j)}
                        {j.titularNome ? ` — ${j.titularNome}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {opcoesDeJazigo(atender).length === 0 && <p className="text-xs text-orange-600 mt-1">Nenhuma sepultura cadastrada serve para este pedido. Cadastre na aba "Sepulturas e jazigos".</p>}
              </div>
              {['CONCESSAO', 'RENOVACAO'].includes(atender.tipo) && (
                <div>
                  <Label>Prazo da concessão (anos)</Label>
                  <Input type="number" min={1} max={99} value={form.anos} onChange={(e) => setForm({ ...form, anos: e.target.value })} />
                </div>
              )}
              {atender.tipo === 'TRANSFERENCIA' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Novo titular</Label>
                    <Input value={form.novoTitularNome} onChange={(e) => setForm({ ...form, novoTitularNome: e.target.value })} placeholder={atender.solicitanteNome} />
                  </div>
                  <div>
                    <Label>CPF do novo titular</Label>
                    <Input value={form.novoTitularDocumento} onChange={(e) => setForm({ ...form, novoTitularDocumento: e.target.value })} />
                  </div>
                </div>
              )}
              {atender.tipo === 'SEPULTAMENTO' && (
                <div>
                  <Label>Dia e hora do sepultamento</Label>
                  <Input type="datetime-local" value={form.dataSepultamento} onChange={(e) => setForm({ ...form, dataSepultamento: e.target.value })} />
                </div>
              )}
              {exumacaoParaMarcar && (
                <>
                  <div>
                    <Label>Dia e hora da exumação</Label>
                    <Input type="datetime-local" value={form.dataAgendada} onChange={(e) => setForm({ ...form, dataAgendada: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.ordemJudicial} onChange={(e) => setForm({ ...form, ordemJudicial: e.target.checked })} />
                    Há ordem judicial (antes do prazo mínimo de 3 anos)
                  </label>
                </>
              )}
              {atender.tipo === 'EXUMACAO' && !exumacaoParaMarcar && (
                <div>
                  <Label>Para onde foram os restos</Label>
                  <Input value={form.destinoRestos} onChange={(e) => setForm({ ...form, destinoRestos: e.target.value })} />
                </div>
              )}
              {!exumacaoParaMarcar && (
                <div>
                  <Label>Recado para o cidadão (opcional)</Label>
                  <Textarea rows={2} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} placeholder="Ex.: retire o título de concessão na administração do cemitério" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtender(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !form.jazigoId || (exumacaoParaMarcar && !form.dataAgendada)}
              onClick={async () => {
                const ok = exumacaoParaMarcar
                  ? await executar(() => enviar(`/pedidos/${atender.id}/agendar`, { jazigoId: form.jazigoId, dataAgendada: form.dataAgendada, ordemJudicial: form.ordemJudicial }), 'Exumação marcada. O cidadão foi avisado.')
                  : await executar(() => enviar(`/pedidos/${atender.id}/atender`, { ...form, anos: Number(form.anos) }), 'Atendido. O pedido foi encerrado.');
                if (ok) setAtender(null);
              }}
            >
              {exumacaoParaMarcar ? 'Marcar' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrar sepultamento direto */}
      <Dialog open={!!sepultar} onOpenChange={(open) => !open && setSepultar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar sepultamento — {nomeJazigo(sepultar)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome de quem foi sepultado</Label>
              <Input value={sepultamento.falecidoNome} onChange={(e) => setSepultamento({ ...sepultamento, falecidoNome: e.target.value })} />
            </div>
            <div>
              <Label>Data do óbito</Label>
              <Input type="date" value={sepultamento.dataObito} onChange={(e) => setSepultamento({ ...sepultamento, dataObito: e.target.value })} />
            </div>
            <div>
              <Label>Data do sepultamento</Label>
              <Input type="datetime-local" value={sepultamento.dataSepultamento} onChange={(e) => setSepultamento({ ...sepultamento, dataSepultamento: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Certidão de óbito (número, opcional)</Label>
              <Input value={sepultamento.certidaoObito} onChange={(e) => setSepultamento({ ...sepultamento, certidaoObito: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSepultar(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !sepultamento.falecidoNome.trim()}
              onClick={async () => {
                if (await executar(() => enviar(`/jazigos/${sepultar.id}/sepultamentos`, sepultamento), 'Sepultamento registrado')) setSepultar(null);
              }}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadastrar / editar sepultura */}
      <Dialog open={!!jazigoForm} onOpenChange={(open) => !open && setJazigoForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{jazigoForm?.id ? 'Editar sepultura' : 'Cadastrar sepultura'}</DialogTitle>
          </DialogHeader>
          {jazigoForm && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Cemitério</Label>
                <Input value={jazigoForm.cemiterio} onChange={(e) => setJazigoForm({ ...jazigoForm, cemiterio: e.target.value })} list="lista-cemiterios" placeholder="Ex.: Cemitério Municipal" />
                <datalist id="lista-cemiterios">
                  {cemiterios.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Quadra</Label>
                <Input value={jazigoForm.quadra} onChange={(e) => setJazigoForm({ ...jazigoForm, quadra: e.target.value })} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={jazigoForm.numero} onChange={(e) => setJazigoForm({ ...jazigoForm, numero: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={jazigoForm.tipo} onValueChange={(v) => setJazigoForm({ ...jazigoForm, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_JAZIGO).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Concessão até (se houver)</Label>
                <Input type="date" value={jazigoForm.concessaoAte} onChange={(e) => setJazigoForm({ ...jazigoForm, concessaoAte: e.target.value })} />
              </div>
              <div>
                <Label>Titular (se houver)</Label>
                <Input value={jazigoForm.titularNome} onChange={(e) => setJazigoForm({ ...jazigoForm, titularNome: e.target.value })} />
              </div>
              <div>
                <Label>CPF do titular</Label>
                <Input value={jazigoForm.titularDocumento} onChange={(e) => setJazigoForm({ ...jazigoForm, titularDocumento: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea rows={2} value={jazigoForm.observacoes} onChange={(e) => setJazigoForm({ ...jazigoForm, observacoes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setJazigoForm(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !jazigoForm?.cemiterio.trim() || !jazigoForm?.numero.trim()}
              onClick={async () => {
                if (!jazigoForm) return;
                const { id, ...dados } = jazigoForm;
                const ok = await executar(() => (id ? enviar(`/jazigos/${id}`, dados, 'PUT') : enviar('/jazigos', dados)), 'Salvo');
                if (ok) setJazigoForm(null);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Recusar — ${recusar?.solicitanteNome || ''}`}
        rotulo="Motivo (o cidadão vai ler no pedido)"
        exemplo="Ex.: falta a certidão de óbito; faça um novo pedido com o documento"
        confirmar="Recusar"
        onClose={() => setRecusar(null)}
        onConfirm={async (mensagem) => {
          if (await executar(() => enviar(`/pedidos/${recusar.id}/recusar`, { mensagem }), 'Recusado. O cidadão foi avisado.')) setRecusar(null);
        }}
      />
    </div>
  );
}
