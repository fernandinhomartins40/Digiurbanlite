import { redirect } from 'next/navigation'

// página antiga de cartões: o Gabinete do Prefeito é o Painel (com abas)
export default function LegacyGabinetePage() {
  redirect('/admin/gabinete/painel-prefeito')
}
