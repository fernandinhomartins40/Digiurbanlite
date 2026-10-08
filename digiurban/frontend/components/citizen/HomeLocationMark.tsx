'use client';

/**
 * "Marcar minha casa no mapa" (perfil do cidadão). O ponto vem do GPS do
 * celular ou do alfinete tocado/arrastado pela pessoa — fica guardado sem prazo
 * e é usado nos próximos pedidos no mesmo endereço.
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Check, Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PinConfirmMap = dynamic(() => import('@/components/maps/PinConfirmMap'), {
  ssr: false,
  loading: () => <div className="h-[260px] w-full rounded-lg bg-gray-100" />,
});

interface Status {
  address: string | null;
  confirmed: boolean;
  latitude?: number;
  longitude?: number;
  source?: 'GPS' | 'PIN';
  suggestion?: { latitude: number; longitude: number } | null;
}

async function save(latitude: number, longitude: number, source: 'GPS' | 'PIN') {
  const res = await fetch('/api/citizen/location/home', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude, source }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Não foi possível guardar');
  return data;
}

export function HomeLocationMark() {
  const [status, setStatus] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/citizen/location/home', { credentials: 'include' });
      if (res.ok) setStatus(await res.json());
    } catch {
      // sem internet: só não mostra
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!status || !status.address) return null;

  const start = () => {
    const initial = status.confirmed && status.latitude !== undefined ? { latitude: status.latitude, longitude: status.longitude! } : status.suggestion || null;
    setPoint(initial);
    setOpen(true);
  };

  const confirm = async (next: { latitude: number; longitude: number }, source: 'GPS' | 'PIN') => {
    setBusy(true);
    try {
      await save(next.latitude, next.longitude, source);
      setPoint(next);
      toast.success('Casa marcada no mapa');
      await load();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      toast.error('Seu aparelho não informa a localização');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setOpen(true);
        confirm(next, 'GPS');
      },
      () => {
        setBusy(false);
        toast.error('Não foi possível pegar sua localização. Verifique a permissão do navegador.');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {status.confirmed ? (
        <p className="flex items-center gap-1.5 text-sm text-green-700">
          <Check className="h-4 w-4" /> Casa marcada no mapa {status.source === 'GPS' ? '(pelo GPS)' : ''}
        </p>
      ) : (
        <p className="text-sm text-gray-600">Marque sua casa no mapa para a equipe chegar no endereço certo.</p>
      )}

      {!open ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={start}>
            <MapPin className="mr-1 h-4 w-4" /> {status.confirmed ? 'Ver ou corrigir no mapa' : 'Marcar minha casa no mapa'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={useGps} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Navigation className="mr-1 h-4 w-4" />} Estou em casa: usar minha localização
          </Button>
        </div>
      ) : point ? (
        <div className="space-y-2">
          <PinConfirmMap point={point} confirmed={status.confirmed} onConfirm={(next) => confirm(next, 'PIN')} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={useGps} disabled={busy}>
              <Navigation className="mr-1 h-4 w-4" /> Usar minha localização
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">Não achamos seu endereço no mapa. Se estiver em casa, use sua localização.</p>
          <Button type="button" variant="outline" size="sm" onClick={useGps} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Navigation className="mr-1 h-4 w-4" />} Usar minha localização
          </Button>
        </div>
      )}
    </div>
  );
}
