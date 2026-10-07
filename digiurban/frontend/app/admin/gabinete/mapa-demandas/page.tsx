import { redirect } from 'next/navigation'

// endereço antigo: o mapa agora é de todos os servidores (e a aba Território do Painel do Prefeito)
export default function LegacyMapaDemandasPage() {
  redirect('/admin/mapa')
}
