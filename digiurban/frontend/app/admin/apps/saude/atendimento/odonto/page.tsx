'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import { portalApi as api } from '@/components/apps/portal-requests/shared';
import { Check, Plus, RefreshCw, Smile, Trash2 } from 'lucide-react';

/** Condições do dente: a cor aparece no desenho da arcada. */
const CONDICOES: Record<string, { label: string; className: string }> = {
  HIGIDO: { label: 'Sadio', className: 'bg-white border-gray-300 text-gray-700' },
  CARIADO: { label: 'Cárie', className: 'bg-red-500 border-red-600 text-white' },
  OBTURADO: { label: 'Restaurado', className: 'bg-blue-500 border-blue-600 text-white' },
  PERDIDO: { label: 'Perdido', className: 'bg-gray-700 border-gray-800 text-white' },
  EXTRACAO_INDICADA: { label: 'Extração indicada', className: 'bg-orange-500 border-orange-600 text-white' },
  SELANTE: { label: 'Selante', className: 'bg-green-500 border-green-600 text-white' },
  PROTESE: { label: 'Prótese', className: 'bg-purple-500 border-purple-600 text-white' },
  AUSENTE: { label: 'Não nasceu', className: 'bg-gray-200 border-gray-300 text-gray-400' },
};

// Numeração FDI (dentes permanentes), como o dentista vê o paciente
const SUPERIOR = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const INFERIOR = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

const FORM_VAZIO = { queixaPrincipal: '', exameBucal: '', diagnostico: '', planoTratamento: '', orientacoes: '', observacoes: '' };
const PROC_VAZIO = { descricao: '', dente: '', face: '', codigoSIGTAP: '' };

