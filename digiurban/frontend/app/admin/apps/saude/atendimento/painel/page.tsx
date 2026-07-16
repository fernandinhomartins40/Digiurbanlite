'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Monitor, Volume2 } from 'lucide-react';

type Chamada = {
  id: string;
  nomePaciente: string;
  consultorio: string;
  mensagem?: string | null;
  exibidoEm: string;
  unidade?: { nome?: string } | null;
};

const POLL_MS = 5000;

export default function PainelChamadasPage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [unidadeId, setUnidadeId] = useState('');
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [modoTV, setModoTV] = useState(false);
  const ultimaChamadaId = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/apps/saude/cadastros/unidades', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.unidades || [];
        setUnidades(lista);
        if (lista.length > 0) setUnidadeId(lista[0].id);
      })
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    if (!unidadeId) return;
    let ativo = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/saude/painel/unidade/${unidadeId}?limit=8`, {
          credentials: 'include',
        });
        if (!res.ok || !ativo) return;
        const data: Chamada[] = await res.json();
        setChamadas(data);

        // Aviso sonoro quando entra chamada nova
        if (data.length > 0 && data[0].id !== ultimaChamadaId.current) {
          if (ultimaChamadaId.current !== null) {
            try {
              const ctx = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
              osc.start();
              osc.stop(ctx.currentTime + 1.2);
            } catch {
              // navegador pode bloquear áudio sem interação — ignorar
            }
          }
          ultimaChamadaId.current = data[0].id;
        }
      } catch {
        // erro de rede transitório — próximo poll tenta de novo
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [unidadeId]);

  const atual = chamadas[0];
  const anteriores = chamadas.slice(1, 6);

  return (
    <div className={modoTV ? 'fixed inset-0 z-50 bg-slate-900 p-8 overflow-auto' : 'p-6 space-y-6'}>
      {/* Controles (ocultos no modo TV) */}
      {!modoTV && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Chamadas</h1>
            <p className="text-gray-500 mt-1">
              Exiba esta tela na TV da recepção — atualiza a cada {POLL_MS / 1000}s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white px-4 py-2 text-sm"
              onClick={() => setModoTV(true)}
            >
              <Monitor className="h-4 w-4" /> Modo TV
            </button>
          </div>
        </div>
      )}

      {modoTV && (
        <button
          className="absolute top-3 right-4 text-slate-500 text-sm hover:text-white"
          onClick={() => setModoTV(false)}
        >
          sair do modo TV
        </button>
      )}

      {/* Chamada atual */}
      <div className={modoTV ? 'mt-6' : ''}>
        <Card
          className={
            modoTV
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'bg-blue-600 text-white border-blue-700'
          }
        >
          <CardContent className="py-12 text-center">
            {atual ? (
              <>
                <div className="flex items-center justify-center gap-3 text-lg opacity-80 mb-4">
                  <Volume2 className="h-6 w-6" />
                  Chamando agora
                </div>
                <div className={modoTV ? 'text-7xl font-extrabold' : 'text-5xl font-extrabold'}>
                  {atual.nomePaciente}
                </div>
                <div className={modoTV ? 'text-4xl mt-6 opacity-90' : 'text-2xl mt-4 opacity-90'}>
                  {atual.consultorio}
                </div>
                {atual.mensagem && (
                  <div className="text-xl mt-3 opacity-75">{atual.mensagem}</div>
                )}
              </>
            ) : (
              <div className="text-3xl opacity-70">Aguardando chamadas...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas chamadas */}
      <div>
        <h2
          className={
            modoTV
              ? 'text-slate-400 text-2xl font-semibold mt-10 mb-4'
              : 'text-lg font-semibold text-gray-700 mb-3'
          }
        >
          Últimas chamadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anteriores.length === 0 ? (
            <div className={modoTV ? 'text-slate-500 text-xl' : 'text-gray-500'}>
              Nenhuma chamada anterior hoje
            </div>
          ) : (
            anteriores.map((c) => (
              <Card
                key={c.id}
                className={modoTV ? 'bg-slate-800 border-slate-700 text-white' : ''}
              >
                <CardContent className="py-4">
                  <div className={modoTV ? 'text-2xl font-bold' : 'text-lg font-bold'}>
                    {c.nomePaciente}
                  </div>
                  <div className={modoTV ? 'text-lg opacity-75' : 'text-sm text-gray-500'}>
                    {c.consultorio} —{' '}
                    {new Date(c.exibidoEm).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
