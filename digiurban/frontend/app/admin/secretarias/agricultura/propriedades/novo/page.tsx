'use client';

import { RuralPropertyForm } from '@/components/admin/modules/RuralPropertyForm';
import { ruralPropertiesConfig } from '@/lib/module-configs/agriculture';

export default function NovaPropriedadePage() {
  return (
    <RuralPropertyForm
      config={ruralPropertiesConfig}
      departmentType="agricultura"
    />
  );
}
