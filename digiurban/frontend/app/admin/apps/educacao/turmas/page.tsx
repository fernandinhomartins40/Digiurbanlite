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
import { useToast } from '@/components/ui/use-toast';
import { Users, Plus } from 'lucide-react';

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

export default function TurmasPage() {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('TODAS');
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [novaAberta, setNovaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nova, setNova] = useState({
    unidadeEducacaoId: '',
    codigo: '',
    nome: '',
    serie: '',
    turno: 'MATUTINO',
    sala: '',
    capacidade: '25',
  });

  useEffect(() => {
    api('/api/apps/educacao/unidades?ativas=true')
      .then((data) => setUnidades(Array.isArray(data) ? data : []))
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    loadTurmas();
  }, [unidadeId]);

  const loadTurmas = async () => {
    setLoading(true);
    try {
      const qs = unidadeId !== 'TODAS' ? `?unidadeId=${unidadeId}` : '';
      const data = await api(`/api/apps/educacao/turmas${qs}`);
      setTurmas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao listar turmas:', error);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  };

  const criar = async () => {
    if (!nova.unidadeEducacaoId || !nova.codigo || !nova.serie || !nova.capacidade) {
      toast({ title: 'Preencha unidade, código, série e capacidade', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/educacao/turmas', {
        method: 'POST',
        body: JSON.stringify({ ...nova, capacidade: Number(nova.capacidade) }),
      });
      toast({ title: 'Turma criada' });
      setNovaAberta(false);
      setNova({ ...nova, codigo: '', nome: '', sala: '' });
      await loadTurmas();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar turma',
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
          <h1 className="text-3xl font-bold text-gray-900">Turmas</h1>
          <p className="text-gray-500 mt-1">Turmas por unidade, capacidade e ocupação</p>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova turma
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Select value={unidadeId} onValueChange={setUnidadeId}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas as unidades</SelectItem>
              {unidades.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Turmas
            <Badge variant="secondary">{turmas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : turmas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma turma cadastrada</div>
          ) : (
            <div className="space-y-3">
              {turmas.map((t: any) => {
                const ocupacao = t.capacidade > 0 ? (t.vagasOcupadas / t.capacidade) * 100 : 0;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {t.codigo}
                        {t.nome && <span className="text-gray-500 font-normal"> — {t.nome}</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {t.serie} | {t.turno} | Ano {t.ano}
                        {t.sala && ` | Sala ${t.sala}`}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-40 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              ocupacao >= 100
                                ? 'bg-red-600'
                                : ocupacao >= 80
                                ? 'bg-orange-500'
                                : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(ocupacao, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {t.vagasOcupadas}/{t.capacidade} vagas
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={
                        t.vagasOcupadas >= t.capacidade ? 'bg-red-600' : 'bg-green-600'
                      }
                    >
                      {t.vagasOcupadas >= t.capacidade
                        ? 'Lotada'
                        : `${t.capacidade - t.vagasOcupadas} vagas livres`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Unidade</Label>
              <Select
                value={nova.unidadeEducacaoId}
                onValueChange={(v) => setNova({ ...nova, unidadeEducacaoId: v })}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <Input
                  placeholder="Ex.: 1A-2026"
                  value={nova.codigo}
                  onChange={(e) => setNova({ ...nova, codigo: e.target.value })}
                />
              </div>
              <div>
                <Label>Nome</Label>
                <Input
                  placeholder="Ex.: Turma A"
                  value={nova.nome}
                  onChange={(e) => setNova({ ...nova, nome: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Série *</Label>
                <Input
                  placeholder="Ex.: 1º Ano"
                  value={nova.serie}
                  onChange={(e) => setNova({ ...nova, serie: e.target.value })}
                />
              </div>
              <div>
                <Label>Turno</Label>
                <Select value={nova.turno} onValueChange={(v) => setNova({ ...nova, turno: v })}>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sala</Label>
                <Input
                  value={nova.sala}
                  onChange={(e) => setNova({ ...nova, sala: e.target.value })}
                />
              </div>
              <div>
                <Label>Capacidade *</Label>
                <Input
                  type="number"
                  min={1}
                  value={nova.capacidade}
                  onChange={(e) => setNova({ ...nova, capacidade: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criar} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar turma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
