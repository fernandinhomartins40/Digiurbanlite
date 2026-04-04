import { redirect } from 'next/navigation';

export default function AdminCitizenFaceReadRedirectPage() {
  redirect('/admin/atendimento-presencial/biometria-facial');
}
