import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function PesquisaPrecosPage() {
  if (!FEATURE_FLAGS.PESQUISA_PRECOS) notFound();
  // Re-enable: set FEATURE_FLAGS.PESQUISA_PRECOS = true and restore page.client.tsx content here
}
