'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { tourismProgramConfig } from '@/lib/module-configs/turismo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProgramasTuristicosPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Programas Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={tourismProgramConfig}
            departmentType="turismo"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="INSCRICAO_PROGRAMA_TURISTICO"
            moduleName="Programas Turísticos"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
