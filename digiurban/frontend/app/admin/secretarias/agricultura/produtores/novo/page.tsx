'use client';

import { RuralProducerForm } from '@/components/admin/modules/RuralProducerForm';
import { ruralProducersConfig } from '@/lib/module-configs/agriculture';

export default function NovoProdutorPage() {
  return (
    <RuralProducerForm
      config={ruralProducersConfig}
      departmentType="agricultura"
    />
  );
}
