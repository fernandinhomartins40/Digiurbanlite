'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { alvarasConstrucaoConfig } from '@/lib/module-configs/planejamento-urbano';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AlvarasConstrucaoPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados">
          <ModulePageTemplate
            config={alvarasConstrucaoConfig}
            departmentType="planejamento-urbano"
          />
        </TabsContent>

        <TabsContent value="pendentes">
          <PendingProtocolsList
            config={alvarasConstrucaoConfig}
            departmentType="planejamento-urbano"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
