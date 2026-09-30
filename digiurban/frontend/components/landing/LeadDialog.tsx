'use client';

/**
 * Formulário da landing (pedido de demonstração / falar com especialista).
 * Grava em POST /api/leads — o pedido aparece em Super-admin › Leads.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export type LeadKind = 'demo' | 'contact';

export async function sendLead(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Não foi possível enviar agora. Tente de novo em instantes.');
  }
}

const LeadContext = createContext<(kind: LeadKind) => void>(() => undefined);
export const useOpenLead = () => useContext(LeadContext);

const TITLES: Record<LeadKind, { title: string; text: string; button: string }> = {
  demo: {
    title: 'Solicitar uma demonstração',
    text: 'Conte quem é você e da prefeitura. Nossa equipe entra em contato para agendar.',
    button: 'Solicitar demonstração',
  },
  contact: {
    title: 'Falar com um especialista',
    text: 'Deixe seu contato e o que precisa. Um especialista responde em breve.',
    button: 'Enviar mensagem',
  },
};

export function LeadDialogProvider({ children }: { children: React.ReactNode }) {
  const [kind, setKind] = useState<LeadKind | null>(null);
  const open = useCallback((k: LeadKind) => setKind(k), []);
  return (
    <LeadContext.Provider value={open}>
      {children}
      {kind && <LeadDialog kind={kind} onClose={() => setKind(null)} />}
    </LeadContext.Provider>
  );
}

function LeadDialog({ kind, onClose }: { kind: LeadKind; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', position: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const copy = TITLES[kind];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      await sendLead({ kind, ...form });
      setStatus('sent');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const field =
    'w-full rounded-xl border border-[#c9dcf5] bg-white/85 px-3.5 py-2.5 text-[15px] text-[#122f6e] outline-none placeholder:text-[#8ea0bb] focus:border-[#1673f0] focus:ring-2 focus:ring-[#1673f0]/20';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={copy.title}>
      <button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default bg-[#0b2a8c]/25" onClick={onClose} />
      <div className="dl-glass dl-sheet dl-rim relative w-full max-w-[460px] rounded-[28px] p-5 sm:p-6">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[#1b3f86] hover:bg-white/80">
          <X className="h-5 w-5" />
        </button>
        {status === 'sent' ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#12c9c9]" />
            <p className="dl-h mt-3 text-[22px]">Recebemos seu pedido!</p>
            <p className="mt-1.5 text-[15px]">Nossa equipe vai falar com você pelo e-mail {form.email}.</p>
            <button type="button" onClick={onClose} className="dl-btn dl-btn-blue mt-5 h-[44px] rounded-xl px-6 text-[15px]">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="pr-8">
              <p className="dl-h text-[22px]">{copy.title}</p>
              <p className="mt-1 text-[14px]">{copy.text}</p>
            </div>
            <input required minLength={2} value={form.name} onChange={set('name')} placeholder="Seu nome" autoComplete="name" className={field} />
            <input required type="email" value={form.email} onChange={set('email')} placeholder="Seu e-mail" autoComplete="email" className={field} />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.phone} onChange={set('phone')} placeholder="Telefone" autoComplete="tel" className={field} />
              <input value={form.position} onChange={set('position')} placeholder="Cargo" className={field} />
            </div>
            <input value={form.company} onChange={set('company')} placeholder="Prefeitura / município" className={field} />
            <textarea value={form.message} onChange={set('message')} placeholder="Mensagem (opcional)" rows={3} className={`${field} resize-none`} />
            {/* Armadilha para robôs: invisível para pessoas */}
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={form.website}
              onChange={set('website')}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              name="website"
            />
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[14px] text-red-700">{error}</p>}
            <button type="submit" disabled={status === 'sending'} className="dl-btn dl-btn-teal h-[48px] w-full rounded-xl text-[16px] disabled:opacity-70">
              {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy.button}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
