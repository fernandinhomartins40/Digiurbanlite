'use client';

/**
 * Buscar e fazer (Ctrl+K / ⌘K): telas do menu (mesmas regras de permissão),
 * pessoas e pedidos (GET /api/admin/search) e ações rápidas.
 * Montar UMA vez no layout do painel. Abre também por `openCommandPalette()`
 * (CustomEvent), de qualquer lugar, sem depender de onde está montado.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, FileText, FolderPlus, Search, Store, User, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/api';
import { getProtocolStatusLabel } from '@/lib/protocol-helpers';
import { useAdminNavigation } from '@/components/admin/navigation/useAdminNavigation';

export const COMMAND_PALETTE_EVENT = 'digiurban:command-palette';

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
}

interface SearchResult {
  citizens: Array<{ id: string; name: string; cpf: string; isActive: boolean }>;
  protocols: Array<{ id: string; number: string; title: string; status: string }>;
  processes: Array<{ id: string; number: string; subject: string; status: string }>;
}

// Cada ação aparece só se a tela de origem está no menu da pessoa (mesma permissão)
const ACTIONS: Array<{ title: string; href: string; menuHref: string; icon: LucideIcon }> = [
  { title: 'Novo atendimento no balcão', href: '/admin/balcao', menuHref: '/admin/balcao', icon: Store },
  { title: 'Novo processo interno', href: '/admin/processos-internos/novo', menuHref: '/admin/processos-internos', icon: FolderPlus },
  { title: 'Nova pesquisa de preços', href: '/admin/pesquisa-precos', menuHref: '/admin/pesquisa-precos', icon: Search },
  { title: 'Novo compromisso', href: '/admin/agenda', menuHref: '/admin/agenda', icon: CalendarPlus },
];

const MIN_CHARS = 3;
const DEBOUNCE_MS = 250;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function CommandPalette() {
  const router = useRouter();
  const { visibleSections, visibleMayorPortalItems } = useAdminNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(COMMAND_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Pessoas e pedidos: espera 250 ms depois da última tecla; resposta velha é ignorada
  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_CHARS) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      apiRequest(`/admin/search?q=${encodeURIComponent(term)}`)
        .then((data: SearchResult) => !cancelled && setResults(data?.citizens ? data : null))
        .catch(() => !cancelled && setResults(null))
        .finally(() => !cancelled && setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const screens = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ title: string; section: string; href: string; icon: LucideIcon }> = [];
    const add = (item: { title: string; href: string; icon: LucideIcon }, section: string) => {
      if (seen.has(item.href)) return;
      seen.add(item.href);
      list.push({ title: item.title, section, href: item.href, icon: item.icon });
    };
    visibleSections.forEach((section) => section.items.forEach((item) => add(item, section.title)));
    visibleMayorPortalItems.forEach((item) => add(item, 'Gabinete'));
    return list;
  }, [visibleSections, visibleMayorPortalItems]);

  const term = normalize(query);
  const matches = (text: string) => !term || normalize(text).includes(term);
  const visibleScreens = screens.filter((screen) => matches(`${screen.title} ${screen.section}`));
  const actions = ACTIONS.filter((action) => seenIn(screens, action.menuHref) && matches(action.title));

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const hasRemote = !!results && (results.citizens.length || results.protocols.length || results.processes.length);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl rounded-2xl">
        <DialogTitle className="sr-only">Buscar no painel</DialogTitle>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar tela, cidadão (nome ou CPF), pedido ou processo..."
            className="h-12 text-base"
          />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>
              {loading ? 'Buscando...' : term.length < MIN_CHARS ? 'Digite o que procura.' : 'Nada encontrado.'}
            </CommandEmpty>

            {hasRemote ? (
              <CommandGroup heading="Pessoas e pedidos">
                {results!.citizens.map((citizen) => (
                  <CommandItem key={`c-${citizen.id}`} value={`c-${citizen.id}`} onSelect={() => go(`/admin/cidadaos/${citizen.id}`)}>
                    <User className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{citizen.name}</span>
                    <span className="ml-auto pl-3 text-xs text-muted-foreground">
                      {citizen.cpf}
                      {!citizen.isActive && ' · inativo'}
                    </span>
                  </CommandItem>
                ))}
                {results!.protocols.map((protocol) => (
                  <CommandItem key={`p-${protocol.id}`} value={`p-${protocol.id}`} onSelect={() => go(`/admin/protocolos/${protocol.id}`)}>
                    <FileText className="mr-2 h-4 w-4 shrink-0" />
                    <span className="shrink-0 font-medium">Pedido {protocol.number}</span>
                    <span className="ml-2 truncate text-muted-foreground">{protocol.title}</span>
                    <span className="ml-auto pl-3 text-xs text-muted-foreground">{getProtocolStatusLabel(protocol.status)}</span>
                  </CommandItem>
                ))}
                {results!.processes.map((process) => (
                  <CommandItem key={`i-${process.id}`} value={`i-${process.id}`} onSelect={() => go(`/admin/processos-internos/${process.id}`)}>
                    <Workflow className="mr-2 h-4 w-4 shrink-0" />
                    <span className="shrink-0 font-medium">{process.number}</span>
                    <span className="ml-2 truncate text-muted-foreground">{process.subject}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {visibleScreens.length > 0 && (
              <CommandGroup heading="Telas">
                {visibleScreens.map((screen) => (
                  <CommandItem key={screen.href} value={`t-${screen.href}`} onSelect={() => go(screen.href)}>
                    <screen.icon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{screen.title}</span>
                    {screen.section && <span className="ml-auto pl-3 text-xs text-muted-foreground">{screen.section}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {actions.length > 0 && (
              <CommandGroup heading="Ações">
                {actions.map((action) => (
                  <CommandItem key={action.title} value={`a-${action.title}`} onSelect={() => go(action.href)}>
                    <action.icon className="mr-2 h-4 w-4 shrink-0" />
                    {action.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <div className="hidden border-t px-3 py-2 text-xs text-muted-foreground sm:block">
            Enter abre · setas escolhem · Esc fecha · Ctrl+K abre de qualquer tela
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function seenIn(screens: Array<{ href: string }>, href: string) {
  return screens.some((screen) => screen.href === href);
}
