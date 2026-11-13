"use client"

import { Toaster as SonnerToaster } from "sonner"
import { DialogHost } from "@/lib/dialogs"

// Um só sistema de aviso (sonner) e a janela de confirmação do produto
export function ToasterProvider() {
  return (
    <>
      <SonnerToaster position="top-center" richColors closeButton />
      <DialogHost />
    </>
  )
}
