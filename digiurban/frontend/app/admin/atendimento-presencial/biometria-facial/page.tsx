import { redirect } from 'next/navigation';

// Endereço antigo: a biometria presencial fica em Cidadãos (e é atalho do Balcão)
export default function AdminAttendanceFaceRedirectPage() {
  redirect('/admin/cidadaos/biometria-facial');
}
