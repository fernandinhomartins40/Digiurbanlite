import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function WorkflowNewPage() {
  if (!FEATURE_FLAGS.WORKFLOWS) notFound();
}
