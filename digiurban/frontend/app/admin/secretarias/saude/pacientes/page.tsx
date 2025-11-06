'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { patientConfig } from '@/lib/module-configs/saude';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PacientesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cadastro de Pacientes</h1>
        <p className="text-muted-foreground">
          Gestão completa do cadastro de pacientes
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Pacientes Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={patientConfig}
            departmentType="saude"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="CADASTRO_PACIENTE"
            moduleName="Cadastro de Pacientes"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
