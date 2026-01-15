/**
 * ============================================================================
 * CATEGORY BADGE COMPONENT
 * ============================================================================
 * Badge visual para exibir categoria de cidadão
 */

import React from 'react';
import { CitizenCategory } from '@/types/citizen-categories';
import * as LucideIcons from 'lucide-react';

interface CategoryBadgeProps {
  category: CitizenCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
  className = '',
  onClick,
}) => {
  // Tamanhos
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  // Obter ícone dinamicamente
  const IconComponent = showIcon && category.icon
    ? (LucideIcons as any)[category.icon.charAt(0).toUpperCase() + category.icon.slice(1).replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())]
    : null;

  // Estilo inline com cor da categoria
  const badgeStyle: React.CSSProperties = {
    backgroundColor: category.color ? `${category.color}15` : '#f3f4f6',
    borderColor: category.color || '#d1d5db',
    color: category.color || '#374151',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border font-medium
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      style={badgeStyle}
      onClick={onClick}
      title={category.description || category.name}
    >
      {showIcon && IconComponent && (
        <IconComponent size={iconSizes[size]} />
      )}
      <span>{category.name}</span>
    </span>
  );
};

export default CategoryBadge;
