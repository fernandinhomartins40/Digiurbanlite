'use client';

/**
 * Prévia do DigiBot num celular: mostra como o cidadão vê a mensagem de
 * boas-vindas e o menu (do rascunho, se houver) e permite testar uma frase.
 */

import { useState } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BotConfig, BotTestResult, digibotApi } from './api';

export function PhonePreview({ config, isDraft }: { config: BotConfig; isDraft: boolean }) {
  const [text, setText] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<BotTestResult | null>(null);
  const [error, setError] = useState('');

  const test = async () => {
    if (text.trim().length < 2) return;
    setTesting(true);
    setError('');
    try {
      setResult(await digibotApi<BotTestResult>('/test', { method: 'POST', body: JSON.stringify({ text }) }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTesting(false);
    }
  };

  const menu = config.menu.filter((m) => m.enabled);

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[300px] rounded-[2.2rem] border-[10px] border-gray-900 bg-gray-900 shadow-xl">
        <div className="overflow-hidden rounded-[1.6rem] bg-slate-50">
          <div className="flex items-center gap-2 border-b bg-white px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{config.botName}</p>
              <p className="text-[11px] text-gray-500">{isDraft ? 'Prévia do rascunho' : 'Como está no ar'}</p>
            </div>
          </div>
          <div className="max-h-[460px] space-y-2 overflow-y-auto p-3">
            <div className="rounded-lg border border-blue-100 bg-white p-3 text-[13px] leading-5 text-gray-800 shadow-sm">{config.welcomeMessage}</div>
            {menu.map((m) => (
              <div key={m.id} className="rounded-lg border bg-white px-3 py-2 shadow-sm">
                <p className="text-[13px] font-semibold text-gray-900">{m.label}</p>
                {m.description && <p className="text-[11px] text-gray-500">{m.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-3">
        <p className="mb-2 text-sm font-medium text-gray-900">Testar uma frase</p>
        <p className="mb-2 text-xs text-gray-500">Escreva como um cidadão escreveria e veja o que o bot entende (sem IA).</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void test();
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder='Ex.: "quero a carteirinha da escola"' />
          <Button type="submit" size="icon" disabled={testing || text.trim().length < 2} aria-label="Testar">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {result && (
          <div className="mt-3 space-y-2 text-sm">
            {result.faq && (
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-900">
                <p className="text-xs font-semibold">Responde com a pergunta frequente:</p>
                <p className="text-xs">{result.faq.question}</p>
              </div>
            )}
            {result.services.length > 0 ? (
              <div className="rounded-lg bg-blue-50 p-2 text-blue-900">
                <p className="text-xs font-semibold">{result.services.length === 1 ? 'Abre o serviço:' : 'Sugere os serviços:'}</p>
                {result.services.map((s) => (
                  <p key={s.id} className="text-xs">
                    {s.name}
                    {s.department ? ` · ${s.department}` : ''}
                  </p>
                ))}
              </div>
            ) : (
              !result.faq && (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                  O bot não entenderia esta frase. Cadastre essas palavras num serviço (aba Serviços) ou crie uma pergunta frequente.
                </p>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
