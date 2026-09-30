'use client';

import { Moon, Sun } from 'lucide-react';
import { useLgTheme } from '@/lib/lg-theme';
import { cn } from '@/lib/utils';

/** Botão de tema (lua/sol): fixa claro ou escuro por cima do automático do aparelho */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { dark, toggle } = useLgTheme();
  const label = dark ? 'Usar tema claro' : 'Usar tema escuro';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn('lg-tab h-10 w-10 rounded-full flex items-center justify-center', className)}
    >
      {dark ? <Sun className="h-[19px] w-[19px]" /> : <Moon className="h-[19px] w-[19px]" />}
    </button>
  );
}
