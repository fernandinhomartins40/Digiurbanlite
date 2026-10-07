'use client'

/**
 * Mapa dos pedidos — para todo servidor, no escopo dele (os pedidos com ele,
 * ou os da secretaria). O Gabinete do Prefeito vê o município todo (também na
 * aba Território do Painel do Prefeito).
 */

import { ProtocolsMapView } from '@/components/admin/map/ProtocolsMapView'

export default function MapaPedidosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Mapa dos pedidos</h1>
        <p className="mt-1 text-sm text-gray-600">Onde estão os pedidos que você acompanha. Clique num ponto para abrir o protocolo.</p>
      </div>
      <ProtocolsMapView />
    </div>
  )
}
