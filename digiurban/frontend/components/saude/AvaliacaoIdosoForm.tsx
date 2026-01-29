'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export function AvaliacaoIdosoForm({ citizenId }: { citizenId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-purple-600" />
          Avaliação Multidimensional do Idoso (IVCF)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Módulo de avaliação do idoso (funcionalidade, cognição, humor, mobilidade) será implementado</p>
      </CardContent>
    </Card>
  );
}
