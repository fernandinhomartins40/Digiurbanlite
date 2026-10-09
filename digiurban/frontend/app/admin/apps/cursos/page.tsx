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
import { Numeros, SecretariaSelect, fmtDia, nomeSecretaria, paraCampoData } from '@/components/apps/apps-gerais/shared';
import { Ban, GraduationCap, Pencil, Play, Plus, UserMinus, UserPlus, Users } from 'lucide-react';

const BASE = '/api/apps/cursos';
const STATUS_INSCRICAO = {
  AGUARDANDO: { label: 'Aguardando turma', className: 'bg-yellow-600' },
  LISTA_ESPERA: { label: 'Lista de espera', className: 'bg-orange-600' },
  INSCRITO: { label: 'Na turma', className: 'bg-indigo-600' },
  CONCLUIU: { label: 'Concluiu', className: 'bg-green-600' },
  NAO_CONCLUIU: { label: 'Não concluiu', variant: 'secondary' },
  DESISTIU: { label: 'Desistiu', variant: 'secondary' },
  RECUSADA: { label: 'Recusada', variant: 'secondary' },
};
const STATUS_CURSO: Record<string, { label: string; className?: string; variant?: any }> = {
  INSCRICOES: { label: 'Inscrições abertas', className: 'bg-blue-600' },
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-indigo-600' },
  CONCLUIDO: { label: 'Concluído', className: 'bg-green-600' },
  CANCELADO: { label: 'Cancelado', variant: 'secondary' },
};
const CURSO_VAZIO = { id: '', nome: '', descricao: '', publicoAlvo: '', local: '', horario: '', instrutor: '', dataInicio: '', dataFim: '', vagas: '20', totalAulas: '0', frequenciaMinima: '75', departmentCode: '' };

