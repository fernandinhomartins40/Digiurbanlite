'use client';

/**
 * Entrada da secretaria para a Gestão de Protocolos.
 *
 * Antes: dois "módulos gerais" (Protocolos + Dados) dentro da página da
 * secretaria, além das páginas de módulo por serviço e "Serviços Gerais".
 * Decisão do produto (ARQUITETURA-DE-PRODUTO.md, seção 10): os módulos deixam
 * de existir — há UMA página de Gestão de Protocolos. Esta seção leva até ela
 * já filtrada pela secretaria, com atalhos para os dados dos formulários de
 * cada serviço. Integração continua de uma linha:
 *   <SecretariaModulosSection slug="saude" />
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Table2 } from 'lucide-react';

interface Props {
  /** Slug/código da secretaria (ex.: 'saude', 'assistencia-social'). */
  slug: string;
  /** Nome amigável para exibir (opcional). */
  departmentName?: string;
  /** Mantido por compatibilidade com as páginas existentes. */
  departmentId?: string;
}

interface ServiceOption {
  id: string;
  name: string;
  hasForm: boolean;
  isActive: boolean;
}

const MAX_SHORTCUTS = 8;

export function SecretariaModulosSection({ slug, departmentName }: Props) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const code = slug.toUpperCase().replace(/-/g, '_');
  const queueHref = `/admin/protocolos?departamento=${slug}`;

  useEffect(() => {
    let active = true;
    fetch(`/api/protocols/filter-options?departmentCode=${code}`, { credentials: 'include' })
      .then((response) => response.json())
      .then((body) => {
        if (active && body?.success) setServices(body.data.services || []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [code]);

  const withForm = services.filter((s) => s.hasForm && s.isActive);

  return (
    <section className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Pedidos {departmentName ? `de ${departmentName}` : 'desta secretaria'}
          </CardTitle>
          <CardDescription>
            Todos os pedidos da secretaria ficam na Gestão de Protocolos: fila, prazos, responsáveis e os dados dos formulários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <Link href={queueHref} className="inline-flex items-center whitespace-nowrap">
              Abrir Gestão de Protocolos
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Link>
          </Button>

          {withForm.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Dados dos formulários por serviço</p>
              <div className="flex flex-wrap gap-2">
                {withForm.slice(0, MAX_SHORTCUTS).map((service) => (
                  <Link
                    key={service.id}
                    href={`${queueHref}&servico=${service.id}&vista=dados`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted"
                  >
                    <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {service.name}
                  </Link>
                ))}
                {withForm.length > MAX_SHORTCUTS && (
                  <Link href={queueHref} className="inline-flex items-center rounded-full px-3 py-1 text-sm text-primary hover:underline">
                    + {withForm.length - MAX_SHORTCUTS} serviços
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
