'use client';

/**
 * ============================================================================
 * PREVIEW AO VIVO DA LANDING DO MUNICÍPIO
 * ============================================================================
 * Mini-representação da landing (components/landing/MunicipioLanding) que
 * reage em tempo real às cores/logo em edição no painel de identidade visual.
 * Não busca dados — recebe branding + nome por props.
 */

import { ArrowRight, FileText, Clock, MessageSquare, LogIn, UserCog } from 'lucide-react';

interface Props {
  nome: string;
  nomeMunicipio: string;
  ufMunicipio?: string;
  primary: string;
  secondary: string;
  logoUrl?: string | null;
}

export function LandingPreview({ nome, nomeMunicipio, ufMunicipio, primary, secondary, logoUrl }: Props) {
  const municipio = nomeMunicipio || nome;
  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm text-[11px] leading-tight select-none pointer-events-none">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: `${primary}22` }}>
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-5 w-auto max-w-[80px] object-contain" />
          ) : (
            <div className="h-5 w-5 rounded flex items-center justify-center text-white font-bold text-[10px]" style={{ background: primary }}>
              {municipio.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold" style={{ color: primary }}>{nome || 'Prefeitura'}</div>
            <div className="text-gray-400 text-[9px]">{municipio}{ufMunicipio ? `/${ufMunicipio}` : ''}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="rounded px-2 py-0.5 text-white text-[9px] flex items-center gap-0.5" style={{ background: primary }}>
            <LogIn className="h-2.5 w-2.5" /> Entrar
          </span>
          <span className="rounded px-2 py-0.5 border text-[9px]" style={{ borderColor: primary, color: primary }}>Cadastrar</span>
        </div>
      </div>

      {/* hero */}
      <div className="px-3 py-4" style={{ background: `linear-gradient(135deg, ${primary}0d, ${secondary}0d)` }}>
        <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-medium mb-1.5" style={{ background: `${secondary}22`, color: primary }}>
          Portal do Cidadão
        </span>
        <div className="font-bold text-gray-900 text-[13px] leading-snug">
          Os serviços de <span style={{ color: primary }}>{municipio}</span> na palma da mão
        </div>
        <p className="text-gray-500 text-[10px] mt-1">Solicite serviços e acompanhe seus protocolos online.</p>
        <div className="mt-2 flex gap-1.5">
          <span className="rounded px-2.5 py-1 text-white text-[9px] font-semibold flex items-center gap-0.5" style={{ background: primary }}>
            Acessar <ArrowRight className="h-2.5 w-2.5" />
          </span>
          <span className="rounded px-2.5 py-1 border text-[9px] font-semibold" style={{ borderColor: primary, color: primary }}>Criar conta</span>
        </div>
      </div>

      {/* serviços */}
      <div className="px-3 py-3">
        <div className="font-semibold text-gray-800 mb-1.5">Serviços disponíveis</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[FileText, Clock, MessageSquare].map((Icon, i) => (
            <div key={i} className="rounded-lg border p-1.5" style={{ borderColor: `${primary}1f` }}>
              <div className="h-5 w-5 rounded flex items-center justify-center mb-1" style={{ background: `${primary}14`, color: primary }}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="h-1.5 rounded bg-gray-200 w-4/5 mb-0.5" />
              <div className="h-1.5 rounded bg-gray-100 w-3/5" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 py-3 text-center text-white" style={{ background: primary }}>
        <div className="font-bold text-[12px]">Comece agora</div>
        <span className="inline-block mt-1 rounded px-2.5 py-1 bg-white text-[9px] font-semibold" style={{ color: primary }}>
          Criar minha conta
        </span>
      </div>

      {/* rodapé */}
      <div className="px-3 py-1.5 border-t flex items-center justify-between text-gray-400 text-[9px]" style={{ borderColor: `${primary}22` }}>
        <span>{nome || 'Prefeitura'} — Governo Digital</span>
        <span className="flex items-center gap-0.5"><UserCog className="h-2.5 w-2.5" /> Servidores</span>
      </div>
    </div>
  );
}

export default LandingPreview;
