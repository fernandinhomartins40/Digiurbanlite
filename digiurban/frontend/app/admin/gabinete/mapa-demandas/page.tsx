'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Map as MapIcon } from 'lucide-react'
import { mapaDemandasService } from '@/lib/services/gabinete.service'
import { useToast } from '@/hooks/use-toast'

export default function MapaDemandasPage() {
  const [protocols, setProtocols] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [protocolsResponse, statsResponse] = await Promise.all([
        mapaDemandasService.getProtocolsWithLocation({}),
        mapaDemandasService.getStats()
      ])

      setProtocols(protocolsResponse.data || [])
      setStats(statsResponse.data)
    } catch (error) {
      console.error('Erro ao carregar dados do mapa:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do mapa',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mapa de Demandas</h1>
        <p className="text-gray-600 mt-1">Visualização geoespacial das solicitações municipais</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total com Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWithLocation || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Protocolos no Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{protocols.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byCategory ? Object.keys(stats.byCategory).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa Interativo</CardTitle>
          <CardDescription>Visualize a distribuição de protocolos por região</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Mapa será implementado com Leaflet</p>
              <p className="text-sm text-gray-500 mt-2">
                {protocols.length} protocolos com geolocalização encontrados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Protocolos */}
      <Card>
        <CardHeader>
          <CardTitle>Protocolos Geolocalizados</CardTitle>
        </CardHeader>
        <CardContent>
          {protocols.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Nenhum protocolo com geolocalização encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {protocols.slice(0, 10).map((protocol) => (
                <div key={protocol.id} className="border p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">#{protocol.number} - {protocol.title}</p>
                      <p className="text-sm text-gray-600">
                        {protocol.endereco || `${protocol.latitude}, ${protocol.longitude}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {protocol.service?.name} • {protocol.department?.name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      protocol.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' :
                      protocol.status === 'PROGRESSO' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {protocol.status}
                    </span>
                  </div>
                </div>
              ))}
              {protocols.length > 10 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  ...e mais {protocols.length - 10} protocolos
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
