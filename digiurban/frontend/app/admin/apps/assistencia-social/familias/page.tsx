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
import { Users, Plus, CalendarCheck, ClipboardCheck, Check, X } from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string; variant?: any }> = {
  AGENDADO: { label: 'Aguardando agendamento', className: 'bg-yellow-600' },
  AGUARDANDO_ENTREVISTA: { label: 'Entrevista agendada', className: 'bg-blue-600' },
  DOCUMENTOS_VALIDADOS: { label: 'Entrevista realizada', className: 'bg-indigo-600' },
  AGUARDANDO_ANALISE: { label: 'Com pendências', className: 'bg-orange-600' },
  CADASTRADO: { label: 'Cadastrado', className: 'bg-green-600' },
  ATIVO: { label: 'Ativo', className: 'bg-green-700' },
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

export default function FamiliasPage() {
  const { toast } = useToast();
  const [familias, setFamilias] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Nova família
  const [novaAberta, setNovaAberta] = useState(false);
  const [responsavel, setResponsavel] = useState<any>(null);
  const [endereco, setEndereco] = useState('');
  const [renda, setRenda] = useState('');

  // Entrevista
  const [familiaEntrevista, setFamiliaEntrevista] = useState<any>(null);
  const [dataEntrevista, setDataEntrevista] = useState('');

  // Detalhe
  const [familiaDetalhe, setFamiliaDetalhe] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api('/api/apps/assistencia-social/familias');
      setFamilias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao listar famílias:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    let lista = familias;
    if (filtroStatus !== 'TODAS') lista = lista.filter((f) => f.status === filtroStatus);
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (f) =>
          f.responsavel?.name?.toLowerCase().includes(termo) ||
          f.numeroCadUnico?.includes(termo)
      );
    }
    return lista;
  }, [familias, filtroStatus, busca]);

  const criarFamilia = async () => {
    if (!responsavel?.id) {
      toast({ title: 'Selecione o responsável familiar', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/assistencia-social/familias', {
        method: 'POST',
        body: JSON.stringify({
          responsavelFamiliarId: responsavel.id,
          endereco: { descricao: endereco },
          rendaTotalFamiliar: renda ? Number(renda) : 0,
          membros: [],
        }),
      });
      toast({ title: 'Família cadastrada' });
      setNovaAberta(false);
      setResponsavel(null);
      setEndereco('');
      setRenda('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const agendarEntrevista = async () => {
    if (!familiaEntrevista || !dataEntrevista) return;
    setSalvando(true);
    try {
      await api(
        `/api/apps/assistencia-social/familias/${familiaEntrevista.id}/agendar-entrevista`,
        {
          method: 'POST',
          body: JSON.stringify({ dataEntrevista }),
        }
      );
      toast({ title: 'Entrevista agendada' });
      setFamiliaEntrevista(null);
      setDataEntrevista('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (familia: any, rota: string, body: any = {}) => {
    try {
      await api(`/api/apps/assistencia-social/familias/${familia.id}/${rota}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Situação atualizada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const acoesFamilia = (f: any) => {
    switch (f.status) {
      case 'AGENDADO':
        return (
          <Button size="sm" onClick={() => setFamiliaEntrevista(f)}>
            <CalendarCheck className="h-4 w-4 mr-1" /> Agendar entrevista
          </Button>
        );
      case 'AGUARDANDO_ENTREVISTA':
        return (
          <Button size="sm" onClick={() => acao(f, 'realizar-entrevista')}>
            <ClipboardCheck className="h-4 w-4 mr-1" /> Entrevista realizada
          </Button>
        );
      case 'DOCUMENTOS_VALIDADOS':
      case 'AGUARDANDO_ANALISE':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => acao(f, 'validar', { aprovado: true })}
            >
              <Check className="h-4 w-4 mr-1" /> Aprovar cadastro
            </Button>
            <Button size="sm" variant="outline" onClick={() => acao(f, 'validar', { aprovado: false })}>
              <X className="h-4 w-4 mr-1" /> Pendências
            </Button>
          </div>
        );
      case 'CADASTRADO':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => acao(f, 'ativar')}
          >
            <Check className="h-4 w-4 mr-1" /> Ativar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Famílias — CadÚnico</h1>
          <p className="text-gray-500 mt-1">
            Cadastro → entrevista → validação → cadastro ativo
          </p>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova família
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por responsável ou nº CadÚnico..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todos os status</SelectItem>
                {Object.entries(STATUS_LABEL).map(([valor, cfg]) => (
                  <SelectItem key={valor} value={valor}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Famílias
            <Badge variant="secondary">{filtradas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma família encontrada</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((f: any) => {
                const badge = STATUS_LABEL[f.status] || { label: f.status };
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setFamiliaDetalhe(f)}
                    >
                      <div className="font-medium">
                        {f.responsavel?.name || 'Responsável'}
                        {f.numeroCadUnico && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            CadÚnico {f.numeroCadUnico}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {(f.membros || []).length} membro(s) | Renda familiar: R${' '}
                        {(f.rendaTotalFamiliar || 0).toLocaleString('pt-BR')}
                      </div>
                      {f.dataEntrevista && (
                        <div className="text-xs text-gray-400 mt-1">
                          Entrevista: {new Date(f.dataEntrevista).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                      {acoesFamilia(f)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nova família */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar família no CadÚnico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector
              label="Responsável familiar"
              onSelect={setResponsavel}
              selectedCidadao={responsavel}
            />
            <div>
              <Label>Endereço</Label>
              <Input
                placeholder="Rua, número, bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
            </div>
            <div>
              <Label>Renda familiar total (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={renda}
                onChange={(e) => setRenda(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              Os membros da família podem ser adicionados na entrevista.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarFamilia} disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog agendar entrevista */}
      <Dialog
        open={!!familiaEntrevista}
        onOpenChange={(open) => !open && setFamiliaEntrevista(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Agendar entrevista — {familiaEntrevista?.responsavel?.name}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label>Data e hora</Label>
            <Input
              type="datetime-local"
              value={dataEntrevista}
              onChange={(e) => setDataEntrevista(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamiliaEntrevista(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={agendarEntrevista} disabled={salvando || !dataEntrevista}>
              {salvando ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detalhe da família */}
      <Dialog open={!!familiaDetalhe} onOpenChange={(open) => !open && setFamiliaDetalhe(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Família de {familiaDetalhe?.responsavel?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {familiaDetalhe?.numeroCadUnico && (
              <div>
                <span className="text-gray-500">Nº CadÚnico:</span>{' '}
                <span className="font-medium">{familiaDetalhe.numeroCadUnico}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Renda familiar:</span>{' '}
              R$ {(familiaDetalhe?.rendaTotalFamiliar || 0).toLocaleString('pt-BR')}
            </div>
            <div className="font-medium mt-2">Membros ({(familiaDetalhe?.membros || []).length})</div>
            {(familiaDetalhe?.membros || []).length === 0 ? (
              <p className="text-gray-500">Nenhum membro registrado além do responsável</p>
            ) : (
              <div className="space-y-2">
                {familiaDetalhe.membros.map((m: any) => (
                  <div key={m.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{m.nome}</div>
                    <div className="text-xs text-gray-500">
                      {m.parentesco} | Nascimento:{' '}
                      {m.dataNascimento
                        ? new Date(m.dataNascimento).toLocaleDateString('pt-BR')
                        : '-'}
                      {m.trabalha && ' | Trabalha'}
                      {m.deficiencia && ' | PcD'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
