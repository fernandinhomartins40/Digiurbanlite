'use client';

/**
 * ============================================================================
 * TROCA DE MUNICÍPIO (cidadão com cadastro em 2+ prefeituras)
 * ============================================================================
 * Só aparece quando o CPF do cidadão logado tem vínculo em mais de um
 * município. Lista as prefeituras e troca a sessão SEM redigitar senha
 * (POST /api/auth/citizen/switch-municipio re-emite o cookie).
 * Uma sessão = um município: ao trocar, recarrega o portal no novo contexto.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Check, Loader2, ArrowLeftRight } from 'lucide-react';

interface Municipio {
  citizenId: string;
  tenantId: string | null;
  slug: string | null;
  nome: string;
  nomeMunicipio: string;
  ufMunicipio: string;
  current: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export function MunicipioSwitcher() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/citizen/auth/municipios`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMunicipios(data.municipios || []);
        }
      } catch {
        // silencioso — se falhar, o card simplesmente não aparece
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Só faz sentido com 2+ municípios
  if (loading || municipios.length < 2) return null;

  const switchTo = async (m: Municipio) => {
    if (m.current || !m.tenantId) return;
    setSwitching(m.tenantId);
    try {
      const res = await fetch(`${API}/citizen/auth/switch-municipio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenantId: m.tenantId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Se cada município tem subdomínio próprio, ir para ele; senão recarrega.
        const base = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN;
        if (data.slug && base && typeof window !== 'undefined') {
          const proto = window.location.protocol;
          window.location.href = `${proto}//${data.slug}.${base}/cidadao`;
        } else if (typeof window !== 'undefined') {
          // grava a seleção (o backend também lê o cookie de slug no domínio raiz)
          if (data.slug) document.cookie = `digiurban_tenant_slug=${data.slug}; path=/; SameSite=Lax`;
          window.location.href = '/cidadao';
        }
      } else {
        setSwitching(null);
      }
    } catch {
      setSwitching(null);
    }
  };

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-blue-900">
          <ArrowLeftRight className="h-4 w-4" /> Trocar de município
        </div>
        <p className="text-xs text-blue-800/70 mb-3">
          Seu CPF está cadastrado em mais de uma prefeitura. Escolha qual deseja acessar.
        </p>
        <div className="space-y-2">
          {municipios.map((m) => (
            <button
              key={m.tenantId || m.citizenId}
              onClick={() => switchTo(m)}
              disabled={m.current || !!switching}
              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                m.current ? 'border-blue-400 bg-white cursor-default' : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{m.nome}</div>
                  <div className="text-xs text-gray-500">{m.nomeMunicipio}{m.ufMunicipio ? `/${m.ufMunicipio}` : ''}</div>
                </div>
              </div>
              {m.current ? (
                <span className="flex items-center gap-1 text-xs font-medium text-blue-700"><Check className="h-3.5 w-3.5" /> atual</span>
              ) : switching === m.tenantId ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <span className="text-xs text-blue-600">acessar</span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default MunicipioSwitcher;
