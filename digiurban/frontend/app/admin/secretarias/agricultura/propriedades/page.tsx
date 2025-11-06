'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { ruralPropertiesConfig } from '@/lib/module-configs/agriculture';

export default function PropriedadesPage() {
  return <ModulePageTemplate config={ruralPropertiesConfig} departmentType="agricultura" />;
}
