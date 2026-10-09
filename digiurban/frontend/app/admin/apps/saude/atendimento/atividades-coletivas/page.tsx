'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { portalApi as api } from '@/components/apps/portal-requests/shared';
import { Check, Plus, UserPlus, Users, X } from 'lucide-react';

const TIPOS: Record<string, string> = {
  GRUPO_HIPERTENSOS: 'Grupo de hipertensos',
  GRUPO_DIABETICOS: 'Grupo de diabéticos',
  GRUPO_GESTANTES: 'Grupo de gestantes',
  GRUPO_IDOSOS: 'Grupo de idosos',
  GRUPO_CRIANCAS: 'Grupo de crianças',
  GRUPO_SAUDE_MENTAL: 'Grupo de saúde mental',
  EDUCACAO_SAUDE: 'Palestra / educação em saúde',
  PRATICAS_CORPORAIS: 'Atividade física',
  PLANEJAMENTO_FAMILIAR: 'Planejamento familiar',
  GRUPO_TABAGISMO: 'Grupo de tabagismo',
  OUTRO: 'Outro',
};
const STATUS: Record<string, { label: string; className?: string; variant?: any }> = {
  PLANEJADA: { label: 'Planejada', className: 'bg-blue-600' },
  REALIZADA: { label: 'Realizada', className: 'bg-green-600' },
  CANCELADA: { label: 'Cancelada', variant: 'secondary' },
};
const NOVA = { tipo: 'GRUPO_HIPERTENSOS', tema: '', data: '', hora: '08:00', duracao: '60', local: '', unidadeId: '', publicoAlvo: '' };
const MEDIDAS = { pressaoArterial: '', glicemia: '', peso: '' };

