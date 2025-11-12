'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

interface Protocol {
  id: string;
  number: string;
  title: string;
  status: 'VINCULADO' | 'PROGRESSO' | 'ATUALIZACAO' | 'CONCLUIDO' | 'PENDENCIA';
  service: {
    id: string;
    name: string;
    category?: string;
  };
  department: {
    id: string;
    name: string;
  };
  citizen: {
    id: string;
    name: string;
    cpf: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  history?: any[];
  _count?: {
    history: number;
    evaluations: number;
  };
}

interface ProtocolCardProps {
  protocol: Protocol;
  showCitizen?: boolean;
  onClick?: (protocolId: string) => void;
  className?: string;
}

export function ProtocolCard({
  protocol,
  showCitizen = false,
  onClick,
  className
}: ProtocolCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(protocol.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VINCULADO':
        return '🔗';
      case 'PROGRESSO':
        return '⚙️';
      case 'ATUALIZACAO':
        return '🔄';
      case 'CONCLUIDO':
        return '✅';
      case 'PENDENCIA':
        return '⏳';
      default:
        return '📄';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'saúde':
        return '🏥';
      case 'educação':
        return '🎓';
      case 'assistência social':
        return '🤝';
      case 'cultura':
        return '🎭';
      case 'segurança':
        return '🚔';
      case 'planejamento':
        return '📊';
      case 'meio ambiente':
        return '🌱';
      default:
        return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {getCategoryIcon(protocol.service.category)}
            </span>
            <div>
              <CardTitle className="text-lg leading-tight">
                Protocolo {protocol.number}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {protocol.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon(protocol.status)}</span>
            <StatusBadge status={protocol.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Serviço:</span>
            <span className="font-medium text-right max-w-[60%] truncate">
              {protocol.service.name}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Departamento:</span>
            <span className="font-medium text-right max-w-[60%] truncate">
              {protocol.department.name}
            </span>
          </div>

          {showCitizen && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solicitante:</span>
              <span className="font-medium text-right max-w-[60%] truncate">
                {protocol.citizen.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Criado em:</span>
            <span className="font-medium">{formatDate(protocol.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Última atualização:</span>
            <span className="font-medium">{getTimeAgo(protocol.updatedAt)}</span>
          </div>

          {protocol.dueDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prazo:</span>
              <span className="font-medium">{formatDate(protocol.dueDate)}</span>
            </div>
          )}

          {protocol._count && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Atualizações:</span>
              <span className="font-medium">{protocol._count.history}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/cidadao/protocolos/${protocol.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Ver Detalhes
            </Button>
          </Link>

          {protocol.status === 'CONCLUIDO' && protocol._count?.evaluations === 0 && (
            <Button variant="default" size="sm">
              Avaliar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProtocolCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}