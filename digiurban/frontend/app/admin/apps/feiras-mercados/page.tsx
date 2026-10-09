'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { MotivoDialog, PedidoCard, StatusBadge, portalApi as api } from '@/components/apps/portal-requests/shared';
import { Numeros, SecretariaSelect, fmtDia, nomeSecretaria, paraCampoData } from '@/components/apps/apps-gerais/shared';
import { Ban, Check, Plus, RefreshCw, Store, XCircle } from 'lucide-react';

const BASE = '/api/apps/feiras-mercados';
const SITUACAO = {
  AGUARDANDO: { label: 'Aguardando', className: 'bg-yellow-600' },
  ATIVA: { label: 'Ativa', className: 'bg-green-600' },
  VENCIDA: { label: 'Vencida', className: 'bg-red-600' },
  RECUSADA: { label: 'Recusada', variant: 'secondary' },
  REVOGADA: { label: 'Revogada', variant: 'secondary' },
  ENCERRADA: { label: 'Encerrada', variant: 'secondary' },
};
const TIPO_PEDIDO: Record<string, string> = { PERMISSAO: 'Permissão de uso', INSCRICAO_FEIRA: 'Inscrição em feira', RELOCACAO: 'Troca de ponto', RENOVACAO: 'Renovação' };
const TIPO_ESPACO: Record<string, string> = { BOX: 'Box', BANCA: 'Banca', QUIOSQUE: 'Quiosque', PONTO: 'Ponto' };
const SEM_ESPACO = '__nenhum__';
const ESPACO_VAZIO = { local: '', identificacao: '', tipo: 'BOX', diaFuncionamento: '', departmentCode: '' };

function umAnoDepois() {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return paraCampoData(data);
}

