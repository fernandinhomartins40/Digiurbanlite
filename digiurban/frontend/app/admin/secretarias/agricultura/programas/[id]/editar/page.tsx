'use client';

import { ProgramFormWithSchema } from '@/components/admin/programs/ProgramFormWithSchema';
import { useParams } from 'next/navigation';

export default function EditarProgramaPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProgramFormWithSchema
      departmentType="agricultura"
      programId={id}
    />
  );
}
