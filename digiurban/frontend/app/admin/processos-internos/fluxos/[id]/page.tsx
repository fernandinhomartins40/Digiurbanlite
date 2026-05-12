import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function FluxoEditPage() {
  if (!FEATURE_FLAGS.PROCESSOS_INTERNOS) notFound();
}
