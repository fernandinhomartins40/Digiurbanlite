'use client';

import { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { Bus, Route, Plus, UserPlus, UserMinus } from 'lucide-react';

const STATUS_VEICULO: Record<string, { label: string; className?: string; variant?: any }> = {
  DISPONIVEL: { label: 'Disponível', className: 'bg-green-600' },
  EM_USO: { label: 'Em uso', className: 'bg-blue-600' },
  MANUTENCAO: { label: 'Manutenção', className: 'bg-orange-600' },
  INATIVO: { label: 'Inativo', variant: 'secondary' },
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

export default function TransporteEscolarPage() {
  const { toast } = useToast();
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [rotas, setRotas] = useState<any[]>([]);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Novo veículo
  const [novoVeiculoAberto, setNovoVeiculoAberto] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState({
    placa: '',
    modelo: '',
    capacidade: '',
    acessibilidade: 'false',
  });

  // Nova rota
  const [novaRotaAberta, setNovaRotaAberta] = useState(false);
  const [novaRota, setNovaRota] = useState({
    nome: '',
    veiculoId: '',
    motoristaId: '',
    turno: 'MATUTINO',
    horarioSaida: '06:30',
    horarioRetorno: '12:30',
  });

  // Detalhe da rota (alunos)
  const [rotaDetalhe, setRotaDetalhe] = useState<any>(null);
  const [alunoNovo, setAlunoNovo] = useState<any>(null);
  const [pontoEmbarque, setPontoEmbarque] = useState('');

  useEffect(() => {
    loadData();
    // Motoristas = servidores; usa lista de usuários admin como aproximação
    api('/api/admin/users?limit=200')
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.users || data?.data || [];
        setMotoristas(lista);
      })
      .catch(() => setMotoristas([]));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, r] = await Promise.all([
        api('/api/apps/educacao/transporte/veiculos'),
        api('/api/apps/educacao/transporte/rotas'),
      ]);
      setVeiculos(Array.isArray(v) ? v : []);
      setRotas((Array.isArray(r) ? r : []).filter((rota: any) => rota?.isActive !== false));
    } catch (error) {
      console.error('Erro ao carregar transporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarVeiculo = async () => {
    if (!novoVeiculo.placa || !novoVeiculo.modelo || !novoVeiculo.capacidade) {
      toast({ title: 'Informe placa, modelo e capacidade', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/educacao/transporte/veiculos', {
        method: 'POST',
        body: JSON.stringify({
          placa: novoVeiculo.placa.toUpperCase(),
          modelo: novoVeiculo.modelo,
          capacidade: Number(novoVeiculo.capacidade),
          acessibilidade: novoVeiculo.acessibilidade === 'true',
        }),
      });
      toast({ title: 'Veículo cadastrado' });
      setNovoVeiculoAberto(false);
      setNovoVeiculo({ placa: '', modelo: '', capacidade: '', acessibilidade: 'false' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const criarRota = async () => {
    if (!novaRota.nome || !novaRota.veiculoId || !novaRota.motoristaId) {
      toast({ title: 'Informe nome, veículo e motorista', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/educacao/transporte/rotas', {
        method: 'POST',
        body: JSON.stringify({ ...novaRota, paradas: [] }),
      });
      toast({ title: 'Rota criada' });
      setNovaRotaAberta(false);
      setNovaRota({ ...novaRota, nome: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const abrirRota = async (rota: any) => {
    try {
      const detalhe = await api(`/api/apps/educacao/transporte/rotas/${rota.id}`);
      setRotaDetalhe(detalhe);
      setAlunoNovo(null);
      setPontoEmbarque('');
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const vincularAluno = async () => {
    if (!rotaDetalhe || !alunoNovo?.id) {
      toast({ title: 'Selecione o aluno', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api(`/api/apps/educacao/transporte/rotas/${rotaDetalhe.id}/alunos`, {
        method: 'POST',
        body: JSON.stringify({ alunoId: alunoNovo.id, pontoEmbarque }),
      });
      toast({ title: 'Aluno vinculado à rota' });
      await abrirRota(rotaDetalhe);
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const desvincularAluno = async (vinculoId: string) => {
    try {
      await api(`/api/apps/educacao/transporte/alunos/${vinculoId}`, { method: 'DELETE' });
      toast({ title: 'Aluno desvinculado' });
      if (rotaDetalhe) await abrirRota(rotaDetalhe);
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const nomeVeiculo = (id: string) => {
    const v = veiculos.find((x: any) => x.id === id);
    return v ? `${v.modelo} (${v.placa})` : '-';
  };

  const nomeMotorista = (id: string) => {
    const m = motoristas.find((x: any) => x.id === id);
    return m?.name || '-';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transporte Escolar</h1>
          <p className="text-gray-500 mt-1">Frota, rotas e alunos transportados</p>
        </div>
      </div>

      <Tabs defaultValue="rotas">
        <TabsList>
          <TabsTrigger value="rotas">Rotas ({rotas.length})</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos ({veiculos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rotas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovaRotaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova rota
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : rotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma rota cadastrada</div>
              ) : (
                <div className="space-y-3">
                  {rotas.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => abrirRota(r)}
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <Route className="h-4 w-4 text-indigo-600" />
                          {r.nome}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {r.turno} | Saída {r.horarioSaida} — Retorno {r.horarioRetorno}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Veículo: {nomeVeiculo(r.veiculoId)} | Motorista:{' '}
                          {nomeMotorista(r.motoristaId)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver alunos
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="veiculos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovoVeiculoAberto(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo veículo
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {veiculos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum veículo cadastrado</div>
              ) : (
                <div className="space-y-3">
                  {veiculos.map((v: any) => {
                    const badge = STATUS_VEICULO[v.status] || { label: v.status };
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <Bus className="h-4 w-4 text-indigo-600" />
                            {v.modelo} — {v.placa}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Capacidade: {v.capacidade} alunos
                            {v.acessibilidade && ' | ♿ Acessível'}
                            {typeof v.km === 'number' && ` | ${v.km.toLocaleString('pt-BR')} km`}
                          </div>
                        </div>
                        <Badge variant={badge.variant} className={badge.className}>
                          {badge.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog novo veículo */}
      <Dialog open={novoVeiculoAberto} onOpenChange={setNovoVeiculoAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo veículo escolar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placa *</Label>
                <Input
                  placeholder="ABC1D23"
                  value={novoVeiculo.placa}
                  onChange={(e) => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value })}
                />
              </div>
              <div>
                <Label>Capacidade *</Label>
                <Input
                  type="number"
                  min={1}
                  value={novoVeiculo.capacidade}
                  onChange={(e) =>
                    setNovoVeiculo({ ...novoVeiculo, capacidade: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Modelo *</Label>
              <Input
                placeholder="Ex.: Ônibus Mercedes-Benz OF-1721"
                value={novoVeiculo.modelo}
                onChange={(e) => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })}
              />
            </div>
            <div>
              <Label>Acessibilidade (PcD)</Label>
              <Select
                value={novoVeiculo.acessibilidade}
                onValueChange={(v) => setNovoVeiculo({ ...novoVeiculo, acessibilidade: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Não</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoVeiculoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarVeiculo} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova rota */}
      <Dialog open={novaRotaAberta} onOpenChange={setNovaRotaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova rota escolar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Ex.: Rota Zona Rural Norte"
                value={novaRota.nome}
                onChange={(e) => setNovaRota({ ...novaRota, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Veículo *</Label>
                <Select
                  value={novaRota.veiculoId}
                  onValueChange={(v) => setNovaRota({ ...novaRota, veiculoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos
                      .filter((v: any) => v.isActive !== false)
                      .map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.modelo} ({v.placa})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motorista *</Label>
                <Select
                  value={novaRota.motoristaId}
                  onValueChange={(v) => setNovaRota({ ...novaRota, motoristaId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {motoristas.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Turno</Label>
                <Select
                  value={novaRota.turno}
                  onValueChange={(v) => setNovaRota({ ...novaRota, turno: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATUTINO">Matutino</SelectItem>
                    <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                    <SelectItem value="INTEGRAL">Integral</SelectItem>
                    <SelectItem value="NOTURNO">Noturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Saída</Label>
                <Input
                  type="time"
                  value={novaRota.horarioSaida}
                  onChange={(e) => setNovaRota({ ...novaRota, horarioSaida: e.target.value })}
                />
              </div>
              <div>
                <Label>Retorno</Label>
                <Input
                  type="time"
                  value={novaRota.horarioRetorno}
                  onChange={(e) => setNovaRota({ ...novaRota, horarioRetorno: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaRotaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarRota} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar rota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detalhe da rota (alunos) */}
      <Dialog open={!!rotaDetalhe} onOpenChange={(open) => !open && setRotaDetalhe(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alunos da rota — {rotaDetalhe?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(rotaDetalhe?.alunos || []).length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum aluno vinculado</p>
            ) : (
              <div className="space-y-2">
                {rotaDetalhe.alunos.map((v: any) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{v.aluno?.name || 'Aluno'}</div>
                      <div className="text-xs text-gray-500">
                        Embarque: {v.pontoEmbarque || '-'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => desvincularAluno(v.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <div className="font-medium text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Vincular aluno
              </div>
              <CidadaoSelector label="Aluno" onSelect={setAlunoNovo} selectedCidadao={alunoNovo} required={false} />
              <div>
                <Label>Ponto de embarque</Label>
                <Input
                  placeholder="Ex.: Rua das Flores, em frente ao mercado"
                  value={pontoEmbarque}
                  onChange={(e) => setPontoEmbarque(e.target.value)}
                />
              </div>
              <Button onClick={vincularAluno} disabled={salvando || !alunoNovo}>
                {salvando ? 'Vinculando...' : 'Vincular aluno'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
