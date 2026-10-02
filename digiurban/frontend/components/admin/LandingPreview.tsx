'use client';

/**
 * ============================================================================
 * PREVIEW AO VIVO DA LANDING DO MUNICÍPIO
 * ============================================================================
 * Miniatura da landing (components/landing/MunicipioLanding — padrão DigiUrban
 * Glass: topo com a arte da cidade, mascote e painel "Olá, Cidadão!"), que
 * reage em tempo real ao logo, nome e cor de destaque em edição.
 * Não busca dados — recebe branding + nome por props.
 */

import { ArrowRight, ChevronRight, ClipboardList, FilePlus2, FileText, Heart, LogIn, UserCog, UserPlus, Hammer } from 'lucide-react';

interface Props {
  nome: string;
  nomeMunicipio: string;
  ufMunicipio?: string;
  primary: string;
  /** mantido por compatibilidade: o visual atual usa só a cor de destaque */
  secondary?: string;
  logoUrl?: string | null;
}

export function LandingPreview({ nome, nomeMunicipio, ufMunicipio, primary, logoUrl }: Props) {
  const municipio = nomeMunicipio || nome;
  const icon = (Icon: typeof FileText) => (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-[#f1f7ff] to-[#e0edff]" style={{ color: primary }}>
      <Icon className="h-3 w-3" />
    </span>
  );

  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-xl border bg-[#f4f8ff] text-[10px] leading-tight text-[#4d5f80] shadow-sm">
      {/* topo de vidro */}
      <div className="flex items-center justify-between border-b border-white bg-white/80 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-5 w-auto max-w-[70px] object-contain" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-b from-[#f1f7ff] to-[#e0edff] text-[10px] font-bold" style={{ color: primary }}>
              {municipio.charAt(0)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-bold text-[#0b2a8c]">{nome || 'Prefeitura'}</span>
            <span className="block truncate text-[8px]">{municipio}{ufMunicipio ? `/${ufMunicipio}` : ''}</span>
          </span>
        </div>
        <div className="flex gap-1">
          <span className="flex items-center gap-0.5 rounded-md border border-[#a0bee9] bg-white/70 px-1.5 py-0.5 text-[8px] text-[#122f6e]">
            <LogIn className="h-2.5 w-2.5" style={{ color: primary }} /> Entrar
          </span>
          <span className="flex items-center gap-0.5 rounded-md bg-gradient-to-r from-[#3af6d6] to-[#13dbe7] px-1.5 py-0.5 text-[8px] font-semibold text-[#06306e]">
            <UserPlus className="h-2.5 w-2.5" /> Criar conta
          </span>
        </div>
      </div>

      {/* hero com a arte da cidade */}
      <div className="relative overflow-hidden px-3 py-3 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/mobile/fundo-hero.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative grid grid-cols-[1.2fr_1fr] items-end gap-2">
          <div>
            <span className="inline-block rounded-full border border-white/40 bg-white/10 px-1.5 py-0.5 text-[7px]">Portal do Cidadão</span>
            <div className="mt-1 text-[12px] font-bold leading-[1.05]">
              Os serviços de <span className="bg-gradient-to-r from-[#3ff5d9] to-[#20e3ea] bg-clip-text text-transparent">{municipio}</span> na palma da mão
            </div>
            <span className="mt-1.5 inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-[#3af6d6] to-[#13dbe7] px-1.5 py-0.5 text-[8px] font-semibold text-[#06306e]">
              Acessar o portal <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="rounded-lg bg-white/95 p-1.5 text-[#183e7e] shadow">
            <div className="text-[8px] font-bold text-[#0b2a8c]">Olá, Cidadão!</div>
            {[FilePlus2, ClipboardList].map((Icon, i) => (
              <div key={i} className="mt-1 flex items-center gap-1">
                {icon(Icon)}
                <span className="h-1 flex-1 rounded bg-[#dbe7f7]" />
                <ChevronRight className="h-2.5 w-2.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* serviços em cartões de vidro */}
      <div className="px-3 py-2.5">
        <div className="mb-1.5 font-bold text-[#0b2a8c]">Serviços disponíveis</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[Heart, Hammer, FileText].map((Icon, i) => (
            <div key={i} className="rounded-lg border border-[#d0e0f8] bg-white/80 p-1.5">
              {icon(Icon)}
              <div className="mt-1 h-1.5 w-4/5 rounded bg-[#d6e2f3]" />
            </div>
          ))}
        </div>
      </div>

      {/* rodapé */}
      <div className="flex items-center justify-between bg-[#0b1d33] px-3 py-1.5 text-[8px] text-[#b9c7dc]">
        <span className="truncate">{nome || 'Prefeitura'} — Governo Digital</span>
        <span className="flex items-center gap-0.5 text-white">
          <UserCog className="h-2.5 w-2.5" /> Servidores
        </span>
      </div>
    </div>
  );
}

export default LandingPreview;
