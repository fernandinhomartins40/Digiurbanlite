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
  const cleanName = name.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
  return getDepartmentTheme(cleanName);
}

export function DepartmentCarousel({ options, onSelect }: DepartmentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 sm:p-4 shadow-sm overflow-hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Secretarias</p>
          <p className="text-xs text-slate-500 break-words">Deslize para o lado e toque na secretaria desejada.</p>
        </div>
        <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {options.length} opcoes
        </div>
      </div>

      <div className="relative group min-w-0 max-w-full overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden h-9 w-9 rounded-full bg-white/95 shadow-md md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          ref={scrollRef}
          className="flex w-full min-w-0 max-w-full gap-2.5 overflow-x-auto overscroll-x-contain scrollbar-hide px-0.5 py-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {options.map((option) => {
            const displayName = (option.name || option.label || '').replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
            const theme = getDeptTheme(displayName);
            const IconComponent = getDeptIcon(displayName);

            return (
              <button
                key={option.id}
                onClick={() => onSelect(option)}
                className="flex-shrink-0 snap-start w-[min(160px,calc(50vw-24px))] min-w-[132px] max-w-[160px] rounded-2xl border-2 p-3 sm:p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer flex flex-col items-center gap-3 text-center overflow-hidden"
                style={{
                  backgroundColor: theme.light,
                  borderColor: theme.border,
                }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
                  style={{ backgroundColor: theme.primary + '20' }}
                >
                  <IconComponent
                    className="h-7 w-7"
                    style={{ color: theme.primary }}
                  />
                </div>
                <span className="line-clamp-2 max-w-full break-words text-xs font-semibold leading-tight" style={{ color: theme.primary }}>
                  {displayName.replace(/^Secretaria\s*(Municipal\s*de?\s*)?/i, '').trim() || displayName}
                </span>
                <div className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] text-gray-600 shadow-sm">
                  {option.serviceCount || 0} servicos
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden h-9 w-9 rounded-full bg-white/95 shadow-md md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DepartmentCarousel;
