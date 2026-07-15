'use client';

/**
 * ============================================================================
 * MÓDULO PROTOCOLOS (geral, por secretaria)
 * ============================================================================
 * Reforma de módulos por secretaria (PLANO-MODULOS-GERAIS-SECRETARIA.md).
 * Substitui a listagem de protocolos que hoje se repete nos módulos por-serviço
 * e o módulo de serviços-sem-dados. Um único módulo reutilizável:
 *   - "Meus protocolos" (default): só os do servidor logado;
 *   - alternador "Da secretaria": todos (respeita role no backend).
 * Vale para serviços COM e SEM dados — é o fluxo de trabalho.
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Search } from 'lucide-react';
import { ProtocolListCard, type ProtocolCardData } from '@/components/protocols/ProtocolListCard';

type Scope = 'mine' | 'department';

const STATUS_LABEL: Record<string, string> = {
  VINCULADO: 'Vinculado',
  PROGRESSO: 'Em progresso',
  PENDENCIA: 'Pendência',
  ATUALIZACAO: 'Atualização',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

interface Props {
  departmentId: string;
  departmentName?: string;
}

export function SecretariaProtocolosModule({ departmentId, departmentName }: Props) {
  const { user } = useAdminAuth();
  const canSeeDepartment = user?.role !== 'USER';

  const [scope, setScope] = useState<Scope>('mine');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ProtocolCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope, status, limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      const res = await apiClient.get(`/protocols/secretaria/${departmentId}?${params}`);
      const json = await res.json();
      setRows(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [departmentId, scope, status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0); // debounce só na busca
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho + alternador de escopo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Protocolos</h2>
          <Badge variant="secondary">{total}</Badge>
        </div>

        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
          <button
            onClick={() => setScope('mine')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              scope === 'mine' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'
            }`}
          >
            Meus protocolos
          </button>
          <button
            onClick={() => canSeeDepartment && setScope('department')}
            disabled={!canSeeDepartment}
            title={canSeeDepartment ? '' : 'Disponível para coordenadores/gestores'}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              scope === 'department' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'
            } ${!canSeeDepartment ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {departmentName ? `Da ${departmentName}` : 'Da secretaria'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, título ou cidadão…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Lista — mesmo card e ações da página de protocolos */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando…</div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {scope === 'mine' ? 'Nenhum protocolo atribuído a você.' : 'Nenhum protocolo nesta secretaria.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <ProtocolListCard key={p.id} protocol={p} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
