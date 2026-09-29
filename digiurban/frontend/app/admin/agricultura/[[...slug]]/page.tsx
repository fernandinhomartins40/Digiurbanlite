import { redirect } from 'next/navigation';

/**
 * O app de Agricultura mudou para /admin/apps/agricultura (mesma área dos
 * demais apps). Antes ficava em /admin/agricultura e nenhuma tela levava até
 * ele. Links antigos continuam funcionando.
 */
export default function LegacyAgriculturaRedirect({ params }: { params: { slug?: string[] } }) {
  const rest = params.slug?.length ? `/${params.slug.join('/')}` : '';
  redirect(`/admin/apps/agricultura${rest}`);
}
