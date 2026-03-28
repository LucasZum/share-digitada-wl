'use client'
import { useEffect } from 'react'
import { useWhiteLabel } from '@/hooks/useWhiteLabel'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useWhiteLabel()
  return <>{children}</>
}
