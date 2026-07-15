'use client';

/**
 * ============================================================================
 * PÁGINA PILOTO — Módulos Gerais da Secretaria (Protocolos + Dados)
 * ============================================================================
 * Reforma de módulos por secretaria (PLANO-MODULOS-GERAIS-SECRETARIA.md).
 * Instancia os DOIS módulos gerais reutilizáveis para a secretaria do servidor
 * logado. Convive ao lado dos módulos atuais (piloto) — nada é removido ainda.
 *
 * Serve de referência para plugar nas páginas de secretaria existentes.
 * ============================================================================
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { SecretariaProtocolosModule } from '@/components/modules/secretaria/SecretariaProtocolosModule';
import { SecretariaDadosModule } from '@/components/modules/secretaria/SecretariaDadosModule';
import { Building2 } from 'lucide-react';

export default function SecretariaModulosPage() {
  const { user } = useAdminAuth();
  const dept = user?.department || user?.primaryDepartment;

  if (!dept) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Seu usuário não está vinculado a uma secretaria.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-semibold">{dept.name}</h1>
          <p className="text-sm text-muted-foreground">Protocolos e dados coletados da secretaria</p>
        </div>
      </div>

      <Tabs defaultValue="protocolos">
        <TabsList>
          <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="protocolos" className="mt-4">
          <SecretariaProtocolosModule departmentId={dept.id} departmentName={dept.name} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <SecretariaDadosModule departmentCode={dept.code} departmentName={dept.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
