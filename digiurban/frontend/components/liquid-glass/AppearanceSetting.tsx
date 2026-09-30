'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useLgTheme, type ThemePreference } from '@/lib/lg-theme';
import { cn } from '@/lib/utils';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Automático', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
];

/**
 * Aparência: Automático (segue o aparelho) · Claro · Escuro.
 * O botão de tema no topo fixa claro/escuro; aqui a pessoa volta ao automático.
 */
export function AppearanceSetting() {
  const { preference, choose } = useLgTheme();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">Aparência</p>
        <p className="text-sm text-gray-600">Automático segue o claro ou escuro do seu aparelho.</p>
      </div>
      <div role="radiogroup" aria-label="Aparência" className="flex gap-1 p-1 rounded-full bg-[var(--lg-fill)] self-start sm:self-auto">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-[var(--lg-surface)] text-[var(--lg-ink)] shadow-sm' : 'text-[var(--lg-ink2)] hover:text-[var(--lg-ink)]'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
