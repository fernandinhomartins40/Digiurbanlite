'use client';

/**
 * GlassView — a mesma ideia (e as mesmas propriedades) do `GlassView` do
 * `expo-glass-effect`, para o site.
 *
 * O `expo-glass-effect` é do React Native: no iPhone com iOS 26 ele usa o
 * vidro nativo (UIGlassEffect); no navegador ele vira uma caixa comum, sem
 * efeito. Aqui o efeito é refeito na web: lente na borda (refração), desfoque
 * leve, brilho especular e toque interativo — ver `lib/liquid-glass/`.
 *
 *   <GlassView glassEffectStyle="regular" isInteractive className="rounded-full p-2">…</GlassView>
 *
 * Regras do produto: vidro só na navegação (barras, botões flutuantes, menus),
 * nunca vidro sobre vidro.
 */

import { forwardRef, useEffect, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { startLiquidGlass } from '@/lib/liquid-glass/runtime';

export { isLiquidGlassAvailable } from '@/lib/liquid-glass/runtime';

export type GlassEffectStyle = 'clear' | 'regular' | 'thick';

export interface GlassViewProps extends HTMLAttributes<HTMLDivElement> {
  /** 'clear' = mais transparente (ícones/botões); 'regular' = barras com texto; 'thick' = folhas grandes e menus */
  glassEffectStyle?: GlassEffectStyle;
  /** Cor que tinge o vidro (ação principal). Ex.: '#0a7cff' */
  tintColor?: string;
  /** Cresce com mola e acende brilho no ponto do toque */
  isInteractive?: boolean;
}

const STYLE_CLASS: Record<GlassEffectStyle, string> = {
  clear: '',
  regular: 'lg-bar',
  thick: 'lg-thick',
};

export const GlassView = forwardRef<HTMLDivElement, GlassViewProps>(function GlassView(
  { glassEffectStyle = 'regular', tintColor, isInteractive, className, style, ...rest },
  ref
) {
  useEffect(() => startLiquidGlass(), []);

  return (
    <div
      ref={ref}
      data-lg-variant={glassEffectStyle}
      className={cn('lg-glass', STYLE_CLASS[glassEffectStyle], tintColor && 'lg-glass-tint', isInteractive && 'lg-interactive', className)}
      style={tintColor ? ({ ...style, '--lg-tint': tintColor } as CSSProperties) : style}
      {...rest}
    />
  );
});
