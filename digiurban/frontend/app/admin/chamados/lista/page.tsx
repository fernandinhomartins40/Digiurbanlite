import { redirect } from 'next/navigation'

// Endereço antigo de "Meus Chamados": agora é a aba Acompanhar das Demandas do Gabinete
export default function ListaChamadosRedirect() {
  redirect('/admin/gabinete/painel-prefeito?aba=demandas')
}
