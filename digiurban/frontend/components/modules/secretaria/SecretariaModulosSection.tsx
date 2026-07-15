'use client';

/**
 * ============================================================================
 * SecretariaModulosSection — seção EMBUTIDA na página da secretaria
 * ============================================================================
 * Os dois módulos gerais (Protocolos + Dados) como uma SEÇÃO dentro da página
 * de secretaria existente (não um item de menu). Integração de uma linha:
 *   <SecretariaModulosSection slug="saude" />
 *
 * Resolve o departmentId a partir dos serviços da secretaria (mesmo hook que a
 * página já usa). departmentCode = slug. Ver PLANO-MODULOS-GERAIS-SECRETARIA.md.
 * ============================================================================
 */

import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSecretariaServices } from '@/hooks/useSecretariaServices';
import { SecretariaProtocolosModule } from './SecretariaProtocolosModule';
import { SecretariaDadosModule } from './SecretariaDadosModule';
import { FileText, Database } from 'lucide-react';

interface Props {
  /** Slug/código da secretaria (ex.: 'saude', 'assistencia-social'). */
  slug: string;
  /** Nome amigável para exibir (opcional). */
  departmentName?: string;
  /** Se já souber o departmentId, passe para evitar a resolução via serviços. */
  departmentId?: string;
}

export function SecretariaModulosSection({ slug, departmentName, departmentId }: Props) {
  const { services } = useSecretariaServices(slug);

  // departmentId: preferir o passado; senão, deriva do primeiro serviço da área.
  const resolvedDeptId = useMemo(
    () => departmentId || services.find((s) => s.departmentId)?.departmentId || '',
    [departmentId, services]
  );

  if (!resolvedDeptId) {
    // Sem serviços/departamento resolvido: não renderiza a seção (silencioso).
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">Protocolos e Dados</h2>
      <Tabs defaultValue="protocolos">
        <TabsList>
          <TabsTrigger value="protocolos" className="gap-1.5">
            <FileText className="h-4 w-4" /> Protocolos
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <Database className="h-4 w-4" /> Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="protocolos" className="mt-4">
          <SecretariaProtocolosModule departmentId={resolvedDeptId} departmentName={departmentName} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <SecretariaDadosModule departmentCode={slug} departmentName={departmentName} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
