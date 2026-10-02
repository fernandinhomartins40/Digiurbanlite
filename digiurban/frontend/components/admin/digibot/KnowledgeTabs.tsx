'use client';

/** Abas de conhecimento do bot: serviços (palavras do cidadão), perguntas frequentes e "Ensinar o bot" */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BotFaq, BotServiceWithTerms, BotUnanswered, digibotApi } from './api';

function Loading() {
  return (
    <div className="flex items-center justify-center py-10 text-gray-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
    </div>
  );
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-sm text-gray-600">
      <p>Não foi possível carregar: {message}</p>
      <Button variant="outline" size="sm" onClick={retry}>
        Tentar de novo
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- serviços

function ServiceRow({ service, onChanged }: { service: BotServiceWithTerms; onChanged: (s: BotServiceWithTerms) => void }) {
  const { toast } = useToast();
  const [term, setTerm] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (term.trim().length < 2) return;
    setBusy(true);
    try {
      const r = await digibotApi<{ term: { id: string; term: string } }>(`/services/${service.id}/terms`, { method: 'POST', body: JSON.stringify({ term }) });
      onChanged({ ...service, terms: [...service.terms.filter((t) => t.id !== r.term.id), r.term] });
      setTerm('');
    } catch (e: any) {
      toast({ title: 'Não foi possível adicionar', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await digibotApi(`/terms/${id}`, { method: 'DELETE' });
      onChanged({ ...service, terms: service.terms.filter((t) => t.id !== id) });
    } catch (e: any) {
      toast({ title: 'Não foi possível remover', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-gray-900">{service.name}</p>
        <p className="text-xs text-gray-500">{service.department?.name || service.category || ''}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {service.terms.map((t) => (
          <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
            {t.term}
            <button type="button" onClick={() => void remove(t.id)} className="rounded p-0.5 hover:bg-gray-300" aria-label={`Remover ${t.term}`}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Como o cidadão chama isso?" className="h-8 w-56 text-sm" maxLength={60} />
          <Button type="submit" size="sm" variant="outline" className="h-8" disabled={busy || term.trim().length < 2}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ServicesTab() {
  const [services, setServices] = useState<BotServiceWithTerms[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setServices((await digibotApi<{ services: BotServiceWithTerms[] }>('/services')).services);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return (services || []).filter((s) => !f || s.name.toLowerCase().includes(f) || s.terms.some((t) => t.term.includes(f)));
  }, [services, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços e palavras do cidadão</CardTitle>
        <CardDescription>
          O bot já entende variações e erros de digitação. Aqui você ensina os apelidos que o cidadão usa — ex.: "passe escolar" para Cartão do Estudante.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Procurar serviço" className="pl-9" />
        </div>
        {error ? (
          <LoadError message={error} retry={() => void load()} />
        ) : !services ? (
          <Loading />
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Nenhum serviço encontrado.</p>
        ) : (
          shown.map((s) => <ServiceRow key={s.id} service={s} onChanged={(n) => setServices((all) => (all || []).map((x) => (x.id === n.id ? n : x)))} />)
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- perguntas frequentes

const emptyFaq = { question: '', answer: '', keywords: '' };

export function FaqTab() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<BotFaq[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyFaq);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setFaqs((await digibotApi<{ faqs: BotFaq[] }>('/faqs')).faqs);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (faq?: BotFaq) => {
    setEditing(faq ? faq.id : 'new');
    setForm(faq ? { question: faq.question, answer: faq.answer, keywords: faq.keywords.join(', ') } : emptyFaq);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ question: form.question, answer: form.answer, keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean) });
      if (editing === 'new') await digibotApi('/faqs', { method: 'POST', body });
      else await digibotApi(`/faqs/${editing}`, { method: 'PUT', body });
      setEditing(null);
      await load();
      toast({ title: 'Pergunta salva' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (faq: BotFaq, isActive: boolean) => {
    try {
      await digibotApi(`/faqs/${faq.id}`, { method: 'PUT', body: JSON.stringify({ question: faq.question, answer: faq.answer, keywords: faq.keywords, isActive }) });
      setFaqs((all) => (all || []).map((f) => (f.id === faq.id ? { ...f, isActive } : f)));
    } catch (e: any) {
      toast({ title: 'Não foi possível alterar', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (faq: BotFaq) => {
    if (!window.confirm(`Excluir a pergunta "${faq.question}"?`)) return;
    try {
      await digibotApi(`/faqs/${faq.id}`, { method: 'DELETE' });
      setFaqs((all) => (all || []).filter((f) => f.id !== faq.id));
    } catch (e: any) {
      toast({ title: 'Não foi possível excluir', description: e.message, variant: 'destructive' });
    }
  };

  const editor = (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <div className="space-y-1">
        <Label>Pergunta</Label>
        <Input value={form.question} maxLength={200} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Ex.: Qual o horário da prefeitura?" />
      </div>
      <div className="space-y-1">
        <Label>Resposta</Label>
        <Textarea rows={4} value={form.answer} maxLength={2000} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Outras formas de perguntar (separe por vírgula)</Label>
        <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="horário, que horas abre, funcionamento" />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => void save()} disabled={saving || form.question.trim().length < 5 || form.answer.trim().length < 5}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
        <Button variant="ghost" onClick={() => setEditing(null)}>
          Cancelar
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Perguntas frequentes</CardTitle>
          <CardDescription>O bot responde quando o cidadão escreve a pergunta, e elas aparecem em Ajuda.</CardDescription>
        </div>
        {editing === null && (
          <Button size="sm" onClick={() => startEdit()}>
            <Plus className="mr-1 h-4 w-4" /> Nova pergunta
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {editing === 'new' && editor}
        {error ? (
          <LoadError message={error} retry={() => void load()} />
        ) : !faqs ? (
          <Loading />
        ) : (
          faqs.map((faq) =>
            editing === faq.id ? (
              <div key={faq.id}>{editor}</div>
            ) : (
              <div key={faq.id} className={`rounded-xl border p-3 ${faq.isActive ? 'bg-white' : 'bg-gray-50 opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="text-left" onClick={() => startEdit(faq)}>
                    <p className="font-medium text-gray-900">{faq.question}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{faq.answer}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <Switch checked={faq.isActive} onCheckedChange={(v) => void toggle(faq, v)} aria-label="Ativa" />
                    <Button variant="ghost" size="icon" onClick={() => void remove(faq)} aria-label="Excluir">
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- ensinar o bot

function TeachRow({ item, services, onDone }: { item: BotUnanswered; services: BotServiceWithTerms[]; onDone: () => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'service' | 'faq' | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  const resolve = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      await digibotApi(`/unanswered/${item.id}/resolve`, { method: 'POST', body: JSON.stringify(body) });
      toast({ title: ok });
      onDone();
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-gray-900">"{item.text}"</p>
        <span className="text-xs text-gray-500">
          {item.count}× · {new Date(item.lastSeenAt).toLocaleDateString('pt-BR')}
        </span>
      </div>
      {mode === null && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setMode('service')}>
            Era um serviço
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode('faq')}>
            Responder como pergunta frequente
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void resolve({ type: 'ignore' }, 'Ignorado')}>
            <EyeOff className="mr-1 h-4 w-4" /> Ignorar
          </Button>
        </div>
      )}
      {mode === 'service' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Escolha o serviço" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={busy || !serviceId} onClick={() => void resolve({ type: 'service', serviceId, term: item.text.slice(0, 60) }, 'O bot aprendeu este pedido')}>
            Ensinar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
            Cancelar
          </Button>
        </div>
      )}
      {mode === 'faq' && (
        <div className="mt-3 space-y-2">
          <Textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escreva a resposta que o bot deve dar" />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || answer.trim().length < 5} onClick={() => void resolve({ type: 'faq', answer }, 'Pergunta frequente criada')}>
              Salvar resposta
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeachTab({ onTaught }: { onTaught?: () => void }) {
  const [items, setItems] = useState<BotUnanswered[] | null>(null);
  const [services, setServices] = useState<BotServiceWithTerms[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [u, s] = await Promise.all([
        digibotApi<{ items: BotUnanswered[] }>('/unanswered'),
        digibotApi<{ services: BotServiceWithTerms[] }>('/services'),
      ]);
      setItems(u.items);
      setServices(s.services);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ensinar o bot</CardTitle>
        <CardDescription>Frases que o bot não entendeu. Diga o que era e ele passa a entender. Dados pessoais aparecem mascarados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <LoadError message={error} retry={() => void load()} />
        ) : !items ? (
          <Loading />
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Nada pendente. O bot entendeu tudo o que foi perguntado. 🎉</p>
        ) : (
          items.map((item) => (
            <TeachRow
              key={item.id}
              item={item}
              services={services}
              onDone={() => {
                setItems((all) => (all || []).filter((i) => i.id !== item.id));
                onTaught?.();
              }}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
