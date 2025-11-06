'use client';
import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { sportsModalityConfig } from '@/lib/module-configs/esportes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ModalidadesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Modalidades Esportivas</h1>
        <p className="text-muted-foreground">Gestão de modalidades oferecidas</p>
      </div>
      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Modalidades Cadastradas</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>
        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate config={sportsModalityConfig} departmentType="esportes" />
        </TabsContent>
        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList moduleType="MODALIDADES_ESPORTIVAS" moduleName="Modalidades Esportivas" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
