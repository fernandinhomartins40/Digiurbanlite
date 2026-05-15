'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCategoryColor } from '@/lib/department-colors';

interface ServiceOption {
  id: string;
  label: string;
  description?: string;
  metadata?: {
    category?: string;
    estimatedDays?: number;
    requiresDocuments?: boolean;
    serviceType?: string;
  };
}

interface CategoryGroup {
  name: string;
  services: ServiceOption[];
}

interface ServiceCarouselProps {
  options: ServiceOption[];
  categories?: CategoryGroup[];
  departmentName?: string;
  onSelect: (option: ServiceOption) => void;
}

function groupByCategory(options: ServiceOption[]): CategoryGroup[] {
  const grouped: Record<string, ServiceOption[]> = {};
  for (const opt of options) {
    const cat = opt.metadata?.category || 'Geral';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(opt);
  }
  return Object.entries(grouped).map(([name, services]) => ({ name, services }));
}

export function ServiceCarousel({ options, categories, departmentName, onSelect }: ServiceCarouselProps) {
  const groups = categories && categories.length > 0
    ? categories.map(cat => ({
        name: cat.name,
        services: cat.services,
      }))
    : groupByCategory(options);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:p-4 shadow-sm overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{departmentName || 'Servicos disponiveis'}</p>
          <p className="text-xs text-slate-500 break-words">Os servicos estao agrupados por categoria. Deslize lateralmente para explorar.</p>
        </div>
        <div className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 min-[380px]:block">
          {options.length} servicos
        </div>
      </div>

      {groups.map((group) => (
        <CategorySection
          key={group.name}
          categoryName={group.name}
          services={group.services}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function CategorySection({
  categoryName,
  services,
  onSelect,
}: {
  categoryName: string;
  services: ServiceOption[];
  onSelect: (option: ServiceOption) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const catColor = getCategoryColor(categoryName);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -260 : 260,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-center gap-2 px-1">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: catColor.primary }}
        />
        <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide" style={{ color: catColor.primary }}>
          {categoryName}
        </span>
        <span className="text-[10px] text-gray-400">
          ({services.length})
        </span>
      </div>

      <div className="relative group w-full min-w-0 max-w-full overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-white/95 shadow-md md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div
          ref={scrollRef}
          className="flex w-full min-w-0 max-w-full gap-2.5 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide px-0.5 py-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', contain: 'inline-size' }}
        >
          {services.map((service) => {
            const estimatedDays = service.metadata?.estimatedDays;
            const requiresDocs = service.metadata?.requiresDocuments;

            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="snap-start min-w-0 max-w-full rounded-xl border bg-white p-3 sm:p-4 transition-shadow duration-200 hover:shadow-md active:scale-[0.99] cursor-pointer text-left flex flex-col gap-3 overflow-hidden"
                style={{ borderColor: catColor.primary + '40', flex: '0 0 min(100%, 240px)' }}
              >
                <div className="min-w-0 font-semibold text-sm text-gray-800 leading-tight line-clamp-2 min-h-[40px] break-words [overflow-wrap:anywhere]">
                  {service.label}
                </div>

                {service.description && (
                  <p className="min-w-0 text-[11px] text-gray-500 line-clamp-2 leading-snug min-h-[32px] break-words [overflow-wrap:anywhere]">
                    {service.description}
                  </p>
                )}

                <div className="mt-auto flex min-w-0 flex-col items-start gap-2 pt-1 text-[10px] text-gray-500 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                  <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-3 gap-y-1">
                    {estimatedDays !== undefined && estimatedDays !== null && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap">{estimatedDays > 0 ? `${estimatedDays} dias` : 'Prazo variavel'}</span>
                      </div>
                    )}
                    {requiresDocs && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap">Documentos</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="max-w-full shrink-0 rounded-full px-2 py-1 text-[10px] font-medium"
                    style={{ backgroundColor: `${catColor.primary}15`, color: catColor.primary }}
                  >
                    Selecionar
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-white/95 shadow-md md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default ServiceCarousel;
