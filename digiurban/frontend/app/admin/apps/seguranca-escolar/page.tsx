import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function SegurancaEscolarPage() {
  if (!FEATURE_FLAGS.SEGURANCA_ESCOLAR) notFound();
}
