"use client"

import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"

export function ToasterProvider() {
  return (
    <>
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </>
  )
}
