'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { benefitRequestConfig } from '@/lib/module-configs/assistencia-social';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SolicitacoesBeneficiosPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Solicitação de Benefícios</h1>
        <p className="text-muted-foreground">
          Gestão de solicitações de benefícios: cesta básica, auxílio aluguel, funeral
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Solicitações Cadastradas</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={benefitRequestConfig}
            departmentType="assistencia-social"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="SOLICITACOES_BENEFICIOS"
            moduleName="Solicitação de Benefícios"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
