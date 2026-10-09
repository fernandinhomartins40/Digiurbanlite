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
import { Numeros, SecretariaSelect, fmtDataHora, hojeBrasilia, nomeSecretaria, paraCampoDataHora } from '@/components/apps/apps-gerais/shared';
import { CalendarClock, Check, Plus, UserX, X } from 'lucide-react';

const BASE = '/api/apps/agenda-atendimentos';
const STATUS = {
  AGUARDANDO: { label: 'Aguardando horário', className: 'bg-yellow-600' },
  AGENDADO: { label: 'Marcado', className: 'bg-indigo-600' },
  REALIZADO: { label: 'Atendido', className: 'bg-green-600' },
  FALTOU: { label: 'Não compareceu', className: 'bg-orange-600' },
  CANCELADO: { label: 'Cancelado', variant: 'secondary' },
};
const MODALIDADE: Record<string, string> = { PRESENCIAL: 'Presencial', DOMICILIAR: 'Na casa da pessoa', ONLINE: 'Online', TELEFONE: 'Por telefone' };
const SEM_PROFISSIONAL = '__nenhum__';

export default function AgendaAtendimentosPage() {
  const { toast } = useToast();
  const [itens, setItens] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [secretarias, setSecretarias] = useState<string[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [filtroSecretaria, setFiltroSecretaria] = useState('TODAS');
  const [dia, setDia] = useState(hojeBrasilia());
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [marcar, setMarcar] = useState<any>(null);
  const [form, setForm] = useState({ dataHora: '', duracaoMin: '30', local: '', profissionalId: SEM_PROFISSIONAL, observacoes: '' });
  const [resultado, setResultado] = useState<{ item: any; tipo: 'REALIZADO' | 'FALTOU' } | null>(null);
  const [cancelar, setCancelar] = useState<any>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState({ solicitanteNome: '', telefone: '', servico: '', assunto: '', modalidade: 'PRESENCIAL', departmentCode: '' });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [lista, numeros] = await Promise.all([api(`${BASE}/atendimentos?abertos=true`), api(`${BASE}/stats`).catch(() => null)]);
      setItens(Array.isArray(lista) ? lista : []);
      setStats(numeros);
    } catch {
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    api(`${BASE}/secretarias`).then((s) => setSecretarias(Array.isArray(s) ? s : [])).catch(() => setSecretarias([]));
    api(`${BASE}/profissionais`).then((p) => setProfissionais(Array.isArray(p) ? p : [])).catch(() => setProfissionais([]));
  }, [carregar]);

  const daSecretaria = useMemo(() => (filtroSecretaria === 'TODAS' ? itens : itens.filter((i) => i.departmentCode === filtroSecretaria)), [itens, filtroSecretaria]);
  const aguardando = daSecretaria.filter((i) => i.status === 'AGUARDANDO');
  const doDia = daSecretaria
    .filter((i) => i.status === 'AGENDADO' && i.dataHora && paraCampoDataHora(i.dataHora).slice(0, 10) === dia)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
  const marcados = daSecretaria.filter((i) => i.status === 'AGENDADO');

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

  const abrirMarcar = (item: any) => {
    setForm({
      dataHora: paraCampoDataHora(item.dataHora),
      duracaoMin: String(item.duracaoMin || 30),
      local: item.local || '',
      profissionalId: item.profissionalId || SEM_PROFISSIONAL,
      observacoes: item.observacoes || '',
    });
    setMarcar(item);
  };

  const cartao = (i: any) => (
    <PedidoCard
      key={i.id}
      titulo={
        <>
          {i.status === 'AGENDADO' && i.dataHora ? `${fmtDataHora(i.dataHora)} — ` : ''}
          {i.solicitanteNome || 'Cidadão'}
          <Badge variant="outline" className="ml-2 font-normal">
            {MODALIDADE[i.modalidade] || i.modalidade}
          </Badge>
        </>
      }
      subtitulo={[i.servico, secretarias.length > 1 && nomeSecretaria(i.departmentCode)].filter(Boolean).join(' · ')}
      detalhes={[
        i.assunto,
        i.telefone && `Telefone: ${i.telefone}`,
        i.status === 'AGUARDANDO' && i.preferencia && `Prefere: ${i.preferencia}`,
        i.endereco && `Endereço: ${i.endereco}`,
        i.local && i.status === 'AGENDADO' && `Local: ${i.local}`,
        i.profissionalNome && `Com: ${i.profissionalNome}`,
      ]}
      protocolNumber={i.protocolNumber}
      criadoEm={i.createdAt}
      status={<StatusBadge status={i.status} map={STATUS} />}
      acoes={
        <>
          <Button size="sm" variant={i.status === 'AGUARDANDO' ? 'default' : 'outline'} onClick={() => abrirMarcar(i)}>
            <CalendarClock className="h-4 w-4 mr-1" /> {i.status === 'AGUARDANDO' ? 'Marcar horário' : 'Remarcar'}
          </Button>
          {i.status === 'AGENDADO' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setResultado({ item: i, tipo: 'REALIZADO' })}>
                <Check className="h-4 w-4 mr-1" /> Atendido
              </Button>
              <Button size="sm" variant="outline" onClick={() => setResultado({ item: i, tipo: 'FALTOU' })}>
                <UserX className="h-4 w-4 mr-1" /> Não veio
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => setCancelar(i)}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </>
      }
    />
  );

  const lista = (itensLista: any[], vazio: string) =>
    loading ? (
      <div className="text-center py-8 text-gray-500">Carregando...</div>
    ) : itensLista.length === 0 ? (
      <div className="text-center py-8 text-gray-500">{vazio}</div>
    ) : (
      <div className="space-y-3">{itensLista.map(cartao)}</div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-indigo-600" />
            Agenda de Atendimentos
          </h1>
          <p className="text-gray-500 mt-1">Pedidos de atendimento, orientação e visita: marque o dia, a hora e o local. O cidadão recebe no pedido.</p>
        </div>
        <div className="flex gap-2">
          {secretarias.length > 1 && (
            <Select value={filtroSecretaria} onValueChange={setFiltroSecretaria}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as secretarias</SelectItem>
                {secretarias.map((code) => (
                  <SelectItem key={code} value={code}>
                    {nomeSecretaria(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => {
              setNovo({ solicitanteNome: '', telefone: '', servico: '', assunto: '', modalidade: 'PRESENCIAL', departmentCode: secretarias[0] || '' });
              setNovoAberto(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Atendimento no balcão
          </Button>
        </div>
      </div>

      <Numeros
        itens={[
          ['Aguardando horário', stats?.aguardando],
          ['Marcados para hoje', stats?.hoje],
          ['Atendidos no mês', stats?.realizadosNoMes],
          ['Faltas no mês', stats?.faltasNoMes],
        ]}
      />

      <Tabs defaultValue="aguardando">
        <TabsList>
          <TabsTrigger value="aguardando">Aguardando horário ({aguardando.length})</TabsTrigger>
          <TabsTrigger value="dia">Agenda do dia</TabsTrigger>
          <TabsTrigger value="marcados">Todos os marcados ({marcados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="aguardando">
          <Card>
            <CardHeader>
              <CardTitle>Por ordem de chegada</CardTitle>
            </CardHeader>
            <CardContent>{lista(aguardando, 'Ninguém esperando horário')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dia">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Atendimentos do dia</CardTitle>
              <Input type="date" className="w-44" value={dia} onChange={(e) => setDia(e.target.value || hojeBrasilia())} />
            </CardHeader>
            <CardContent>{lista(doDia, 'Nenhum atendimento marcado neste dia')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marcados">
          <Card>
            <CardHeader>
              <CardTitle>Próximos atendimentos</CardTitle>
            </CardHeader>
            <CardContent>{lista(marcados, 'Nenhum atendimento marcado')}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Marcar / remarcar */}
      <Dialog open={!!marcar} onOpenChange={(open) => !open && setMarcar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {marcar?.status === 'AGENDADO' ? 'Remarcar' : 'Marcar horário'} — {marcar?.solicitanteNome}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-sm text-gray-600">
              {marcar?.servico}
              {marcar?.preferencia && <div>A pessoa prefere: {marcar.preferencia}</div>}
            </div>
            <div>
              <Label>Dia e hora</Label>
              <Input type="datetime-local" value={form.dataHora} onChange={(e) => setForm({ ...form, dataHora: e.target.value })} />
            </div>
            <div>
              <Label>Duração (minutos)</Label>
              <Input type="number" min={5} value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: e.target.value })} />
            </div>
            {marcar?.modalidade !== 'DOMICILIAR' && (
              <div className="col-span-2">
                <Label>{marcar?.modalidade === 'ONLINE' ? 'Link da chamada' : marcar?.modalidade === 'TELEFONE' ? 'Observação sobre a ligação' : 'Local'}</Label>
                <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder={marcar?.modalidade === 'PRESENCIAL' ? 'Ex.: Sala do Empreendedor, térreo da Prefeitura' : ''} />
              </div>
            )}
            <div className="col-span-2">
              <Label>Quem vai atender (opcional)</Label>
              <Select value={form.profissionalId} onValueChange={(v) => setForm({ ...form, profissionalId: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_PROFISSIONAL}>Não definir agora</SelectItem>
                  {profissionais.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Recado para o cidadão (opcional)</Label>
              <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Ex.: traga RG e comprovante de endereço" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcar(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !form.dataHora}
              onClick={async () => {
                const ok = await executar(
                  () =>
                    post(`/atendimentos/${marcar.id}/agendar`, {
                      dataHora: form.dataHora,
                      duracaoMin: Number(form.duracaoMin) || 30,
                      local: form.local,
                      profissionalId: form.profissionalId === SEM_PROFISSIONAL ? null : form.profissionalId,
                      observacoes: form.observacoes,
                    }),
                  'Horário marcado. O cidadão foi avisado.'
                );
                if (ok) setMarcar(null);
              }}
            >
              Confirmar horário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atendimento no balcão */}
      <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Atendimento no balcão</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <SecretariaSelect secretarias={secretarias} value={novo.departmentCode} onChange={(v) => setNovo({ ...novo, departmentCode: v })} />
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={novo.solicitanteNome} onChange={(e) => setNovo({ ...novo, solicitanteNome: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} />
            </div>
            <div>
              <Label>Atendimento</Label>
              <Input value={novo.servico} onChange={(e) => setNovo({ ...novo, servico: e.target.value })} placeholder="Ex.: Orientação MEI" />
            </div>
            <div>
              <Label>Como</Label>
              <Select value={novo.modalidade} onValueChange={(v) => setNovo({ ...novo, modalidade: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODALIDADE).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>
                      {rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Assunto</Label>
              <Textarea rows={2} value={novo.assunto} onChange={(e) => setNovo({ ...novo, assunto: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoAberto(false)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !novo.solicitanteNome.trim()}
              onClick={async () => {
                if (await executar(() => post('/atendimentos', novo), 'Registrado. Agora marque o horário.')) setNovoAberto(false);
              }}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!resultado}
        titulo={resultado?.tipo === 'FALTOU' ? `Não compareceu — ${resultado?.item?.solicitanteNome || ''}` : `Atendido — ${resultado?.item?.solicitanteNome || ''}`}
        rotulo="Resposta para o cidadão (opcional — se ficar em branco, vai um texto padrão)"
        exemplo={resultado?.tipo === 'FALTOU' ? 'Ex.: você não veio no horário; se ainda precisar, peça de novo' : 'Ex.: orientação feita; o próximo passo é...'}
        obrigatorio={false}
        confirmar={resultado?.tipo === 'FALTOU' ? 'Registrar falta' : 'Registrar atendimento'}
        destrutivo={resultado?.tipo === 'FALTOU'}
        onClose={() => setResultado(null)}
        onConfirm={async (mensagem) => {
          if (resultado && (await executar(() => post(`/atendimentos/${resultado.item.id}/resultado`, { resultado: resultado.tipo, mensagem }), 'Registrado. O pedido foi encerrado.'))) setResultado(null);
        }}
      />

      <MotivoDialog
        aberto={!!cancelar}
        titulo={`Cancelar — ${cancelar?.solicitanteNome || ''}`}
        rotulo="Motivo (o cidadão vai ler no pedido)"
        exemplo="Ex.: o serviço pedido é feito pela Receita Federal; procure..."
        confirmar="Cancelar atendimento"
        onClose={() => setCancelar(null)}
        onConfirm={async (motivo) => {
          if (await executar(() => post(`/atendimentos/${cancelar.id}/cancelar`, { motivo }), 'Cancelado. O cidadão foi avisado.')) setCancelar(null);
        }}
      />
    </div>
  );
}
