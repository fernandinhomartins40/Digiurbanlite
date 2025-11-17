'use client'

import { HelpCircle } from 'lucide-react'

interface HelpButtonProps {
  onClick: () => void
  position?: 'fixed' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function HelpButton({
  onClick,
  position = 'fixed',
  size = 'lg',
  label = 'Precisa de ajuda?'
}: HelpButtonProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  }

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28
  }

  if (position === 'inline') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
        aria-label={label}
      >
        <HelpCircle size={20} />
        <span className="font-medium">{label}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      <div className="group relative">
        <button
          onClick={onClick}
          className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center animate-pulse-slow`}
          aria-label={label}
        >
          <HelpCircle size={iconSizes[size]} />
        </button>

        {/* Tooltip text */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            {label}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Pulse ring animation */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
