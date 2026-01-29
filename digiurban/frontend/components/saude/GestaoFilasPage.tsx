'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from 'lucide-react';

export function GestaoFilasPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-green-600" />
            Painel de Gestão de Filas em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Painel de gestão de filas com chamada de pacientes e métricas em tempo real será implementado</p>
        </CardContent>
      </Card>
    </div>
  );
}
