'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { culturalAttendanceConfig } from '@/lib/module-configs/cultura';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AtendimentosCulturaPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Atendimentos Culturais</h1>
        <p className="text-muted-foreground">
          Gestão de atendimentos gerais da Secretaria de Cultura
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Atendimentos Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={culturalAttendanceConfig}
            departmentType="cultura"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="ATENDIMENTOS_CULTURA"
            moduleName="Atendimentos Culturais"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
