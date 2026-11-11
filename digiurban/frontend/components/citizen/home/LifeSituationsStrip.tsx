'use client';

import Link from 'next/link';
import {
  Baby, Briefcase, GraduationCap, Hammer, HeartPulse, Home, LucideIcon, Store, Tractor, TriangleAlert, Flower2, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLifeSituations } from './hooks';

const ICONS: Record<string, LucideIcon> = {
  'tive-um-filho': Baby,
  'filho-na-escola': GraduationCap,
  saude: HeartPulse,
  'sem-trabalho': Briefcase,
  'abrir-negocio': Store,
  'construir-reformar': Hammer,
  'problema-na-rua': TriangleAlert,
  'perdi-um-familiar': Flower2,
  'produtor-rural': Tractor,
  'cheguei-na-cidade': Home,
};

/** "O que está acontecendo?" — situações de vida com serviço no município */
export function LifeSituationsStrip() {
  const { situations, loading } = useLifeSituations();
  if (loading || situations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">O que está acontecendo?</CardTitle>
        <p className="text-sm text-gray-600">Escolha a sua situação e veja tudo o que a prefeitura oferece para ela.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {situations.map((situation) => {
            const Icon = ICONS[situation.slug] || Sparkles;
            return (
              <Link
                key={situation.slug}
                href={`/cidadao/servicos?situacao=${situation.slug}`}
                className="flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium text-gray-900 hover:border-blue-400 hover:bg-blue-50"
              >
                <Icon className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="min-w-0">{situation.title}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
