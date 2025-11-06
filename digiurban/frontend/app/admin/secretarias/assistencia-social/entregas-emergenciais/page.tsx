'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { emergencyDeliveryConfig } from '@/lib/module-configs/assistencia-social';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EntregasEmergenciaisPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Entregas Emergenciais</h1>
        <p className="text-muted-foreground">
          Gestão de entregas emergenciais: cestas básicas, cobertores, medicamentos
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Entregas Cadastradas</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={emergencyDeliveryConfig}
            departmentType="assistencia-social"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="ENTREGAS_EMERGENCIAIS"
            moduleName="Entregas Emergenciais"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
