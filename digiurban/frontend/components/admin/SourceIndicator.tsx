'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, UserCircle, Upload } from 'lucide-react';

interface SourceIndicatorProps {
  source: 'service' | 'manual' | 'import';
  showLabel?: boolean;
}

const sourceConfig = {
  service: {
    label: 'Portal do Cidadão',
    icon: Globe,
    variant: 'default' as const,
    color: 'bg-blue-500'
  },
  manual: {
    label: 'Cadastro Manual',
    icon: UserCircle,
    variant: 'secondary' as const,
    color: 'bg-gray-500'
  },
  import: {
    label: 'Importação',
    icon: Upload,
    variant: 'outline' as const,
    color: 'bg-purple-500'
  }
};

export function SourceIndicator({ source, showLabel = true }: SourceIndicatorProps) {
  const config = sourceConfig[source];
  const Icon = config.icon;

  if (!showLabel) {
    return (
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
