'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { ruralProgramsConfig } from '@/lib/module-configs/agriculture';

export default function ProgramasPage() {
  return <ModulePageTemplate config={ruralProgramsConfig} departmentType="agricultura" />;
}
