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
    <div className="w-full min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{departmentName || 'Servicos disponiveis'}</p>
          <p className="text-xs text-slate-500">Os servicos estao agrupados por categoria. Deslize lateralmente para explorar.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
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
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: catColor.primary }}
        />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: catColor.primary }}>
          {categoryName}
        </span>
        <span className="text-[10px] text-gray-400">
          ({services.length})
        </span>
      </div>

      <div className="relative group">
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
          className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {services.map((service) => {
            const estimatedDays = service.metadata?.estimatedDays;
            const requiresDocs = service.metadata?.requiresDocuments;

            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="flex-shrink-0 snap-start w-[240px] rounded-2xl border bg-white p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left flex flex-col gap-3"
                style={{ borderColor: catColor.primary + '40' }}
              >
                <div className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2 min-h-[40px]">
                  {service.label}
                </div>

                {service.description && (
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug min-h-[32px]">
                    {service.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-[10px] text-gray-500">
                  <div className="flex items-center gap-3">
                    {estimatedDays !== undefined && estimatedDays !== null && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{estimatedDays > 0 ? `${estimatedDays} dias` : 'Prazo variavel'}</span>
                      </div>
                    )}
                    {requiresDocs && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Documentos</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="rounded-full px-2 py-1 text-[10px] font-medium"
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
