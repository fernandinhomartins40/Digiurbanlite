'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDepartmentTheme, type DepartmentTheme } from '@/lib/department-colors';
import { departmentConfig } from '@/lib/department-config';

interface DepartmentOption {
  id: string;
  label: string;
  description?: string;
  name?: string;
  serviceCount?: number;
}

interface DepartmentCarouselProps {
  options: DepartmentOption[];
  onSelect: (option: DepartmentOption) => void;
}

function getDeptIcon(name: string) {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/secretaria\s*(municipal\s*de?\s*)?/i, '')
    .trim();

  for (const [slug, config] of Object.entries(departmentConfig)) {
    const configNormalized = config.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/secretaria\s*(municipal\s*de?\s*)?/i, '')
      .trim();

    if (normalized.includes(slug.replace(/-/g, ' ')) || configNormalized.includes(normalized) || normalized.includes(configNormalized)) {
      return config.icon;
    }
  }
  return Building2;
}

function getDeptTheme(name: string): DepartmentTheme {
  const cleanName = name.replace(/🏢\s*/, '').trim();
  return getDepartmentTheme(cleanName);
}

export function DepartmentCarousel({ options, onSelect }: DepartmentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 180;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {options.map((option) => {
            const displayName = (option.name || option.label || '').replace(/🏢\s*/, '').trim();
            const theme = getDeptTheme(displayName);
            const IconComponent = getDeptIcon(displayName);

            return (
              <button
                key={option.id}
                onClick={() => onSelect(option)}
                className="flex-shrink-0 snap-start w-[130px] rounded-xl border-2 p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer flex flex-col items-center gap-2 text-center"
                style={{
                  backgroundColor: theme.light,
                  borderColor: theme.border,
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: theme.primary + '20' }}
                >
                  <IconComponent
                    className="w-7 h-7"
                    style={{ color: theme.primary }}
                  />
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: theme.primary }}>
                  {displayName.replace(/^Secretaria\s*(Municipal\s*de?\s*)?/i, '').trim() || displayName}
                </span>
                {option.serviceCount && (
                  <span className="text-[10px] text-gray-500">
                    {option.serviceCount} serviço{option.serviceCount !== 1 ? 's' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DepartmentCarousel;
