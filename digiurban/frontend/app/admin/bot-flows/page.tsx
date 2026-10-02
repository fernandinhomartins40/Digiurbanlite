import { redirect } from 'next/navigation';

/** "Fluxos do Bot" (editor de JSON) foi substituído pela página DigiBot */
export default function LegacyBotFlowsPage() {
  redirect('/admin/digibot');
}
