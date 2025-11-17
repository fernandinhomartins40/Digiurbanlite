'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Plus } from 'lucide-react'

interface Appointment {
  id: string
  time: string
  patientName: string
  patientPhone?: string
  doctorName: string
  speciality: string
  type: 'consultation' | 'exam' | 'procedure'
  status: 'scheduled' | 'completed' | 'canceled'
  observations?: string
}

interface CalendarioMedicoProps {
  onScheduleAppointment?: (appointment: Partial<Appointment>) => void
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void
}

export default function CalendarioMedico({
  onScheduleAppointment,
  onUpdateAppointment
}: CalendarioMedicoProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>('')

  // Mock data de consultas
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        time: '08:00',
        patientName: 'Maria Silva',
        patientPhone: '(11) 99999-9999',
        doctorName: 'Dr. João Santos',
        speciality: 'Cardiologia',
        type: 'consultation',
        status: 'scheduled'
      },
      {
        id: '2',
        time: '09:30',
        patientName: 'Pedro Oliveira',
        patientPhone: '(11) 88888-8888',
        doctorName: 'Dra. Ana Costa',
        speciality: 'Pediatria',
        type: 'consultation',
        status: 'scheduled'
      },
      {
        id: '3',
        time: '14:00',
        patientName: 'José Carlos',
        doctorName: 'Dr. Roberto Lima',
        speciality: 'Ortopedia',
        type: 'exam',
        status: 'completed'
      }
    ]
    setAppointments(mockAppointments)
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Dias do mês anterior para completar a primeira semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // Dias do próximo mês para completar a última semana
    const remainingDays = 42 - days.length // 6 semanas x 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const today = new Date()
      return today.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ]

  const specialities = [
    'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia',
    'Dermatologia', 'Oftalmologia', 'Psicologia', 'Nutrição'
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'canceled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <User className="w-4 h-4" />
      case 'exam': return <Calendar className="w-4 h-4" />
      case 'procedure': return <Clock className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  if (viewMode === 'month') {
    const days = getDaysInMonth(currentDate)

    return (
      <div className="space-y-4">
        {/* Header do Calendário */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={selectedSpeciality} onValueChange={setSelectedSpeciality}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {specialities.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => setViewMode('week')}>
              Semana
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('day')}>
              Dia
            </Button>
            <Button onClick={() => setShowNewAppointment(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Consulta
            </Button>
          </div>
        </div>

        {/* Grid do Calendário */}
        <Card>
          <CardContent className="p-0">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-500 border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day.date)
                const isToday = day.date.toDateString() === new Date().toDateString()
                const isSelected = day.date.toDateString() === selectedDate.toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                      !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className={`text-sm mb-2 ${isToday ? 'font-bold text-blue-600' : ''}`}>
                      {day.date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(apt => (
                        <div
                          key={apt.id}
                          className={`text-xs p-1 rounded truncate ${getStatusColor(apt.status)}`}
                          title={`${apt.time} - ${apt.patientName} (${apt.speciality})`}
                        >
                          {apt.time} {apt.patientName}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayAppointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Visualização de Dia
  return (
    <div className="space-y-4">
      {/* Header da Visualização de Dia */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode('month')}>
            Mês
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode('week')}>
            Semana
          </Button>
          <Button onClick={() => setShowNewAppointment(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Grade de Horários */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {timeSlots.map(slot => {
              const slotAppointments = appointments.filter(apt => apt.time === slot)

              return (
                <div key={slot} className="flex items-center space-x-4 p-2 border-b hover:bg-gray-50">
                  <div className="w-16 text-sm font-medium text-gray-600">
                    {slot}
                  </div>

                  <div className="flex-1">
                    {slotAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {slotAppointments.map(apt => (
                          <div
                            key={apt.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white"
                          >
                            <div className="flex items-center space-x-3">
                              {getTypeIcon(apt.type)}
                              <div>
                                <div className="font-medium">{apt.patientName}</div>
                                <div className="text-sm text-gray-500">
                                  {apt.doctorName} - {apt.speciality}
                                </div>
                                {apt.patientPhone && (
                                  <div className="text-sm text-gray-400 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {apt.patientPhone}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(apt.status)}>
                                {apt.status === 'scheduled' ? 'Agendado' :
                                 apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                Editar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full text-left justify-start text-gray-400"
                        onClick={() => setShowNewAppointment(true)}
                      >
                        Disponível - Clique para agendar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}