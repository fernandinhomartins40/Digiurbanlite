'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { teamScheduleConfig } from '@/lib/module-configs/servicos-publicos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GestaoEquipesPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Equipes Cadastradas</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={teamScheduleConfig}
            departmentType="servicos-publicos"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="GESTAO_EQUIPES_SERVICOS"
            moduleName="Gestão de Equipes"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
