'use client';

import { RuralProducerForm } from '@/components/admin/modules/RuralProducerForm';
import { ruralProducersConfig } from '@/lib/module-configs/agriculture';
import { useParams } from 'next/navigation';

export default function EditarProdutorPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <RuralProducerForm
      config={ruralProducersConfig}
      departmentType="agricultura"
      recordId={id}
    />
  );
}
