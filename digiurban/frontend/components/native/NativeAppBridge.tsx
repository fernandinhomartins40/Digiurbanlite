'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { installNativeBridge } from '@/lib/native-app'

/** Dentro do app Android/iOS: arquivos, links externos e toque no aviso. Fora do app não faz nada. */
export function NativeAppBridge() {
  const router = useRouter()
  useEffect(() => {
    installNativeBridge(router)
  }, [router])
  return null
}
