'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { schoolTransportConfig } from '@/lib/module-configs/educacao';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SchoolTransportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{schoolTransportConfig.displayName}</h1>
        <p className="text-muted-foreground mt-2">{schoolTransportConfig.description}</p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={schoolTransportConfig}
            departmentType="education"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="SCHOOL_TRANSPORT"
            moduleName="Transporte Escolar"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
