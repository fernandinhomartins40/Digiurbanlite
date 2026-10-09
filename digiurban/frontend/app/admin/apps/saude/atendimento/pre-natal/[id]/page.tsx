'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import { portalApi as api, fmtData } from '@/components/apps/portal-requests/shared';
import { Baby, ClipboardCheck, FlaskConical, Plus } from 'lucide-react';

const EXAMES: Record<string, string> = {
  HEMOGRAMA: 'Hemograma',
  GLICEMIA: 'Glicemia',
  TIPO_SANGUINEO: 'Tipo sanguíneo e fator Rh',
  VDRL: 'VDRL (sífilis)',
  HIV: 'HIV',
  TOXOPLASMOSE: 'Toxoplasmose',
  HEPATITE_B: 'Hepatite B',
  HEPATITE_C: 'Hepatite C',
  URINA_ROTINA: 'Urina (rotina)',
  UROCULTURA: 'Urocultura',
  ULTRASSOM: 'Ultrassom',
  OUTRO: 'Outro',
};
const DESFECHOS: Record<string, string> = { PARTO_NORMAL: 'Parto normal', CESAREA: 'Cesárea', ABORTO: 'Aborto', INTERRUPCAO: 'Interrupção' };
const CONSULTA = { peso: '', pressaoArterial: '', alturaUterina: '', bcf: '', edema: 'Ausente', apresentacaoFetal: '', queixas: '', conduta: '', orientacoes: '', proximaConsulta: '' };

