'use client';

import React, { useRef } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Bus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  GraduationCap,
  Handshake,
  HeartPulse,
  Home,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
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

const SERVICE_ICONS: Array<{ patterns: string[]; Icon: LucideIcon }> = [
  { patterns: ['saude', 'consulta', 'medic', 'vacina', 'ubs'], Icon: HeartPulse },
  { patterns: ['educacao', 'escola', 'aluno', 'matricula'], Icon: GraduationCap },
  { patterns: ['esporte', 'atleta', 'ginasio', 'ranking'], Icon: Trophy },
  { patterns: ['agricultura', 'rural', 'produtor', 'propriedade'], Icon: Building2 },
  { patterns: ['assistencia', 'social', 'beneficio', 'cadastro unico'], Icon: Handshake },
  { patterns: ['habitacao', 'moradia', 'imovel'], Icon: Home },
  { patterns: ['agua', 'esgoto', 'drenagem'], Icon: Droplets },
  { patterns: ['transporte', 'transito', 'onibus'], Icon: Bus },
  { patterns: ['seguranca', 'denuncia', 'guarda'], Icon: ShieldCheck },
  { patterns: ['empresa', 'economico', 'alvara'], Icon: BriefcaseBusiness },
  { patterns: ['documento', 'certidao', 'autorizacao', 'licenca'], Icon: FileText },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getServiceIcon(service: ServiceOption, categoryName: string): LucideIcon {
  const haystack = normalizeText(`${service.label} ${service.description || ''} ${categoryName}`);
  return SERVICE_ICONS.find(({ patterns }) => patterns.some((pattern) => haystack.includes(pattern)))?.Icon || FileText;
}

export function ServiceCarousel({ options, categories, departmentName, onSelect }: ServiceCarouselProps) {
  const groups = categories && categories.length > 0
    ? categories.map(cat => ({
        name: cat.name,
        services: cat.services,
      }))
    : groupByCategory(options);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 rounded-lg border border-blue-100 bg-white p-2.5 shadow-sm overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{departmentName || 'Servicos disponiveis'}</p>
          <p className="text-xs text-slate-500 break-words">Os servicos estao agrupados por categoria. Deslize lateralmente para explorar.</p>
        </div>
        <div className="hidden shrink-0 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 min-[380px]:block">
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
          className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-lg bg-white/95 shadow-md md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
            const ServiceIcon = getServiceIcon(service, categoryName);

            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="snap-start min-w-0 max-w-full rounded-lg border bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer text-left flex flex-col gap-3 overflow-hidden"
                style={{
                  borderColor: catColor.primary + '40',
                  background: `linear-gradient(135deg, ${catColor.primary}10 0%, #ffffff 58%)`,
                  flex: '0 0 min(100%, 240px)',
                }}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5"
                    style={{ backgroundColor: `${catColor.primary}16` }}
                  >
                    <ServiceIcon className="h-4 w-4" style={{ color: catColor.primary }} />
                  </div>
                  <div className="min-w-0 font-semibold text-sm text-gray-800 leading-tight line-clamp-2 min-h-[40px] break-words [overflow-wrap:anywhere]">
                    {service.label}
                  </div>
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
                    className="max-w-full shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-black/5"
                    style={{ backgroundColor: `${catColor.primary}18`, color: catColor.primary }}
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
          className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-lg bg-white/95 shadow-md md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default ServiceCarousel;
