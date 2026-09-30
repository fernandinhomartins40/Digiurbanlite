'use client';

/**
 * Fundo das telas de login (DigiUrban Glass): manchas de cor da prefeitura que
 * o vidro "pega" e o botão de tema no canto. O formulário fica numa folha de
 * vidro (`lg-glass lg-thick`), como as telas de entrada do iOS 26.
 *
 * `withThemeScope`: liga o tema claro/escuro quando o painel da tela ainda não
 * o faz (ex.: super-admin).
 */

import { useLgThemeScope } from '@/lib/lg-theme';
import { LgAmbient } from './LgAmbient';
import { ThemeToggleButton } from './ThemeToggleButton';

function ThemeScope() {
  useLgThemeScope();
  return null;
}

export function LgAuthBackdrop({
  primary = '#3B9BFF',
  secondary = '#FF5FA8',
  withThemeScope = false,
}: {
  primary?: string;
  secondary?: string;
  withThemeScope?: boolean;
}) {
  return (
    <>
      {withThemeScope && <ThemeScope />}
      <LgAmbient colors={[primary, secondary, '#3DDC84']} />
      <div className="fixed top-3 right-3 z-40 lg-glass lg-bar rounded-full p-1">
        <ThemeToggleButton />
      </div>
    </>
  );
}
