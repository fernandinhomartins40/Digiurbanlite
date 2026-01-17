'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  onSelect: (time: string) => void;
  availableTimes?: string[]; // ['08:00', '09:00', '10:00', ...]
  selectedTime?: string;
  interval?: number; // Minutos entre slots (padrão: 30)
  startTime?: string; // '08:00'
  endTime?: string; // '18:00'
}

export function TimePicker({
  onSelect,
  availableTimes,
  selectedTime,
  interval = 30,
  startTime = '08:00',
  endTime = '18:00',
}: TimePickerProps) {
  const [selected, setSelected] = useState<string | undefined>(selectedTime);

  // Gera slots de horário
  const generateTimeSlots = (): string[] => {
    if (availableTimes) return availableTimes;

    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin <= endMin)
    ) {
      const hourStr = currentHour.toString().padStart(2, '0');
      const minStr = currentMin.toString().padStart(2, '0');
      slots.push(`${hourStr}:${minStr}`);

      currentMin += interval;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeClick = (time: string) => {
    setSelected(time);
    onSelect(time);
  };

  // Divide em períodos
  const morningSlots = timeSlots.filter(t => {
    const hour = parseInt(t.split(':')[0]);
    return hour < 12;
  });

  const afternoonSlots = timeSlots.filter(t => {
    const hour = parseInt(t.split(':')[0]);
    return hour >= 12 && hour < 18;
  });

  const eveningSlots = timeSlots.filter(t => {
    const hour = parseInt(t.split(':')[0]);
    return hour >= 18;
  });

  const TimeSlotButton = ({ time }: { time: string }) => {
    const isSelected = selected === time;

    return (
      <button
        onClick={() => handleTimeClick(time)}
        className={`
          px-4 py-3 rounded-lg border-2 transition-all font-medium
          ${
            isSelected
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg scale-105'
              : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        {time}
      </button>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Escolha o horário
        </h3>
      </div>

      {/* Morning */}
      {morningSlots.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            ☀️ Manhã
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {morningSlots.map(time => (
              <TimeSlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Afternoon */}
      {afternoonSlots.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            🌤️ Tarde
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {afternoonSlots.map(time => (
              <TimeSlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Evening */}
      {eveningSlots.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">
            🌙 Noite
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {eveningSlots.map(time => (
              <TimeSlotButton key={time} time={time} />
            ))}
          </div>
        </div>
      )}

      {/* Selected time display */}
      {selected && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Horário selecionado:{' '}
            <span className="font-semibold text-gray-900">{selected}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default TimePicker;
