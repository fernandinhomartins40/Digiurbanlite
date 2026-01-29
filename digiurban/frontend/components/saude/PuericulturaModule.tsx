'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Baby, TrendingUp } from 'lucide-react';

export function PuericulturaModule({ citizenId }: { citizenId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-600" />
            Acompanhamento de Puericultura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Módulo de puericultura (curvas de crescimento, marcos do desenvolvimento) será implementado</p>
        </CardContent>
      </Card>
    </div>
  );
}
