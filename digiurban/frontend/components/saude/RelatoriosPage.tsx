'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function RelatoriosPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Relatórios e Indicadores de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Módulo de relatórios (produção, indicadores, coberturas) será implementado</p>
        </CardContent>
      </Card>
    </div>
  );
}