export default function AtividadesColetivasPage() {
  const { toast } = useToast();
  const [atividades, setAtividades] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aberta, setAberta] = useState(false);
  const [nova, setNova] = useState(NOVA);
  const [presenca, setPresenca] = useState<any>(null);
  const [pessoa, setPessoa] = useState<any>(null);
  const [medidas, setMedidas] = useState(MEDIDAS);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/api/saude/atividades-coletivas');
      const lista = Array.isArray(data) ? data : [];
      setAtividades(lista);
      // mantém aberta a lista de presença que estava sendo preenchida
      setPresenca((atual: any) => (atual ? lista.find((a: any) => a.id === atual.id) || null : null));
    } catch {
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    api('/api/apps/saude/cadastros/unidades')
      .then((data) => setUnidades(Array.isArray(data) ? data : data?.unidades || []))
      .catch(() => setUnidades([]));
  }, [carregar]);

  const criar = async () => {
    if (!nova.tema.trim() || !nova.data || !nova.local.trim() || !nova.unidadeId) {
      toast({ title: 'Informe tema, data, local e unidade', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/saude/atividades-coletivas', {
        method: 'POST',
        body: JSON.stringify({
          tipo: nova.tipo,
          tema: nova.tema.trim(),
          dataHora: `${nova.data}T${nova.hora || '08:00'}:00-03:00`,
          duracao: Number(nova.duracao) || undefined,
          local: nova.local.trim(),
          unidadeId: nova.unidadeId,
          publicoAlvo: nova.publicoAlvo || undefined,
        }),
      });
      toast({ title: 'Atividade criada' });
      setAberta(false);
      setNova(NOVA);
      await carregar();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (atividade: any, status: string) => {
    try {
      await api(`/api/saude/atividades-coletivas/${atividade.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast({ title: status === 'REALIZADA' ? 'Atividade marcada como realizada' : 'Atividade cancelada' });
      await carregar();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const adicionarPessoa = async () => {
    if (!presenca || !pessoa?.id) {
      toast({ title: 'Escolha a pessoa', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api(`/api/saude/atividades-coletivas/${presenca.id}/participantes`, {
        method: 'POST',
        body: JSON.stringify({
          citizenId: pessoa.id,
          pressaoArterial: medidas.pressaoArterial || undefined,
          glicemia: medidas.glicemia ? Number(medidas.glicemia.replace(',', '.')) : undefined,
          peso: medidas.peso ? Number(medidas.peso.replace(',', '.')) : undefined,
        }),
      });
      setPessoa(null);
      setMedidas(MEDIDAS);
      await carregar();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <HealthAppHeader
        title="Atividades coletivas"
        description="Grupos e palestras da unidade, com lista de presença."
        icon={Users}
        backHref="/admin/apps/saude/atendimento"
        actions={
          <Button onClick={() => setAberta(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova atividade
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Atividades <Badge variant="secondary">{atividades.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : atividades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma atividade cadastrada</div>
          ) : (
            <div className="space-y-3">
              {atividades.map((a) => {
                const badge = STATUS[a.status] || { label: a.status };
                return (
                  <div key={a.id} className="flex flex-col gap-3 p-4 border rounded-lg md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">
                        {a.tema} <span className="text-sm text-gray-500 font-normal">— {TIPOS[a.tipo] || a.tipo}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(a.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {a.local}
                      </div>
                      <div className="text-xs text-gray-400">
                        {a.participantes?.length || 0} participante(s)
                        {a.profissionais?.length ? ` · Responsável: ${a.profissionais.map((p: any) => p.profissional?.name).filter(Boolean).join(', ')}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                      {a.status !== 'CANCELADA' && (
                        <Button size="sm" variant="outline" onClick={() => setPresenca(a)}>
                          <UserPlus className="h-4 w-4 mr-1" /> Lista de presença
                        </Button>
                      )}
                      {a.status === 'PLANEJADA' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => mudarStatus(a, 'REALIZADA')}>
                            <Check className="h-4 w-4 mr-1" /> Realizada
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => mudarStatus(a, 'CANCELADA')}>
                            <X className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nova atividade */}
      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova atividade coletiva</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
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
            <div className="col-span-2">
              <Label>Tema</Label>
              <Input value={nova.tema} onChange={(e) => setNova({ ...nova, tema: e.target.value })} placeholder="Ex.: alimentação e pressão alta" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={nova.data} onChange={(e) => setNova({ ...nova, data: e.target.value })} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={nova.hora} onChange={(e) => setNova({ ...nova, hora: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Unidade</Label>
              <Select value={nova.unidadeId} onValueChange={(v) => setNova({ ...nova, unidadeId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Local</Label>
              <Input value={nova.local} onChange={(e) => setNova({ ...nova, local: e.target.value })} placeholder="Ex.: sala de reuniões da UBS" />
            </div>
            <div>
              <Label>Duração (minutos)</Label>
              <Input type="number" min={0} value={nova.duracao} onChange={(e) => setNova({ ...nova, duracao: e.target.value })} />
            </div>
            <div>
              <Label>Público</Label>
              <Input value={nova.publicoAlvo} onChange={(e) => setNova({ ...nova, publicoAlvo: e.target.value })} placeholder="Ex.: idosos" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Criar atividade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de presença */}
      <Dialog open={!!presenca} onOpenChange={(open) => !open && setPresenca(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lista de presença — {presenca?.tema}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector label="Adicionar pessoa" onSelect={setPessoa} selectedCidadao={pessoa} />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Pressão</Label>
                <Input value={medidas.pressaoArterial} onChange={(e) => setMedidas({ ...medidas, pressaoArterial: e.target.value })} placeholder="120/80" />
              </div>
              <div>
                <Label>Glicemia</Label>
                <Input value={medidas.glicemia} onChange={(e) => setMedidas({ ...medidas, glicemia: e.target.value })} placeholder="98" />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input value={medidas.peso} onChange={(e) => setMedidas({ ...medidas, peso: e.target.value })} placeholder="70" />
              </div>
            </div>
            <Button onClick={adicionarPessoa} disabled={salvando || !pessoa?.id}>
              <UserPlus className="h-4 w-4 mr-2" /> Adicionar à lista
            </Button>
            <div className="space-y-2">
              {(presenca?.participantes || []).length === 0 ? (
                <div className="text-sm text-gray-500">Ninguém na lista ainda.</div>
              ) : (
                presenca.participantes.map((p: any) => (
                  <div key={p.id} className="flex justify-between p-3 border rounded-lg text-sm">
                    <span className="font-medium">{p.citizen?.name || 'Participante'}</span>
                    <span className="text-gray-500">
                      {[p.pressaoArterial && `PA ${p.pressaoArterial}`, p.glicemia && `Glicemia ${p.glicemia}`, p.peso && `${p.peso} kg`].filter(Boolean).join(' · ') || 'Sem medidas'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresenca(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
