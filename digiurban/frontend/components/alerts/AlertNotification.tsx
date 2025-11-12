'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NotificationAlert {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  autoHide?: boolean
  duration?: number
  timestamp: Date
  actions?: {
    label: string
    action: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }[]
}

interface AlertNotificationProps {
  alert: NotificationAlert
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function AlertNotification({
  alert,
  onClose,
  position = 'top-right'
}: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (alert.autoHide !== false) {
      const timer = setTimeout(() => {
        handleClose()
      }, alert.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [alert])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose(alert.id)
    }, 200)
  }

  const getIcon = () => {
    switch (alert.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    switch (alert.type) {
      case 'success':
        return {
          card: 'border-green-200 bg-green-50 shadow-green-100',
          title: 'text-green-800',
          message: 'text-green-700'
        }
      case 'warning':
        return {
          card: 'border-yellow-200 bg-yellow-50 shadow-yellow-100',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        }
      case 'error':
        return {
          card: 'border-red-200 bg-red-50 shadow-red-100',
          title: 'text-red-800',
          message: 'text-red-700'
        }
      case 'info':
      default:
        return {
          card: 'border-blue-200 bg-blue-50 shadow-blue-100',
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
    }
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  if (!isVisible) return null

  const styles = getStyles()

  return (
    <div className={cn(
      'fixed z-50 max-w-sm w-full transition-all duration-200',
      getPositionStyles(),
      isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
    )}>
      <Card className={cn(
        'p-4 shadow-lg border-l-4',
        styles.card
      )}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
                <p className={cn('font-semibold text-sm leading-tight', styles.title)}>
                  {alert.title}
                </p>
                <p className={cn('text-sm mt-1 leading-tight', styles.message)}>
                  {alert.message}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {alert.actions && alert.actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {alert.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => {
                      action.action()
                      handleClose()
                    }}
                    className="h-7 text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <Badge variant="secondary" className="text-xs">
                {alert.timestamp.toLocaleTimeString('pt-BR')}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Notification Manager Component
interface NotificationManagerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxNotifications?: number
}

export function NotificationManager({
  position = 'top-right',
  maxNotifications = 5
}: NotificationManagerProps) {
  const [notifications, setNotifications] = useState<NotificationAlert[]>([])

  // Global function to add notifications
  useEffect(() => {
    const addNotification = (notification: Omit<NotificationAlert, 'id' | 'timestamp'>) => {
      const newNotification: NotificationAlert = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      }

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, maxNotifications)
        return updated
      })
    }

    // Expose globally
    (window as any).addNotification = addNotification

    return () => {
      delete (window as any).addNotification
    }
  }, [maxNotifications])

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            'transition-all duration-200',
            position.includes('top') ? `mt-${index * 2}` : `mb-${index * 2}`
          )}
          style={{
            zIndex: 1000 - index,
            transform: position.includes('top')
              ? `translateY(${index * 80}px)`
              : `translateY(-${index * 80}px)`
          }}
        >
          <AlertNotification
            alert={notification}
            onClose={handleClose}
            position={position}
          />
        </div>
      ))}
    </>
  )
}

// Helper functions for easy notification creation
export const showNotification = {
  success: (title: string, message: string, options?: Partial<NotificationAlert>) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      (window as any).addNotification({
        title,
        message,
        type: 'success',
        ...options
      })
    }
  },

  error: (title: string, message: string, options?: Partial<NotificationAlert>) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      (window as any).addNotification({
        title,
        message,
        type: 'error',
        autoHide: false,
        ...options
      })
    }
  },

  warning: (title: string, message: string, options?: Partial<NotificationAlert>) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      (window as any).addNotification({
        title,
        message,
        type: 'warning',
        ...options
      })
    }
  },

  info: (title: string, message: string, options?: Partial<NotificationAlert>) => {
    if (typeof window !== 'undefined' && (window as any).addNotification) {
      (window as any).addNotification({
        title,
        message,
        type: 'info',
        ...options
      })
    }
  }
}