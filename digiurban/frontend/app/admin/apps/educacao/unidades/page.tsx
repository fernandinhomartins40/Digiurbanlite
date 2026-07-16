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
import { School, Plus, Search } from 'lucide-react';

const TIPOS = ['ESCOLA', 'CRECHE', 'CMEI', 'EJA', 'OUTRO'];

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

export default function UnidadesEducacaoPage() {
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const [novaAberta, setNovaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nova, setNova] = useState({
    nome: '',
    tipo: 'ESCOLA',
    endereco: '',
    bairro: '',
    telefone: '',
    vagasTotais: '',
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    setLoading(true);
    try {
      const data = await api('/api/apps/educacao/unidades');
      setUnidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao listar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = unidades.filter(
    (u: any) =>
      !busca ||
      u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.bairro?.toLowerCase().includes(busca.toLowerCase())
  );

  const criar = async () => {
    if (!nova.nome) {
      toast({ title: 'Informe o nome da unidade', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      const { vagasTotais, ...resto } = nova;
      await api('/api/apps/educacao/unidades', {
        method: 'POST',
        body: JSON.stringify({
          ...resto,
          vagas: vagasTotais ? Number(vagasTotais) : undefined,
        }),
      });
      toast({ title: 'Unidade criada' });
      setNovaAberta(false);
      setNova({ nome: '', tipo: 'ESCOLA', endereco: '', bairro: '', telefone: '', vagasTotais: '' });
      await loadUnidades();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar unidade',
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
          <h1 className="text-3xl font-bold text-gray-900">Unidades de Ensino</h1>
          <p className="text-gray-500 mt-1">Escolas, creches e centros de educação</p>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova unidade
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou bairro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Unidades
            <Badge variant="secondary">{filtradas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma unidade cadastrada</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{u.nome}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {u.tipo}
                      {u.bairro && ` | ${u.bairro}`}
                      {u.telefone && ` | ${u.telefone}`}
                    </div>
                    {u.endereco && (
                      <div className="text-xs text-gray-400 mt-1">{u.endereco}</div>
                    )}
                  </div>
                  <Badge className={u.isActive ? 'bg-green-600' : 'bg-gray-500'}>
                    {u.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova unidade de ensino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Ex.: E.M. Professora Maria da Silva"
                value={nova.nome}
                onChange={(e) => setNova({ ...nova, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={nova.tipo} onValueChange={(v) => setNova({ ...nova, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vagas totais</Label>
                <Input
                  type="number"
                  value={nova.vagasTotais}
                  onChange={(e) => setNova({ ...nova, vagasTotais: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={nova.endereco}
                onChange={(e) => setNova({ ...nova, endereco: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bairro</Label>
                <Input
                  value={nova.bairro}
                  onChange={(e) => setNova({ ...nova, bairro: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={nova.telefone}
                  onChange={(e) => setNova({ ...nova, telefone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criar} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar unidade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
