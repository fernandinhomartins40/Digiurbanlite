import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function ProcessosInternosPage() {
  if (!FEATURE_FLAGS.PROCESSOS_INTERNOS) notFound();
  // Re-enable: set FEATURE_FLAGS.PROCESSOS_INTERNOS = true and restore page.client.tsx content here
}