export default function OdontologiaPage() {
  const { toast } = useToast();
  const [fila, setFila] = useState<any[]>([]);
  const [carregandoFila, setCarregandoFila] = useState(true);
  const [paciente, setPaciente] = useState<any>(null);
  const [odontograma, setOdontograma] = useState<Record<string, { condicao: string }>>({});
  const [pincel, setPincel] = useState('CARIADO');
  const [form, setForm] = useState(FORM_VAZIO);
  const [procedimentos, setProcedimentos] = useState<any[]>([]);
  const [novoProc, setNovoProc] = useState(PROC_VAZIO);
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregarFila = useCallback(async () => {
    setCarregandoFila(true);
    try {
      const data = await api('/api/saude/odonto/fila');
      setFila(Array.isArray(data) ? data : []);
    } catch {
      setFila([]);
    } finally {
      setCarregandoFila(false);
    }
  }, []);

  useEffect(() => {
    carregarFila();
  }, [carregarFila]);

  const abrirPaciente = async (entrada: any) => {
    setPaciente(entrada);
    setNovoProc(PROC_VAZIO);
    try {
      const [atual, hist] = await Promise.all([
        api(`/api/saude/odonto/fila/${entrada.id}`),
        api(`/api/saude/odonto/cidadao/${entrada.citizenId}`),
      ]);
      const lista = Array.isArray(hist) ? hist : [];
      setHistorico(lista);
      if (atual) {
        setOdontograma(atual.odontograma || {});
        setProcedimentos(atual.procedimentos || []);
        setForm({
          queixaPrincipal: atual.queixaPrincipal || '',
          exameBucal: atual.exameBucal || '',
          diagnostico: atual.diagnostico || '',
          planoTratamento: atual.planoTratamento || '',
          orientacoes: atual.orientacoes || '',
          observacoes: atual.observacoes || '',
        });
      } else {
        // Primeiro registro deste atendimento: parte do último desenho da boca do paciente
        setOdontograma(lista[0]?.odontograma || {});
        setProcedimentos([]);
        setForm({ ...FORM_VAZIO, planoTratamento: lista[0]?.planoTratamento || '' });
      }
    } catch (error: any) {
      toast({ title: 'Erro ao abrir o paciente', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const pintar = (dente: string) => {
    setOdontograma((atual) => {
      const novo = { ...atual };
      if (pincel === 'HIGIDO') delete novo[dente];
      else novo[dente] = { condicao: pincel };
      return novo;
    });
  };

  const indice = useMemo(() => {
    const valores = Object.values(odontograma).map((d) => d.condicao);
    const cariados = valores.filter((c) => c === 'CARIADO').length;
    const perdidos = valores.filter((c) => c === 'PERDIDO' || c === 'EXTRACAO_INDICADA').length;
    const obturados = valores.filter((c) => c === 'OBTURADO').length;
    return { cariados, perdidos, obturados, cpod: cariados + perdidos + obturados };
  }, [odontograma]);

  const adicionarProcedimento = () => {
    if (!novoProc.descricao.trim()) {
      toast({ title: 'Escreva o procedimento feito', variant: 'destructive' });
      return;
    }
    setProcedimentos((lista) => [...lista, { ...novoProc, novo: true }]);
    setNovoProc(PROC_VAZIO);
  };

  const salvar = async (finalizar: boolean) => {
    if (!paciente) return;
    setSalvando(true);
    try {
      await api('/api/saude/odonto', {
        method: 'POST',
        body: JSON.stringify({
          filaAtendimentoId: paciente.id,
          odontograma,
          ...form,
          procedimentos: procedimentos.filter((p) => p.novo).map(({ novo: _novo, ...p }) => p),
          finalizar,
        }),
      });
      toast({ title: finalizar ? 'Atendimento finalizado' : 'Atendimento salvo' });
      if (finalizar) {
        setPaciente(null);
        await carregarFila();
      } else {
        await abrirPaciente(paciente);
      }
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const Dente = ({ numero }: { numero: string }) => {
    const condicao = odontograma[numero]?.condicao || 'HIGIDO';
    return (
      <button
        type="button"
        title={`Dente ${numero}: ${CONDICOES[condicao]?.label || condicao}`}
        onClick={() => pintar(numero)}
        className={`h-10 w-8 sm:w-9 rounded-md border text-xs font-medium transition ${CONDICOES[condicao]?.className || ''}`}
      >
        {numero}
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <HealthAppHeader
        title="Odontologia"
        description="Atendimento do dentista: desenho da boca, procedimentos e plano de tratamento."
        icon={Smile}
        backHref="/admin/apps/saude/atendimento"
        actions={
          <Button variant="outline" onClick={carregarFila}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar fila
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              Meus pacientes <Badge variant="secondary">{fila.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {carregandoFila ? (
              <div className="text-sm text-gray-500">Carregando...</div>
            ) : fila.length === 0 ? (
              <div className="text-sm text-gray-500">
                Ninguém na sua fila. A recepção coloca o paciente em &quot;Adicionar à lista&quot; escolhendo você como
                profissional.
              </div>
            ) : (
              fila.map((entrada) => (
                <button
                  key={entrada.id}
                  type="button"
                  onClick={() => abrirPaciente(entrada)}
                  className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 ${paciente?.id === entrada.id ? 'border-blue-500 bg-blue-50' : ''}`}
                >
                  <div className="font-medium text-sm">{entrada.citizen?.name || 'Paciente'}</div>
                  <div className="text-xs text-gray-500">
                    Chegou às {new Date(entrada.dataHoraChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {entrada.unidade?.nome ? ` · ${entrada.unidade.nome}` : ''}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {!paciente ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">Escolha um paciente da fila para começar.</CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {paciente.citizen?.name}
                    <Badge variant="outline">CPO-D {indice.cpod}</Badge>
                    <span className="text-xs font-normal text-gray-500">
                      {indice.cariados} com cárie · {indice.perdidos} perdidos · {indice.obturados} restaurados
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>1. Escolha a situação e toque nos dentes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(CONDICOES).map(([valor, cfg]) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => setPincel(valor)}
                          className={`px-3 py-1 rounded-full border text-xs ${cfg.className} ${pincel === valor ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="inline-flex flex-col gap-2 min-w-max">
                      <div className="flex gap-1">
                        {SUPERIOR.map((n) => (
                          <Dente key={n} numero={n} />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {INFERIOR.map((n) => (
                          <Dente key={n} numero={n} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Em cima: arcada superior. Embaixo: arcada inferior. Lado direito do paciente à esquerda.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Atendimento de hoje</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      ['queixaPrincipal', 'O que o paciente relata'],
                      ['exameBucal', 'Exame da boca'],
                      ['diagnostico', 'Diagnóstico'],
                      ['planoTratamento', 'Plano de tratamento (próximas consultas)'],
                      ['orientacoes', 'Orientações dadas ao paciente'],
                      ['observacoes', 'Observações'],
                    ] as const
                  ).map(([campo, rotulo]) => (
                    <div key={campo}>
                      <Label>{rotulo}</Label>
                      <Textarea rows={2} value={form[campo]} onChange={(e) => setForm({ ...form, [campo]: e.target.value })} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Procedimentos feitos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {procedimentos.length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhum procedimento registrado.</div>
                  ) : (
                    procedimentos.map((p, index) => (
                      <div key={p.id || `novo-${index}`} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div>
                          <span className="font-medium">{p.descricao}</span>
                          <span className="text-gray-500">
                            {p.dente ? ` · dente ${p.dente}` : ''}
                            {p.face ? ` · face ${p.face}` : ''}
                            {p.codigoSIGTAP && p.codigoSIGTAP !== 'NAO_INFORMADO' ? ` · SIGTAP ${p.codigoSIGTAP}` : ''}
                          </span>
                        </div>
                        {p.novo ? (
                          <Button size="sm" variant="ghost" onClick={() => setProcedimentos((lista) => lista.filter((_, i) => i !== index))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Badge variant="secondary">Gravado</Badge>
                        )}
                      </div>
                    ))
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                    <div className="col-span-2">
                      <Label>Procedimento</Label>
                      <Input value={novoProc.descricao} onChange={(e) => setNovoProc({ ...novoProc, descricao: e.target.value })} placeholder="Ex.: restauração com resina" />
                    </div>
                    <div>
                      <Label>Dente</Label>
                      <Input value={novoProc.dente} onChange={(e) => setNovoProc({ ...novoProc, dente: e.target.value })} placeholder="16" />
                    </div>
                    <div>
                      <Label>Código SIGTAP</Label>
                      <Input value={novoProc.codigoSIGTAP} onChange={(e) => setNovoProc({ ...novoProc, codigoSIGTAP: e.target.value })} placeholder="opcional" />
                    </div>
                    <Button variant="outline" onClick={adicionarProcedimento}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => salvar(false)} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar e continuar'}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => salvar(true)} disabled={salvando}>
                  <Check className="h-4 w-4 mr-2" /> Salvar e finalizar atendimento
                </Button>
              </div>

              {historico.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Atendimentos anteriores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {historico.map((h) => (
                      <div key={h.id} className="p-3 border rounded-lg text-sm">
                        <div className="font-medium">
                          {new Date(h.dataHora).toLocaleDateString('pt-BR')} — {h.dentista?.name || 'Dentista'}
                        </div>
                        <div className="text-gray-500">
                          {[h.diagnostico, h.procedimentos?.length ? `${h.procedimentos.length} procedimento(s): ${h.procedimentos.map((p: any) => p.descricao).join(', ')}` : null]
                            .filter(Boolean)
                            .join(' · ') || 'Sem anotações'}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
