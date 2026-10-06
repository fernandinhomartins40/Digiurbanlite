'use client';

/**
 * Meus pedidos — lista simples: busca, filtro por situação e uma linha por
 * pedido (toque abre o detalhe). Cancelar fica no detalhe do pedido.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, FileText, Loader2, Search, X, XCircle } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCitizenProtocols } from '@/hooks/useCitizenProtocols';
import { citizenStatusInfo } from '@/lib/citizen-protocol-status';

const FILTERS = [
  { id: 'todos', name: 'Todos', apiValue: undefined },
  { id: 'AGUARDANDO_VOCE', name: 'Aguardando você', apiValue: undefined },
  { id: 'EM_ANDAMENTO', name: 'Em andamento', apiValue: 'VINCULADO,PROGRESSO,ATUALIZACAO,PENDENCIA' },
  { id: 'CONCLUIDO', name: 'Concluídos', apiValue: 'CONCLUIDO' },
  { id: 'CANCELADO', name: 'Cancelados', apiValue: 'CANCELADO' },
] as const;

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function ProtocolosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todos');
  const selected = FILTERS.find((item) => item.id === filter) || FILTERS[0];

  const { protocols, loading, error, summary } = useCitizenProtocols({
    status: selected.apiValue,
    awaiting: filter === 'AGUARDANDO_VOCE',
    limit: 100,
  });
  const awaitingCount = summary?.awaitingCitizen || 0;

  const filtered = useMemo(() => {
    const term = normalize(searchTerm.trim());
    if (!term) return protocols;
    return protocols.filter((protocol) =>
      normalize(`${protocol.number} ${protocol.title} ${protocol.service?.name || ''} ${protocol.department?.name || ''}`).includes(term)
    );
  }, [protocols, searchTerm]);

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus pedidos</h1>
          <p className="mt-0.5 text-sm text-gray-600">Acompanhe o que você pediu à prefeitura.</p>
        </div>

        {awaitingCount > 0 && filter !== 'AGUARDANDO_VOCE' && (
          <button
            type="button"
            onClick={() => setFilter('AGUARDANDO_VOCE')}
            className="flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left hover:border-orange-300"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-orange-600" />
            <span className="flex-1 text-sm text-orange-900">
              <strong>
                {awaitingCount} {awaitingCount === 1 ? 'pedido precisa' : 'pedidos precisam'} de uma resposta sua
              </strong>
              <span className="block text-orange-800">Sem isso o atendimento não avança.</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-orange-500" />
          </button>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar pelo número ou pelo serviço"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-9 pr-10"
              aria-label="Buscar pedido"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  filter === item.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
              >
                {item.name}
                {item.id === 'AGUARDANDO_VOCE' && awaitingCount > 0 && (
                  <span className={cn('rounded-full px-1.5 text-xs font-semibold', filter === item.id ? 'bg-white text-blue-700' : 'bg-orange-500 text-white')}>
                    {awaitingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <XCircle className="h-10 w-10 text-red-400" />
            <p className="font-medium text-gray-900">Não foi possível carregar seus pedidos</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-900">Nenhum pedido por aqui</p>
            <p className="text-sm text-gray-500">
              {searchTerm || filter !== 'todos' ? 'Tente outra busca ou outro filtro.' : (
                <>
                  Quando você pedir um serviço, ele aparece aqui.{' '}
                  <Link href="/cidadao/servicos" className="font-medium text-blue-600 hover:underline">
                    Ver serviços
                  </Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl border bg-white">
            {filtered.map((protocol) => {
              const pendingCount = protocol.openCitizenPendingsCount || 0;
              const status = citizenStatusInfo(protocol.status, pendingCount);
              return (
                <li key={protocol.id}>
                  <Link
                    href={`/cidadao/protocolos/${protocol.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{protocol.service?.name || protocol.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Nº {protocol.number} · {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', status.className)}>
                      {status.label}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CitizenLayout>
  );
}
