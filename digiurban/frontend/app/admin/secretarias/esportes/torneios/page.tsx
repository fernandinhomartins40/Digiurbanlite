'use client';
import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { tournamentConfig } from '@/lib/module-configs/esportes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TorneiosPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Torneios e Inscrições</h1>
        <p className="text-muted-foreground">Gestão de torneios e inscrições</p>
      </div>
      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Torneios Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>
        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate config={tournamentConfig} departmentType="esportes" />
        </TabsContent>
        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList moduleType="TORNEIOS_ESPORTIVOS" moduleName="Torneios Esportivos" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
