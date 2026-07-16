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
import { Building2, Plus, Pencil, Power } from 'lucide-react';

interface UnidadeForm {
  nome: string;
  tipo: string;
  endereco: string;
  bairro: string;
  telefone: string;
  email: string;
  horario: string;
}

const FORM_VAZIO: UnidadeForm = {
  nome: '',
  tipo: 'CRAS',
  endereco: '',
  bairro: '',
  telefone: '',
  email: '',
  horario: '',
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

export default function UnidadesCRASPage() {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busca, setBusca] = useState('');

  const [dialogAberto, setDialogAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<UnidadeForm>(FORM_VAZIO);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api('/api/apps/assistencia-social/unidades');
      setUnidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao listar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    let lista = unidades;
    if (filtroTipo !== 'TODOS') lista = lista.filter((u) => u.tipo === filtroTipo);
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (u) =>
          u.nome?.toLowerCase().includes(termo) || u.bairro?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [unidades, filtroTipo, busca]);

  const abrirNova = () => {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setDialogAberto(true);
  };

  const abrirEdicao = (u: any) => {
    setEditandoId(u.id);
    setForm({
      nome: u.nome || '',
      tipo: u.tipo || 'CRAS',
      endereco: u.endereco || '',
      bairro: u.bairro || '',
      telefone: u.telefone || '',
      email: u.email || '',
      horario: u.horario || '',
    });
    setDialogAberto(true);
  };

  const salvar = async () => {
    if (!form.nome) {
      toast({ title: 'Informe o nome da unidade', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        await api(`/api/apps/assistencia-social/unidades/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast({ title: 'Unidade atualizada' });
      } else {
        await api('/api/apps/assistencia-social/unidades', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast({ title: 'Unidade criada' });
      }
      setDialogAberto(false);
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const desativar = async (u: any) => {
    try {
      await api(`/api/apps/assistencia-social/unidades/${u.id}`, { method: 'DELETE' });
      toast({ title: 'Unidade desativada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unidades — CRAS/CREAS</h1>
          <p className="text-gray-500 mt-1">
            Centros de referência e equipamentos da assistência social
          </p>
        </div>
        <Button onClick={abrirNova}>
          <Plus className="h-4 w-4 mr-2" />
          Nova unidade
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por nome ou bairro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os tipos</SelectItem>
                <SelectItem value="CRAS">CRAS</SelectItem>
                <SelectItem value="CREAS">CREAS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Unidades
            <Badge variant="secondary">{filtradas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma unidade encontrada</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {u.nome}
                      <Badge variant="outline">{u.tipo}</Badge>
                      {!u.isActive && <Badge className="bg-gray-500">Inativa</Badge>}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {[u.endereco, u.bairro].filter(Boolean).join(' — ') || 'Sem endereço'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {[u.telefone, u.email, u.horario].filter(Boolean).join(' | ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => abrirEdicao(u)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    {u.isActive && (
                      <Button size="sm" variant="outline" onClick={() => desativar(u)}>
                        <Power className="h-4 w-4 mr-1" /> Desativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar unidade' : 'Nova unidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex.: CRAS Centro"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRAS">CRAS</SelectItem>
                    <SelectItem value="CREAS">CREAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endereço</Label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Horário de funcionamento</Label>
              <Input
                placeholder="Ex.: Seg–Sex 8h às 17h"
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
