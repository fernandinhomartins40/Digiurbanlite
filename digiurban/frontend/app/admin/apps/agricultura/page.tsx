'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Leaf, MapPinned, Sprout, Tractor, Users } from 'lucide-react';

/**
 * App de Agricultura — mesa de trabalho da Secretaria de Agricultura.
 * Recebe os casos que nascem dos pedidos (cadastro de produtor, propriedade,
 * assistência técnica) e as operações feitas direto pela equipe.
 */
const AREAS = [
  { href: '/admin/apps/agricultura/produtores', title: 'Produtores rurais', description: 'Cadastro, documentação e carteirinha do produtor', icon: Users },
  { href: '/admin/apps/agricultura/propriedades', title: 'Propriedades', description: 'Imóveis rurais, área e CAR', icon: MapPinned },
  { href: '/admin/apps/agricultura/assistencia-tecnica', title: 'Assistência técnica', description: 'Solicitações e visitas dos técnicos', icon: Leaf },
  { href: '/admin/apps/agricultura/sementes', title: 'Sementes e mudas', description: 'Estoque e distribuição', icon: Sprout },
  { href: '/admin/apps/agricultura/mecanizacao', title: 'Mecanização', description: 'Patrulha agrícola e máquinas', icon: Tractor },
];

export default function AgriculturaAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Agricultura</h1>
        <p className="text-muted-foreground mt-1">Gestão dos produtores, propriedades e serviços rurais do município.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {AREAS.map((area) => (
          <Link key={area.href} href={area.href} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <area.icon className="h-5 w-5 text-green-600" />
                  {area.title}
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardTitle>
                <CardDescription>{area.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
