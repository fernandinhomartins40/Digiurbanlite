'use client';

/** Lupa que abre a paleta "Buscar e fazer" (Ctrl+K), para o topo do painel */

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openCommandPalette } from './CommandPalette';

export function CommandPaletteButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Buscar no painel (Ctrl+K)"
      title="Buscar no painel (Ctrl+K)"
      className={cn('lg-tab h-10 w-10 rounded-full flex items-center justify-center', className)}
    >
      <Search className="h-[19px] w-[19px]" />
    </button>
  );
}
