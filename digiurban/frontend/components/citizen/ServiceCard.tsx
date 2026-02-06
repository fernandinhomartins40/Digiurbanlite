'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, GraduationCap, Handshake, Theater, ShieldCheck, BarChart3, Leaf, ClipboardList } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimatedDays?: number;
  requiresDocuments: boolean;
  department: {
    id: string;
    name: string;
  };
  priority: number;
  icon?: string;
  color?: string;
  _count?: {
    protocols: number;
  };
}

interface ServiceCardProps {
  service: Service;
  onRequestService?: (serviceId: string) => void;
  showStats?: boolean;
  className?: string;
}

export function ServiceCard({
  service,
  onRequestService,
  showStats = false,
  className
}: ServiceCardProps) {
  const handleRequestClick = () => {
    if (onRequestService) {
      onRequestService(service.id);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'saúde':
        return <Stethoscope className="h-6 w-6 text-red-500" />;
      case 'educação':
        return <GraduationCap className="h-6 w-6 text-blue-500" />;
      case 'assistência social':
        return <Handshake className="h-6 w-6 text-purple-500" />;
      case 'cultura':
        return <Theater className="h-6 w-6 text-pink-500" />;
      case 'segurança':
        return <ShieldCheck className="h-6 w-6 text-indigo-500" />;
      case 'planejamento':
        return <BarChart3 className="h-6 w-6 text-cyan-500" />;
      case 'meio ambiente':
        return <Leaf className="h-6 w-6 text-green-500" />;
      default:
        return <ClipboardList className="h-6 w-6 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-600';
    if (priority >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100">
              {service.icon ? (
                <span className="text-xl">{service.icon}</span>
              ) : (
                getCategoryIcon(service.category)
              )}
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">
                {service.name}
              </CardTitle>
              {service.category && (
                <p className="text-sm text-muted-foreground mt-1">
                  {service.category}
                </p>
              )}
            </div>
          </div>

          {service.priority > 1 && (
            <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(service.priority)}`}>
              Prioridade {service.priority}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {service.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {service.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Departamento:</span>
            <span className="font-medium">{service.department.name}</span>
          </div>

          {service.estimatedDays && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prazo estimado:</span>
              <span className="font-medium">
                {service.estimatedDays} {service.estimatedDays === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Documentos:</span>
            <span className={`font-medium ${service.requiresDocuments ? 'text-orange-600' : 'text-green-600'}`}>
              {service.requiresDocuments ? 'Necessários' : 'Não necessários'}
            </span>
          </div>

          {showStats && service._count && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solicitações:</span>
              <span className="font-medium">{service._count.protocols}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleRequestClick}
            className="flex-1"
            size="sm"
          >
            Solicitar Serviço
          </Button>

          <Link href={`/cidadao/servicos/${service.id}`}>
            <Button variant="outline" size="sm">
              Detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}