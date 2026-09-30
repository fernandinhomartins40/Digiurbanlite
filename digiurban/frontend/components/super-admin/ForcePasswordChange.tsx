'use client';

/**
 * Troca obrigatória de senha após senha temporária (convite ou redefinição
 * na Equipe da plataforma). Bloqueia o console até a pessoa criar a própria.
 */

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';

export function ForcePasswordChange({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError('A nova senha precisa ter pelo menos 8 caracteres.');
    if (next !== confirm) return setError('A confirmação não confere com a nova senha.');
    setSaving(true);
    try {
      const res = await fetch('/api/platform/me/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível trocar a senha');
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full rounded-xl bg-[var(--lg-fill)] px-3.5 py-2.5 text-[15px] text-[var(--lg-ink)] outline-none placeholder:text-[var(--lg-ink3)] focus:ring-2 focus:ring-[var(--lg-blue)]/40';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-label="Crie sua senha">
      <form onSubmit={submit} className="lg-glass lg-thick w-full max-w-sm space-y-3 rounded-[28px] p-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-[var(--lg-blue)]" />
          Crie sua senha
        </div>
        <p className="text-sm text-[var(--lg-ink2)]">Você entrou com uma senha temporária. Para continuar, crie a sua.</p>
        <input type="password" required autoComplete="current-password" placeholder="Senha temporária" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
        <input type="password" required autoComplete="new-password" placeholder="Nova senha (mín. 8 caracteres)" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
        <input type="password" required autoComplete="new-password" placeholder="Repita a nova senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--lg-blue)] py-2.5 font-semibold text-white disabled:opacity-70">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar e continuar
        </button>
      </form>
    </div>
  );
}
