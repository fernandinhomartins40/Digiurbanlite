'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import * as LucideIcons from 'lucide-react'
import { Search, X } from 'lucide-react'

// Lista de ícones mais usados em serviços públicos
const POPULAR_ICONS = [
  'FileText', 'Calendar', 'MapPin', 'Clock', 'User', 'Users',
  'Building', 'Home', 'Hospital', 'School', 'GraduationCap',
  'Briefcase', 'Phone', 'Mail', 'AlertCircle', 'CheckCircle',
  'Shield', 'Key', 'CreditCard', 'Wallet', 'Banknote',
  'Car', 'Bus', 'Truck', 'TreePine', 'Leaf',
  'Droplet', 'Trash2', 'Recycle', 'Lightbulb', 'Zap',
  'Wifi', 'Globe', 'Smartphone', 'Laptop', 'Monitor',
  'Camera', 'Video', 'Music', 'Book', 'BookOpen',
  'Newspaper', 'FileSpreadsheet', 'FileBarChart', 'ClipboardList', 'ClipboardCheck',
  'Settings', 'Tool', 'Wrench', 'Package', 'Archive',
  'ShoppingCart', 'Store', 'Tag', 'Gift', 'Heart',
  'Star', 'Award', 'TrendingUp', 'TrendingDown', 'BarChart',
  'PieChart', 'Activity', 'Target', 'Flag', 'MessageSquare',
  'MessageCircle', 'Send', 'Bell', 'BellRing', 'Volume2',
  'Lock', 'Unlock', 'Eye', 'EyeOff', 'UserCheck',
  'UserPlus', 'UserMinus', 'UserX', 'Users2', 'UsersRound',
  'BadgeCheck', 'BadgeAlert', 'BadgeInfo', 'ShieldCheck', 'ShieldAlert',
  'Stethoscope', 'Pill', 'Syringe', 'HeartPulse', 'Ambulance',
  'Baby', 'PersonStanding', 'Accessibility', 'Languages', 'Globe2',
  'Navigation', 'Compass', 'Map', 'MapPinned', 'Route',
  'Sun', 'Moon', 'Cloud', 'CloudRain', 'Snowflake',
  'Wind', 'Umbrella', 'Thermometer', 'Radio', 'Tv',
  'HardDrive', 'Database', 'Server', 'Code', 'Terminal',
]

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  label?: string
  placeholder?: string
}

export function IconPicker({ value, onChange, label, placeholder }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filtrar ícones disponíveis
  const filteredIcons = useMemo(() => {
    const searchLower = search.toLowerCase()
    return POPULAR_ICONS.filter(iconName =>
      iconName.toLowerCase().includes(searchLower)
    )
  }, [search])

  // Obter o componente do ícone selecionado
  const SelectedIcon = value && (LucideIcons as any)[value]
    ? (LucideIcons as any)[value]
    : null

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange('')
    setSearch('')
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex gap-2">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              type="button"
            >
              {SelectedIcon ? (
                <div className="flex items-center gap-2">
                  <SelectedIcon className="h-4 w-4" />
                  <span>{value}</span>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder || 'Selecione um ícone'}</span>
              )}
            </Button>
          </PopoverTrigger>

          {value && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              type="button"
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ícone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-6 gap-2 p-3">
              {filteredIcons.length > 0 ? (
                filteredIcons.map((iconName) => {
                  const IconComponent = (LucideIcons as any)[iconName]
                  if (!IconComponent) return null

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleSelectIcon(iconName)}
                      className={`
                        flex items-center justify-center p-3 rounded-md
                        border-2 transition-all hover:bg-gray-50
                        ${value === iconName
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:border-gray-300'
                        }
                      `}
                      title={iconName}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  )
                })
              ) : (
                <div className="col-span-6 text-center py-8 text-sm text-gray-500">
                  Nenhum ícone encontrado
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              {filteredIcons.length} ícone{filteredIcons.length !== 1 ? 's' : ''} disponível{filteredIcons.length !== 1 ? 'is' : ''}
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-gray-500">
        Escolha um ícone da biblioteca Lucide React
      </p>
    </div>
  )
}
