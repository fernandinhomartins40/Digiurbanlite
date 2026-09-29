import { redirect } from 'next/navigation';

/** Assinaturas digitais agora é uma aba de "Meus documentos". */
export default function MeusDocumentosRedirect() {
  redirect('/cidadao/documentos?aba=assinaturas');
}
