'use client';

/**
 * Serviços — busca + filtro por secretaria + lista agrupada por assunto.
 * Uma linha por serviço (toque abre o pedido). Antes: carrosséis horizontais
 * que cortavam os cartões, um "Mais procurados" que era só os 6 primeiros da
 * lista e um cartão criado dentro da página (recriado a cada atualização).
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Loader2, Search, X } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCitizenServices } from '@/hooks/useCitizenServices';

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function ServicosPage() {
  const { services, loading, error } = useCitizenServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('todos');

  const departments = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    services.forEach((service) => {
      const id = service.departmentId || service.department?.name;
      if (id && service.department?.name && !map.has(id)) map.set(id, { id, name: service.department.name });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  const filtered = useMemo(() => {
    const term = normalize(searchTerm.trim());
    return services.filter((service) => {
      const id = service.departmentId || service.department?.name;
      if (department !== 'todos' && id !== department) return false;
      if (!term) return true;
      return normalize(`${service.name} ${service.description || ''} ${service.department?.name || ''}`).includes(term);
    });
  }, [services, searchTerm, department]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((service) => {
      const key = service.category || service.department?.name || 'Outros';
      map.set(key, [...(map.get(key) || []), service]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="mt-0.5 text-sm text-gray-600">Escolha o que você precisa pedir à prefeitura.</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Ex.: poda de árvore, matrícula, consulta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-10 pr-10 text-base"
              aria-label="Buscar serviço"
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

          {departments.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
              {[{ id: 'todos', name: 'Todas as secretarias' }, ...departments].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDepartment(item.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    department === item.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {item.name.replace(/^Secretaria (Municipal )?(de |da |do |dos |das )?/i, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Search className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-900">Nenhum serviço encontrado</p>
            <p className="text-sm text-gray-500">
              Tente outra palavra ou{' '}
              <Link href="/cidadao/assistente" className="font-medium text-blue-600 hover:underline">
                pergunte ao assistente
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(([groupName, items]) => (
              <section key={groupName} className="space-y-2">
                <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{groupName}</h2>
                <ul className="divide-y overflow-hidden rounded-2xl border bg-white">
                  {items.map((service) => (
                    <li key={service.id}>
                      <Link href={`/cidadao/servicos/${service.id}/solicitar`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{service.name}</p>
                          {service.description && <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{service.description}</p>}
                          {!!service.estimatedDays && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              Prazo de até {service.estimatedDays} dia{service.estimatedDays > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}
