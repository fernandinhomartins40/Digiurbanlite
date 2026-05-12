import { notFound } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

export default function WorkflowsPage() {
  if (!FEATURE_FLAGS.WORKFLOWS) notFound();
}
