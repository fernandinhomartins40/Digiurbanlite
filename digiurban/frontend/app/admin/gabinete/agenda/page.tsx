'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Edit, Trash2, Check } from 'lucide-react'
import { agendaService } from '@/lib/services/gabinete.service'
import { useToast } from '@/hooks/use-toast'

export default function AgendaPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await agendaService.getEvents({})
      setEvents(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este evento?')) return

    try {
      await agendaService.deleteEvent(id)
      toast({
        title: 'Sucesso',
        description: 'Evento excluído com sucesso'
      })
      loadEvents()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir evento',
        variant: 'destructive'
      })
    }
  }

  const handleMarkRealized = async (id: string) => {
    try {
      await agendaService.markAsRealized(id)
      toast({
        title: 'Sucesso',
        description: 'Evento marcado como realizado'
      })
      loadEvents()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar evento',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda Executiva</h1>
          <p className="text-gray-600 mt-1">Gerencie compromissos oficiais e eventos do gabinete</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum evento cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{event.titulo}</CardTitle>
                    <CardDescription>
                      {new Date(event.dataHoraInicio).toLocaleString('pt-BR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {event.status !== 'REALIZADO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkRealized(event.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Tipo:</strong> {event.tipo}</p>
                  {event.descricao && <p><strong>Descrição:</strong> {event.descricao}</p>}
                  {event.local && <p><strong>Local:</strong> {event.local}</p>}
                  {event.participantes && <p><strong>Participantes:</strong> {event.participantes}</p>}
                  <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${
                    event.status === 'REALIZADO' ? 'bg-green-100 text-green-800' :
                    event.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{event.status}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
