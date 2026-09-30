'use client';

/**
 * Tema claro/escuro dos painéis DigiUrban Glass.
 *
 * Decisão do produto: por padrão segue o aparelho (Apple HIG › Dark Mode), e a
 * pessoa pode fixar claro ou escuro pelo botão de tema. A escolha fica no
 * navegador (localStorage). Aplicado no <html> só enquanto um painel que já
 * adotou o visual novo está aberto (hoje: portal do cidadão).
 */

import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

import { THEME_STORAGE_KEY } from './lg-theme-boot';

export { THEME_STORAGE_KEY };

const isDarkPreferred = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

// Guarda a escolha também em memória (navegação privada pode bloquear o localStorage)
let memoryPreference: ThemePreference = 'system';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return memoryPreference;
  }
}

export function resolveDark(pref: ThemePreference) {
  return pref === 'dark' || (pref === 'system' && isDarkPreferred());
}

/**
 * Liga o tema no <html> enquanto o painel está aberto e desliga ao sair.
 * Usar UMA vez, no layout persistente do painel (não por página).
 */
export function useLgThemeScope() {
  useEffect(() => {
    const apply = () => document.documentElement.classList.toggle('dark', resolveDark(readThemePreference()));
    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', apply);
    window.addEventListener('digiurban-theme-change', apply);
    return () => {
      media.removeEventListener?.('change', apply);
      window.removeEventListener('digiurban-theme-change', apply);
      document.documentElement.classList.remove('dark');
    };
  }, []);
}

/** Estado e ações do tema para botões e opções de aparência */
export function useLgTheme() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => {
      const pref = readThemePreference();
      setPreference(pref);
      setDark(resolveDark(pref));
    };
    sync();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', sync);
    window.addEventListener('digiurban-theme-change', sync);
    return () => {
      media.removeEventListener?.('change', sync);
      window.removeEventListener('digiurban-theme-change', sync);
    };
  }, []);

  const choose = useCallback((pref: ThemePreference) => {
    memoryPreference = pref;
    try {
      if (pref === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      /* navegação privada: vale só nesta visita */
    }
    window.dispatchEvent(new CustomEvent('digiurban-theme-change', { detail: pref }));
  }, []);

  const toggle = useCallback(() => choose(dark ? 'light' : 'dark'), [choose, dark]);

  return { preference, dark, choose, toggle };
}
