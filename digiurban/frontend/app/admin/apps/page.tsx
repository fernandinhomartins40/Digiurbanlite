'use client'

/**
 * Apps — as mesas de trabalho especializadas a que o servidor tem acesso
 * (ARQUITETURA-DE-PRODUTO.md 5.1), como ícones (igual à tela de um celular).
 * Cada app aparece UMA vez; o filtro por secretaria mostra só os dela.
 * O alfinete (ou arrastar o ícone até a barra inferior) fixa o app na barra,
 * como qualquer outra tela do menu.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Pin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDepartmentConfig } from '@/lib/department-config'
import { departmentSlugFromCode } from '@/lib/app-catalog-client'
import { useMyApps, type MyApp } from '@/lib/hooks/use-my-apps'
import { PIN_DRAG_TYPE, usePinnedShortcuts } from '@/components/admin/navigation/PinnedShortcuts'

const semAcento = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const nomeSecretaria = (code: string) =>
  (getDepartmentConfig(departmentSlugFromCode(code))?.name || code).replace(/^Secretaria (Municipal )?(de |da |do )?/i, '')

function AppIcon({ app }: { app: MyApp }) {
  const { isPinned, canPin, toggle } = usePinnedShortcuts()
  const Icon = app.icon
  const pinnable = canPin(app.route)
  const pinned = pinnable && isPinned(app.route)
  return (
    <div className="group relative flex flex-col items-center">
      <Link
        href={app.route}
        title={app.description}
        draggable={pinnable}
        onDragStart={(e) => {
          // Arrastar até a barra inferior fixa o app (computador)
          e.dataTransfer.setData(PIN_DRAG_TYPE, app.route)
          e.dataTransfer.effectAllowed = 'copy'
        }}
        className="flex w-full flex-col items-center gap-2 rounded-2xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-blue)]"
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-[18px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(0,0,0,0.45)] transition-transform duration-150 ease-out group-hover:scale-105 group-active:scale-95 sm:h-[72px] sm:w-[72px] sm:rounded-[20px]"
          style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${app.color} 78%, white), ${app.color})` }}
        >
          <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.9} />
        </span>
        <span className="line-clamp-2 min-h-[2.5em] text-center text-[13px] font-medium leading-tight text-[var(--lg-ink)]">{app.name}</span>
      </Link>
      {pinnable && (
        <button
          type="button"
          onClick={() => toggle(app.route)}
          aria-pressed={pinned}
          aria-label={pinned ? `Tirar ${app.name} da barra` : `Fixar ${app.name} na barra`}
          title={pinned ? 'Tirar da barra' : 'Fixar na barra'}
          className={cn(
            'absolute right-1 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lg-surface)] shadow ring-1 ring-black/5 transition-opacity',
            pinned
              ? 'text-[var(--lg-blue)] opacity-100'
              : 'text-[var(--lg-ink3)] opacity-100 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100'
          )}
        >
          <Pin className="h-3.5 w-3.5" fill={pinned ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  )
}

export default function AppsPage() {
  const apps = useMyApps()
  const [secretaria, setSecretaria] = useState('TODAS')
  const [busca, setBusca] = useState('')

  const secretarias = useMemo(() => {
    const codes = Array.from(new Set((apps || []).flatMap((app) => app.departments)))
    return codes.map((code) => ({ code, name: nomeSecretaria(code) })).sort((a, b) => a.name.localeCompare(b.name))
  }, [apps])

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim())
    return (apps || [])
      .filter((app) => secretaria === 'TODAS' || app.departments.includes(secretaria))
      .filter((app) => !termo || semAcento(`${app.name} ${app.description}`).includes(termo))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [apps, secretaria, busca])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Apps</h1>
          <p className="text-gray-600 mt-1">Toque para abrir. Use o alfinete para deixar o app na barra de baixo.</p>
        </div>
        {(apps?.length || 0) > 8 && (
          <label className="relative block w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-ink3)]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Procurar app"
              className="h-10 w-full rounded-full border border-[var(--lg-sep)] bg-[var(--lg-surface)] pl-9 pr-4 text-sm outline-none focus:border-[var(--lg-blue)]"
            />
          </label>
        )}
      </div>

      {secretarias.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ code: 'TODAS', name: 'Todos' }, ...secretarias].map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => setSecretaria(s.code)}
              aria-pressed={secretaria === s.code}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors',
                secretaria === s.code ? 'bg-[var(--lg-blue)] font-semibold text-white' : 'bg-[var(--lg-fill)] text-[var(--lg-ink)] hover:bg-[var(--lg-fill2)]'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {apps === null ? (
        <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-2">
              <div className="h-16 w-16 animate-pulse rounded-[18px] bg-[var(--lg-fill)] sm:h-[72px] sm:w-[72px]" />
              <div className="h-3 w-14 animate-pulse rounded bg-[var(--lg-fill)]" />
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--lg-sep)] p-10 text-center">
          <LayoutGrid className="h-10 w-10 text-[var(--lg-ink3)] mb-3" />
          <p className="font-medium">Nenhum app disponível para você</p>
          <p className="text-sm text-[var(--lg-ink3)] mt-1 max-w-md">
            Os apps aparecem aqui para a equipe da secretaria dona de cada um. Os seus pedidos estão na Gestão de Protocolos.
          </p>
        </div>
      ) : visiveis.length === 0 ? (
        <p className="py-10 text-center text-[var(--lg-ink3)]">Nenhum app encontrado.</p>
      ) : (
        <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {visiveis.map((app) => (
            <AppIcon key={app.route} app={app} />
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--lg-ink3)]">Os pedidos que chegam a um app continuam visíveis na Gestão de Protocolos.</p>
    </div>
  )
}
