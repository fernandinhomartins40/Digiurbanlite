'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { socialAssistanceAttendanceConfig } from '@/lib/module-configs/assistencia-social';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AtendimentosAssistenciaSocialPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Atendimentos de Assistência Social</h1>
        <p className="text-muted-foreground">
          Gestão de atendimentos gerais de assistência social (CRAS/CREAS)
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Atendimentos Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={socialAssistanceAttendanceConfig}
            departmentType="assistencia-social"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="ATENDIMENTOS_ASSISTENCIA_SOCIAL"
            moduleName="Atendimentos de Assistência Social"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
