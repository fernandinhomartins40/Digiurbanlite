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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { StatusBadge, fmtData, portalApi as api } from '@/components/apps/portal-requests/shared';
import { Briefcase, Plus, Send, Users } from 'lucide-react';

const BASE = '/api/apps/desenvolvimento-economico';
const STATUS_VAGA = {
  ABERTA: { label: 'Aberta', className: 'bg-green-600' },
  PREENCHIDA: { label: 'Preenchida', className: 'bg-blue-600' },
  ENCERRADA: { label: 'Encerrada', variant: 'secondary' },
};
const STATUS_CURRICULO = {
  ATIVO: { label: 'Procurando emprego', className: 'bg-green-600' },
  EMPREGADO: { label: 'Empregado', className: 'bg-blue-600' },
  INATIVO: { label: 'Inativo', variant: 'secondary' },
};
const STATUS_ENC = {
  ENCAMINHADO: { label: 'Encaminhado', className: 'bg-yellow-600' },
  CONTRATADO: { label: 'Contratado', className: 'bg-green-600' },
  NAO_SELECIONADO: { label: 'Não selecionado', variant: 'secondary' },
  NAO_COMPARECEU: { label: 'Não compareceu', variant: 'destructive' },
};
const VAGA = { empresa: '', titulo: '', area: '', descricao: '', escolaridadeMinima: '', salario: '', quantidade: '1', tipoContrato: '', local: '', contato: '', pcd: false };
const CURRICULO = { escolaridade: '', areaInteresse: '', experiencia: '', habilidades: '', telefone: '', pcd: false };

