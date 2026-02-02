'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SearchItem {
  title: string
  description: string
  href: string
  category: string
  icon?: React.ReactNode
  keywords?: string[]
}

interface SearchBarProps {
  items?: SearchItem[]
  placeholder?: string
  className?: string
}

export function SearchBar({ items = [], placeholder = 'Buscar funcionalidades...', className }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin-recent-searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch {
        // Ignorar erro de parse
      }
    }
  }, [])

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    return items
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(searchTerm)
        const descMatch = item.description.toLowerCase().includes(searchTerm)
        const categoryMatch = item.category.toLowerCase().includes(searchTerm)
        const keywordsMatch = item.keywords?.some((k) => k.toLowerCase().includes(searchTerm))
        return titleMatch || descMatch || categoryMatch || keywordsMatch
      })
      .slice(0, 8)
  }, [query, items])

  // Salvar busca recente
  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('admin-recent-searches', JSON.stringify(updated))
  }

  // Limpar buscas recentes
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('admin-recent-searches')
  }

  // Navegar para resultado
  const navigateToResult = (item: SearchItem) => {
    saveRecentSearch(query)
    router.push(item.href)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length)
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault()
        navigateToResult(filteredResults[selectedIndex])
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredResults, selectedIndex])

  // Reset selected index quando query mudar
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atalho de teclado global (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-20 py-2.5 rounded-lg border bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-all duration-200',
            'placeholder:text-muted-foreground'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted rounded border">
            <span>⌘K</span>
          </kbd>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <Card
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full z-50 shadow-xl border-2 max-h-[400px] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          {filteredResults.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
                Resultados ({filteredResults.length})
              </div>
              {filteredResults.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => navigateToResult(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                    'hover:bg-accent transition-colors text-left',
                    selectedIndex === index && 'bg-accent'
                  )}
                >
                  {item.icon && <div className="shrink-0">{item.icon}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {item.category}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum resultado encontrado</p>
            </div>
          ) : (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Buscas Recentes
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-primary hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                  ))}
                </>
              )}
              <div className="px-3 py-2 mt-2">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Atalhos Rápidos
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Digite para buscar funcionalidades</div>
                  <div>• Use ↑↓ para navegar</div>
                  <div>• Enter para acessar</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
