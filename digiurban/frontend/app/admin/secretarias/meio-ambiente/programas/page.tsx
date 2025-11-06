'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { programasAmbientaisConfig } from '@/lib/module-configs/meio-ambiente';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProgramasAmbientaisPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cadastrados">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados">
          <ModulePageTemplate
            config={programasAmbientaisConfig}
            departmentType="meio-ambiente"
          />
        </TabsContent>

        <TabsContent value="pendentes">
          <PendingProtocolsList
            moduleType="PROGRAMA_AMBIENTAL"
            moduleName="Programas Ambientais"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
