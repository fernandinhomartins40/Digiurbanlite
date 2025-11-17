'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface ProtocolBadgeProps {
  protocol: string;
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
}

export function ProtocolBadge({
  protocol,
  variant = 'secondary',
  showIcon = true
}: ProtocolBadgeProps) {
  return (
    <Badge variant={variant} className="font-mono">
      {showIcon && <FileText className="h-3 w-3 mr-1" />}
      {protocol}
    </Badge>
  );
}
