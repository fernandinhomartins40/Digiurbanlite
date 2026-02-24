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
    <div className="w-full space-y-4">
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
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div
          className="w-2 h-2 rounded-full"
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-3 w-3" />
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
                className="flex-shrink-0 snap-start w-[200px] rounded-xl border bg-white p-3 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left flex flex-col gap-2"
                style={{ borderColor: catColor.primary + '40' }}
              >
                <div className="font-semibold text-sm text-gray-800 leading-tight line-clamp-2">
                  {service.label}
                </div>

                {service.description && (
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">
                    {service.description.replace(/^.*?•\s*/, '')}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-auto pt-1">
                  {estimatedDays && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{estimatedDays}d</span>
                    </div>
                  )}
                  {requiresDocs && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <FileText className="w-3 h-3" />
                      <span>Docs</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default ServiceCarousel;
