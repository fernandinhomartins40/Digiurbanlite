import { redirect } from 'next/navigation';

export default function AdminAttendanceFaceReadRedirectPage() {
  redirect('/admin/atendimento-presencial/biometria-facial');
}
