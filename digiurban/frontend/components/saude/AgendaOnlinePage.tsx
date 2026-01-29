'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function AgendaOnlinePage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Configuração de Agenda Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Módulo de configuração de agenda (horários, tipos aceitos, bloqueios) será implementado</p>
        </CardContent>
      </Card>
    </div>
  );
}
