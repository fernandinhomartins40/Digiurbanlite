'use client';

import { Award, ArrowUpCircle } from 'lucide-react';

interface RegistrationLevelBadgeProps {
  level: 'BRONZE' | 'SILVER' | 'GOLD';
  onUpgradeClick: () => void;
}

export function RegistrationLevelBadge({ level, onUpgradeClick }: RegistrationLevelBadgeProps) {
  const levelConfig = {
    BRONZE: {
      label: 'Bronze',
      color: 'from-amber-700 to-amber-600',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: '🥉'
    },
    SILVER: {
      label: 'Prata',
      color: 'from-gray-500 to-gray-400',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: '🥈'
    },
    GOLD: {
      label: 'Ouro',
      color: 'from-yellow-500 to-yellow-400',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: '🥇'
    }
  };

  const config = levelConfig[level];

  return (
    <div className="flex items-center gap-2">
      {/* Badge do Nível */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full border
          ${config.bgColor} ${config.borderColor}
        `}
      >
        <span className="text-base">{config.icon}</span>
        <span className={`text-xs font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Botão de Upgrade (apenas se não for GOLD) */}
      {level !== 'GOLD' && (
        <button
          onClick={onUpgradeClick}
          className="
            flex items-center gap-1 px-2 py-1 rounded-md
            text-xs font-medium text-blue-600
            hover:bg-blue-50 hover:text-blue-700
            transition-colors
          "
          title="Solicitar aumento de nível"
        >
          <ArrowUpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Aumentar Nível</span>
        </button>
      )}
    </div>
  );
}
