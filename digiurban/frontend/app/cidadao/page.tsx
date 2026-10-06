'use client';

/**
 * Início do portal do cidadão (ARQUITETURA-DE-PRODUTO.md 5.3).
 *
 *  1. "Do que você precisa?"  → busca direto nos serviços
 *  2. "Aguardando você"       → pedidos em que a prefeitura pediu algo ao cidadão
 *  3. "Seus pedidos"          → situação dos pedidos mais recentes
 *
 * Antes o portal abria direto no chat; o chat agora é o Assistente
 * (/cidadao/assistente), disponível em todas as telas.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2, FileText, Folder, MessageCircle, Search } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { useCitizenServices } from '@/hooks/useCitizenServices';
import { useCitizenProtocols } from '@/hooks/useCitizenProtocols';
import { citizenStatusInfo } from '@/lib/citizen-protocol-status';


const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

export default function CitizenHomePage() {
  const router = useRouter();
  const { citizen } = useCitizenAuth();
  const { services, loading: servicesLoading } = useCitizenServices();
  const awaiting = useCitizenProtocols({ awaiting: true, limit: 5 });
  const recent = useCitizenProtocols({ limit: 5 });
  const [query, setQuery] = useState('');

  const firstName = citizen?.name?.split(' ')[0];

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (term.length < 2) return [];
    return services
      .filter((s) => normalize(`${s.name} ${s.description || ''} ${s.department?.name || ''}`).includes(term))
      .slice(0, 6);
  }, [services, query]);

  const awaitingCount = awaiting.summary?.awaitingCitizen ?? awaiting.protocols.length;

  return (
    <CitizenLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {firstName ? `Olá, ${firstName}!` : 'Olá!'}
          </h1>
          <p className="text-gray-600 mt-1">O que a prefeitura pode fazer por você hoje?</p>
        </div>

        {/* 1. Do que você precisa? */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Do que você precisa?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (results.length === 1) router.push(`/cidadao/servicos/${results[0].id}/solicitar`);
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: poda de árvore, matrícula, cartão do estudante"
                className="h-12 pl-11 text-base"
                aria-label="Buscar serviço"
              />
            </form>

            {query.trim().length >= 2 && (
              servicesLoading ? (
                <Skeleton className="h-24" />
              ) : results.length > 0 ? (
                <div className="divide-y rounded-lg border">
                  {results.map((service) => (
                    <Link
                      key={service.id}
                      href={`/cidadao/servicos/${service.id}/solicitar`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-gray-900">{service.name}</span>
                        {service.department?.name && (
                          <span className="block text-xs text-muted-foreground">{service.department.name}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-medium text-blue-600">Pedir</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
                  Não encontramos esse serviço.{' '}
                  <Link href="/cidadao/assistente" className="font-medium text-blue-600 hover:underline">
                    Pergunte ao assistente
                  </Link>{' '}
                  ou{' '}
                  <Link href="/cidadao/servicos" className="font-medium text-blue-600 hover:underline">
                    veja todos os serviços
                  </Link>
                  .
                </div>
              )
            )}

            <Link href="/cidadao/servicos" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
              Ver todos os serviços
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* 2. Aguardando você */}
        {!awaiting.loading && awaitingCount > 0 && (
          <Card className="border-orange-200 bg-orange-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
                <AlertCircle className="h-5 w-5" />
                Aguardando você ({awaitingCount})
              </CardTitle>
              <p className="text-sm text-orange-800">
                A prefeitura precisa de uma resposta ou documento seu para continuar estes pedidos.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {awaiting.protocols.map((protocol) => (
                <Link
                  key={protocol.id}
                  href={`/cidadao/protocolos/${protocol.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-white px-4 py-3 hover:border-orange-400"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900 truncate">{protocol.service?.name || protocol.title}</span>
                    <span className="block text-xs text-muted-foreground">Pedido nº {protocol.number}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-orange-700">Responder</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 3. Seus pedidos */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-600" />
              Seus pedidos
            </CardTitle>
            <Link href="/cidadao/protocolos" className="text-sm font-medium text-blue-600 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {recent.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : recent.protocols.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-gray-300 mb-2" />
                <p className="font-medium text-gray-900">Você ainda não fez nenhum pedido</p>
                <p className="text-sm text-gray-600">Busque acima o serviço de que precisa.</p>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {recent.protocols.map((protocol) => {
                  const status = citizenStatusInfo(protocol.status, protocol.openCitizenPendingsCount || 0);
                  return (
                    <Link
                      key={protocol.id}
                      href={`/cidadao/protocolos/${protocol.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <span className="min-w-0 flex items-start gap-3">
                        <FileText className="h-5 w-5 mt-0.5 shrink-0 text-gray-400" />
                        <span className="min-w-0">
                          <span className="block font-medium text-gray-900 truncate">{protocol.service?.name || protocol.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            Nº {protocol.number} · {formatDate(protocol.createdAt)}
                          </span>
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assistente */}
        <Link href="/cidadao/assistente" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">Prefere conversar?</p>
                <p className="text-sm text-gray-600">O assistente ajuda a encontrar serviços, consultar pedidos e falar com a prefeitura.</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </CitizenLayout>
  );
}
