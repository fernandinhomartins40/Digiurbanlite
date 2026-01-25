'use client'

import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminUser {
  id: string
  name: string
  email: string
  role?: string
  department?: string
}

interface AdminUserAutocompleteProps {
  value?: AdminUser | null
  onChange: (user: AdminUser | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
}

export function AdminUserAutocomplete({
  value,
  onChange,
  label = 'Servidor',
  placeholder = 'Digite o nome do servidor...',
  required = false,
  error,
}: AdminUserAutocompleteProps) {
  const { apiRequest } = useAdminAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar usuários admin
  const searchUsers = async (search: string) => {
    if (search.length < 2) {
      setUsers([])
      return
    }

    setIsLoading(true)
    try {
      const response = await apiRequest(`/api/admin/users/search?q=${encodeURIComponent(search)}`)
      const usersData = response.data || []
      setUsers(usersData)
      setIsOpen(true)
      setHighlightedIndex(0)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && !value) {
        searchUsers(searchTerm)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || users.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < users.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (users[highlightedIndex]) {
          handleSelect(users[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Selecionar usuário
  const handleSelect = (user: AdminUser) => {
    onChange(user)
    setSearchTerm('')
    setIsOpen(false)
    setUsers([])
  }

  // Limpar seleção
  const handleClear = () => {
    onChange(null)
    setSearchTerm('')
    setUsers([])
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && (
        <Label htmlFor="user-search">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        {value ? (
          // Usuário selecionado
          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
                <User size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{value.name}</div>
                <div className="text-sm text-gray-600">
                  {value.email}
                  {value.department && <span className="ml-2">• {value.department}</span>}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Limpar seleção"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        ) : (
          // Campo de busca
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                ref={inputRef}
                id="user-search"
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (!e.target.value) {
                    setUsers([])
                    setIsOpen(false)
                  }
                }}
                onFocus={() => {
                  if (searchTerm.length >= 2 && users.length > 0) {
                    setIsOpen(true)
                  }
                }}
                onKeyDown={handleKeyDown}
                className={cn(
                  'pl-10 pr-4',
                  error && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-autocomplete="list"
                aria-controls="user-list"
                aria-expanded={isOpen}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                </div>
              )}
            </div>

            {/* Lista de resultados */}
            {isOpen && users.length > 0 && (
              <div
                id="user-list"
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                role="listbox"
              >
                {users.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                      highlightedIndex === index && 'bg-green-50'
                    )}
                    role="option"
                    aria-selected={highlightedIndex === index}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {user.email}
                          {user.department && <span className="ml-2">• {user.department}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Mensagem de "nenhum resultado" */}
            {isOpen && searchTerm.length >= 2 && users.length === 0 && !isLoading && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                Nenhum servidor encontrado
              </div>
            )}

            {/* Dica de busca */}
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!value && searchTerm.length === 0 && (
        <p className="text-xs text-gray-500">
          Digite o nome ou email do servidor (mínimo 2 caracteres)
        </p>
      )}
    </div>
  )
}
