import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function NovoProcessoPage() {
  if (!FEATURE_FLAGS.PROCESSOS_INTERNOS) notFound();
}
