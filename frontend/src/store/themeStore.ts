'use client'
import { create } from 'zustand'
import type { WhiteLabelConfig } from '@/types/whiteLabel'

interface ThemeState {
  config: WhiteLabelConfig | null
  isLoaded: boolean
  setConfig: (config: WhiteLabelConfig) => void
  applyTheme: (config: WhiteLabelConfig) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  config: null,
  isLoaded: false,

  setConfig: (config) => {
    set({ config, isLoaded: true })
  },

  applyTheme: (config) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--color-primary', config.primary_color)
      document.documentElement.style.setProperty('--color-secondary', config.secondary_color)
    }
    set({ config, isLoaded: true })
  },
}))
