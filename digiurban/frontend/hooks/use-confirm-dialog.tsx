'use client'

import { useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    options: ConfirmDialogOptions
    resolver?: (value: boolean) => void
  }>({
    isOpen: false,
    options: {
      title: '',
      description: '',
    },
  })

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options: {
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          variant: 'default',
          ...options,
        },
        resolver: resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    dialogState.resolver?.(true)
    setDialogState((prev) => ({ ...prev, isOpen: false }))
  }, [dialogState.resolver])

  const handleCancel = useCallback(() => {
    dialogState.resolver?.(false)
    setDialogState((prev) => ({ ...prev, isOpen: false }))
  }, [dialogState.resolver])

  const ConfirmDialog = useCallback(
    () => (
      <AlertDialog open={dialogState.isOpen} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogState.options.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {dialogState.options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                dialogState.options.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {dialogState.options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [dialogState, handleConfirm, handleCancel]
  )

  return { confirm, ConfirmDialog }
}
