import { redirect } from 'next/navigation'

// Tela antiga (sem links no sistema): as demandas recebidas do gabinete ficam
// na Visão geral do espaço da secretaria; os pedidos, na aba Protocolos.
export default function ChamadosRecebidosRedirect({ params }: { params: { department: string } }) {
  redirect(`/admin/secretarias/${params.department}`)
}
