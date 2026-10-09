'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { portalApi as api, fmtData } from '@/components/apps/portal-requests/shared';
import { Home, MapPin, Plus } from 'lucide-react';

const TIPOS: Record<string, string> = {
  ACOMPANHAMENTO: 'Acompanhamento',
  CADASTRAMENTO: 'Cadastro da família',
  BUSCA_ATIVA: 'Busca ativa',
  CONTROLE_AMBIENTAL: 'Controle ambiental (dengue etc.)',
  EDUCACAO_SAUDE: 'Orientação de saúde',
  CONVOCACAO: 'Convocação',
};
const ACOMPANHAMENTOS: Record<string, string> = {
  hipertensao: 'Pressão alta',
  diabetes: 'Diabetes',
  gestacao: 'Gestante',
  crianca: 'Criança',
  idoso: 'Idoso',
  acamado: 'Acamado',
  saudeMental: 'Saúde mental',
  vacinacao: 'Vacinas em atraso',
};
const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const NOVA = { tipoVisita: 'ACOMPANHAMENTO', turno: 'MANHA', dataVisita: hoje(), motivoVisita: '', desfecho: '', encaminhamentoUBS: false, motivoEncaminhamento: '' };

export default function VisitasDomiciliaresPage() {
  const { toast } = useToast();
  const [visitas, setVisitas] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [inicio, setInicio] = useState(diasAtras(30));
  const [fim, setFim] = useState(hoje());
  const [somenteMinhas, setSomenteMinhas] = useState(true);
  const [loading, setLoading] = useState(true);
  const [aberta, setAberta] = useState(false);
  const [cidadao, setCidadao] = useState<any>(null);
  const [nova, setNova] = useState(NOVA);
  const [acomp, setAcomp] = useState<Record<string, boolean>>({});
  const [local, setLocal] = useState<{ latitude: number; longitude: number } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const filtro = `inicio=${inicio}&fim=${fim}`;
      const [lista, numeros] = await Promise.all([
        api(`/api/saude/visitas-domiciliares?${filtro}${somenteMinhas ? '&minhas=true' : ''}`),
        api(`/api/saude/visitas-domiciliares/resumo?${filtro}`).catch(() => null),
      ]);
      setVisitas(Array.isArray(lista) ? lista : []);
      setResumo(numeros);
    } catch {
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  }, [inicio, fim, somenteMinhas]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pegarLocal = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Este aparelho não informa a localização', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocal({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => toast({ title: 'Não foi possível pegar a localização', variant: 'destructive' })
    );
  };

  const registrar = async () => {
    if (!nova.motivoVisita.trim()) {
      toast({ title: 'Escreva o motivo da visita', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/saude/visitas-domiciliares', {
        method: 'POST',
        body: JSON.stringify({
          ...nova,
          dataVisita: `${nova.dataVisita}T12:00:00-03:00`,
          citizenId: cidadao?.id,
          acompanhamentosRealizados: acomp,
          atividadesRealizadas: Object.entries(acomp).filter(([, v]) => v).map(([k]) => ACOMPANHAMENTOS[k]),
          ...(local || {}),
        }),
      });
      toast({ title: 'Visita registrada' });
      setAberta(false);
      setCidadao(null);
      setNova({ ...NOVA, dataVisita: hoje() });
      setAcomp({});
      setLocal(null);
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
        title="Visitas domiciliares"
        description="Registro das visitas dos agentes de saúde e produção do período."
        icon={Home}
        backHref="/admin/apps/saude/atendimento"
        actions={
          <Button onClick={() => setAberta(true)}>
            <Plus className="h-4 w-4 mr-2" /> Registrar visita
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-end">
          <div>
            <Label>De</Label>
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant={somenteMinhas ? 'default' : 'outline'} onClick={() => setSomenteMinhas(true)}>
              Minhas visitas
            </Button>
            <Button size="sm" variant={!somenteMinhas ? 'default' : 'outline'} onClick={() => setSomenteMinhas(false)}>
              Toda a equipe
            </Button>
          </div>
        </CardContent>
      </Card>

      {resumo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{resumo.total}</div>
              <div className="text-sm text-gray-500">visitas da equipe no período</div>
              <div className="text-sm text-gray-500 mt-2">{resumo.encaminhamentos} encaminhamento(s) para a unidade</div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Visitas por agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {(resumo.porAgente || []).length === 0 ? (
                <div className="text-gray-500">Sem visitas no período</div>
              ) : (
                resumo.porAgente.map((a: any) => (
                  <div key={a.acsId} className="flex justify-between border-b py-1 last:border-0">
                    <span>{a.nome}</span>
                    <span className="text-gray-600">
                      {a.visitas} visita(s){a.encaminhamentos ? ` · ${a.encaminhamentos} encaminhada(s)` : ''}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Visitas <Badge variant="secondary">{visitas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : visitas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma visita no período</div>
          ) : (
            <div className="space-y-3">
              {visitas.map((v) => (
                <div key={v.id} className="p-4 border rounded-lg text-sm">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {fmtData(v.dataVisita)} — {v.citizen?.name || 'Visita ao domicílio'}
                    <Badge variant="outline">{TIPOS[v.tipoVisita] || v.tipoVisita}</Badge>
                    {v.encaminhamentoUBS && <Badge className="bg-orange-600">Encaminhado à unidade</Badge>}
                    {v.latitude != null && <MapPin className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="text-gray-600 mt-1">{v.motivoVisita}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {[
                      `Agente: ${v.acs?.name || '-'}`,
                      Array.isArray(v.atividadesRealizadas) && v.atividadesRealizadas.length ? `Acompanhou: ${v.atividadesRealizadas.join(', ')}` : null,
                      v.motivoEncaminhamento && `Encaminhamento: ${v.motivoEncaminhamento}`,
                      v.desfecho && `Resultado: ${v.desfecho}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector label="Pessoa visitada (opcional)" required={false} onSelect={setCidadao} selectedCidadao={cidadao} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={nova.dataVisita} onChange={(e) => setNova({ ...nova, dataVisita: e.target.value })} />
              </div>
              <div>
                <Label>Período</Label>
                <Select value={nova.turno} onValueChange={(v) => setNova({ ...nova, turno: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANHA">Manhã</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="NOITE">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo da visita</Label>
                <Select value={nova.tipoVisita} onValueChange={(v) => setNova({ ...nova, tipoVisita: v })}>
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
            </div>
            <div>
              <Label>Motivo da visita</Label>
              <Textarea rows={2} value={nova.motivoVisita} onChange={(e) => setNova({ ...nova, motivoVisita: e.target.value })} />
            </div>
            <div>
              <Label>O que foi acompanhado</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(ACOMPANHAMENTOS).map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    type="button"
                    onClick={() => setAcomp((a) => ({ ...a, [chave]: !a[chave] }))}
                    className={`px-3 py-1 rounded-full border text-sm ${acomp[chave] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Resultado da visita</Label>
              <Textarea rows={2} value={nova.desfecho} onChange={(e) => setNova({ ...nova, desfecho: e.target.value })} placeholder="Ex.: pressão controlada, remédios em dia" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nova.encaminhamentoUBS} onChange={(e) => setNova({ ...nova, encaminhamentoUBS: e.target.checked })} />
              Encaminhei a pessoa para a unidade de saúde
            </label>
            {nova.encaminhamentoUBS && (
              <div>
                <Label>Por que foi encaminhada</Label>
                <Textarea rows={2} value={nova.motivoEncaminhamento} onChange={(e) => setNova({ ...nova, motivoEncaminhamento: e.target.value })} />
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={pegarLocal}>
              <MapPin className="h-4 w-4 mr-2" />
              {local ? 'Localização marcada' : 'Marcar onde estou (opcional)'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={registrar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Registrar visita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
