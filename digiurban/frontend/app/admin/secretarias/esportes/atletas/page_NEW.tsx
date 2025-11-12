'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { athleteConfig } from '@/lib/module-configs/esportes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AtletasPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cadastro de Atletas</h1>
        <p className="text-muted-foreground">
          Gestão de atletas cadastrados no município
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Atletas Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={athleteConfig}
            departmentType="esportes"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="CADASTRO_ATLETAS"
            moduleName="Cadastro de Atletas"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