export default function PreNatalDetalhePage() {
  const params = useParams();
  const id = String(params?.id || '');
  const { toast } = useToast();
  const [pn, setPn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [consultaAberta, setConsultaAberta] = useState(false);
  const [consulta, setConsulta] = useState(CONSULTA);
  const [exameTipo, setExameTipo] = useState('');
  const [resultado, setResultado] = useState<{ exame: any; texto: string } | null>(null);
  const [encerrar, setEncerrar] = useState<{ tipoDesfecho: string; dataDesfecho: string; observacoes: string } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setPn(await api(`/api/saude/pre-natal/${id}`));
    } catch (error: any) {
      toast({ title: 'Erro ao carregar', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) carregar();
  }, [id, carregar]);

  /** Chama a API e mostra o acompanhamento atualizado que ela devolve. */
  const enviar = async (caminho: string, init: RequestInit, mensagem: string) => {
    setSalvando(true);
    try {
      setPn(await api(caminho, init));
      toast({ title: mensagem });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const numero = (texto: string) => (texto ? Number(texto.replace(',', '.')) : undefined);

  if (loading && !pn) return <div className="p-6 text-gray-500">Carregando...</div>;
  if (!pn) return <div className="p-6 text-gray-500">Pré-natal não encontrado.</div>;
  const ativo = pn.status === 'EM_ANDAMENTO';

  return (
    <div className="p-6 space-y-6">
      <HealthAppHeader
        title={pn.citizen?.name || 'Gestante'}
        description={ativo ? `${pn.idadeGestacional} · ${pn.trimestre}º trimestre · parto previsto para ${fmtData(pn.dpp)}` : `${DESFECHOS[pn.tipoDesfecho] || 'Encerrado'} em ${fmtData(pn.dataDesfecho || pn.dataFim)}`}
        icon={Baby}
        backHref="/admin/apps/saude/atendimento/pre-natal"
        badge={pn.riscoGestacional === 'ALTO_RISCO' ? <Badge variant="destructive">Alto risco</Badge> : <Badge variant="secondary">Risco habitual</Badge>}
        actions={
          ativo && (
            <>
              <Button
                variant="outline"
                disabled={salvando}
                onClick={() =>
                  enviar(
                    `/api/saude/pre-natal/${id}/risco`,
                    { method: 'PUT', body: JSON.stringify({ riscoGestacional: pn.riscoGestacional === 'ALTO_RISCO' ? 'HABITUAL' : 'ALTO_RISCO' }) },
                    'Risco atualizado'
                  )
                }
              >
                {pn.riscoGestacional === 'ALTO_RISCO' ? 'Voltar a risco habitual' : 'Marcar alto risco'}
              </Button>
              <Button variant="outline" onClick={() => setEncerrar({ tipoDesfecho: '', dataDesfecho: new Date().toISOString().slice(0, 10), observacoes: '' })}>
                Encerrar pré-natal
              </Button>
              <Button onClick={() => setConsultaAberta(true)}>
                <Plus className="h-4 w-4 mr-2" /> Registrar consulta
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {[
          ['Última menstruação', fmtData(pn.dum)],
          ['Gestações / partos / abortos', `${pn.gravidez} / ${pn.partos} / ${pn.abortos}`],
          ['Tipo sanguíneo', [pn.grupoSanguineo, pn.fatorRh].filter(Boolean).join(' ') || 'Não informado'],
          ['Peso e IMC no início', pn.pesoInicial ? `${pn.pesoInicial} kg${pn.imcInicial ? ` · IMC ${pn.imcInicial}` : ''}` : 'Não informado'],
        ].map(([rotulo, valor]) => (
          <Card key={rotulo}>
            <CardContent className="pt-6">
              <div className="font-semibold">{valor}</div>
              <div className="text-gray-500">{rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="consultas">
        <TabsList>
          <TabsTrigger value="consultas">Consultas ({pn.consultas?.length || 0})</TabsTrigger>
          <TabsTrigger value="exames">Exames ({pn.exames?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="consultas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-5 w-5" /> Consultas do pré-natal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(pn.consultas || []).length === 0 ? (
                <div className="text-center py-6 text-gray-500">Nenhuma consulta registrada</div>
              ) : (
                pn.consultas.map((c: any) => (
                  <div key={c.id} className="p-4 border rounded-lg text-sm">
                    <div className="font-medium">
                      {fmtData(c.dataConsulta)} — {c.idadeGestacional}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {[
                        c.peso && `Peso ${c.peso} kg`,
                        c.pressaoArterial && `PA ${c.pressaoArterial}`,
                        c.alturaUterina && `Altura uterina ${c.alturaUterina} cm`,
                        c.bcf && `Batimentos do bebê ${c.bcf}`,
                        c.edema && `Inchaço: ${c.edema}`,
                        c.apresentacaoFetal && `Posição: ${c.apresentacaoFetal}`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sem medidas'}
                    </div>
                    {(c.queixas || c.conduta || c.orientacoes) && (
                      <div className="text-gray-500 mt-1">{[c.queixas && `Queixas: ${c.queixas}`, c.conduta && `Conduta: ${c.conduta}`, c.orientacoes && `Orientações: ${c.orientacoes}`].filter(Boolean).join(' · ')}</div>
                    )}
                    {c.proximaConsulta && <div className="text-xs text-gray-400 mt-1">Próxima consulta: {fmtData(c.proximaConsulta)}</div>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exames">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-5 w-5" /> Exames
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ativo && (
                <div className="flex gap-2">
                  <Select value={exameTipo} onValueChange={setExameTipo}>
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="Pedir exame..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXAMES).map(([valor, rotulo]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!exameTipo || salvando}
                    onClick={async () => {
                      if (await enviar(`/api/saude/pre-natal/${id}/exames`, { method: 'POST', body: JSON.stringify({ tipoExame: exameTipo }) }, 'Exame pedido')) setExameTipo('');
                    }}
                  >
                    Pedir
                  </Button>
                </div>
              )}
              {(pn.exames || []).length === 0 ? (
                <div className="text-center py-6 text-gray-500">Nenhum exame pedido</div>
              ) : (
                pn.exames.map((e: any) => (
                  <div key={e.id} className="flex flex-col gap-2 p-4 border rounded-lg text-sm md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{EXAMES[e.tipoExame] || e.tipoExame}</div>
                      <div className="text-gray-500">
                        Pedido em {fmtData(e.dataSolicitacao)}
                        {e.dataRealizacao ? ` · feito em ${fmtData(e.dataRealizacao)}` : ''}
                        {e.resultado ? ` · Resultado: ${e.resultado}` : ''}
                      </div>
                    </div>
                    {e.resultado ? (
                      <Badge className="bg-green-600">Com resultado</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setResultado({ exame: e, texto: '' })}>
                        Registrar resultado
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Consulta */}
      <Dialog open={consultaAberta} onOpenChange={setConsultaAberta}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consulta de pré-natal — {pn.idadeGestacional}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(
              [
                ['peso', 'Peso (kg)', '65,2'],
                ['pressaoArterial', 'Pressão', '120/80'],
                ['alturaUterina', 'Altura uterina (cm)', '24'],
                ['bcf', 'Batimentos do bebê', '140'],
              ] as const
            ).map(([campo, rotulo, exemplo]) => (
              <div key={campo}>
                <Label>{rotulo}</Label>
                <Input value={consulta[campo]} placeholder={exemplo} onChange={(e) => setConsulta({ ...consulta, [campo]: e.target.value })} />
              </div>
            ))}
            <div className="col-span-2">
              <Label>Inchaço</Label>
              <Select value={consulta.edema} onValueChange={(v) => setConsulta({ ...consulta, edema: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ausente">Sem inchaço</SelectItem>
                  <SelectItem value="Membros Inferiores">Nas pernas</SelectItem>
                  <SelectItem value="Generalizado">No corpo todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Próxima consulta</Label>
              <Input type="date" value={consulta.proximaConsulta} onChange={(e) => setConsulta({ ...consulta, proximaConsulta: e.target.value })} />
            </div>
            {(
              [
                ['queixas', 'Queixas da gestante'],
                ['conduta', 'Conduta'],
                ['orientacoes', 'Orientações'],
              ] as const
            ).map(([campo, rotulo]) => (
              <div key={campo} className="col-span-2 md:col-span-4">
                <Label>{rotulo}</Label>
                <Textarea rows={2} value={consulta[campo]} onChange={(e) => setConsulta({ ...consulta, [campo]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsultaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando}
              onClick={async () => {
                const ok = await enviar(
                  `/api/saude/pre-natal/${id}/consultas`,
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      ...consulta,
                      peso: numero(consulta.peso),
                      alturaUterina: numero(consulta.alturaUterina),
                      bcf: numero(consulta.bcf),
                      proximaConsulta: consulta.proximaConsulta || undefined,
                    }),
                  },
                  'Consulta registrada'
                );
                if (ok) {
                  setConsultaAberta(false);
                  setConsulta(CONSULTA);
                }
              }}
            >
              {salvando ? 'Salvando...' : 'Registrar consulta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resultado de exame */}
      <Dialog open={!!resultado} onOpenChange={(open) => !open && setResultado(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultado — {resultado ? EXAMES[resultado.exame.tipoExame] : ''}</DialogTitle>
          </DialogHeader>
          <Textarea rows={3} value={resultado?.texto || ''} placeholder="Ex.: não reagente" onChange={(e) => setResultado((r) => (r ? { ...r, texto: e.target.value } : r))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultado(null)}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !resultado?.texto.trim()}
              onClick={async () => {
                if (!resultado) return;
                if (await enviar(`/api/saude/pre-natal/exames/${resultado.exame.id}/resultado`, { method: 'PUT', body: JSON.stringify({ resultado: resultado.texto }) }, 'Resultado registrado')) setResultado(null);
              }}
            >
              Salvar resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encerrar */}
      <Dialog open={!!encerrar} onOpenChange={(open) => !open && setEncerrar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encerrar pré-natal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Como a gestação terminou</Label>
              <Select value={encerrar?.tipoDesfecho || ''} onValueChange={(v) => setEncerrar((e) => (e ? { ...e, tipoDesfecho: v } : e))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DESFECHOS).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>
                      {rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={encerrar?.dataDesfecho || ''} onChange={(e) => setEncerrar((d) => (d ? { ...d, dataDesfecho: e.target.value } : d))} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={encerrar?.observacoes || ''} onChange={(e) => setEncerrar((d) => (d ? { ...d, observacoes: e.target.value } : d))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncerrar(null)}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !encerrar?.tipoDesfecho}
              onClick={async () => {
                if (encerrar && (await enviar(`/api/saude/pre-natal/${id}/encerrar`, { method: 'POST', body: JSON.stringify(encerrar) }, 'Pré-natal encerrado'))) setEncerrar(null);
              }}
            >
              Encerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
