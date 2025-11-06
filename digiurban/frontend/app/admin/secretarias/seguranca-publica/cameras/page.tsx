'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { cameraRequestConfig } from '@/lib/module-configs/seguranca-publica';

export default function CameraRequestPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="cadastrados">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados">
          <ModulePageTemplate
            config={cameraRequestConfig}
            departmentType="seguranca-publica"
          />
        </TabsContent>

        <TabsContent value="pendentes">
          <PendingProtocolsList
            moduleType="CAMERA_REQUEST"
            moduleName="Solicitações de Câmeras"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