export default function FeirasMercadosPage() {
  const { toast } = useToast();
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [espacos, setEspacos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [secretarias, setSecretarias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [conceder, setConceder] = useState<{ pedido: any; espacoId: string; validade: string } | null>(null);
  const [recusar, setRecusar] = useState<any>(null);
  const [revogar, setRevogar] = useState<any>(null);
  const [renovar, setRenovar] = useState<{ permissao: any; validade: string } | null>(null);
  const [espacoForm, setEspacoForm] = useState<typeof ESPACO_VAZIO | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, listaEspacos, numeros] = await Promise.all([api(`${BASE}/permissoes`), api(`${BASE}/espacos`), api(`${BASE}/stats`).catch(() => null)]);
      setPermissoes(Array.isArray(lista) ? lista : []);
      setEspacos(Array.isArray(listaEspacos) ? listaEspacos : []);
      setStats(numeros);
    } catch {
      setPermissoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    api(`${BASE}/secretarias`).then((s) => setSecretarias(Array.isArray(s) ? s : [])).catch(() => setSecretarias([]));
  }, [carregar]);

  const pedidos = permissoes.filter((p) => p.status === 'AGUARDANDO');
  const ativas = permissoes.filter((p) => p.status === 'ATIVA').sort((a, b) => (a.situacao === 'VENCIDA' ? -1 : 0) - (b.situacao === 'VENCIDA' ? -1 : 0));
  const porLocal = useMemo(() => {
    const grupos = new Map<string, any[]>();
    for (const espaco of espacos) {
      if (!grupos.has(espaco.local)) grupos.set(espaco.local, []);
      grupos.get(espaco.local)!.push(espaco);
    }
    return Array.from(grupos.entries());
  }, [espacos]);
  const livres = (departmentCode: string) => espacos.filter((e) => e.status === 'LIVRE' && e.departmentCode === departmentCode);

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
  const post = (caminho: string, body: unknown = {}) => api(`${BASE}${caminho}`, { method: 'POST', body: JSON.stringify(body) });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Store className="h-8 w-8 text-emerald-600" />
            Feiras e Mercados
          </h1>
          <p className="text-gray-500 mt-1">Boxes, bancas e pontos: conceda a permissão com validade e acompanhe as vencidas.</p>
        </div>
        <Button onClick={() => setEspacoForm({ ...ESPACO_VAZIO, departmentCode: secretarias[0] || '' })}>
          <Plus className="h-4 w-4 mr-2" /> Cadastrar box/banca
        </Button>
      </div>

      <Numeros
        itens={[
          ['Pedidos aguardando', stats?.aguardando],
          ['Permissões ativas', stats?.ativas],
          ['Vencidas', stats?.vencidas],
          ['Espaços livres', stats?.espacosLivres],
        ]}
      />

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos ({pedidos.length})</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões ({ativas.length})</TabsTrigger>
          <TabsTrigger value="espacos">Boxes e bancas ({espacos.length})</TabsTrigger>
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
                <div className="text-center py-8 text-gray-500">Nenhum pedido aguardando</div>
              ) : (
                <div className="space-y-3">
                  {[...pedidos].reverse().map((p) => (
                    <PedidoCard
                      key={p.id}
                      titulo={
                        <>
                          {p.titularNome}
                          <Badge variant="outline" className="ml-2 font-normal">
                            {TIPO_PEDIDO[p.tipoPedido] || p.tipoPedido}
                          </Badge>
                        </>
                      }
                      subtitulo={[p.localDesejado, secretarias.length > 1 && nomeSecretaria(p.departmentCode)].filter(Boolean).join(' · ')}
                      detalhes={[p.atividade && `Vende: ${p.atividade}`, p.telefone && `Telefone: ${p.telefone}`, p.documento && `Documento: ${p.documento}`]}
                      protocolNumber={p.protocolNumber}
                      criadoEm={p.createdAt}
                      status={<StatusBadge status={p.situacao} map={SITUACAO} />}
                      acoes={
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConceder({ pedido: p, espacoId: SEM_ESPACO, validade: umAnoDepois() })}>
                            <Check className="h-4 w-4 mr-1" /> Conceder
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

        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle>Permissões em vigor (vencidas primeiro)</CardTitle>
            </CardHeader>
            <CardContent>
              {ativas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma permissão ativa</div>
              ) : (
                <div className="space-y-3">
                  {ativas.map((p) => (
                    <PedidoCard
                      key={p.id}
                      titulo={`${p.numero || ''} — ${p.titularNome}`}
                      subtitulo={[p.espaco ? `${p.espaco.identificacao} · ${p.espaco.local}` : p.localDesejado, p.atividade].filter(Boolean).join(' · ')}
                      detalhes={[p.validade && `Válida até ${fmtDia(p.validade)}`, p.telefone && `Telefone: ${p.telefone}`]}
                      protocolNumber={p.protocolNumber}
                      criadoEm={p.createdAt}
                      status={<StatusBadge status={p.situacao} map={SITUACAO} />}
                      acoes={
                        <>
                          <Button size="sm" variant="outline" onClick={() => setRenovar({ permissao: p, validade: umAnoDepois() })}>
                            <RefreshCw className="h-4 w-4 mr-1" /> Renovar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRevogar(p)}>
                            <XCircle className="h-4 w-4 mr-1" /> Revogar
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

        <TabsContent value="espacos">
          {porLocal.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-gray-500">Nenhum box ou banca cadastrado. Clique em "Cadastrar box/banca".</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {porLocal.map(([local, lista]) => (
                <Card key={local}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {local}{' '}
                      <span className="text-sm font-normal text-gray-500">
                        {lista.filter((e) => e.status === 'LIVRE').length} livres de {lista.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {lista.map((e) => (
                        <div key={e.id} className={`rounded-lg border p-3 text-sm ${e.status === 'LIVRE' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                          <div className="font-medium">
                            {TIPO_ESPACO[e.tipo] && !e.identificacao.toLowerCase().startsWith(TIPO_ESPACO[e.tipo].toLowerCase()) ? `${TIPO_ESPACO[e.tipo]} ` : ''}
                            {e.identificacao}
                          </div>
                          <div className="text-xs text-gray-500">{e.status === 'LIVRE' ? 'Livre' : e.permissoes?.[0]?.titularNome || 'Ocupado'}</div>
                          {e.diaFuncionamento && <div className="text-xs text-gray-400">{e.diaFuncionamento}</div>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Conceder */}
      <Dialog open={!!conceder} onOpenChange={(open) => !open && setConceder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conceder — {conceder?.pedido?.titularNome}</DialogTitle>
          </DialogHeader>
          {conceder && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {TIPO_PEDIDO[conceder.pedido.tipoPedido]} · pediu: {conceder.pedido.localDesejado}
              </p>
              <div>
                <Label>Box, banca ou ponto {conceder.pedido.tipoPedido === 'INSCRICAO_FEIRA' && '(opcional)'}</Label>
                <Select value={conceder.espacoId} onValueChange={(v) => setConceder({ ...conceder, espacoId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_ESPACO}>{conceder.pedido.tipoPedido === 'INSCRICAO_FEIRA' ? 'Sem lugar fixo' : 'Escolha um espaço livre'}</SelectItem>
                    {livres(conceder.pedido.departmentCode).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.identificacao} — {e.local}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {livres(conceder.pedido.departmentCode).length === 0 && <p className="text-xs text-orange-600 mt-1">Não há espaço livre cadastrado nesta secretaria.</p>}
              </div>
              <div>
                <Label>Válida até</Label>
                <Input type="date" value={conceder.validade} onChange={(e) => setConceder({ ...conceder, validade: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConceder(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !conceder?.validade}
              onClick={async () => {
                if (!conceder) return;
                const ok = await executar(
                  () => post(`/permissoes/${conceder.pedido.id}/conceder`, { espacoId: conceder.espacoId === SEM_ESPACO ? undefined : conceder.espacoId, validade: conceder.validade }),
                  'Concedida. O cidadão foi avisado.'
                );
                if (ok) setConceder(null);
              }}
            >
              Conceder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renovar */}
      <Dialog open={!!renovar} onOpenChange={(open) => !open && setRenovar(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renovar — {renovar?.permissao?.titularNome}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Nova validade</Label>
            <Input type="date" value={renovar?.validade || ''} onChange={(e) => renovar && setRenovar({ ...renovar, validade: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenovar(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !renovar?.validade}
              onClick={async () => {
                if (renovar && (await executar(() => post(`/permissoes/${renovar.permissao.id}/renovar`, { validade: renovar.validade }), 'Renovada'))) setRenovar(null);
              }}
            >
              Renovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadastrar espaço */}
      <Dialog open={!!espacoForm} onOpenChange={(open) => !open && setEspacoForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar box ou banca</DialogTitle>
          </DialogHeader>
          {espacoForm && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <SecretariaSelect secretarias={secretarias} value={espacoForm.departmentCode} onChange={(v) => setEspacoForm({ ...espacoForm, departmentCode: v })} />
              </div>
              <div className="col-span-2">
                <Label>Feira ou mercado</Label>
                <Input value={espacoForm.local} onChange={(e) => setEspacoForm({ ...espacoForm, local: e.target.value })} placeholder="Ex.: Mercado Municipal" list="locais-feira" />
                <datalist id="locais-feira">
                  {porLocal.map(([local]) => (
                    <option key={local} value={local} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={espacoForm.tipo} onValueChange={(v) => setEspacoForm({ ...espacoForm, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_ESPACO).map(([valor, rotulo]) => (
                      <SelectItem key={valor} value={valor}>
                        {rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Identificação</Label>
                <Input value={espacoForm.identificacao} onChange={(e) => setEspacoForm({ ...espacoForm, identificacao: e.target.value })} placeholder="Ex.: Box 12" />
              </div>
              <div className="col-span-2">
                <Label>Dias de funcionamento (opcional)</Label>
                <Input value={espacoForm.diaFuncionamento} onChange={(e) => setEspacoForm({ ...espacoForm, diaFuncionamento: e.target.value })} placeholder="Ex.: sábados, 6h às 12h" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEspacoForm(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !espacoForm?.local.trim() || !espacoForm?.identificacao.trim()}
              onClick={async () => {
                if (espacoForm && (await executar(() => post('/espacos', espacoForm), 'Cadastrado'))) setEspacoForm({ ...espacoForm, identificacao: '' });
              }}
            >
              Salvar e cadastrar outro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Recusar — ${recusar?.titularNome || ''}`}
        rotulo="Motivo (o cidadão vai ler no pedido)"
        exemplo="Ex.: não há boxes livres; você entrou na lista para a próxima vaga"
        confirmar="Recusar"
        onClose={() => setRecusar(null)}
        onConfirm={async (mensagem) => {
          if (await executar(() => post(`/permissoes/${recusar.id}/recusar`, { mensagem }), 'Recusado. O cidadão foi avisado.')) setRecusar(null);
        }}
      />

      <MotivoDialog
        aberto={!!revogar}
        titulo={`Revogar — ${revogar?.titularNome || ''}`}
        rotulo="Motivo (fica no histórico; o espaço volta a ficar livre)"
        exemplo="Ex.: desistência do permissionário"
        confirmar="Revogar"
        onClose={() => setRevogar(null)}
        onConfirm={async (motivo) => {
          if (await executar(() => post(`/permissoes/${revogar.id}/revogar`, { motivo }), 'Revogada. O espaço está livre.')) setRevogar(null);
        }}
      />
    </div>
  );
}
