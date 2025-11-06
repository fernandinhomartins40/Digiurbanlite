'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { educationAttendanceConfig } from '@/lib/module-configs/educacao';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EducationAttendancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{educationAttendanceConfig.displayName}</h1>
        <p className="text-muted-foreground mt-2">{educationAttendanceConfig.description}</p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={educationAttendanceConfig}
            departmentType="education"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="EDUCATION_ATTENDANCE"
            moduleName="Atendimento Educacional"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
