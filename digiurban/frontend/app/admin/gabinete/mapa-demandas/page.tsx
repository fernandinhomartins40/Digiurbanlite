'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mapaDemandasService } from '@/lib/services/gabinete.service'
import { useToast } from '@/hooks/use-toast'

// Lazy load do mapa para evitar SSR
const ProtocolMapEnhanced = lazy(() =>
  import('@/components/admin/gabinete/ProtocolMapEnhanced').then(module => ({
    default: module.ProtocolMapEnhanced
  }))
)

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
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mapa de Demandas</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Visualização geoespacial e análise de solicitações municipais
        </p>
      </div>

      {/* Mapa Interativo com Análise Integrada */}
      <Suspense
        fallback={
          <div className="bg-gray-100 h-[400px] md:h-[600px] rounded-lg flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        }
      >
        <ProtocolMapEnhanced
          protocols={protocols}
          showClustering={true}
          showHeatmap={false}
          height="mobile-responsive"
        />
      </Suspense>
    </div>
  )
}
