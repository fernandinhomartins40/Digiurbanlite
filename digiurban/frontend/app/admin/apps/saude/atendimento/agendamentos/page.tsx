'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { CalendarDays, Check, X, UserX, CalendarPlus, Plus } from 'lucide-react';

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const STATUS_CONSULTA: Record<string, { label: string; className?: string; variant?: any }> = {
  AGENDADA: { label: 'Agendada', className: 'bg-blue-600' },
  CONFIRMADA: { label: 'Confirmada', className: 'bg-green-600' },
  REALIZADA: { label: 'Realizada', className: 'bg-green-700' },
  CANCELADA: { label: 'Cancelada', variant: 'destructive' },
  FALTOU: { label: 'Faltou', className: 'bg-orange-600' },
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

export default function AgendamentosPage() {
  const { toast } = useToast();
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [profissionalId, setProfissionalId] = useState('');
  const [agendas, setAgendas] = useState<any[]>([]);
  const [agendaId, setAgendaId] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [horarios, setHorarios] = useState<{ hora: string; disponivel: boolean }[]>([]);
  const [consultasDia, setConsultasDia] = useState<any[]>([]);
  const [erroHorarios, setErroHorarios] = useState('');

  // Dialog de marcação
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);
  const [cidadao, setCidadao] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Dialog nova agenda
  const [novaAgendaAberta, setNovaAgendaAberta] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [novaAgenda, setNovaAgenda] = useState({
    unidadeId: '',
    diaSemana: '1',
    horaInicio: '08:00',
    horaFim: '12:00',
    tempoPorConsulta: '20',
    vagasDisponiveis: '12',
  });

  useEffect(() => {
    api('/api/apps/saude/cadastros/profissionais?isActive=true')
      .then((data) => setProfissionais(Array.isArray(data) ? data : []))
      .catch(() => setProfissionais([]));
    api('/api/apps/saude/cadastros/unidades')
      .then((data) => setUnidades(Array.isArray(data) ? data : data?.unidades || []))
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    if (!profissionalId) {
      setAgendas([]);
      setAgendaId('');
      return;
    }
    api(`/api/saude/agendamento/agendas?profissionalId=${profissionalId}`)
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        setAgendas(lista);
        setAgendaId(lista[0]?.id || '');
      })
      .catch(() => setAgendas([]));
  }, [profissionalId]);

  useEffect(() => {
    if (!agendaId || !data) {
      setHorarios([]);
      setConsultasDia([]);
      return;
    }
    carregarDia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaId, data]);

  const carregarDia = async () => {
    setErroHorarios('');
    try {
      const [slots, consultas] = await Promise.all([
        api(`/api/saude/agendamento/agendas/${agendaId}/horarios?data=${data}`),
        api(`/api/saude/agendamento/agendas/${agendaId}/consultas?data=${data}`),
      ]);
      setHorarios(Array.isArray(slots) ? slots : []);
      setConsultasDia(Array.isArray(consultas) ? consultas : []);
    } catch (error: any) {
      setHorarios([]);
      setConsultasDia([]);
      setErroHorarios(String(error?.message || error));
    }
  };

  const agendaAtual = useMemo(
    () => agendas.find((a) => a.id === agendaId),
    [agendas, agendaId]
  );

  const marcarConsulta = async () => {
    if (!cidadao?.id || !slotSelecionado) {
      toast({ title: 'Selecione o cidadão', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/saude/agendamento/consultas', {
        method: 'POST',
        body: JSON.stringify({
          agendaId,
          citizenId: cidadao.id,
          dataHora: `${data}T${slotSelecionado}:00`,
          motivoConsulta: motivo || undefined,
        }),
      });
      toast({ title: 'Consulta agendada!' });
      setSlotSelecionado(null);
      setCidadao(null);
      setMotivo('');
      await carregarDia();
    } catch (error: any) {
      toast({
        title: 'Erro ao agendar',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const acaoConsulta = async (id: string, acao: string) => {
    try {
      await api(`/api/saude/agendamento/consultas/${id}/${acao}`, { method: 'PUT' });
      toast({ title: 'Consulta atualizada' });
      await carregarDia();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    }
  };

  const criarAgenda = async () => {
    if (!profissionalId || !novaAgenda.unidadeId) {
      toast({ title: 'Selecione o profissional e a unidade', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/saude/agendamento/agendas', {
        method: 'POST',
        body: JSON.stringify({
          profissionalId,
          unidadeId: novaAgenda.unidadeId,
          diaSemana: Number(novaAgenda.diaSemana),
          horaInicio: novaAgenda.horaInicio,
          horaFim: novaAgenda.horaFim,
          tempoPorConsulta: Number(novaAgenda.tempoPorConsulta),
          vagasDisponiveis: Number(novaAgenda.vagasDisponiveis),
        }),
      });
      toast({ title: 'Agenda criada' });
      setNovaAgendaAberta(false);
      const lista = await api(`/api/saude/agendamento/agendas?profissionalId=${profissionalId}`);
      setAgendas(Array.isArray(lista) ? lista : []);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar agenda',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamento de Consultas</h1>
          <p className="text-gray-500 mt-1">
            Marque, confirme e acompanhe as consultas por profissional
          </p>
        </div>
        <Button variant="outline" onClick={() => setNovaAgendaAberta(true)} disabled={!profissionalId}>
          <Plus className="h-4 w-4 mr-2" />
          Nova grade de agenda
        </Button>
      </div>

      {/* Seleção */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Profissional</Label>
              <Select value={profissionalId} onValueChange={setProfissionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.categoria ? `(${p.categoria})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade de agenda</Label>
              <Select value={agendaId} onValueChange={setAgendaId} disabled={agendas.length === 0}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      profissionalId
                        ? agendas.length === 0
                          ? 'Nenhuma agenda cadastrada'
                          : 'Selecione a agenda'
                        : 'Escolha o profissional primeiro'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {agendas.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {DIAS_SEMANA[a.diaSemana]} {a.horaInicio}–{a.horaFim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ag-data">Data</Label>
              <Input
                id="ag-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>
          {agendaAtual && (
            <p className="text-xs text-gray-500 mt-3">
              Consultas de {agendaAtual.tempoPorConsulta} min, {DIAS_SEMANA[agendaAtual.diaSemana]}{' '}
              das {agendaAtual.horaInicio} às {agendaAtual.horaFim}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Horários do dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {erroHorarios ? (
            <div className="text-center py-6 text-orange-600 text-sm">{erroHorarios}</div>
          ) : horarios.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Selecione profissional, agenda e uma data no dia da semana correspondente
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {horarios.map((slot) => (
                <Button
                  key={slot.hora}
                  variant={slot.disponivel ? 'outline' : 'secondary'}
                  disabled={!slot.disponivel}
                  className={slot.disponivel ? 'border-green-400' : 'opacity-50'}
                  onClick={() => setSlotSelecionado(slot.hora)}
                >
                  {slot.hora}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultas do dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Consultas do dia
            <Badge variant="secondary">{consultasDia.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consultasDia.length === 0 ? (
            <div className="text-center py-6 text-gray-500">Nenhuma consulta neste dia</div>
          ) : (
            <div className="space-y-3">
              {consultasDia.map((c: any) => {
                const badge = STATUS_CONSULTA[c.status] || { label: c.status };
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {new Date(c.dataHora).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        — {c.citizen?.name || `Cidadão ${String(c.citizenId).slice(0, 8)}`}
                      </div>
                      {c.motivoConsulta && (
                        <div className="text-sm text-gray-500 mt-1">{c.motivoConsulta}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                      {c.status === 'AGENDADA' && (
                        <Button size="sm" variant="outline" onClick={() => acaoConsulta(c.id, 'confirmar')}>
                          <Check className="h-4 w-4 mr-1" /> Confirmar
                        </Button>
                      )}
                      {(c.status === 'AGENDADA' || c.status === 'CONFIRMADA') && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => acaoConsulta(c.id, 'realizada')}
                          >
                            <Check className="h-4 w-4 mr-1" /> Realizada
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => acaoConsulta(c.id, 'falta')}>
                            <UserX className="h-4 w-4 mr-1" /> Falta
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => acaoConsulta(c.id, 'cancelar')}>
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

      {/* Dialog marcar consulta */}
      <Dialog open={!!slotSelecionado} onOpenChange={(open) => !open && setSlotSelecionado(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Agendar para {data && new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')} às{' '}
              {slotSelecionado}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector onSelect={setCidadao} selectedCidadao={cidadao} />
            <div>
              <Label htmlFor="ag-motivo">Motivo da consulta</Label>
              <Input
                id="ag-motivo"
                placeholder="Ex.: consulta de rotina, retorno"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotSelecionado(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={marcarConsulta} disabled={salvando || !cidadao}>
              {salvando ? 'Agendando...' : 'Agendar consulta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova agenda */}
      <Dialog open={novaAgendaAberta} onOpenChange={setNovaAgendaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova grade de agenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Unidade</Label>
              <Select
                value={novaAgenda.unidadeId}
                onValueChange={(v) => setNovaAgenda({ ...novaAgenda, unidadeId: v })}
              >
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
            <div>
              <Label>Dia da semana</Label>
              <Select
                value={novaAgenda.diaSemana}
                onValueChange={(v) => setNovaAgenda({ ...novaAgenda, diaSemana: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={novaAgenda.horaInicio}
                  onChange={(e) => setNovaAgenda({ ...novaAgenda, horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={novaAgenda.horaFim}
                  onChange={(e) => setNovaAgenda({ ...novaAgenda, horaFim: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minutos por consulta</Label>
                <Input
                  type="number"
                  min={5}
                  value={novaAgenda.tempoPorConsulta}
                  onChange={(e) =>
                    setNovaAgenda({ ...novaAgenda, tempoPorConsulta: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Vagas por dia</Label>
                <Input
                  type="number"
                  min={1}
                  value={novaAgenda.vagasDisponiveis}
                  onChange={(e) =>
                    setNovaAgenda({ ...novaAgenda, vagasDisponiveis: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAgendaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarAgenda} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar agenda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
