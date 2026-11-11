'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuggestedServices } from './hooks';

/** "Para você" — serviços sugeridos pelas etiquetas do cidadão; some sem sugestão */
export function ForYouBlock() {
  const services = useSuggestedServices();
  if (services.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Para você
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y rounded-lg border">
          {services.slice(0, 5).map((service) => (
            <Link
              key={service.id}
              href={`/cidadao/servicos/${service.id}/solicitar`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block font-medium text-gray-900">{service.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {[service.department, service.forTag].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-blue-600">Ver</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
