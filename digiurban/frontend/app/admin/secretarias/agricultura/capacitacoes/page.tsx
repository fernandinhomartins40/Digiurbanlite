'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { ruralTrainingsConfig } from '@/lib/module-configs/agriculture';

export default function CapacitacoesPage() {
  return <ModulePageTemplate config={ruralTrainingsConfig} departmentType="agricultura" />;
}
