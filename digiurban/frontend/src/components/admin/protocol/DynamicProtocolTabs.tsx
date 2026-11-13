'use client'

import { Tabs } from '@/components/ui/tabs'

interface DynamicProtocolTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  availableTabs: string[]
  primaryTab?: string
  badges?: Record<string, number>
  children: React.ReactNode
}

// Quatro assuntos no lugar de até 13 abas soltas. Os códigos de dentro continuam os
// mesmos (links com ?tab= e o conteúdo de cada um não mudam); só a porta é que agrupa.
export const PROTOCOL_TAB_GROUPS: { id: string; label: string; tabs: { id: string; label: string }[] }[] = [
  {
    id: 'pedido',
    label: 'Pedido',
    tabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'resumo-final', label: 'Resumo final' },
      { id: 'dados', label: 'Dados informados' },
      { id: 'documentos', label: 'Documentos do cidadão' },
    ],
  },
  {
    id: 'conversa',
    label: 'Conversa',
    tabs: [
      { id: 'comunicacao', label: 'Mensagens e etapas' },
      { id: 'pendencias', label: 'Pendências' },
    ],
  },
  {
    id: 'prefeitura',
    label: 'Documentos da prefeitura',
    tabs: [
      { id: 'documentos-gerados', label: 'Gerar e assinar' },
      { id: 'enviar', label: 'Entregar ao cidadão' },
      { id: 'payment', label: 'Pagamento' },
    ],
  },
  {
    id: 'historico',
    label: 'Histórico',
    tabs: [
      { id: 'atribuicoes', label: 'Quem cuidou' },
      { id: 'timeline', label: 'Linha do tempo' },
      { id: 'envolvidos', label: 'Envolvidos' },
    ],
  },
]

/** Grupos com as abas de dentro que este protocolo tem ("Quem cuidou" existe sempre) */
export function protocolTabGroups(availableTabs: string[]) {
  const has = new Set([...availableTabs, 'atribuicoes'])
  return PROTOCOL_TAB_GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => has.has(t.id)) })).filter((g) => g.tabs.length > 0)
}

export function DynamicProtocolTabs({ activeTab, onTabChange, availableTabs, badges = {}, children }: DynamicProtocolTabsProps) {
  const groups = protocolTabGroups(availableTabs)
  const current = groups.find((g) => g.tabs.some((t) => t.id === activeTab)) || groups[0]
  const count = (ids: string[]) => ids.reduce((sum, id) => sum + (badges[id] || 0), 0)

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div role="tablist" aria-label="Assuntos do protocolo" className="lg-glass lg-bar mb-3 flex w-full gap-1 overflow-x-auto rounded-full p-1">
        {groups.map((g) => {
          const on = g.id === current?.id
          const n = count(g.tabs.map((t) => t.id))
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTabChange(g.tabs[0].id)}
              className={`lg-tab ${on ? 'lg-tab-on' : ''} flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium`}
            >
              {g.label}
              {n > 0 && <span className={g.id === 'conversa' ? 'sense sense-waiting' : 'sense sense-off'}>{n}</span>}
            </button>
          )
        })}
      </div>

      {current && current.tabs.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {current.tabs.map((t) => {
            const on = t.id === activeTab
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                aria-pressed={on}
                className={`rounded-full px-3 py-1.5 text-sm ${on ? 'bg-[var(--lg-fill)] font-semibold text-[var(--lg-ink)]' : 'text-muted-foreground hover:bg-[var(--lg-fill)]'}`}
              >
                {t.label}
                {(badges[t.id] || 0) > 0 && <span className="ml-1.5 text-xs opacity-70">{badges[t.id]}</span>}
              </button>
            )
          })}
        </div>
      )}

      {children}
    </Tabs>
  )
}
