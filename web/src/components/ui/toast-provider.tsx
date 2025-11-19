"use client"

import * as React from "react"
import { Toaster as ToasterComponent } from "sonner"

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <ToasterComponent
        position="top-right"
        richColors
        closeButton
        expand
        visibleToasts={5}
        toastOptions={{
          style: {
            fontSize: '14px',
          },
          className: 'my-toast',
          duration: 4000,
        }}
      />
    </>
  )
}