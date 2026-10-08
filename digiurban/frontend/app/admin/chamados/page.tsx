import { redirect } from 'next/navigation'

// Demandas do Gabinete agora é uma aba do Painel do Prefeito
export default function DemandasGabinetePage() {
  redirect('/admin/gabinete/painel-prefeito?aba=demandas')
}
