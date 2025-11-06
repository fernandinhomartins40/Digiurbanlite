'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Bell, Users } from 'lucide-react'

interface SchedulingConfigProps {
  formData: any
  onChange: (field: string, value: any) => void
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export function SchedulingConfig({ formData, onChange }: SchedulingConfigProps) {
  const config = formData.schedulingConfig || {
    type: 'appointment',
    slotDuration: 30,
    bufferTime: 0,
    maxPerDay: null,
    maxPerSlot: 1,
    advanceBooking: 30,
    minAdvance: 1,
    sendReminders: true,
    reminderHours: 24,
    allowReschedule: true,
    rescheduleDeadline: 24,
    workingHours: {
      monday: ['08:00-12:00', '14:00-18:00'],
      tuesday: ['08:00-12:00', '14:00-18:00'],
      wednesday: ['08:00-12:00', '14:00-18:00'],
      thursday: ['08:00-12:00', '14:00-18:00'],
      friday: ['08:00-12:00', '14:00-18:00'],
      saturday: [],
      sunday: [],
    },
  }

  const updateConfig = (updates: any) => {
    onChange('schedulingConfig', { ...config, ...updates })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tipo de Agendamento
          </CardTitle>
          <CardDescription>Escolha como os agendamentos serão feitos</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={config.type} onValueChange={(value) => updateConfig({ type: value })}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="appointment" id="type-appointment" />
              <Label htmlFor="type-appointment" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Horário Específico</p>
                  <p className="text-xs text-gray-500">Agendamento em horários definidos (ex: 14:30)</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="time_slot" id="type-slot" />
              <Label htmlFor="type-slot" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Time Slot</p>
                  <p className="text-xs text-gray-500">Períodos (ex: manhã, tarde)</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="date_only" id="type-date" />
              <Label htmlFor="type-date" className="cursor-pointer flex-1">
                <div>
                  <p className="font-medium">Apenas Data</p>
                  <p className="text-xs text-gray-500">Sem horário específico</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Configurações de Horário
          </CardTitle>
          <CardDescription>Defina duração e intervalos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slotDuration" className="text-xs">Duração do Slot (min)</Label>
              <Input
                id="slotDuration"
                type="number"
                min="5"
                step="5"
                value={config.slotDuration}
                onChange={(e) => updateConfig({ slotDuration: parseInt(e.target.value) || 30 })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bufferTime" className="text-xs">Intervalo entre slots (min)</Label>
              <Input
                id="bufferTime"
                type="number"
                min="0"
                step="5"
                value={config.bufferTime}
                onChange={(e) => updateConfig({ bufferTime: parseInt(e.target.value) || 0 })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Exemplo:</strong> Com duração de {config.slotDuration}min e intervalo de {config.bufferTime}min,
              cada agendamento ocupará {config.slotDuration + config.bufferTime} minutos no total.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Limites e Capacidade
          </CardTitle>
          <CardDescription>Controle a quantidade de agendamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPerDay" className="text-xs">Máximo por dia</Label>
              <Input
                id="maxPerDay"
                type="number"
                min="1"
                value={config.maxPerDay || ''}
                onChange={(e) => updateConfig({ maxPerDay: parseInt(e.target.value) || null })}
                placeholder="Ilimitado"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPerSlot" className="text-xs">Máximo por horário</Label>
              <Input
                id="maxPerSlot"
                type="number"
                min="1"
                value={config.maxPerSlot}
                onChange={(e) => updateConfig({ maxPerSlot: parseInt(e.target.value) || 1 })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advanceBooking" className="text-xs">Agendar com até (dias)</Label>
              <Input
                id="advanceBooking"
                type="number"
                min="1"
                value={config.advanceBooking}
                onChange={(e) => updateConfig({ advanceBooking: parseInt(e.target.value) || 30 })}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAdvance" className="text-xs">Antecedência mín (dias)</Label>
              <Input
                id="minAdvance"
                type="number"
                min="0"
                value={config.minAdvance}
                onChange={(e) => updateConfig({ minAdvance: parseInt(e.target.value) || 1 })}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações e Reagendamento
          </CardTitle>
          <CardDescription>Configure lembretes e políticas de reagendamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="sendReminders"
                checked={config.sendReminders}
                onCheckedChange={(checked) => updateConfig({ sendReminders: checked })}
              />
              <Label htmlFor="sendReminders" className="cursor-pointer">
                <div>
                  <p className="font-medium text-sm">Enviar lembretes</p>
                  <p className="text-xs text-gray-500">Notificar antes do agendamento</p>
                </div>
              </Label>
            </div>
            {config.sendReminders && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={config.reminderHours}
                  onChange={(e) => updateConfig({ reminderHours: parseInt(e.target.value) || 24 })}
                  className="w-16 h-8 text-xs text-center"
                />
                <span className="text-xs text-gray-600">horas antes</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowReschedule"
                checked={config.allowReschedule}
                onCheckedChange={(checked) => updateConfig({ allowReschedule: checked })}
              />
              <Label htmlFor="allowReschedule" className="cursor-pointer">
                <div>
                  <p className="font-medium text-sm">Permitir reagendamento</p>
                  <p className="text-xs text-gray-500">Cidadão pode remarcar</p>
                </div>
              </Label>
            </div>
            {config.allowReschedule && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={config.rescheduleDeadline}
                  onChange={(e) => updateConfig({ rescheduleDeadline: parseInt(e.target.value) || 24 })}
                  className="w-16 h-8 text-xs text-center"
                />
                <span className="text-xs text-gray-600">h antes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horários de Funcionamento</CardTitle>
          <CardDescription>Configure os horários disponíveis por dia da semana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const hours = config.workingHours[day.key] || []
            return (
              <div key={day.key} className="flex items-center gap-3 p-2 border rounded-lg">
                <Badge variant="outline" className="w-20 justify-center">
                  {day.label}
                </Badge>
                <div className="flex-1 text-sm">
                  {hours.length > 0 ? hours.join(', ') : <span className="text-gray-400">Fechado</span>}
                </div>
              </div>
            )
          })}
          <p className="text-xs text-gray-500 pt-2">
            💡 Edição completa de horários disponível após criação do serviço
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