function semAcento(texto: string) {
  return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function CursosPage() {
  const { toast } = useToast();
  const [cursos, setCursos] = useState<any[]>([]);
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [secretarias, setSecretarias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [cursoForm, setCursoForm] = useState<typeof CURSO_VAZIO | null>(null);
  const [turma, setTurma] = useState<{ inscricao: any; cursoId: string } | null>(null);
  const [encerrar, setEncerrar] = useState<{ inscricao: any; tipo: 'RECUSADA' | 'DESISTIU' } | null>(null);
  const [cancelarCurso, setCancelarCurso] = useState<any>(null);
  const [cursoAberto, setCursoAberto] = useState<any>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [listaCursos, listaInscricoes, numeros] = await Promise.all([api(`${BASE}/cursos`), api(`${BASE}/inscricoes`), api(`${BASE}/stats`).catch(() => null)]);
      setCursos(Array.isArray(listaCursos) ? listaCursos : []);
      setInscricoes(Array.isArray(listaInscricoes) ? listaInscricoes : []);
      setStats(numeros);
    } catch {
      setCursos([]);
      setInscricoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    api(`${BASE}/secretarias`).then((s) => setSecretarias(Array.isArray(s) ? s : [])).catch(() => setSecretarias([]));
  }, [carregar]);

  const esperando = useMemo(() => inscricoes.filter((i) => ['AGUARDANDO', 'LISTA_ESPERA'].includes(i.status) && !(i.status === 'LISTA_ESPERA' && i.cursoId)), [inscricoes]);
  const listaEspera = useMemo(() => inscricoes.filter((i) => i.status === 'LISTA_ESPERA' && i.cursoId), [inscricoes]);
  const daTurma = (cursoId: string) => inscricoes.filter((i) => i.cursoId === cursoId && ['INSCRITO', 'LISTA_ESPERA'].includes(i.status));

  /** Curso aberto da mesma secretaria com nome parecido ao que a pessoa pediu */
  const cursoSugerido = (inscricao: any) => {
    const pedido = semAcento(inscricao.interesse);
    const opcoes = cursos.filter((c) => c.departmentCode === inscricao.departmentCode && ['INSCRICOES', 'EM_ANDAMENTO'].includes(c.status));
    return opcoes.find((c) => pedido.includes(semAcento(c.nome)) || semAcento(c.nome).includes(pedido)) || opcoes[0];
  };

  const executar = async (acao: () => Promise<any>, mensagem: string | ((r: any) => string)) => {
    setSalvando(true);
    try {
      const resposta = await acao();
      toast({ title: typeof mensagem === 'function' ? mensagem(resposta) : mensagem });
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

  const cartaoInscricao = (i: any, naTurma = false) => (
    <PedidoCard
      key={i.id}
      titulo={i.nome}
      subtitulo={[`Pediu: ${i.interesse}`, i.curso && !naTurma && `Turma: ${i.curso.nome}`, secretarias.length > 1 && nomeSecretaria(i.departmentCode)].filter(Boolean).join(' · ')}
      detalhes={[i.telefone && `Telefone: ${i.telefone}`, i.escolaridade && `Escolaridade: ${i.escolaridade}`, i.observacoes]}
      protocolNumber={i.protocolNumber}
      criadoEm={i.createdAt}
      status={<StatusBadge status={i.status} map={STATUS_INSCRICAO} />}
      acoes={
        <>
          {i.status === 'INSCRITO' && naTurma && (i.curso?.totalAulas || 0) > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Input
                type="number"
                min={0}
                max={i.curso.totalAulas}
                defaultValue={i.presencas}
                className="h-9 w-20"
                onBlur={(e) => {
                  const valor = Number(e.target.value);
                  if (valor !== i.presencas) executar(() => enviar(`/inscricoes/${i.id}/frequencia`, { presencas: valor }, 'PUT'), 'Frequência salva');
                }}
              />
              <span className="text-gray-500">de {i.curso.totalAulas} aulas</span>
            </div>
          )}
          {['AGUARDANDO', 'LISTA_ESPERA'].includes(i.status) && !naTurma && (
            <Button size="sm" onClick={() => setTurma({ inscricao: i, cursoId: cursoSugerido(i)?.id || '' })}>
              <UserPlus className="h-4 w-4 mr-1" /> Pôr na turma
            </Button>
          )}
          {i.status === 'INSCRITO' ? (
            <Button size="sm" variant="ghost" onClick={() => setEncerrar({ inscricao: i, tipo: 'DESISTIU' })}>
              <UserMinus className="h-4 w-4 mr-1" /> Desistência
            </Button>
          ) : (
            ['AGUARDANDO', 'LISTA_ESPERA'].includes(i.status) && (
              <Button size="sm" variant="ghost" onClick={() => setEncerrar({ inscricao: i, tipo: 'RECUSADA' })}>
                <Ban className="h-4 w-4 mr-1" /> Recusar
              </Button>
            )
          )}
        </>
      }
    />
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Cursos e Capacitações
          </h1>
          <p className="text-gray-500 mt-1">Cadastre o curso, coloque os inscritos na turma, lance a frequência e conclua. Cada pessoa recebe o resultado no pedido.</p>
        </div>
        <Button onClick={() => setCursoForm({ ...CURSO_VAZIO, departmentCode: secretarias[0] || '' })}>
          <Plus className="h-4 w-4 mr-2" /> Novo curso
        </Button>
      </div>

      <Numeros
        itens={[
          ['Aguardando turma', stats?.aguardando],
          ['Em lista de espera', stats?.espera],
          ['Cursos abertos', stats?.cursosAbertos],
          ['Já concluíram', stats?.concluiram],
        ]}
      />

      <Tabs defaultValue="inscricoes">
        <TabsList>
          <TabsTrigger value="inscricoes">Inscrições aguardando ({esperando.length})</TabsTrigger>
          <TabsTrigger value="cursos">Cursos ({cursos.length})</TabsTrigger>
          <TabsTrigger value="espera">Lista de espera ({listaEspera.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inscricoes">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de inscrição</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : esperando.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma inscrição esperando turma</div>
              ) : (
                <div className="space-y-3">{esperando.map((i) => cartaoInscricao(i))}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cursos.length === 0 && !loading && (
              <Card className="border-dashed lg:col-span-2">
                <CardContent className="py-10 text-center text-gray-500">Nenhum curso aberto. Clique em "Novo curso" para cadastrar o primeiro.</CardContent>
              </Card>
            )}
            {cursos.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between gap-2">
                    <span>{c.nome}</span>
                    <StatusBadge status={c.status} map={STATUS_CURSO} />
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    {[secretarias.length > 1 && nomeSecretaria(c.departmentCode), c.horario, c.local, c.dataInicio && `Início ${fmtDia(c.dataInicio)}`].filter(Boolean).join(' · ')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" /> {c.inscritos} de {c.vagas} vagas
                    </Badge>
                    {c.espera > 0 && <Badge variant="outline">{c.espera} na espera</Badge>}
                    {c.totalAulas > 0 && <Badge variant="outline">{c.totalAulas} aulas · mínimo {c.frequenciaMinima}%</Badge>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setCursoAberto(c)}>
                      <Users className="h-4 w-4 mr-1" /> Turma
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setCursoForm({
                          id: c.id,
                          nome: c.nome,
                          descricao: c.descricao || '',
                          publicoAlvo: c.publicoAlvo || '',
                          local: c.local || '',
                          horario: c.horario || '',
                          instrutor: c.instrutor || '',
                          dataInicio: paraCampoData(c.dataInicio),
                          dataFim: paraCampoData(c.dataFim),
                          vagas: String(c.vagas),
                          totalAulas: String(c.totalAulas),
                          frequenciaMinima: String(c.frequenciaMinima),
                          departmentCode: c.departmentCode,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    {c.status === 'INSCRICOES' && (
                      <Button size="sm" variant="outline" onClick={() => executar(() => enviar(`/cursos/${c.id}/iniciar`), 'Curso em andamento')}>
                        <Play className="h-4 w-4 mr-1" /> Começou
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={salvando}
                      onClick={() => {
                        if (!window.confirm(`Concluir "${c.nome}"? Cada inscrito recebe o resultado (pela frequência) e o pedido é encerrado.`)) return;
                        executar(() => enviar(`/cursos/${c.id}/concluir`), (r) => `Curso concluído: ${r?.concluiram ?? 0} de ${r?.inscritos ?? 0} concluíram`);
                      }}
                    >
                      Concluir curso
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCancelarCurso(c)}>
                      Cancelar turma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="espera">
          <Card>
            <CardHeader>
              <CardTitle>Esperando vaga (por ordem de chegada)</CardTitle>
            </CardHeader>
            <CardContent>
              {listaEspera.length === 0 ? <div className="text-center py-8 text-gray-500">Ninguém na lista de espera</div> : <div className="space-y-3">{listaEspera.map((i) => cartaoInscricao(i))}</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Turma de um curso */}
      <Dialog open={!!cursoAberto} onOpenChange={(open) => !open && setCursoAberto(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Turma — {cursoAberto?.nome}</DialogTitle>
          </DialogHeader>
          {cursoAberto && (
            <div className="space-y-3">
              {(cursoAberto.totalAulas || 0) > 0 && <p className="text-sm text-gray-500">Digite quantas aulas cada pessoa frequentou (salva ao sair do campo).</p>}
              {daTurma(cursoAberto.id).length === 0 ? (
                <div className="text-center py-6 text-gray-500">Ninguém na turma ainda</div>
              ) : (
                daTurma(cursoAberto.id).map((i) => cartaoInscricao(i, true))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pôr na turma */}
      <Dialog open={!!turma} onOpenChange={(open) => !open && setTurma(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pôr na turma — {turma?.inscricao?.nome}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Pediu: {turma?.inscricao?.interesse}</p>
          <div>
            <Label>Curso</Label>
            <Select value={turma?.cursoId || ''} onValueChange={(v) => turma && setTurma({ ...turma, cursoId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos
                  .filter((c) => ['INSCRICOES', 'EM_ANDAMENTO'].includes(c.status) && (!turma || c.departmentCode === turma.inscricao.departmentCode))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.inscritos}/{c.vagas})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Sem vaga, a pessoa entra na lista de espera do curso e é chamada sozinha quando alguém desistir.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTurma(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !turma?.cursoId}
              onClick={async () => {
                if (turma && (await executar(() => enviar(`/inscricoes/${turma.inscricao.id}/turma`, { cursoId: turma.cursoId }), (r) => (r?.status === 'LISTA_ESPERA' ? 'Sem vaga: foi para a lista de espera' : 'Inscrito na turma. O cidadão foi avisado.'))))
                  setTurma(null);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Curso: novo / editar */}
      <Dialog open={!!cursoForm} onOpenChange={(open) => !open && setCursoForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{cursoForm?.id ? 'Editar curso' : 'Novo curso'}</DialogTitle>
          </DialogHeader>
          {cursoForm && (
            <div className="grid grid-cols-2 gap-4">
              {!cursoForm.id && (
                <div className="col-span-2">
                  <SecretariaSelect secretarias={secretarias} value={cursoForm.departmentCode} onChange={(v) => setCursoForm({ ...cursoForm, departmentCode: v })} />
                </div>
              )}
              <div className="col-span-2">
                <Label>Nome do curso</Label>
                <Input value={cursoForm.nome} onChange={(e) => setCursoForm({ ...cursoForm, nome: e.target.value })} placeholder="Ex.: Informática Básica" />
              </div>
              <div>
                <Label>Vagas</Label>
                <Input type="number" min={1} value={cursoForm.vagas} onChange={(e) => setCursoForm({ ...cursoForm, vagas: e.target.value })} />
              </div>
              <div>
                <Label>Instrutor(a)</Label>
                <Input value={cursoForm.instrutor} onChange={(e) => setCursoForm({ ...cursoForm, instrutor: e.target.value })} />
              </div>
              <div>
                <Label>Começa em</Label>
                <Input type="date" value={cursoForm.dataInicio} onChange={(e) => setCursoForm({ ...cursoForm, dataInicio: e.target.value })} />
              </div>
              <div>
                <Label>Termina em</Label>
                <Input type="date" value={cursoForm.dataFim} onChange={(e) => setCursoForm({ ...cursoForm, dataFim: e.target.value })} />
              </div>
              <div>
                <Label>Dias e horário</Label>
                <Input value={cursoForm.horario} onChange={(e) => setCursoForm({ ...cursoForm, horario: e.target.value })} placeholder="Ex.: terças e quintas, 19h às 21h" />
              </div>
              <div>
                <Label>Local</Label>
                <Input value={cursoForm.local} onChange={(e) => setCursoForm({ ...cursoForm, local: e.target.value })} />
              </div>
              <div>
                <Label>Número de aulas</Label>
                <Input type="number" min={0} value={cursoForm.totalAulas} onChange={(e) => setCursoForm({ ...cursoForm, totalAulas: e.target.value })} />
              </div>
              <div>
                <Label>Frequência mínima para concluir (%)</Label>
                <Input type="number" min={0} max={100} value={cursoForm.frequenciaMinima} onChange={(e) => setCursoForm({ ...cursoForm, frequenciaMinima: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Para quem é</Label>
                <Input value={cursoForm.publicoAlvo} onChange={(e) => setCursoForm({ ...cursoForm, publicoAlvo: e.target.value })} placeholder="Ex.: maiores de 16 anos" />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea rows={2} value={cursoForm.descricao} onChange={(e) => setCursoForm({ ...cursoForm, descricao: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCursoForm(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !cursoForm?.nome.trim()}
              onClick={async () => {
                if (!cursoForm) return;
                const { id, ...dados } = cursoForm;
                const ok = await executar(() => (id ? enviar(`/cursos/${id}`, dados, 'PUT') : enviar('/cursos', dados)), 'Curso salvo');
                if (ok) setCursoForm(null);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!encerrar}
        titulo={`${encerrar?.tipo === 'DESISTIU' ? 'Desistência' : 'Recusar inscrição'} — ${encerrar?.inscricao?.nome || ''}`}
        rotulo="Resposta para o cidadão (ele vai ler no pedido)"
        exemplo={encerrar?.tipo === 'DESISTIU' ? 'Ex.: desistência informada por telefone' : 'Ex.: o curso é só para maiores de 18 anos'}
        confirmar={encerrar?.tipo === 'DESISTIU' ? 'Registrar desistência' : 'Recusar'}
        onClose={() => setEncerrar(null)}
        onConfirm={async (mensagem) => {
          if (
            encerrar &&
            (await executar(
              () => enviar(`/inscricoes/${encerrar.inscricao.id}/encerrar`, { tipo: encerrar.tipo, mensagem }),
              (r) => (r?.chamadoDaEspera ? `Feito. ${r.chamadoDaEspera} saiu da lista de espera e entrou na turma.` : 'Feito. O cidadão foi avisado.')
            ))
          )
            setEncerrar(null);
        }}
      />

      <MotivoDialog
        aberto={!!cancelarCurso}
        titulo={`Cancelar turma — ${cancelarCurso?.nome || ''}`}
        rotulo="Motivo (os inscritos são avisados e continuam esperando a próxima turma)"
        exemplo="Ex.: o instrutor não poderá dar o curso neste semestre"
        confirmar="Cancelar turma"
        onClose={() => setCancelarCurso(null)}
        onConfirm={async (motivo) => {
          if (await executar(() => enviar(`/cursos/${cancelarCurso.id}/cancelar`, { motivo }), 'Turma cancelada. Os inscritos foram avisados.')) setCancelarCurso(null);
        }}
      />
    </div>
  );
}
