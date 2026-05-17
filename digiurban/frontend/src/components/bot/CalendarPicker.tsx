'use client';

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  onSelect: (date: Date) => void;
  minDate?: Date | 'today';
  maxDate?: Date | string; // '+30days', '+1year', etc
  disabledDates?: Date[];
  selectedDate?: Date;
}

export function CalendarPicker({
  onSelect,
  minDate = 'today',
  maxDate,
  disabledDates = [],
  selectedDate,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | undefined>(selectedDate);

  // Calcula data mínima
  const getMinDate = (): Date => {
    if (minDate === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
    return minDate;
  };

  // Calcula data máxima
  const getMaxDate = (): Date | undefined => {
    if (!maxDate) return undefined;

    if (typeof maxDate === 'string') {
      const match = maxDate.match(/\+(\d+)(days?|months?|years?)/);
      if (match) {
        const amount = parseInt(match[1]);
        const unit = match[2];
        const date = new Date();

        if (unit.startsWith('day')) {
          date.setDate(date.getDate() + amount);
        } else if (unit.startsWith('month')) {
          date.setMonth(date.getMonth() + amount);
        } else if (unit.startsWith('year')) {
          date.setFullYear(date.getFullYear() + amount);
        }

        return date;
      }
    }

    return maxDate as Date;
  };

  const minDateVal = getMinDate();
  const maxDateVal = getMaxDate();

  // Gera dias do mês
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Preenche dias antes do primeiro dia do mês
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }

    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Preenche dias após o último dia do mês
    const endDay = lastDay.getDay();
    for (let i = 1; i < 7 - endDay; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Verifica se é antes da data mínima
    if (dateOnly < minDateVal) return true;

    // Verifica se é depois da data máxima
    if (maxDateVal && dateOnly > maxDateVal) return true;

    // Verifica se está na lista de datas desabilitadas
    return disabledDates.some(
      d =>
        d.getFullYear() === dateOnly.getFullYear() &&
        d.getMonth() === dateOnly.getMonth() &&
        d.getDate() === dateOnly.getDate()
    );
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    setSelected(date);
    onSelect(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return (
    <div className="w-full min-w-0 max-w-full sm:max-w-sm mx-auto bg-white rounded-lg border border-blue-100 shadow-sm p-3 sm:p-4 overflow-hidden">
      {/* Header */}
      <div className="flex min-w-0 items-center justify-between gap-1 mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex min-w-0 items-center justify-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="min-w-0 truncate font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const isSelected =
            selected &&
            date.getFullYear() === selected.getFullYear() &&
            date.getMonth() === selected.getMonth() &&
            date.getDate() === selected.getDate();
          const disabled = isDateDisabled(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                aspect-square min-w-0 p-1 sm:p-2 text-sm rounded-lg transition-colors
                ${!isCurrentMonth && 'text-gray-300'}
                ${isCurrentMonth && !disabled && 'hover:bg-blue-50'}
                ${isToday && !isSelected && 'border border-blue-600'}
                ${isSelected && 'bg-gradient-to-br from-blue-700 to-teal-700 text-white font-semibold'}
                ${disabled && 'opacity-40 cursor-not-allowed'}
                ${!disabled && !isSelected && 'cursor-pointer'}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {selected
          ? `Selecionado: ${selected.toLocaleDateString('pt-BR')}`
          : 'Selecione uma data'}
      </div>
    </div>
  );
}

export default CalendarPicker;
