'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { socialGroupEnrollmentConfig } from '@/lib/module-configs/assistencia-social';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InscricoesGruposPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Grupos e Oficinas Sociais</h1>
        <p className="text-muted-foreground">
          Inscrições em grupos de convivência, artesanato, alfabetização e oficinas
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Inscrições Cadastradas</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={socialGroupEnrollmentConfig}
            departmentType="assistencia-social"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="INSCRICOES_GRUPOS"
            moduleName="Grupos e Oficinas"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