export default function BalcaoEmpregosPage() {
  const { toast } = useToast();
  const [vagas, setVagas] = useState<any[]>([]);
  const [curriculos, setCurriculos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [vagaAberta, setVagaAberta] = useState(false);
  const [vaga, setVaga] = useState(VAGA);
  const [curriculoAberto, setCurriculoAberto] = useState(false);
  const [pessoa, setPessoa] = useState<any>(null);
  const [curriculo, setCurriculo] = useState(CURRICULO);
  const [detalhe, setDetalhe] = useState<any>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [listaVagas, listaCurriculos, numeros] = await Promise.all([
        api(`${BASE}/vagas`),
        api(`${BASE}/curriculos${busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : ''}`),
        api(`${BASE}/stats`).catch(() => null),
      ]);
      setVagas(Array.isArray(listaVagas) ? listaVagas : []);
      setCurriculos(Array.isArray(listaCurriculos) ? listaCurriculos : []);
      setStats(numeros);
    } catch {
      setVagas([]);
    } finally {
      setLoading(false);
    }
    // a busca roda ao apertar Enter ou no botão (não a cada letra)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const buscarCurriculos = async () => {
    try {
      const lista = await api(`${BASE}/curriculos${busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : ''}`);
      setCurriculos(Array.isArray(lista) ? lista : []);
    } catch {
      setCurriculos([]);
    }
  };

  const abrirVaga = async (id: string) => {
    try {
      setDetalhe(await api(`${BASE}/vagas/${id}`));
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

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

  const escolaridades: string[] = stats?.escolaridades || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-blue-600" />
            Balcão de Empregos
          </h1>
          <p className="text-gray-500 mt-1">Vagas das empresas, currículos dos trabalhadores e encaminhamentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurriculoAberto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo currículo
          </Button>
          <Button onClick={() => setVagaAberta(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova vaga
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ['Vagas abertas', stats?.vagasAbertas],
          ['Procurando emprego', stats?.curriculosAtivos],
          ['Encaminhados', stats?.encaminhados],
          ['Contratados', stats?.contratados],
          ['Empregados pelo balcão', stats?.empregados],
        ].map(([rotulo, valor]) => (
          <Card key={rotulo as string}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{valor ?? '-'}</div>
              <div className="text-sm text-gray-500">{rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="vagas">
        <TabsList>
          <TabsTrigger value="vagas">Vagas ({vagas.length})</TabsTrigger>
          <TabsTrigger value="curriculos">Currículos ({curriculos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vagas">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : vagas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma vaga cadastrada. Cadastre a primeira em &quot;Nova vaga&quot;.</div>
              ) : (
                <div className="space-y-3">
                  {vagas.map((v) => (
                    <div key={v.id} className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-gray-50 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {v.titulo} <span className="text-sm text-gray-500 font-normal">— {v.empresa}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {[v.quantidade > 1 && `${v.quantidade} vagas`, v.salario, v.local, v.escolaridadeMinima && `Mínimo: ${v.escolaridadeMinima}`, v.pcd && 'Para pessoa com deficiência'].filter(Boolean).join(' · ') || 'Sem detalhes'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Aberta em {fmtData(v.createdAt)} · {v._count?.encaminhamentos || 0} encaminhado(s)
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={v.status} map={STATUS_VAGA} />
                        <Button size="sm" onClick={() => abrirVaga(v.id)}>
                          <Users className="h-4 w-4 mr-1" /> Candidatos
                        </Button>
                        {v.status === 'ABERTA' && (
                          <Button size="sm" variant="outline" disabled={salvando} onClick={() => executar(() => api(`${BASE}/vagas/${v.id}`, { method: 'PUT', body: JSON.stringify({ ...v, status: 'ENCERRADA' }) }), 'Vaga encerrada')}>
                            Encerrar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculos">
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <Input placeholder="Buscar por nome, área ou experiência" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && buscarCurriculos()} />
                <Button variant="outline" onClick={buscarCurriculos}>
                  Buscar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {curriculos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum currículo encontrado</div>
              ) : (
                <div className="space-y-3">
                  {curriculos.map((c) => (
                    <div key={c.id} className="flex flex-col gap-2 p-4 border rounded-lg md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {c.nome} {c.pcd && <Badge variant="outline">PcD</Badge>}
                        </div>
                        <div className="text-sm text-gray-500">{[c.areaInteresse && `Quer: ${c.areaInteresse}`, c.escolaridade, c.telefone].filter(Boolean).join(' · ') || 'Sem detalhes'}</div>
                        {c.experiencia && <div className="text-xs text-gray-500 mt-1">{c.experiencia}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} map={STATUS_CURRICULO} />
                        {c.status !== 'ATIVO' && (
                          <Button size="sm" variant="outline" disabled={salvando} onClick={() => executar(() => api(`${BASE}/curriculos/${c.id}`, { method: 'PUT', body: JSON.stringify({ ...c, status: 'ATIVO' }) }), 'Currículo reativado')}>
                            Voltar a procurar
                          </Button>
                        )}
                        {c.status === 'ATIVO' && (
                          <Button size="sm" variant="ghost" disabled={salvando} onClick={() => executar(() => api(`${BASE}/curriculos/${c.id}`, { method: 'PUT', body: JSON.stringify({ ...c, status: 'INATIVO' }) }), 'Currículo desativado')}>
                            Desativar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nova vaga */}
      <Dialog open={vagaAberta} onOpenChange={setVagaAberta}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova vaga</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ['empresa', 'Empresa', 'col-span-2'],
                ['titulo', 'Nome da vaga', ''],
                ['area', 'Área (ex.: cozinha, vendas)', ''],
                ['salario', 'Salário', ''],
                ['quantidade', 'Quantas vagas', ''],
                ['tipoContrato', 'Tipo de contrato', ''],
                ['local', 'Local de trabalho', ''],
                ['contato', 'Como o candidato procura a empresa', 'col-span-2'],
              ] as const
            ).map(([campo, rotulo, classe]) => (
              <div key={campo} className={classe}>
                <Label>{rotulo}</Label>
                <Input value={vaga[campo] as string} onChange={(e) => setVaga({ ...vaga, [campo]: e.target.value })} />
              </div>
            ))}
            <div className="col-span-2">
              <Label>Escolaridade mínima</Label>
              <Select value={vaga.escolaridadeMinima || 'QUALQUER'} onValueChange={(v) => setVaga({ ...vaga, escolaridadeMinima: v === 'QUALQUER' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUALQUER">Não exige</SelectItem>
                  {escolaridades.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>O que a pessoa vai fazer</Label>
              <Textarea rows={3} value={vaga.descricao} onChange={(e) => setVaga({ ...vaga, descricao: e.target.value })} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={vaga.pcd} onChange={(e) => setVaga({ ...vaga, pcd: e.target.checked })} />
              Vaga para pessoa com deficiência
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVagaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !vaga.empresa.trim() || !vaga.titulo.trim()}
              onClick={async () => {
                if (await executar(() => api(`${BASE}/vagas`, { method: 'POST', body: JSON.stringify({ ...vaga, quantidade: Number(vaga.quantidade) || 1 }) }), 'Vaga cadastrada')) {
                  setVagaAberta(false);
                  setVaga(VAGA);
                }
              }}
            >
              Cadastrar vaga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novo currículo (balcão) */}
      <Dialog open={curriculoAberto} onOpenChange={setCurriculoAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo currículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector label="Trabalhador" onSelect={setPessoa} selectedCidadao={pessoa} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Escolaridade</Label>
                <Select value={curriculo.escolaridade} onValueChange={(v) => setCurriculo({ ...curriculo, escolaridade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolaridades.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={curriculo.telefone} onChange={(e) => setCurriculo({ ...curriculo, telefone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Em que quer trabalhar</Label>
                <Input value={curriculo.areaInteresse} onChange={(e) => setCurriculo({ ...curriculo, areaInteresse: e.target.value })} placeholder="Ex.: cozinha, vendas, construção" />
              </div>
              <div className="col-span-2">
                <Label>Experiência</Label>
                <Textarea rows={2} value={curriculo.experiencia} onChange={(e) => setCurriculo({ ...curriculo, experiencia: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Cursos e habilidades</Label>
                <Input value={curriculo.habilidades} onChange={(e) => setCurriculo({ ...curriculo, habilidades: e.target.value })} placeholder="Ex.: informática, carteira de motorista D" />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={curriculo.pcd} onChange={(e) => setCurriculo({ ...curriculo, pcd: e.target.checked })} />
                Pessoa com deficiência
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurriculoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              disabled={salvando || !pessoa?.id}
              onClick={async () => {
                const ok = await executar(
                  () => api(`${BASE}/curriculos`, { method: 'POST', body: JSON.stringify({ ...curriculo, citizenId: pessoa.id, nome: pessoa.name || pessoa.nome, cpf: pessoa.cpf }) }),
                  'Currículo cadastrado'
                );
                if (ok) {
                  setCurriculoAberto(false);
                  setPessoa(null);
                  setCurriculo(CURRICULO);
                }
              }}
            >
              Cadastrar currículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidatos da vaga */}
      <Dialog open={!!detalhe} onOpenChange={(open) => !open && setDetalhe(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalhe?.titulo} — {detalhe?.empresa}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-sm mb-2">Já encaminhados ({detalhe?.encaminhamentos?.length || 0})</h3>
              {(detalhe?.encaminhamentos || []).length === 0 ? (
                <div className="text-sm text-gray-500">Ninguém foi encaminhado ainda.</div>
              ) : (
                <div className="space-y-2">
                  {detalhe.encaminhamentos.map((e: any) => (
                    <div key={e.id} className="flex flex-col gap-2 p-3 border rounded-lg text-sm md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="font-medium">{e.curriculo?.nome}</span>
                        <span className="text-gray-500"> · {e.curriculo?.telefone || 'sem telefone'}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={e.status} map={STATUS_ENC} />
                        {e.status === 'ENCAMINHADO' &&
                          (
                            [
                              ['CONTRATADO', 'Contratado'],
                              ['NAO_SELECIONADO', 'Não selecionado'],
                              ['NAO_COMPARECEU', 'Não foi'],
                            ] as const
                          ).map(([status, rotulo]) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={status === 'CONTRATADO' ? 'default' : 'outline'}
                              disabled={salvando}
                              onClick={async () => {
                                if (await executar(() => api(`${BASE}/encaminhamentos/${e.id}`, { method: 'PUT', body: JSON.stringify({ status }) }), 'Resultado registrado')) await abrirVaga(detalhe.id);
                              }}
                            >
                              {rotulo}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Candidatos sugeridos</h3>
              <p className="text-xs text-gray-500 mb-2">
                A sugestão compara a área que a pessoa quer, a experiência e a escolaridade com a vaga. Quem decide o encaminhamento é a equipe.
              </p>
              {(detalhe?.sugestoes || []).length === 0 ? (
                <div className="text-sm text-gray-500">Nenhum currículo parecido com esta vaga. Veja a aba Currículos.</div>
              ) : (
                <div className="space-y-2">
                  {detalhe.sugestoes.map((s: any) => (
                    <div key={s.curriculo.id} className="flex flex-col gap-2 p-3 border rounded-lg text-sm md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {s.curriculo.nome} <Badge variant="outline">{s.nota} pontos</Badge>
                        </div>
                        <div className="text-gray-500">{s.motivos.join(' · ')}</div>
                      </div>
                      {detalhe.status === 'ABERTA' && (
                        <Button
                          size="sm"
                          disabled={salvando}
                          onClick={async () => {
                            const ok = await executar(
                              () => api(`${BASE}/vagas/${detalhe.id}/encaminhar`, { method: 'POST', body: JSON.stringify({ curriculoId: s.curriculo.id }) }),
                              'Trabalhador encaminhado e avisado'
                            );
                            if (ok) await abrirVaga(detalhe.id);
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" /> Encaminhar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalhe(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
